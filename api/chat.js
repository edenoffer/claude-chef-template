import { kv } from './_lib/kv.js';
import { put } from '@vercel/blob';
import { SYSTEM_PROMPT, TOOLS } from './_lib/system-prompt.js';
import { getPhotoStyle, CUISINE_PROPS, slugify } from './_lib/photo-style.js';
import { verifyToken, getSessionToken } from './_lib/session.js';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5-20250929';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Auth guard — protect expensive Claude API
  try {
    const passwordSet = !!(await kv.get('password'));
    if (passwordSet) {
      const token = getSessionToken(req);
      if (!token || !verifyToken(token)) {
        return res.status(401).json({ error: 'Authentication required' });
      }
    }
  } catch (e) { /* KV unavailable — allow access */ }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    await streamConversation(apiKey, messages, res);
  } catch (e) {
    sendSSE(res, 'error', { error: e.message });
  }

  sendSSE(res, 'done', {});
  res.end();
}

async function streamConversation(apiKey, messages, res) {
  // First Claude call
  const response = await callClaude(apiKey, messages);
  const { assistantContent, toolUses } = await processStream(response, res);

  if (toolUses.length === 0) return;

  // Execute tools and get results
  const toolResults = [];
  for (const toolUse of toolUses) {
    sendSSE(res, 'tool_start', { tool: toolUse.name });

    const result = await executeTool(toolUse.name, toolUse.input);
    toolResults.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: JSON.stringify(result),
    });

    // Send tool result event to client
    if (toolUse.name === 'save_recipe') {
      sendSSE(res, 'recipe_saved', { recipe: toolUse.input.recipe });
    } else if (toolUse.name === 'generate_photo' && result.url) {
      sendSSE(res, 'photo_generated', { url: result.url, slug: result.slug });
    }
  }

  // Continue conversation with tool results
  const continuationMessages = [
    ...messages,
    { role: 'assistant', content: assistantContent },
    { role: 'user', content: toolResults },
  ];

  const continuation = await callClaude(apiKey, continuationMessages);
  const { toolUses: moreTools } = await processStream(continuation, res);

  // Handle a second round of tool calls (e.g., save_recipe then generate_photo)
  if (moreTools.length > 0) {
    const moreResults = [];

    for (const toolUse of moreTools) {
      sendSSE(res, 'tool_start', { tool: toolUse.name });
      const result = await executeTool(toolUse.name, toolUse.input);
      moreResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });

      if (toolUse.name === 'save_recipe') {
        sendSSE(res, 'recipe_saved', { recipe: toolUse.input.recipe });
      } else if (toolUse.name === 'generate_photo' && result.url) {
        sendSSE(res, 'photo_generated', { url: result.url, slug: result.slug });
      }
    }

    // Final continuation
    const finalMessages = [
      ...continuationMessages,
      { role: 'assistant', content: moreTools.map(t => ({ type: 'tool_use', id: t.id, name: t.name, input: t.input })) },
      { role: 'user', content: moreResults },
    ];

    const finalResp = await callClaude(apiKey, finalMessages);
    await processStream(finalResp, res);
  }
}

async function callClaude(apiKey, messages) {
  return fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools: TOOLS,
      stream: true,
    }),
  });
}

async function processStream(response, res) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const assistantContent = [];
  const toolUses = [];
  let currentToolUse = null;
  let currentToolInput = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      let event;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }

      if (event.type === 'content_block_start') {
        if (event.content_block?.type === 'text') {
          // Text block starting
        } else if (event.content_block?.type === 'tool_use') {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          };
          currentToolInput = '';
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta?.type === 'text_delta') {
          sendSSE(res, 'text', { text: event.delta.text });
          assistantContent.push({ type: 'text', text: event.delta.text });
        } else if (event.delta?.type === 'input_json_delta') {
          currentToolInput += event.delta.partial_json;
        }
      }

      if (event.type === 'content_block_stop' && currentToolUse) {
        try {
          currentToolUse.input = JSON.parse(currentToolInput);
        } catch {
          currentToolUse.input = {};
        }
        toolUses.push(currentToolUse);
        assistantContent.push({
          type: 'tool_use',
          id: currentToolUse.id,
          name: currentToolUse.name,
          input: currentToolUse.input,
        });
        currentToolUse = null;
        currentToolInput = '';
      }
    }
  }

  // Collapse text blocks
  const collapsedContent = [];
  let textAccumulator = '';
  for (const block of assistantContent) {
    if (block.type === 'text') {
      textAccumulator += block.text;
    } else {
      if (textAccumulator) {
        collapsedContent.push({ type: 'text', text: textAccumulator });
        textAccumulator = '';
      }
      collapsedContent.push(block);
    }
  }
  if (textAccumulator) {
    collapsedContent.push({ type: 'text', text: textAccumulator });
  }

  return { assistantContent: collapsedContent, toolUses };
}

