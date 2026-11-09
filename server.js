#!/usr/bin/env node
/* Local static server for the offline Spatial Rail demo clone. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.md']);

function resolvePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (decoded === '/' || decoded === '' || decoded === '/wrapper.html') decoded = '/index.html';
  // The original demo route lives at /kits/spatial-rail/demo. It renders the
  // full-screen demo wrapper, served from index.html.
  if (decoded === '/kits/spatial-rail/demo' || decoded === '/kits/spatial-rail/demo/') decoded = '/index.html';
  if (decoded === '/demo' || decoded === '/demo/') decoded = '/demo/index.html';
  const file = path.resolve(ROOT, '.' + decoded);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return null;
  return file;
}

function sendNotFound(req, res) {
  const body = fs.readFileSync(path.join(ROOT, '404.html'));
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': String(body.length),
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

function sendFile(req, res, file, stat) {
  const ext = path.extname(file).toLowerCase();
  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'ETag': etag,
    'Last-Modified': stat.mtime.toUTCString(),
    'X-Content-Type-Options': 'nosniff',
  };

  if (COMPRESSIBLE.has(ext)) headers.Vary = 'Accept-Encoding';

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  const range = req.headers.range;
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [startRaw, endRaw] = range.slice(6).split('-');
    let start;
    let end;
    if (startRaw === '') {
      const suffix = Number(endRaw);
      if (!Number.isInteger(suffix) || suffix <= 0) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      start = Math.max(0, stat.size - suffix);
      end = stat.size - 1;
    } else {
      start = Number(startRaw);
      end = endRaw === '' ? stat.size - 1 : Number(endRaw);
    }
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end >= stat.size || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    headers['Content-Length'] = String(end - start + 1);
    res.writeHead(206, headers);
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }

  const acceptsGzip = /\bgzip\b/i.test(req.headers['accept-encoding'] || '');
  if (COMPRESSIBLE.has(ext) && stat.size >= 256 && acceptsGzip) {
    const body = zlib.gzipSync(fs.readFileSync(file), { level: 9 });
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = String(body.length);
    res.writeHead(200, headers);
    return req.method === 'HEAD' ? res.end() : res.end(body);
  }

  headers['Content-Length'] = String(stat.size);
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method not allowed');
  }

  const file = resolvePath(req.url || '/');
  if (!file) return sendNotFound(req, res);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      console.log(`[404] ${req.method} ${req.url}`);
      return sendNotFound(req, res);
    }
    sendFile(req, res, file, stat);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Spatial Rail demo clone: http://127.0.0.1:${PORT}/`);
  console.log(`Raw demo:                http://127.0.0.1:${PORT}/demo/`);
  console.log('Press Ctrl+C to stop.');
});
