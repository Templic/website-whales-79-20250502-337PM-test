import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'server/db-maintenance.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix all function declarations with colons
content = content.replace(/function: /g, 'function ');
content = content.replace(/async function: /g, 'async function ');

// Fix return statements with colons
content = content.replace(/return: /g, 'return ');

// Fix const declarations with colons
content = content.replace(/const: /g, 'const ');

// Fix try blocks with colons
content = content.replace(/try: /g, 'try ');

// Fix boolean return type declarations with extra colons
content = content.replace(/\): boolean: {/g, '): boolean {');

// Fix ANALYZE VERBOSE with colon
content = content.replace(/ANALYZE VERBOSE: /g, 'ANALYZE VERBOSE ');

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Database maintenance syntax fixed successfully.');
