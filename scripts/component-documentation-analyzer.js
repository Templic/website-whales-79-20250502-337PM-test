/**
 * Component Documentation Analyzer
 * 
 * This script analyzes React components in the codebase to:
 * 1. Identify components lacking proper documentation
 * 2. Generate documentation templates based on component analysis
 * 3. Recommend component organization improvements
 * 
 * Usage: node scripts/component-documentation-analyzer.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Get current file and directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'client', 'src', 'components');
const FEATURES_DIR = path.join(COMPONENTS_DIR, 'features');
const OUTPUT_FILE = path.join(ROOT_DIR, 'docs', 'component-documentation-audit-results.md');

// Component categories
const COMPONENT_CATEGORIES = [
  { name: 'Common Components', dir: path.join(COMPONENTS_DIR, 'common') },
  { name: 'Layout Components', dir: path.join(COMPONENTS_DIR, 'layout') },
  { name: 'Shop Components', dir: path.join(FEATURES_DIR, 'shop') },
  { name: 'Audio Components', dir: path.join(FEATURES_DIR, 'audio') },
  { name: 'Cosmic Components', dir: path.join(FEATURES_DIR, 'cosmic') },
  { name: 'Admin Components', dir: path.join(FEATURES_DIR, 'admin') },
  { name: 'Community Components', dir: path.join(FEATURES_DIR, 'community') },
  { name: 'Root Components', dir: COMPONENTS_DIR }
];

// Documentation patterns to search for
const DOCUMENTATION_PATTERNS = {
  fileJSDoc: /\/\*\*[\s\S]*?@file[\s\S]*?\*\//,
  componentJSDoc: /\/\*\*[\s\S]*?ComponentName[\s\S]*?\*\//,
  propsInterface: /interface\s+[A-Za-z0-9]+Props/,
  propsJSDoc: /\/\*\*[\s\S]*?@(required|default)[\s\S]*?\*\//,
  exportDefault: /export\s+default\s+([A-Za-z0-9]+)/,
  exportNamed: /export\s+(?:function|const)\s+([A-Za-z0-9]+)/,
  reactFunctionalComponent: /(?:function|const)\s+([A-Za-z0-9]+)\s*(?::|=)\s*React\.FC/,
  deprecationNotice: /@deprecated/,
  stateUsage: /useState/g,
  effectUsage: /useEffect/g,
  memoUsage: /useMemo|React\.memo/g,
  callbackUsage: /useCallback/g,
  contextUsage: /useContext/g,
  refUsage: /useRef/g,
  inlineEventHandlers: /on[A-Z][a-zA-Z]+={(?![^}]*(?:useCallback|this\.[a-zA-Z]+))/g
};

/**
 * Recursively finds all component files
 */
async function findComponentFiles(dir) {
  const components = [];
  const entries = await readdirAsync(dir);
  
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    const stats = await statAsync(entryPath);
    
    if (stats.isDirectory()) {
      // Skip UI component library directory
      if (entry === 'ui') continue;
      const subComponents = await findComponentFiles(entryPath);
      components.push(...subComponents);
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) {
      components.push(entryPath);
    }
  }
  
  return components;
}

/**
 * Analyzes a component file for documentation and optimization opportunities
 */
