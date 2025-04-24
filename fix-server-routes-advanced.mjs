import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'server/routes.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix 'as:' parameter syntax
content = content.replace(/(\w+), as: /g, '$1 as ');

// Fix ternary statements with semicolons
content = content.replace(/\? ([^:]+): ([^;]+);(\s+\})/g, '? $1: $2$3');

// Fix semicolons in the middle of objects
content = content.replace(/([^;]); (\s+\}\);)/g, '$1$2');

// Fix indentation in nested objects
content = content.replace(/to:.+\/\/ In production/g, (match) => {
  return match.replace(/  subject:/, '            subject:');
});

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Server routes syntax fixed successfully.');