async function executeTool(name, input) {
  if (name === 'save_recipe') {
    return await saveRecipe(input.recipe);
  }
  if (name === 'generate_photo') {
    return await generatePhoto(input);
  }
  if (name === 'fetch_url_content') {
    return await fetchUrlContent(input.url);
  }
  return { error: 'Unknown tool' };
}

async function saveRecipe(recipe) {
  try {
    recipe.rating = 0;
    recipe.dateAdded = recipe.dateAdded || new Date().toISOString().split('T')[0];

    const kvRecipes = await kv.get('recipes') || [];
    const maxId = kvRecipes.reduce((max, r) => Math.max(max, r.id || 0), 999);
    recipe.id = maxId + 1;

    kvRecipes.push(recipe);
    await kv.set('recipes', kvRecipes);

    return { success: true, id: recipe.id, slug: recipe.slug };
  } catch (e) {
    return { error: e.message };
  }
}

async function generatePhoto(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: 'GEMINI_API_KEY not configured — photo skipped' };
  }

  try {
    const props = CUISINE_PROPS[input.cuisine] || 'clean styling, minimal props, linen napkin';
    const context = `Styled with: ${props}. Single serving, intimate scale.`;
    const style = getPhotoStyle();
    const fullPrompt = `${input.subject_description}\n\n${context}\n\n${style}`;

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    if (!geminiResp.ok) {
      return { error: 'Gemini API error' };
    }

    const data = await geminiResp.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart) {
      return { error: 'No image generated' };
    }

    const slug = slugify(input.title);
    const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

    let blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return { success: true, url: null, slug, note: 'Blob storage not configured — photo not saved' };
    }

    const blob = await put(`photos/${slug}.png`, buffer, {
      access: 'public',
      contentType: 'image/png',
    });

    // Update the recipe in KV with the photo URL
    const kvRecipes = await kv.get('recipes') || [];
    const recipe = kvRecipes.find(r => r.slug === slug);
    if (recipe) {
      recipe.photo = blob.url;
      await kv.set('recipes', kvRecipes);
    }

    return { success: true, url: blob.url, slug };
  } catch (e) {
    return { error: e.message };
  }
}

