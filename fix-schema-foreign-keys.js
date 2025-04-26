#!/usr/bin/env node

/**
 * Schema Foreign Key Fixer
 * 
 * A targeted script to fix foreign key type mismatches in schema.ts
 * Specifically addressing the issue of integer foreign keys referencing varchar primary keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory and file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File to analyze and fix
const SCHEMA_FILE = path.join(process.cwd(), 'shared/schema.ts');

console.log('\n🔍 Schema Foreign Key Type Mismatch Analyzer\n');

// Read the schema file
if (!fs.existsSync(SCHEMA_FILE)) {
  console.error(`Error: Schema file ${SCHEMA_FILE} not found`);
  process.exit(1);
}

let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
const originalContent = content;

// Find all references to users.id
const foreignKeyReferences = content.match(/(\w+): integer\(\"\w+\"\)(.*)\.references\(\(\) => users\.id\)/g) || [];

console.log(`Found ${foreignKeyReferences.length} integer foreign keys that reference users.id (which is varchar)`);

if (foreignKeyReferences.length > 0) {
  console.log('\nForeign keys to fix:');
  
  // Create a backup
  fs.writeFileSync(`${SCHEMA_FILE}.backup`, originalContent);
  console.log(`\n✅ Created backup at ${SCHEMA_FILE}.backup`);
  
  // Fix each foreign key
  foreignKeyReferences.forEach(foreignKey => {
    // Extract field name
    const fieldMatch = foreignKey.match(/(\w+): integer\(\"/);
    if (!fieldMatch || !fieldMatch[1]) {
      console.log(`  ❌ Could not extract field name from ${foreignKey}`);
      return;
    }
    
    const fieldName = fieldMatch[1];
    
    // Create the replacement using varchar instead of integer
    const fixedForeignKey = foreignKey.replace(/integer\(\"(\w+)\"\)/, 'varchar("$1")');
    
    // Replace in the content
    content = content.replace(foreignKey, fixedForeignKey);
    
    console.log(`  ✅ Fixed ${fieldName} - changed to varchar`);
  });
  
  // Write the fixed content
  fs.writeFileSync(SCHEMA_FILE, content);
  console.log(`\n✅ Updated schema file with fixed foreign keys`);
  
  // Show diff info
  console.log('\n📊 Changes summary:');
  console.log(`  - Modified ${foreignKeyReferences.length} foreign key references`);
  console.log(`  - Changed type from integer to varchar for user references`);
} else {
  console.log('No integer foreign keys referencing users.id found. Nothing to fix.');
}

console.log('\n✅ Analysis and fixes completed!');