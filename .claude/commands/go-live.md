# Go Live — Deploy Your Recipe Book

Deploy your recipe book to Vercel so you can access it from your phone in the kitchen.

## Usage

```
/go-live
```

## Prerequisites

- Vercel CLI installed (`npm install -g vercel`)
- Vercel account (free at vercel.com)
- At least one recipe in your library

## Execution Steps

### Step 1: Pre-flight Check

1. Verify `recipes/recipe-book.html` exists
2. Check that at least one recipe exists in the data array
3. Verify referenced photos exist in `recipes/photos/`
4. Check that `vercel.json` exists in the project root

### Step 2: Deploy

```bash
vercel --prod
```

For first-time deployment, Vercel will ask:
- Set up and deploy? → Yes
- Which scope? → Select your account
- Link to existing project? → No (first time)
- Project name? → Suggest "my-recipe-book" or let user choose
- Directory? → `./` (root — vercel.json handles the outputDirectory)

### Step 3: Report

After successful deployment:

> "Your recipe book is live, chef! 🎉
>
> **URL:** https://[project].vercel.app
>
> Bookmark this on your phone — now you can pull up any recipe while you're cooking.
>
> Want to connect a custom domain? Just run: `vercel domains add yourdomain.com`"

### Step 4: Custom Domain (if requested)

```bash
vercel domains add [domain]
```

Then guide the user through DNS configuration (usually adding a CNAME record pointing to `cname.vercel-dns.com`).

ARGUMENTS: $ARGUMENTS
