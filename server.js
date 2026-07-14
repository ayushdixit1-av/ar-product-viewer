const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TARGET = 'https://cfcrack.co.in';

app.use(cors());

app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

app.use('/api', createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '/api' },
    onProxyRes(proxyRes) {
        proxyRes.headers['access-control-allow-origin'] = '*';
    },
    onError(err, req, res) {
        console.error('Proxy error:', err.message);
        res.status(502).json({
            error: 'Backend service unavailable',
            message: 'Could not connect to cfcrack.co.in',
            fallback: true
        });
    }
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`AR Product Viewer running on http://localhost:${PORT}`);
    console.log(`API proxy -> ${API_TARGET}`);
});
