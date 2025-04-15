/**
 * Component Refactoring Helper Script
 * 
 * This script helps with refactoring and relocating components according to the
 * component audit results. It performs various tasks:
 * 
 * 1. Relocates components to their proper directories
 * 2. Updates import statements in other files
 * 3. Adds basic documentation templates to undocumented components
 * 4. Creates feature README.md files if they don't exist
 * 
 * Usage: node scripts/component-refactoring-helper.js [--dry-run] [--component=ComponentName]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { execSync } from 'child_process';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);

// Get current file and directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'client', 'src', 'components');
const FEATURES_DIR = path.join(COMPONENTS_DIR, 'features');
const AUDIT_RESULTS_FILE = path.join(ROOT_DIR, 'docs', 'component-documentation-audit-results.md');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const componentArg = args.find(arg => arg.startsWith('--component='));
const targetComponent = componentArg ? componentArg.split('=')[1] : null;

/**
 * Parse the audit results to get component relocation recommendations
 */
async function parseAuditResults() {
  try {
    // Check if audit results file exists
    if (!fs.existsSync(AUDIT_RESULTS_FILE)) {
      console.log('Audit results file not found. Run component-documentation-analyzer.js first.');
      process.exit(1);
    }
    
    const content = await readFileAsync(AUDIT_RESULTS_FILE, 'utf8');
    
    // Extract the relocation recommendations table
    const relocationSection = content.split('## Component Organization Recommendations')[1].split('##')[0];
    const tableRows = relocationSection.split('\n').filter(line => line.includes('|')).slice(2);
    
    const relocations = [];
    
    for (const row of tableRows) {
      const columns = row.split('|').map(col => col.trim()).filter(Boolean);
      if (columns.length >= 3) {
        const component = columns[0];
        const currentLocation = columns[1];
        const suggestedLocation = columns[2];
        
        relocations.push({
          component,
          currentPath: path.join(ROOT_DIR, currentLocation, `${component}.tsx`),
          newPath: path.join(ROOT_DIR, suggestedLocation, `${component}.tsx`),
          directory: suggestedLocation
        });
      }
    }
    
    return relocations;
  } catch (error) {
    console.error('Error parsing audit results:', error);
    process.exit(1);
  }
}

/**
 * Generate JSDoc documentation template for a component
 */
function generateDocumentationTemplate(componentName, filePath) {
  const today = new Date().toISOString().split('T')[0];
  
  return `/**
 * @file ${componentName}.tsx
 * @description ${componentName} component
 * @created ${today}
 * @updated ${today}
 * @status Active
 */

/**
 * ${componentName}
 * 
 * [Add a detailed description of the component here]
 * 
 * @example
 * \`\`\`tsx
 * <${componentName} />
 * \`\`\`
 */
`;
}

/**
 * Add documentation template to a component file
 */
async function addDocumentationToComponent(filePath, componentName) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    
    // Skip if already has JSDoc header
    if (content.includes('/**') && content.includes('@file')) {
      console.log(`${componentName} already has documentation header. Skipping.`);
      return false;
    }
    
    const template = generateDocumentationTemplate(componentName, filePath);
    const updatedContent = template + content;
    
    if (dryRun) {
      console.log(`Would update ${filePath} with documentation template`);
      return false;
    } else {
      await writeFileAsync(filePath, updatedContent);
      console.log(`Added documentation to ${componentName}`);
      return true;
    }
  } catch (error) {
    console.error(`Error adding documentation to ${componentName}:`, error);
    return false;
  }
}

/**
 * Move a component to its proper directory
 */
