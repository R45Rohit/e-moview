const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & SEO response headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Explicit sitemap and robots.txt routes with correct Content-Type headers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// 301 Permanent Redirect for .html extension to clean URLs (eliminates duplicate content)
app.get('/:page.html', (req, res, next) => {
  const page = req.params.page;
  // Never redirect 404 or Google site verification files
  if (page === '404' || page.startsWith('google')) {
    return next();
  }
  const targetHtml = path.join(__dirname, `${page}.html`);
  if (fs.existsSync(targetHtml)) {
    // Preserve query parameters if present
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, `/${page}${query}`);
  }
  next();
});

// Serve static files with proper caching headers
app.use(express.static(path.join(__dirname), {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2|webmanifest)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    }
  }
}));

// Clean URL routing — serve corresponding .html file without extension
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.includes('.')) return next();

  const filePath = path.join(__dirname, `${page}.html`);
  if (fs.existsSync(filePath)) {
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(filePath);
  }
  next();
});

// Root route
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// True 404 handler for non-existent pages (Fixes Soft 404 SEO penalty)
app.use((req, res) => {
  res.status(404).setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Moview running on http://localhost:${PORT}`);
});
