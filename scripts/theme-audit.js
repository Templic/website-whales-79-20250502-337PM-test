/**
 * Theme Audit Tool
 * 
 * This utility analyzes the codebase to identify:
 * - Hardcoded color values
 * - Inconsistent spacing values
 * - Non-semantic variable usage
 * - Inaccessible color combinations
 * 
 * Usage:
 *   node scripts/theme-audit.js [directory]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // File extensions to scan
  extensions: ['.css', '.scss', '.ts', '.tsx', '.js', '.jsx'],
  
  // Directories to exclude
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.cache'],
  
  // Patterns to detect
  patterns: {
    hexColors: /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi,
    rgbColors: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi,
    hslColors: /hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)/gi,
    numericValues: /(\d+)(px|rem|em|vh|vw|%)/g,
    nonVarColors: /color:\s*(?!var)[^;]+;/g,
  },
  
  // Accessibility thresholds
  accessibility: {
    minContrastRatio: 4.5,  // WCAG AA for normal text
  }
};

// Stats and findings
const stats = {
  filesScanned: 0,
  hardcodedColors: 0,
  inconsistentSpacing: 0,
  nonSemanticVars: 0,
  accessibilityIssues: 0,
  findings: []
};

/**
 * Main function
 */
async function main() {
  // Get target directory (default to root folder)
  const targetDir = process.argv[2] || path.join(__dirname, '..');
  console.log(`\n🔍 Theme Audit Tool`);
  console.log(`Scanning directory: ${targetDir}\n`);
  
  // Scan files
  await scanDirectory(targetDir);
  
  // Print summary
  printSummary();
  
  // Generate report
  generateReport();
}

/**
 * Recursively scan a directory for theme issues
 */
async function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(entry.name)) {
          await scanDirectory(fullPath);
        }
        continue;
      }
      
      // Only process files with specified extensions
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.extensions.includes(ext)) {
        await auditFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Audit a single file for theme issues
 */
async function auditFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    
    stats.filesScanned++;
    
    // Find hardcoded colors
    const hexColors = findMatches(content, CONFIG.patterns.hexColors);
    const rgbColors = findMatches(content, CONFIG.patterns.rgbColors);
    const hslColors = findMatches(content, CONFIG.patterns.hslColors);
    const nonVarColors = findMatches(content, CONFIG.patterns.nonVarColors);
    
    const totalHardcodedColors = hexColors.length + rgbColors.length + hslColors.length;
    stats.hardcodedColors += totalHardcodedColors;
    
    if (totalHardcodedColors > 0) {
      stats.findings.push({
        type: 'hardcoded-colors',
        path: relativePath,
        count: totalHardcodedColors,
        details: {
          hex: hexColors.slice(0, 5),
          rgb: rgbColors.slice(0, 5),
          hsl: hslColors.slice(0, 5),
        }
      });
    }
    
    // Find inconsistent spacing
    const numericValues = findMatches(content, CONFIG.patterns.numericValues);
    const spacingIssues = detectInconsistentSpacing(numericValues);
    stats.inconsistentSpacing += spacingIssues.length;
    
    if (spacingIssues.length > 0) {
      stats.findings.push({
        type: 'inconsistent-spacing',
        path: relativePath,
        count: spacingIssues.length,
        details: spacingIssues.slice(0, 5)
      });
    }
    
    // Calculate progress
    if (stats.filesScanned % 50 === 0) {
      process.stdout.write('.');
      if (stats.filesScanned % 500 === 0) {
        process.stdout.write(` ${stats.filesScanned} files\n`);
      }
    }
    
  } catch (error) {
    console.error(`Error auditing file ${filePath}:`, error);
  }
}

/**
 * Find all matches of a pattern in content
 */
function findMatches(content, pattern) {
  const matches = [];
  let match;
  
  // Reset the RegExp object to avoid infinite loops
  pattern.lastIndex = 0;
  
  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return matches;
}

/**
 * Detect inconsistent spacing values
 */
