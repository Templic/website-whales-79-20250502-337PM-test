const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'server/routes.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of "return:" with "return"
content = content.replace(/return:/g, 'return');

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('All "return:" statements fixed successfully.');
