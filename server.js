const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HOST = '127.0.0.1';
const ROOT = __dirname;
const MAX_REDIRECTS = 5;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function send(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}

function serveStatic(req, res) {
  const reqPath = req.url === '/' ? '/ecommerce-tracker.html' : req.url;
  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
}

function proxyRequest(method, targetUrl, reqHeaders, body, res, redirectsLeft) {
  let t;
  try {
    t = new URL(targetUrl);
  } catch (e) {
    send(res, 400, 'Bad target URL: ' + e.message);
    return;
  }

  const options = {
    hostname: t.hostname,
    port: t.port || 443,
    path: t.pathname + t.search,
    method,
    headers: Object.assign({}, reqHeaders, { host: t.hostname }),
  };
  delete options.headers.origin;
  delete options.headers.referer;

  const upstream = https.request(options, (upRes) => {
    const loc = upRes.headers.location;
    if ([301, 302, 303, 307, 308].includes(upRes.statusCode) && loc) {
      if (redirectsLeft <= 0) {
        send(res, 508, 'Too many redirects');
        return;
      }
      upRes.resume();
      const nextUrl = new URL(loc, targetUrl).href;
      const nextMethod = upRes.statusCode === 303 ? 'GET' : method;
      const nextBody = upRes.statusCode === 303 ? null : body;
      proxyRequest(nextMethod, nextUrl, reqHeaders, nextBody, res, redirectsLeft - 1);
      return;
    }

    const headers = Object.assign({}, upRes.headers, {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
    });
    delete headers['transfer-encoding'];
    res.writeHead(upRes.statusCode || 500, headers);
    upRes.pipe(res);
  });

  upstream.on('error', (e) => send(res, 502, 'Proxy error: ' + e.message));
  if (body) upstream.write(body);
  upstream.end();
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/proxy')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let reqUrl;
    try {
      reqUrl = new URL('http://localhost' + req.url);
    } catch {
      send(res, 400, 'Bad request URL');
      return;
    }

    const target = reqUrl.searchParams.get('url');
    if (!target) {
      send(res, 400, 'Missing ?url= parameter');
      return;
    }

    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = chunks.length ? Buffer.concat(chunks) : null;
      const headers = Object.assign({}, req.headers);
      proxyRequest(req.method, target, headers, body, res, MAX_REDIRECTS);
    });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log('Server running on http://' + HOST + ':' + PORT);
  console.log('Open http://' + HOST + ':' + PORT + '/ in your browser');
});

