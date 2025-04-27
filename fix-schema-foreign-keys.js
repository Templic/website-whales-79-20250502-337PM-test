#!/usr/bin/env node

/**
 * Enhanced Schema Foreign Key Fixer
 * 
 * A comprehensive utility to fix various foreign key type mismatches in schema.ts:
 * 1. Integer foreign keys referencing varchar primary keys
 * 2. Varchar foreign keys referencing integer primary keys
 * 3. Inconsistent type options in references
 * 4. Missing not null constraints on required foreign keys
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory and file path (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File to analyze and fix
const SCHEMA_FILE = path.join(process.cwd(), 'shared/schema.ts');

console.log('\n🔍 Enhanced Schema Foreign Key Type Mismatch Analyzer\n');

// Read the schema file
if (!fs.existsSync(SCHEMA_FILE)) {
  console.error(`Error: Schema file ${SCHEMA_FILE} not found`);
  process.exit(1);
}

let content = fs.readFileSync(SCHEMA_FILE, 'utf8');
const originalContent = content;

// Create a backup
fs.writeFileSync(`${SCHEMA_FILE}.backup`, originalContent);
console.log(`✅ Created backup at ${SCHEMA_FILE}.backup\n`);

// Define standard primary key types for tables (extracted from schema analysis)
const primaryKeyTypes = {
  users: 'varchar',
  posts: 'varchar',
  comments: 'varchar',
  sessions: 'varchar',
  products: 'varchar',
  orders: 'varchar',
  categories: 'varchar',
  tags: 'varchar',
  media: 'varchar',
  profiles: 'varchar',
  settings: 'varchar',
  apiKeys: 'varchar',
  events: 'varchar',
  analytics: 'integer'
};

// Find and fix mismatches from integer to varchar (users etc.)
function fixIntegerToVarcharForeignKeys() {
  // Get all tables with varchar primary keys
  const varcharPrimaryKeyTables = Object.entries(primaryKeyTypes)
    .filter(([_, type]) => type === 'varchar')
    .map(([table]) => table);
  
  let totalFixed = 0;
  
  varcharPrimaryKeyTables.forEach(table => {
    // Find all integer foreign keys referring to this table
    const regex = new RegExp(`(\\w+):\\s*integer\\(\"\\w+\"\\)(.*)\.references\\(\\(\\)\\s*=>\\s*${table}\\.id\\)`, 'g');
    const foreignKeyReferences = content.match(regex) || [];
    
    if (foreignKeyReferences.length > 0) {
      console.log(`Found ${foreignKeyReferences.length} integer foreign keys that reference ${table}.id (which is varchar)`);
      
      // Fix each foreign key
      foreignKeyReferences.forEach(foreignKey => {
        // Extract field name
        const fieldMatch = foreignKey.match(/(\w+):\s*integer\(\"/);
        if (!fieldMatch || !fieldMatch[1]) {
          console.log(`  ❌ Could not extract field name from ${foreignKey}`);
          return;
        }
        
        const fieldName = fieldMatch[1];
        
        // Create the replacement using varchar instead of integer
        const fixedForeignKey = foreignKey.replace(/integer\(\"(\w+)\"\)/, 'varchar("$1")');
        
        // Replace in the content
        content = content.replace(foreignKey, fixedForeignKey);
        
        console.log(`  ✅ Fixed ${fieldName} - changed to varchar for ${table} reference`);
        totalFixed++;
      });
    }
  });
  
  return totalFixed;
}

// Find and fix mismatches from varchar to integer (analytics etc.)
function fixVarcharToIntegerForeignKeys() {
  // Get all tables with integer primary keys
  const integerPrimaryKeyTables = Object.entries(primaryKeyTypes)
    .filter(([_, type]) => type === 'integer')
    .map(([table]) => table);
  
  let totalFixed = 0;
  
  integerPrimaryKeyTables.forEach(table => {
    // Find all varchar foreign keys referring to this table
    const regex = new RegExp(`(\\w+):\\s*varchar\\(\"\\w+\"\\)(.*)\.references\\(\\(\\)\\s*=>\\s*${table}\\.id\\)`, 'g');
    const foreignKeyReferences = content.match(regex) || [];
    
    if (foreignKeyReferences.length > 0) {
      console.log(`Found ${foreignKeyReferences.length} varchar foreign keys that reference ${table}.id (which is integer)`);
      
      // Fix each foreign key
      foreignKeyReferences.forEach(foreignKey => {
        // Extract field name
        const fieldMatch = foreignKey.match(/(\w+):\s*varchar\(\"/);
        if (!fieldMatch || !fieldMatch[1]) {
          console.log(`  ❌ Could not extract field name from ${foreignKey}`);
          return;
        }
        
        const fieldName = fieldMatch[1];
        
        // Create the replacement using integer instead of varchar
        const fixedForeignKey = foreignKey.replace(/varchar\(\"(\w+)\"\)/, 'integer("$1")');
        
        // Replace in the content
        content = content.replace(foreignKey, fixedForeignKey);
        
        console.log(`  ✅ Fixed ${fieldName} - changed to integer for ${table} reference`);
        totalFixed++;
      });
    }
  });
  
  return totalFixed;
}

// Fix inconsistent type options in references
function fixInconsistentTypeOptions() {
  // Find all references with inconsistent type options
  const regex = /references\(\(\) => \w+\.id, { \w+: "(\w+)" }\)/g;
  const inconsistentReferences = content.match(regex) || [];
  
  let totalFixed = 0;
  
  if (inconsistentReferences.length > 0) {
    console.log(`Found ${inconsistentReferences.length} references with inconsistent type options`);
    
    // Fix each reference
    inconsistentReferences.forEach(reference => {
      // Create the fixed reference
      const fixedReference = reference.replace(/{ \w+: "(\w+)" }/, '{ onDelete: "cascade" }');
      
      // Replace in the content
      content = content.replace(reference, fixedReference);
      
      console.log(`  ✅ Fixed reference - changed type option to onDelete cascade`);
      totalFixed++;
    });
  }
  
  return totalFixed;
}

// Fix missing not null constraints on required foreign keys
function fixMissingNotNullConstraints() {
  // Find references without .notNull()
  const regex = /((\w+): (integer|varchar)\(\"\w+\"\)\.references\(\(\) => \w+\.id\))([^\)])/g;
  const missingNotNull = [];
  
  // We need to use regex.exec in a loop to get all matches with groups
  let match;
  while ((match = regex.exec(content)) !== null) {
    // Check if it doesn't already have .notNull()
    if (!match[0].includes('.notNull()')) {
      missingNotNull.push({
        full: match[1],
        field: match[2],
        replacement: `${match[1]}.notNull()${match[4]}`
      });
    }
  }
  
  let totalFixed = 0;
  
  if (missingNotNull.length > 0) {
    console.log(`Found ${missingNotNull.length} foreign keys missing notNull constraint`);
    
    // Fix each constraint
    missingNotNull.forEach(item => {
      // Replace in the content
      const newContent = content.replace(
        `${item.full}${item.replacement.charAt(item.replacement.length - 1)}`, 
        item.replacement
      );
      
      if (newContent !== content) {
        content = newContent;
        console.log(`  ✅ Fixed ${item.field} - added notNull constraint`);
        totalFixed++;
      } else {
        console.log(`  ❌ Could not fix ${item.field}`);
      }
    });
  }
  
  return totalFixed;
}

// Run all fixes
const intToVarcharFixed = fixIntegerToVarcharForeignKeys();
const varcharToIntFixed = fixVarcharToIntegerForeignKeys();
const inconsistentOptionsFixed = fixInconsistentTypeOptions();
const notNullFixed = fixMissingNotNullConstraints();

const totalFixed = intToVarcharFixed + varcharToIntFixed + inconsistentOptionsFixed + notNullFixed;

if (totalFixed > 0) {
  // Write the fixed content
  fs.writeFileSync(SCHEMA_FILE, content);
  console.log(`\n✅ Updated schema file with fixed foreign keys`);
  
  // Show diff info
  console.log('\n📊 Changes summary:');
  console.log(`  - Fixed ${intToVarcharFixed} integer → varchar foreign keys`);
  console.log(`  - Fixed ${varcharToIntFixed} varchar → integer foreign keys`);
  console.log(`  - Fixed ${inconsistentOptionsFixed} inconsistent reference options`);
  console.log(`  - Added ${notNullFixed} missing notNull constraints`);
  console.log(`  - Total: ${totalFixed} fixes applied`);
} else {
  console.log('No foreign key issues found. Nothing to fix.');
}

console.log('\n✅ Analysis and fixes completed!');