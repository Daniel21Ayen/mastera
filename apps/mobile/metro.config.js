const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

// Transparently proxy all backend API calls through Metro (port 8081).
// This guarantees that mobile devices on local Wi-Fi can communicate with the backend
// even when host firewalls (e.g., UFW) or router AP client isolation block port 3000.
const API_PREFIXES = [
  '/catalog',
  '/commerce',
  '/content',
  '/assessments',
  '/orders',
  '/refunds',
  '/students',
  '/health',
  '/sync',
  '/questions',
  '/student',
  '/admin',
];

const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    return (req, res, next) => {
      const url = req.url || '';
      const isApiRoute = API_PREFIXES.some(
        (prefix) => url === prefix || url.startsWith(prefix + '/') || url.startsWith(prefix + '?')
      );

      if (isApiRoute) {
        const proxyReq = http.request(
          {
            hostname: '127.0.0.1',
            port: 3000,
            path: url,
            method: req.method,
            headers: {
              ...req.headers,
              host: '127.0.0.1:3000',
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
          }
        );

        proxyReq.on('error', (err) => {
          console.error('[Metro API Proxy Error]', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'Backend API unreachable via Metro proxy',
              message: err.message,
            })
          );
        });

        req.pipe(proxyReq, { end: true });
        return;
      }

      if (originalEnhanceMiddleware) {
        return originalEnhanceMiddleware(metroMiddleware, server)(req, res, next);
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
