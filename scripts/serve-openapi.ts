import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.resolve(__dirname, '../openapi');
const docsPath = path.join(docsDir, 'index.html');
const port = Number(process.env.OPENAPI_PORT ?? 8080);

if (!fs.existsSync(docsPath)) {
    console.error(`OpenAPI docs not found at ${docsPath}. Run \"npm run openapi:build-docs\" first.`);
    process.exit(1);
}

const server = createServer((req, res) => {
    const requestPath = req.url ?? '/';
    const targetPath = requestPath === '/' ? docsPath : path.join(docsDir, requestPath.replace(/^\//, ''));

    if (!targetPath.startsWith(docsDir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
    }

    if (targetPath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }

    fs.createReadStream(targetPath).pipe(res);
});

server.listen(port, () => {
    console.log(`OpenAPI docs available at http://localhost:${port}`);
});