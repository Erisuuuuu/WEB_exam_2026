// Простой прокси-сервер для обхода CORS при локальной разработке
// Запуск: node proxy-server.js
// Затем откройте http://localhost:3001/index.html

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;
const API_BASE = 'http://exam-api-courses.std-900.ist.mospolytech.ru';

// MIME типы
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Обработка OPTIONS запросов (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    // Проксирование API запросов
    if (pathname.startsWith('/api/')) {
        // Сохраняем /api в пути, так как реальный API находится по адресу /api/...
        const apiUrl = `${API_BASE}${pathname}${parsedUrl.search || ''}`;
        console.log(`[Proxy] ${req.method} ${pathname} -> ${apiUrl}`);

        // Передаем заголовки из оригинального запроса (включая Authorization и X-API-Key)
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Копируем заголовки авторизации из оригинального запроса
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }
        if (req.headers['x-api-key']) {
            headers['X-API-Key'] = req.headers['x-api-key'];
        }
        
        const options = {
            method: req.method,
            headers: headers
        };
        
        console.log(`[Proxy Headers]`, headers);

        const proxyReq = http.request(apiUrl, options, (proxyRes) => {
            // Добавляем CORS заголовки
            const headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
                'Content-Type': proxyRes.headers['content-type'] || 'application/json'
            };

            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('Proxy error:', err);
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
        });

        if (req.method === 'POST' || req.method === 'PUT') {
            req.pipe(proxyReq);
        } else {
            proxyReq.end();
        }

        return;
    }

    // Обслуживание статических файлов
    let filePath = '.' + pathname;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Прокси-сервер запущен на http://localhost:${PORT}`);
    console.log(`Откройте в браузере: http://localhost:${PORT}/index.html`);
    console.log(`API запросы будут проксироваться на: ${API_BASE}`);
});
