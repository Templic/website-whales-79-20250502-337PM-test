import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(process.cwd(), 'server/background-services.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix import statements with colons
content = content.replace(/import: /g, 'import ');
content = content.replace(/ from: /g, ' from ');

// Fix interface definition with colons
content = content.replace(/interface ServiceStatus: /g, 'interface ServiceStatus ');

// Fix function declarations with colons
content = content.replace(/function: /g, 'function ');

// Fix async function declarations with colons
content = content.replace(/async function: /g, 'async function ');

// Fix return type declarations with extra colons
content = content.replace(/\): Promise<void> {/g, '): Promise<void> {');
content = content.replace(/\): void: {/g, '): void {');

// Fix try blocks with colons
content = content.replace(/try: {/g, 'try {');

// Fix await statements with colons
content = content.replace(/await: /g, 'await ');

// Fix comma after string property in interface
content = content.replace(/name: string;,/g, 'name: string;');

// Fix filter().map() with an extra semicolon
content = content.replace(/filter\(service => service\.status === 'active'\);/g, 'filter(service => service.status === \'active\')');

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Background services syntax fixed successfully.');
