const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from root directory
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    // No cache for HTML files (always fresh)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Clean URL routing — serve .html files without extension
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  // Skip files with extensions (css, js, etc.)
  if (page.includes('.')) return next();

  const filePath = path.join(__dirname, `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MovieSuggest running on http://localhost:${PORT}`);
});