async function analyzeComponent(filePath) {
  const content = await readFileAsync(filePath, 'utf8');
  const relativePath = path.relative(ROOT_DIR, filePath);
  const fileName = path.basename(filePath);
  const componentName = fileName.replace('.tsx', '');
  
  // Extract component export name
  const exportDefaultMatch = content.match(DOCUMENTATION_PATTERNS.exportDefault);
  const exportNamedMatch = content.match(DOCUMENTATION_PATTERNS.exportNamed);
  const functionalComponentMatch = content.match(DOCUMENTATION_PATTERNS.reactFunctionalComponent);
  
  const componentExportName = exportDefaultMatch?.[1] || exportNamedMatch?.[1] || functionalComponentMatch?.[1] || componentName;
  
  // Check documentation patterns
  const hasFileJSDoc = DOCUMENTATION_PATTERNS.fileJSDoc.test(content);
  const hasComponentJSDoc = DOCUMENTATION_PATTERNS.componentJSDoc.test(content);
  const hasPropsInterface = DOCUMENTATION_PATTERNS.propsInterface.test(content);
  const hasPropsJSDoc = DOCUMENTATION_PATTERNS.propsJSDoc.test(content);
  const isDeprecated = DOCUMENTATION_PATTERNS.deprecationNotice.test(content);
  
  // Check optimization patterns
  const stateUsageCount = (content.match(DOCUMENTATION_PATTERNS.stateUsage) || []).length;
  const effectUsageCount = (content.match(DOCUMENTATION_PATTERNS.effectUsage) || []).length;
  const memoUsageCount = (content.match(DOCUMENTATION_PATTERNS.memoUsage) || []).length;
  const callbackUsageCount = (content.match(DOCUMENTATION_PATTERNS.callbackUsage) || []).length;
  const contextUsageCount = (content.match(DOCUMENTATION_PATTERNS.contextUsage) || []).length;
  const refUsageCount = (content.match(DOCUMENTATION_PATTERNS.refUsage) || []).length;
  const inlineEventHandlersCount = (content.match(DOCUMENTATION_PATTERNS.inlineEventHandlers) || []).length;
  
  // Calculate documentation score (0-100%)
  const documentationChecks = [hasFileJSDoc, hasComponentJSDoc, hasPropsInterface, hasPropsJSDoc];
  const documentationScore = (documentationChecks.filter(Boolean).length / documentationChecks.length) * 100;
  
  // Calculate optimization opportunities
  let optimizationOpportunities = [];
  
  if (stateUsageCount > 3 && callbackUsageCount === 0) {
    optimizationOpportunities.push('Consider using useCallback for event handlers');
  }
  
  if (effectUsageCount > 0 && memoUsageCount === 0) {
    optimizationOpportunities.push('Consider using useMemo for expensive calculations');
  }
  
  if (inlineEventHandlersCount > 2) {
    optimizationOpportunities.push('Extract inline event handlers to useCallback');
  }
  
  if (stateUsageCount > 5) {
    optimizationOpportunities.push('Consider extracting complex state logic to custom hooks');
  }
  
  // Generate documentation template if missing
  let documentationTemplate = '';
  
  if (!hasFileJSDoc || !hasComponentJSDoc) {
    documentationTemplate = generateDocumentationTemplate(componentName);
  }
  
  // Determine best feature directory for this component
  let suggestedDirectory = determineSuggestedDirectory(filePath, content);
  
  return {
    path: relativePath,
    componentName: componentExportName,
    documentationScore,
    hasFileJSDoc,
    hasComponentJSDoc,
    hasPropsInterface,
    hasPropsJSDoc,
    isDeprecated,
    stateUsageCount,
    effectUsageCount,
    memoUsageCount,
    callbackUsageCount,
    contextUsageCount,
    refUsageCount,
    inlineEventHandlersCount,
    optimizationOpportunities,
    documentationTemplate,
    suggestedDirectory
  };
}

/**
 * Generates a documentation template for a component
 */
function generateDocumentationTemplate(componentName) {
  return `/**
 * @file ${componentName}.tsx
 * @description [COMPONENT DESCRIPTION]
 * @author [AUTHOR NAME]
 * @created [CREATION DATE]
 * @updated ${new Date().toISOString().split('T')[0]}
 * @status Active
 */

/**
 * ${componentName}
 * 
 * [DETAILED DESCRIPTION]
 * 
 * @example
 * \`\`\`tsx
 * <${componentName} 
 *   [PROP_NAME]=[PROP_VALUE]
 * />
 * \`\`\`
 * 
 * @see [RELATED_COMPONENT] - [RELATIONSHIP_DESCRIPTION]
 */

/**
 * Props for the ${componentName} component
 */
interface ${componentName}Props {
  /**
   * [PROP_DESCRIPTION]
   * @default [DEFAULT_VALUE]
   */
  [PROP_NAME]: [PROP_TYPE];
  
  /**
   * [REQUIRED_PROP_DESCRIPTION]
   * @required
   */
  [REQUIRED_PROP_NAME]: [PROP_TYPE];
}
`;
}

/**
 * Determines the best feature directory for a component based on its content
 */
function determineSuggestedDirectory(filePath, content) {
  const currentDir = path.dirname(filePath);
  const filename = path.basename(filePath);
  
  // If already in a proper directory, suggest keeping it there
  if (currentDir.includes('features/') || 
      currentDir.includes('layout/') || 
      currentDir.includes('common/')) {
    return currentDir;
  }
  
  // Check if it's an admin component
  if (filename.toLowerCase().includes('admin') || content.includes('admin')) {
    return path.join(FEATURES_DIR, 'admin');
  }
  
  // Check if it's a shop component
  if (filename.toLowerCase().includes('product') || 
      filename.toLowerCase().includes('cart') || 
      filename.toLowerCase().includes('checkout') ||
      content.includes('price') || 
      content.includes('product')) {
    return path.join(FEATURES_DIR, 'shop');
  }
  
  // Check if it's an audio component
  if (filename.toLowerCase().includes('audio') || 
      filename.toLowerCase().includes('music') || 
      filename.toLowerCase().includes('player') ||
      content.includes('audio') || 
      content.includes('playback')) {
    return path.join(FEATURES_DIR, 'audio');
  }
  
  // Check if it's a layout component
  if (filename.toLowerCase().includes('layout') || 
      filename.toLowerCase().includes('header') || 
      filename.toLowerCase().includes('footer') || 
      filename.toLowerCase().includes('sidebar') ||
      filename.toLowerCase().includes('navigation')) {
    return path.join(COMPONENTS_DIR, 'layout');
  }
  
  // Default to common components if no specific category is found
  return path.join(COMPONENTS_DIR, 'common');
}

