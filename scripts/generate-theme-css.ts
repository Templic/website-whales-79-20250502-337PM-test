/**
 * Theme CSS Generator Script
 * 
 * This script generates a CSS file containing all theme variables
 * from the design token system. The result is a static CSS file that
 * can be included in the application.
 * 
 * Usage:
 *   ts-node scripts/generate-theme-css.ts
 * 
 * This will create client/src/styles/generated-theme.css
 */

import fs from 'fs';
import path from 'path';
import { generateThemeVariables } from '../shared/theme/cssVariables';

// Main function
function main() {
  console.log('Generating theme CSS from design tokens...');
  
  try {
    // Generate CSS content
    const cssContent = generateThemeVariables();
    
    // Write to file
    const outputPath = path.join(__dirname, '../client/src/styles/generated-theme.css');
    
    // Ensure directory exists
    const directory = path.dirname(outputPath);
    if (!fs.existsSync(directory)) {
      console.log(`Creating directory: ${directory}`);
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(outputPath, cssContent);
    
    console.log(`Theme CSS generated at ${outputPath}`);
    console.log('Success!');
  } catch (error) {
    console.error('Error generating theme CSS:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main();