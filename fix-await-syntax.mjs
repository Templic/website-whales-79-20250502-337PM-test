import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'server/routes.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of "await:" with "await"
content = content.replace(/await:/g, 'await');

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('All "await:" statements fixed successfully in routes.ts.');