/**
 * Formats component analysis results as Markdown
 */
function formatResults(results) {
  const totalComponents = results.length;
  const wellDocumentedComponents = results.filter(r => r.documentationScore >= 75).length;
  const poorlyDocumentedComponents = results.filter(r => r.documentationScore < 25).length;
  const deprecatedComponents = results.filter(r => r.isDeprecated).length;
  
  let markdown = `# Component Documentation Audit Results

## Summary

- **Total Components Analyzed**: ${totalComponents}
- **Well Documented Components**: ${wellDocumentedComponents} (${Math.round(wellDocumentedComponents / totalComponents * 100)}%)
- **Poorly Documented Components**: ${poorlyDocumentedComponents} (${Math.round(poorlyDocumentedComponents / totalComponents * 100)}%)
- **Deprecated Components**: ${deprecatedComponents}
- **Audit Date**: ${new Date().toISOString().split('T')[0]}

## Documentation Issues by Category

`;

  // Group by categories
  for (const category of COMPONENT_CATEGORIES) {
    const categoryComponents = results.filter(r => r.path.includes(path.relative(ROOT_DIR, category.dir)));
    
    if (categoryComponents.length === 0) continue;
    
    const wellDocumented = categoryComponents.filter(r => r.documentationScore >= 75).length;
    const percentage = Math.round(wellDocumented / categoryComponents.length * 100);
    
    markdown += `### ${category.name}

- **Components**: ${categoryComponents.length}
- **Well Documented**: ${wellDocumented} (${percentage}%)
- **Documentation Health**: ${'🟢'.repeat(Math.floor(percentage / 20))}${'🔴'.repeat(5 - Math.floor(percentage / 20))}

`;

    // List components needing documentation
    const needsDocumentation = categoryComponents.filter(r => r.documentationScore < 75)
      .sort((a, b) => a.documentationScore - b.documentationScore);
    
    if (needsDocumentation.length > 0) {
      markdown += `#### Components Needing Documentation Improvements

| Component | Doc Score | Missing | Optimization Opportunities |
|-----------|-----------|---------|----------------------------|
`;

      for (const component of needsDocumentation) {
        const missing = [
          !component.hasFileJSDoc ? 'File JSDoc' : '',
          !component.hasComponentJSDoc ? 'Component JSDoc' : '',
          !component.hasPropsInterface ? 'Props Interface' : '',
          !component.hasPropsJSDoc ? 'Props JSDoc' : ''
        ].filter(Boolean).join(', ');
        
        const optimizations = component.optimizationOpportunities.join('<br>');
        
        markdown += `| [${component.componentName}](${component.path}) | ${Math.round(component.documentationScore)}% | ${missing} | ${optimizations} |\n`;
      }
      
      markdown += '\n';
    }
  }

  markdown += `## Component Organization Recommendations

The following components should be moved to more appropriate directories:

| Component | Current Location | Suggested Location |
|-----------|------------------|-------------------|
`;

  // Add organization recommendations
  const needsReorganization = results
    .filter(r => r.path !== path.relative(ROOT_DIR, r.suggestedDirectory) + '/' + path.basename(r.path))
    .sort((a, b) => a.path.localeCompare(b.path));
  
  for (const component of needsReorganization) {
    const currentLocation = path.dirname(component.path);
    const suggestedLocation = path.relative(ROOT_DIR, component.suggestedDirectory);
    
    markdown += `| ${component.componentName} | ${currentLocation} | ${suggestedLocation} |\n`;
  }

  markdown += `\n## Performance Optimization Opportunities

Components with the most optimization opportunities:

| Component | State Usage | Effect Usage | Memo Usage | Callback Usage | Inline Handlers | Opportunities |
|-----------|------------|--------------|------------|----------------|----------------|--------------|
`;

  // Add performance optimization recommendations
  const needsOptimization = results
    .filter(r => r.optimizationOpportunities.length > 0)
    .sort((a, b) => b.optimizationOpportunities.length - a.optimizationOpportunities.length)
    .slice(0, 10);
  
  for (const component of needsOptimization) {
    markdown += `| [${component.componentName}](${component.path}) | ${component.stateUsageCount} | ${component.effectUsageCount} | ${component.memoUsageCount} | ${component.callbackUsageCount} | ${component.inlineEventHandlersCount} | ${component.optimizationOpportunities.length} |\n`;
  }

  markdown += `\n## Documentation Templates

For components with missing documentation, use the following templates:

`;

  // Add documentation templates for the worst documented components
  const worstDocumented = results
    .filter(r => r.documentationScore < 25 && r.documentationTemplate)
    .sort((a, b) => a.documentationScore - b.documentationScore)
    .slice(0, 5);
  
  for (const component of worstDocumented) {
    markdown += `### ${component.componentName} Documentation Template

\`\`\`tsx
${component.documentationTemplate}
\`\`\`

`;
  }

  markdown += `## Next Steps

1. Start by documenting the components with the lowest documentation scores
2. Move components to their suggested directories
3. Implement optimization opportunities for components with the most state usage
4. Update feature README.md files to include new components
5. Add proper deprecation notices for deprecated components

Remember to follow the guidelines in the [Component Documentation Guide](../docs/COMPONENT_DOCUMENTATION_GUIDE.md).

---

*Generated on ${new Date().toISOString().split('T')[0]}*
`;

  return markdown;
}

