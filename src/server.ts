import path from 'path';
import { app } from './app.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`API listening on port ${port}`);
});