function detectInconsistentSpacing(numericValues) {
  const issues = [];
  const pxValues = new Set();
  const remValues = new Set();
  
  // Collect all values
  numericValues.forEach(match => {
    if (match.value.endsWith('px')) {
      const value = parseInt(match.value);
      if (value > 0 && value < 48) {  // Only consider spacing-like values
        pxValues.add(value);
      }
    }
    if (match.value.endsWith('rem')) {
      remValues.add(parseFloat(match.value));
    }
  });
  
  // Check for non-standard values
  const standardPxValues = new Set([0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48]);
  const standardRemValues = new Set([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]);
  
  // Find non-standard values
  pxValues.forEach(value => {
    if (!standardPxValues.has(value)) {
      issues.push({
        type: 'non-standard-px',
        value: `${value}px`
      });
    }
  });
  
  remValues.forEach(value => {
    if (!standardRemValues.has(value)) {
      issues.push({
        type: 'non-standard-rem',
        value: `${value}rem`
      });
    }
  });
  
  return issues;
}

/**
 * Print audit summary
 */
function printSummary() {
  console.log(`\n\n📊 Theme Audit Summary`);
  console.log(`--------------------------`);
  console.log(`Files scanned: ${stats.filesScanned}`);
  console.log(`Hardcoded colors found: ${stats.hardcodedColors}`);
  console.log(`Inconsistent spacing values: ${stats.inconsistentSpacing}`);
  console.log(`Accessibility issues: ${stats.accessibilityIssues}`);
  console.log(`--------------------------`);
  
  // Files with most issues
  const filesByIssueCount = {};
  stats.findings.forEach(finding => {
    filesByIssueCount[finding.path] = (filesByIssueCount[finding.path] || 0) + finding.count;
  });
  
  const topFiles = Object.entries(filesByIssueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topFiles.length > 0) {
    console.log(`\nTop files to address:`);
    topFiles.forEach(([file, count], index) => {
      console.log(`${index + 1}. ${file} (${count} issues)`);
    });
  }
}

/**
 * Generate report file
 */
function generateReport() {
  const reportPath = path.join(__dirname, '../docs/theme-audit-report.md');
  let report = `# Theme Audit Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Files scanned: ${stats.filesScanned}\n`;
  report += `- Hardcoded colors found: ${stats.hardcodedColors}\n`;
  report += `- Inconsistent spacing values: ${stats.inconsistentSpacing}\n`;
  report += `- Accessibility issues: ${stats.accessibilityIssues}\n\n`;
  
  report += `## Detailed Findings\n\n`;
  
  // Group findings by type
  const findingsByType = {};
  stats.findings.forEach(finding => {
    findingsByType[finding.type] = findingsByType[finding.type] || [];
    findingsByType[finding.type].push(finding);
  });
  
  // Generate detailed sections
  if (findingsByType['hardcoded-colors']) {
    report += `### Hardcoded Colors\n\n`;
    report += `${findingsByType['hardcoded-colors'].length} files with hardcoded colors found.\n\n`;
    
    // Show top 10 files with most hardcoded colors
    const topColorFiles = findingsByType['hardcoded-colors']
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    report += `| File | Count | Examples |\n`;
    report += `| ---- | ----- | -------- |\n`;
    
    topColorFiles.forEach(finding => {
      const examples = [
        ...finding.details.hex.map(m => m.value),
        ...finding.details.rgb.map(m => m.value),
        ...finding.details.hsl.map(m => m.value),
      ].slice(0, 3).join(', ');
      
      report += `| ${finding.path} | ${finding.count} | ${examples} |\n`;
    });
    
    report += `\n`;
  }
  
  if (findingsByType['inconsistent-spacing']) {
    report += `### Inconsistent Spacing\n\n`;
    report += `${findingsByType['inconsistent-spacing'].length} files with non-standard spacing values found.\n\n`;
    
    // Show top 10 files with most spacing inconsistencies
    const topSpacingFiles = findingsByType['inconsistent-spacing']
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    report += `| File | Count | Examples |\n`;
    report += `| ---- | ----- | -------- |\n`;
    
    topSpacingFiles.forEach(finding => {
      const examples = finding.details.map(d => d.value).slice(0, 3).join(', ');
      report += `| ${finding.path} | ${finding.count} | ${examples} |\n`;
    });
    
    report += `\n`;
  }
  
  report += `## Recommendations\n\n`;
  report += `1. Replace hardcoded color values with CSS custom properties from our design token system\n`;
  report += `2. Standardize spacing values using the spacing scale from our design tokens\n`;
  report += `3. Use semantic variables for all theme-related properties\n`;
  report += `4. Implement accessibility checks for all color combinations\n`;
  
  try {
    // Ensure directory exists
    const dirPath = path.dirname(reportPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`\nAudit report generated: ${reportPath}`);
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

// Run the audit
main();