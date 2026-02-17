export default function handler(req, res) {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '2.0.0'
  });
}
