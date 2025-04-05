/**
 * Component Similarity Analysis
 * 
 * This script analyzes component files to identify similar or duplicate components
 * that could potentially be consolidated.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base components directory
const componentsDir = path.join(process.cwd(), 'client/src/components');

// Extensions to process
const extensions = ['.tsx', '.jsx'];

// Minimum similarity threshold (0-1)
const SIMILARITY_THRESHOLD = 0.7;

/**
 * Gets all component files recursively
 */
function getAllComponentFiles() {
  const result = [];
  
  function traverse(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        traverse(filePath);
      } else if (stat.isFile() && extensions.includes(path.extname(file))) {
        result.push(filePath);
      }
    });
  }
  
  traverse(componentsDir);
  return result;
}

/**
 * Analyze a component file
 */
function analyzeComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const relativePath = path.relative(componentsDir, filePath);
    
    // Component category based on directory
    let category = path.dirname(relativePath).split(path.sep)[0];
    if (category === '.') {
      category = 'root';
    }
    
    // Extract imports
    const imports = [];
    const importRegex = /import\s+(?:{([^}]+)}\s+from\s+|([^\s]+)\s+from\s+)['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const namedImports = match[1] ? match[1].trim().split(/\s*,\s*/) : [];
      const defaultImport = match[2] ? match[2].trim() : null;
      const importPath = match[3];
      
      if (defaultImport) {
        imports.push({ type: 'default', name: defaultImport, path: importPath });
      }
      
      namedImports.forEach(namedImport => {
        // Handle "as" aliases in imports
        const importParts = namedImport.trim().split(/\s+as\s+/);
        const originalName = importParts[0].trim();
        const alias = importParts[1] ? importParts[1].trim() : null;
        
        imports.push({ 
          type: 'named', 
          name: originalName, 
          alias, 
          path: importPath 
        });
      });
    }
    
    // Extract exported component name
    let exportName = null;
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    if (exportMatches && exportMatches[1]) {
      exportName = exportMatches[1];
    }
    
    // Detect props interface or type
    const propsMatches = content.match(/interface\s+(\w+Props)|type\s+(\w+Props)/);
    const propsInterface = propsMatches ? propsMatches[1] || propsMatches[2] : null;
    
    // Count various features to characterize component
    const featureCounts = {
      stateHooks: (content.match(/useState\(/g) || []).length,
      effectHooks: (content.match(/useEffect\(/g) || []).length,
      refHooks: (content.match(/useRef\(/g) || []).length,
      memoHooks: (content.match(/useMemo\(/g) || []).length,
      callbackHooks: (content.match(/useCallback\(/g) || []).length,
      contextHooks: (content.match(/useContext\(/g) || []).length,
      reducerHooks: (content.match(/useReducer\(/g) || []).length,
      customHooks: (content.match(/use[A-Z]\w+\(/g) || []).length,
      conditionalRendering: (content.match(/\{.*\?.*:.*\}/g) || []).length,
      mappedElements: (content.match(/\.map\(\s*\([^)]*\)\s*=>/g) || []).length,
    };
    
    // Extract JSX elements (very basic approach)
    const jsxElements = [];
    const jsxRegex = /<([A-Z]\w+|[a-z][\w\.]*)/g;
    while ((match = jsxRegex.exec(content)) !== null) {
      jsxElements.push(match[1]);
    }
    
    // Count unique JSX elements
    const uniqueElements = [...new Set(jsxElements)];
    featureCounts.jsxElementCount = uniqueElements.length;
    
    // Component size metrics
    const lineCount = content.split('\n').length;
    const codeSize = content.length;
    
    return {
      path: filePath,
      name: fileName,
      exportName,
      category,
      imports,
      propsInterface,
      featureCounts,
      jsxElements: uniqueElements,
      metrics: {
        lineCount,
        codeSize
      },
      // Store normalized name for similarity comparison
      normalizedName: path.basename(filePath, path.extname(filePath))
        .toLowerCase()
        .replace(/[-_]/g, '')
        .replace(/component$/, '')
        .replace(/container$/, '')
    };
  } catch (error) {
    console.error(`Error analyzing component ${filePath}:`, error);
    return { 
      path: filePath, 
      name: path.basename(filePath),
      error: true
    };
  }
}

/**
 * Calculate similarity between two components
 */
function calculateSimilarity(comp1, comp2) {
  if (comp1.error || comp2.error) return 0;
  
  // Name similarity (using normalized names)
  const nameSimilarity = comp1.normalizedName === comp2.normalizedName ? 1 : 
    comp1.normalizedName.includes(comp2.normalizedName) || 
    comp2.normalizedName.includes(comp1.normalizedName) ? 0.8 : 0;
  
  // Import similarity
  const importPaths1 = comp1.imports.map(imp => imp.path);
  const importPaths2 = comp2.imports.map(imp => imp.path);
  
  // Count shared imports
  const sharedImports = importPaths1.filter(path => importPaths2.includes(path));
  const importSimilarity = sharedImports.length / 
    Math.max(importPaths1.length, importPaths2.length, 1);
  
  // JSX element similarity
  const elements1 = comp1.jsxElements || [];
  const elements2 = comp2.jsxElements || [];
  
  // Count shared elements
  const sharedElements = elements1.filter(el => elements2.includes(el));
  const elementSimilarity = sharedElements.length / 
    Math.max(elements1.length, elements2.length, 1);
  
  // Size similarity
  const sizeDiff = Math.abs(comp1.metrics.lineCount - comp2.metrics.lineCount);
  const sizeRatio = Math.min(comp1.metrics.lineCount, comp2.metrics.lineCount) / 
    Math.max(comp1.metrics.lineCount, comp2.metrics.lineCount, 1);
  const sizeSimilarity = sizeDiff < 10 ? 1 : 
    sizeDiff < 50 ? 0.8 : 
    sizeRatio;
  
  // Feature count similarity
  let featureSimilarity = 0;
  if (comp1.featureCounts && comp2.featureCounts) {
    const featureKeys = Object.keys(comp1.featureCounts);
    let featureScore = 0;
    
    featureKeys.forEach(key => {
      const diff = Math.abs(comp1.featureCounts[key] - comp2.featureCounts[key]);
      featureScore += diff === 0 ? 1 : diff === 1 ? 0.8 : diff <= 3 ? 0.5 : 0;
    });
    
    featureSimilarity = featureScore / featureKeys.length;
  }
  
  // Overall similarity score (weighted)
  const score = (
    nameSimilarity * 0.4 + 
    importSimilarity * 0.2 + 
    elementSimilarity * 0.2 + 
    sizeSimilarity * 0.1 + 
    featureSimilarity * 0.1
  );
  
  return {
    score,
    details: {
      nameSimilarity,
      importSimilarity,
      elementSimilarity,
      sizeSimilarity,
      featureSimilarity
    }
  };
}

/**
 * Find similar components
 */
function findSimilarComponents(components) {
  const similarGroups = [];
  const processedPairs = new Set();
  
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const comp1 = components[i];
      const comp2 = components[j];
      
      // Skip if already processed this pair
      const pairKey = `${comp1.path}|${comp2.path}`;
      if (processedPairs.has(pairKey)) {
        continue;
      }
      processedPairs.add(pairKey);
      
      // Skip if components are in the same directory
      const comp1Dir = path.dirname(comp1.path);
      const comp2Dir = path.dirname(comp2.path);
      if (comp1Dir === comp2Dir) {
        continue;
      }
      
      // Calculate similarity
      const similarity = calculateSimilarity(comp1, comp2);
      
      // If above threshold, consider them similar
      if (similarity.score >= SIMILARITY_THRESHOLD) {
        // Check if component1 is already in a group
        let foundGroup = similarGroups.find(group => 
          group.components.some(c => c.path === comp1.path)
        );
        
        if (foundGroup) {
          // Add component2 to existing group if not already there
          if (!foundGroup.components.some(c => c.path === comp2.path)) {
            foundGroup.components.push(comp2);
          }
        } else {
          // Check if component2 is already in a group
          foundGroup = similarGroups.find(group => 
            group.components.some(c => c.path === comp2.path)
          );
          
          if (foundGroup) {
            // Add component1 to existing group
            if (!foundGroup.components.some(c => c.path === comp1.path)) {
              foundGroup.components.push(comp1);
            }
          } else {
            // Create new group
            similarGroups.push({
              components: [comp1, comp2],
              similarity: similarity.score,
              details: similarity.details
            });
          }
        }
      }
    }
  }
  
  return similarGroups;
}

/**
 * Generate a consolidation plan for similar components
 */
function generateConsolidationPlan(similarGroups) {
  const plans = similarGroups.map(group => {
    // Sort components by path to ensure consistent results
    const sortedComponents = [...group.components].sort((a, b) => a.path.localeCompare(b.path));
    
    // Choose best target component
    // Prefer components in feature-specific directories
    const bestComponent = sortedComponents.find(c => c.path.includes('/features/')) || 
                        sortedComponents[0];
    
    // Components to merge into the best one
    const componentsToMerge = sortedComponents.filter(c => c.path !== bestComponent.path);
    
    return {
      targetComponent: {
        path: bestComponent.path,
        name: bestComponent.name,
        category: bestComponent.category
      },
      componentsToMerge: componentsToMerge.map(c => ({
        path: c.path,
        name: c.name,
        category: c.category
      })),
      similarity: group.similarity,
      mergeRecommendation: group.similarity > 0.9 ? 'Strong' : 'Consider'
    };
  });
  
  return plans.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Main function
 */
async function main() {
  console.log('Starting component similarity analysis...');

  // Get all component files
  const componentFiles = getAllComponentFiles();
  console.log(`Found ${componentFiles.length} component files`);
  
  // Analyze all components
  console.log('Analyzing components...');
  const analyzedComponents = componentFiles.map(analyzeComponent);
  const validComponents = analyzedComponents.filter(c => !c.error);
  console.log(`Successfully analyzed ${validComponents.length} components`);
  
  // Find similar components
  console.log('Finding similar components...');
  const similarGroups = findSimilarComponents(validComponents);
  console.log(`Found ${similarGroups.length} groups of similar components`);
  
  // Generate consolidation plan
  console.log('Generating consolidation plan...');
  const consolidationPlan = generateConsolidationPlan(similarGroups);
  
  // Write reports
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  // Write component analysis
  fs.writeFileSync(
    path.join(reportsDir, 'component-analysis.json'), 
    JSON.stringify(validComponents, null, 2)
  );
  
  // Write similar groups
  fs.writeFileSync(
    path.join(reportsDir, 'similar-components.json'), 
    JSON.stringify(similarGroups, null, 2)
  );
  
  // Write consolidation plan
  fs.writeFileSync(
    path.join(reportsDir, 'consolidation-plan.json'), 
    JSON.stringify(consolidationPlan, null, 2)
  );
  
  // Generate a more readable HTML report
  generateHtmlReport(validComponents, consolidationPlan, path.join(reportsDir, 'component-report.html'));
  
  console.log('\n==== Component Analysis Complete ====');
  console.log(`Total components analyzed: ${validComponents.length}`);
  console.log(`Similar component groups identified: ${similarGroups.length}`);
  console.log(`Consolidation recommendations: ${consolidationPlan.length}`);
  console.log(`\nReports generated in: ${reportsDir}`);
  
  // Print top recommendations
  console.log('\nTop consolidation recommendations:');
  consolidationPlan.slice(0, 5).forEach((plan, index) => {
    console.log(`\n${index + 1}. ${plan.mergeRecommendation} recommendation (${(plan.similarity * 100).toFixed(1)}% similarity):`);
    console.log(`   Target: ${path.relative(process.cwd(), plan.targetComponent.path)}`);
    console.log('   Merge:');
    plan.componentsToMerge.forEach(comp => {
      console.log(`     - ${path.relative(process.cwd(), comp.path)}`);
    });
  });
  
  if (consolidationPlan.length > 5) {
    console.log(`\n... and ${consolidationPlan.length - 5} more recommendations in the reports.`);
  }
}

/**
 * Generate an HTML report for better readability
 */
function generateHtmlReport(components, consolidationPlan, outputPath) {
  // Count components by category
  const categoryCounts = {};
  components.forEach(comp => {
    if (!categoryCounts[comp.category]) {
      categoryCounts[comp.category] = 0;
    }
    categoryCounts[comp.category]++;
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #1a1a1a;
    }
    .summary-box {
      background-color: #f5f5f5;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .chart-container {
      height: 300px;
      margin: 20px 0;
    }
    .recommendation {
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .strong {
      border-left: 5px solid #4caf50;
    }
    .consider {
      border-left: 5px solid #2196f3;
    }
    .similarity {
      float: right;
      font-weight: bold;
    }
    .target {
      font-weight: bold;
      color: #2196f3;
    }
    .component-list {
      list-style-type: none;
      padding-left: 20px;
    }
    .component-path {
      font-family: monospace;
      font-size: 0.9em;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  </style>
</head>
<body>
  <h1>Component Analysis Report</h1>
  
  <div class="summary-box">
    <h2>Summary</h2>
    <p>Total components analyzed: <strong>${components.length}</strong></p>
    <p>Consolidation recommendations: <strong>${consolidationPlan.length}</strong></p>
    
    <h3>Components by Category</h3>
    <table>
      <tr>
        <th>Category</th>
        <th>Count</th>
      </tr>
      ${Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => `
          <tr>
            <td>${category}</td>
            <td>${count}</td>
          </tr>
        `).join('')}
    </table>
  </div>
  
  <h2>Consolidation Recommendations</h2>
  
  ${consolidationPlan.map((plan, index) => `
    <div class="recommendation ${plan.mergeRecommendation.toLowerCase()}">
      <span class="similarity">${(plan.similarity * 100).toFixed(1)}% similarity</span>
      <h3>${index + 1}. ${plan.mergeRecommendation} Recommendation</h3>
      
      <p>
        <strong>Target Component:</strong>
        <span class="target">${path.basename(plan.targetComponent.path)}</span>
        <br>
        <span class="component-path">${path.relative(process.cwd(), plan.targetComponent.path)}</span>
      </p>
      
      <p><strong>Components to merge:</strong></p>
      <ul class="component-list">
        ${plan.componentsToMerge.map(comp => `
          <li>
            ${path.basename(comp.path)}
            <br>
            <span class="component-path">${path.relative(process.cwd(), comp.path)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('')}
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
}

// Run the script
main().catch(err => {
  console.error('Error executing script:', err);
});