/**
 * Main function to run the audit
 */
async function main() {
  try {
    console.log('Starting component documentation analysis...');
    
    // Find all component files
    const componentFiles = await findComponentFiles(COMPONENTS_DIR);
    console.log(`Found ${componentFiles.length} component files`);
    
    // Analyze each component
    const results = [];
    for (const filePath of componentFiles) {
      const result = await analyzeComponent(filePath);
      results.push(result);
      process.stdout.write('.');
    }
    console.log('\nAnalysis complete');
    
    // Format results
    const markdown = formatResults(results);
    
    // Write results to file
    await writeFileAsync(OUTPUT_FILE, markdown);
    console.log(`Results written to ${OUTPUT_FILE}`);
    
    // Print summary
    const wellDocumented = results.filter(r => r.documentationScore >= 75).length;
    const percentage = Math.round(wellDocumented / results.length * 100);
    console.log(`\nDocumentation Health: ${percentage}% of components are well documented`);
    
    const needsReorganization = results.filter(r => 
      r.path !== path.relative(ROOT_DIR, r.suggestedDirectory) + '/' + path.basename(r.path)
    ).length;
    console.log(`Organization Issues: ${needsReorganization} components should be moved to better directories`);
    
    const optimizationOpportunities = results.reduce((sum, r) => sum + r.optimizationOpportunities.length, 0);
    console.log(`Optimization Opportunities: ${optimizationOpportunities} total opportunities found`);
    
  } catch (error) {
    console.error('Error during component analysis:', error);
    process.exit(1);
  }
}

/**
 * Checks if an automated audit should be run based on last run date
 */
async function shouldRunAutomatedAudit() {
  const auditSchedulePath = path.join(ROOT_DIR, 'docs', '.audit-schedule.json');
  
  try {
    // Check if schedule file exists
    if (fs.existsSync(auditSchedulePath)) {
      const scheduleData = JSON.parse(await readFileAsync(auditSchedulePath, 'utf8'));
      const lastRunDate = new Date(scheduleData.lastRunDate);
      const nextRunDate = new Date(scheduleData.nextScheduledDate);
      const today = new Date();
      
      console.log(`Last audit run: ${lastRunDate.toLocaleDateString()}`);
      console.log(`Next scheduled audit: ${nextRunDate.toLocaleDateString()}`);
      
      // Return true if today is on or after the next scheduled date
      return today >= nextRunDate;
    }
    
    // If file doesn't exist, return true to run the audit
    return true;
  } catch (error) {
    console.error('Error checking audit schedule:', error);
    return true; // Run the audit on error to be safe
  }
}

/**
 * Updates the audit schedule for the next run
 */
async function updateAuditSchedule() {
  const auditSchedulePath = path.join(ROOT_DIR, 'docs', '.audit-schedule.json');
  const today = new Date();
  
  // Calculate next quarter date (3 months from now)
  const nextQuarterDate = new Date(today);
  nextQuarterDate.setMonth(today.getMonth() + 3);
  
  const scheduleData = {
    lastRunDate: today.toISOString(),
    nextScheduledDate: nextQuarterDate.toISOString(),
    frequency: 'quarterly'
  };
  
  await writeFileAsync(auditSchedulePath, JSON.stringify(scheduleData, null, 2));
  console.log(`Audit schedule updated. Next audit scheduled for: ${nextQuarterDate.toLocaleDateString()}`);
}

// Run the script
const runAudit = async () => {
  const shouldRun = await shouldRunAutomatedAudit();
  
  if (process.argv.includes('--force') || shouldRun) {
    await main();
    await updateAuditSchedule();
    console.log('\nAudit completed and schedule updated. Next audit will be in 3 months.');
  } else {
    console.log('\nSkipping audit as it is not yet time for the scheduled quarterly run.');
    console.log('Use --force flag to run the audit regardless of schedule.');
  }
};

runAudit();