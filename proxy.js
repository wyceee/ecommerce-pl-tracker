// Deprecated entrypoint kept for backward compatibility.
// Use: node server.js

console.warn('[DEPRECATED] proxy.js now starts the unified server. Use `node server.js` moving forward.');
require('./server');