async function relocateComponent(relocation) {
  const { component, currentPath, newPath, directory } = relocation;
  
  try {
    // Skip if current and new paths are the same
    if (currentPath === newPath) {
      console.log(`${component} is already in the correct location. Skipping.`);
      return false;
    }
    
    // Skip if component doesn't exist
    if (!fs.existsSync(currentPath)) {
      console.log(`Component ${component} not found at ${currentPath}. Skipping.`);
      return false;
    }
    
    // Skip if target component doesn't match
    if (targetComponent && component !== targetComponent) {
      return false;
    }
    
    // Create directory if it doesn't exist
    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      if (dryRun) {
        console.log(`Would create directory: ${newDir}`);
      } else {
        await mkdirAsync(newDir, { recursive: true });
        console.log(`Created directory: ${newDir}`);
      }
    }
    
    // Move the component
    if (dryRun) {
      console.log(`Would move ${component} from ${currentPath} to ${newPath}`);
    } else {
      const content = await readFileAsync(currentPath, 'utf8');
      await writeFileAsync(newPath, content);
      console.log(`Moved ${component} to ${newPath}`);
      
      // Add documentation if needed
      await addDocumentationToComponent(newPath, component);
      
      // Update imports in the codebase
      await updateImports(component, currentPath, newPath);
      
      // Remove the original file
      fs.unlinkSync(currentPath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error relocating ${component}:`, error);
    return false;
  }
}

/**
 * Update imports in all files referencing the moved component
 */
async function updateImports(componentName, oldPath, newPath) {
  try {
    const oldRelativePath = path.relative(ROOT_DIR, oldPath).replace(/\.tsx$/, '');
    const newRelativePath = path.relative(ROOT_DIR, newPath).replace(/\.tsx$/, '');
    
    if (dryRun) {
      console.log(`Would search and replace imports from ${oldRelativePath} to ${newRelativePath}`);
      return;
    }
    
    // Use grep to find all files importing the component
    const grepCommand = `grep -rl --include="*.ts*" "from ['\\\"].*${componentName}['\\\"]" ${ROOT_DIR}/client`;
    let files;
    
    try {
      files = execSync(grepCommand).toString().split('\n').filter(Boolean);
    } catch (e) {
      // No imports found
      console.log(`No imports found for ${componentName}`);
      return;
    }
    
    let updatedFilesCount = 0;
    
    for (const file of files) {
      // Skip the component file itself
      if (file === oldPath || file === newPath) continue;
      
      const content = await readFileAsync(file, 'utf8');
      
      // Different patterns to replace
      const patterns = [
        // Basic import
        {
          from: new RegExp(`from ['"]([^'"]*/${componentName})['"]`, 'g'),
          to: (match, p1) => `from "${newRelativePath.replace(/\\/g, '/')}"`
        },
        // Aliased import with @/
        {
          from: new RegExp(`from ['"]@/components/([^'"]*/${componentName})['"]`, 'g'),
          to: (match, p1) => {
            const normalized = newRelativePath.replace(/\\/g, '/').replace(/^client\/src\//, '');
            return `from "@/${normalized}"`;
          }
        }
      ];
      
      let updatedContent = content;
      let hasChanges = false;
      
      for (const pattern of patterns) {
        const newContent = updatedContent.replace(pattern.from, pattern.to);
        if (newContent !== updatedContent) {
          updatedContent = newContent;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await writeFileAsync(file, updatedContent);
        updatedFilesCount++;
        console.log(`Updated imports in ${file}`);
      }
    }
    
    console.log(`Updated imports in ${updatedFilesCount} files`);
  } catch (error) {
    console.error(`Error updating imports for ${componentName}:`, error);
  }
}

/**
 * Create or update README.md for feature directories
 */
async function updateReadmeFiles(relocations) {
  // Group relocations by directory
  const directoriesMap = new Map();
  
  for (const relocation of relocations) {
    const dir = path.dirname(relocation.newPath);
    if (!directoriesMap.has(dir)) {
      directoriesMap.set(dir, []);
    }
    directoriesMap.get(dir).push(relocation.component);
  }
  
  for (const [dir, components] of directoriesMap.entries()) {
    const readmePath = path.join(dir, 'README.md');
    
    // Skip if not a feature directory
    if (!dir.includes('features') && !dir.includes('common') && !dir.includes('layout')) {
      continue;
    }
    
    let readmeContent;
    
    // Check if README already exists
    if (fs.existsSync(readmePath)) {
      readmeContent = await readFileAsync(readmePath, 'utf8');
      
      // Check if components are already documented
      for (const component of components) {
        if (!readmeContent.includes(component)) {
          readmeContent = updateReadmeWithComponent(readmeContent, component, dir);
        }
      }
    } else {
      // Create a new README
      const featureName = path.basename(dir);
      readmeContent = generateReadmeTemplate(featureName, components);
    }
    
    if (dryRun) {
      console.log(`Would update README at ${readmePath}`);
    } else {
      await writeFileAsync(readmePath, readmeContent);
      console.log(`Updated README at ${readmePath}`);
    }
  }
}

/**
 * Add a component to an existing README.md
 */
function updateReadmeWithComponent(content, component, dir) {
  // Look for a component list section
  const componentListMatch = content.match(/## Components\s+(\n|.)*?(?=##|$)/m);
  
  if (componentListMatch) {
    // Add to existing component list
    const componentList = componentListMatch[0];
    const updatedComponentList = componentList + `- \`${component}\` - [Add description]\n`;
    return content.replace(componentList, updatedComponentList);
  } else {
    // Add a new component list section
    return content + '\n\n## Components\n\n' + `- \`${component}\` - [Add description]\n`;
  }
}

/**
 * Generate a new README.md template for a feature directory
 */
function generateReadmeTemplate(featureName, components) {
  const capitalizedName = featureName.charAt(0).toUpperCase() + featureName.slice(1);
  
  return `# ${capitalizedName} Components

This directory contains components related to the ${featureName} feature.

## Components

${components.map(component => `- \`${component}\` - [Add description]`).join('\n')}

## Usage Examples

\`\`\`tsx
import { ${components[0]} } from '@/components/features/${featureName}';

export default function Example() {
  return (
    <div>
      <${components[0]} />
    </div>
  );
}
\`\`\`

## Feature Roadmap

- [ ] [Future improvement 1]
- [ ] [Future improvement 2]
- [ ] [Future improvement 3]

## Related Documentation

- [Link to related docs]

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    console.log('Starting component refactoring...');
    console.log(dryRun ? 'DRY RUN - No changes will be made' : 'LIVE RUN - Changes will be applied');
    
    if (targetComponent) {
      console.log(`Targeting specific component: ${targetComponent}`);
    }
    
    // Parse relocation recommendations from audit results
    const relocations = await parseAuditResults();
    console.log(`Found ${relocations.length} component relocation recommendations`);
    
    // Process relocations
    let relocatedCount = 0;
    for (const relocation of relocations) {
      const success = await relocateComponent(relocation);
      if (success) relocatedCount++;
    }
    
    // Update README files
    await updateReadmeFiles(relocations);
    
    console.log(`\nRefactoring complete:`);
    console.log(`- Relocated ${relocatedCount} components`);
    console.log(`- Updated README files for feature directories`);
    
    if (dryRun) {
      console.log('\nThis was a dry run. Run without --dry-run to apply changes.');
    }
    
  } catch (error) {
    console.error('Error during refactoring:', error);
    process.exit(1);
  }
}

// Run the script
main();