async function fetchYouTubeContent(url) {
  // Extract video ID
  const idMatch = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
  if (!idMatch) return { error: 'Could not extract YouTube video ID from URL' };
  const videoId = idMatch[1];

  let title = '';
  let author = '';
  let description = '';

  // Layer 1: oEmbed API (always works, gives title + author)
  try {
    const oembedResp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (oembedResp.ok) {
      const oembed = await oembedResp.json();
      title = oembed.title || '';
      author = oembed.author_name || '';
    }
  } catch (e) { /* oEmbed failed, continue */ }

  // Layer 2: Fetch the watch page with consent cookie to bypass EU consent screen
  try {
    const pageResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=PENDING+987; SOCS=CAESEwgDEgk2MTcyODAwNTQaAmVuIAEaBgiA_LyaBg',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (pageResp.ok) {
      const html = await pageResp.text();

      // Try ytInitialPlayerResponse
      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
      if (playerMatch) {
        try {
          const player = JSON.parse(playerMatch[1]);
          const vd = player.videoDetails || {};
          if (!title && vd.title) title = vd.title;
          if (!author && vd.author) author = vd.author;
          if (vd.shortDescription) description = vd.shortDescription;
        } catch (e) { /* parse error */ }
      }

      // Try meta description if shortDescription is empty
      if (!description) {
        const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]*?)"/i)
          || html.match(/<meta\s+content="([^"]*?)"\s+name="description"/i);
        if (metaDesc) description = metaDesc[1];
      }

      // Try og:description
      if (!description) {
        const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*?)"/i);
        if (ogDesc) description = ogDesc[1];
      }
    }
  } catch (e) { /* page fetch failed, continue with what we have */ }

  // Layer 3: Try auto-generated captions/transcript
  if (!description || description.length < 100) {
    try {
      // Fetch the page to find caption track URLs
      const captionResp = await fetch(
        `https://www.youtube.com/watch?v=${videoId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': 'CONSENT=PENDING+987',
          },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (captionResp.ok) {
        const html = await captionResp.text();
        // Look for caption track URL in player response
        const captionMatch = html.match(/"captionTracks":\[(\{.+?\})\]/);
        if (captionMatch) {
          try {
            const tracks = JSON.parse(`[${captionMatch[1]}]`);
            const enTrack = tracks.find(t => t.languageCode === 'en') || tracks[0];
            if (enTrack?.baseUrl) {
              const transcriptResp = await fetch(enTrack.baseUrl, { signal: AbortSignal.timeout(5000) });
              if (transcriptResp.ok) {
                const xml = await transcriptResp.text();
                // Extract text from XML transcript
                const lines = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
                  .map(m => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'))
                  .filter(Boolean);
                if (lines.length > 0) {
                  description += '\n\nTranscript (auto-generated):\n' + lines.join(' ').slice(0, 6000);
                }
              }
            }
          } catch (e) { /* caption parse error */ }
        }
      }
    } catch (e) { /* transcript fetch failed */ }
  }

  // Build result
  let text = '';
  if (title) text += `Video Title: ${title}\n`;
  if (author) text += `Channel: ${author}\n\n`;
  if (description) text += `Description / Content:\n${description}\n`;

  if (!text.trim()) {
    return { error: 'Could not extract content from this YouTube video. Try pasting the recipe description directly.' };
  }

  return { success: true, content: text.slice(0, 12000), url, source: 'youtube' };
}

async function fetchUrlContent(url) {
  try {
    // Normalize YouTube short URLs
    const ytShort = url.match(/youtu\.be\/([^?&]+)/);
    if (ytShort) url = `https://www.youtube.com/watch?v=${ytShort[1]}`;

    const isYouTube = /youtube\.com\/watch|youtu\.be/i.test(url);

    if (isYouTube) {
      return await fetchYouTubeContent(url);
    }

    // Non-YouTube: extract page content
    let text = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) text += `Title: ${titleMatch[1].trim()}\n\n`;

    // Try JSON-LD structured data first (recipe blogs often have this)
    const ldMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (ldMatch) {
      for (const block of ldMatch) {
        try {
          const jsonStr = block.replace(/<\/?script[^>]*>/gi, '');
          const ld = JSON.parse(jsonStr);
          // Handle @graph arrays
          const items = ld['@graph'] || [ld];
          for (const item of items) {
            if (item['@type'] === 'Recipe' || item['@type']?.includes?.('Recipe')) {
              text += `Recipe found (structured data):\n`;
              if (item.name) text += `Name: ${item.name}\n`;
              if (item.description) text += `Description: ${item.description}\n`;
              if (item.recipeIngredient) text += `Ingredients:\n${item.recipeIngredient.join('\n')}\n\n`;
              if (item.recipeInstructions) {
                const steps = item.recipeInstructions.map(s => typeof s === 'string' ? s : s.text).filter(Boolean);
                text += `Instructions:\n${steps.join('\n')}\n\n`;
              }
              if (item.recipeYield) text += `Serves: ${item.recipeYield}\n`;
              if (item.totalTime) text += `Total Time: ${item.totalTime}\n`;
              if (item.prepTime) text += `Prep Time: ${item.prepTime}\n`;
              if (item.cookTime) text += `Cook Time: ${item.cookTime}\n`;
            }
          }
        } catch (e) { /* skip malformed JSON-LD */ }
      }
    }

    // Fallback: strip HTML and get body text
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    const plainText = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    text += `\nPage Content:\n${plainText.slice(0, 8000)}`;

    return { success: true, content: text, url };
  } catch (e) {
    return { error: `Failed to fetch URL: ${e.message}` };
  }
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
