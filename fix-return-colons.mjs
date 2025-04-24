import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'server/routes.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of "return:" with "return"
content = content.replace(/return:/g, 'return');

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('All "return:" statements fixed successfully.');
