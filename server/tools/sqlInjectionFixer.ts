/**
 * SQL Injection Vulnerability Automated Fixer
 * 
 * This utility automatically applies fixes to SQL injection vulnerabilities
 * identified by the SQL injection detector.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { scanDirectory, SQLInjectionVulnerability, generateFix } from './sqlInjectionDetector';

// Promisify filesystem operations
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Fix info interface
 */
interface FixInfo {
  file: string;
  originalLines: string[];
  fixedLines: string[];
  vulnerabilities: SQLInjectionVulnerability[];
  dryRun: boolean;
}

/**
 * Fix result interface
 */
interface FixResult {
  file: string;
  fixes: {
    line: number;
    original: string;
    fixed: string;
  }[];
  success: boolean;
  error?: string;
}

/**
 * Apply automated fixes to SQL injection vulnerabilities in a file
 */
async function fixFile(filePath: string, vulnerabilities: SQLInjectionVulnerability[], dryRun = true): Promise<FixResult> {
  try {
    // Read the file content
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Create a copy of the lines for applying fixes
    const fixedLines = [...lines];
    
    // Track fixes
    const fixes: FixResult['fixes'] = [];
    
    // Sort vulnerabilities by line number in descending order to avoid offset issues
    const sortedVulns = [...vulnerabilities].sort((a, b) => b.line - a.line);
    
    // Apply fixes to each vulnerability
    for (const vuln of sortedVulns) {
      const lineIndex = vuln.line - 1;
      
      if (lineIndex >= 0 && lineIndex < fixedLines.length) {
        const originalLine = fixedLines[lineIndex];
        const suggestedFix = generateFix(vuln);
        
        // Only apply the fix if it's meaningful
        if (suggestedFix && !suggestedFix.includes('Use ')) {
          // Simple replacement - in a real implementation, this would need to be smarter
          // and handle more complex code structures
          const fixedLine = applyFixToLine(originalLine, vuln, suggestedFix);
          
          // Only update if the line was actually changed
          if (fixedLine !== originalLine) {
            fixedLines[lineIndex] = fixedLine;
            
            fixes.push({
              line: vuln.line,
              original: originalLine,
              fixed: fixedLine
            });
          }
        }
      }
    }
    
    // If not a dry run and we have fixes, write the changes back to the file
    if (!dryRun && fixes.length > 0) {
      await writeFile(filePath, fixedLines.join('\n'));
    }
    
    return {
      file: filePath,
      fixes,
      success: true
    };
  } catch (error) {
    return {
      file: filePath,
      fixes: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * Apply a fix to a line of code
 */
function applyFixToLine(line: string, vulnerability: SQLInjectionVulnerability, suggestedFix: string): string {
  // Look for common SQL query patterns and apply appropriate fixes
  
  // Match template literals
  if (vulnerability.pattern.includes('Template literal')) {
    const templateMatch = line.match(/`([^`]+)`/);
    if (templateMatch) {
      // Extract the template and determine its position in the line
      const template = templateMatch[0];
      const startPos = line.indexOf(template);
      const endPos = startPos + template.length;
      
      // Determine if this is part of a query call
      const queryMatch = line.match(/(\w+)\.query\(`/);
      if (queryMatch) {
        // Extract the variable name before .query
        const dbVar = queryMatch[1];
        
        // Create a fixed version using sqlFix
        return `${dbVar}.query(${suggestedFix.replace('sqlFix.query(', '')})`;
      } else {
        // If it's just a SQL string without a query call
        // Build the context before and after the template
        const before = line.substring(0, startPos);
        const after = line.substring(endPos);
        
        // Replace the template with the fix
        return `${before}${suggestedFix}${after}`;
      }
    }
  }
  
  // Match string concatenation in queries
  if (vulnerability.pattern.includes('String concatenation')) {
    // Find query pattern
    const queryMatch = line.match(/(\w+)\.query\(([^)]+)\)/);
    if (queryMatch) {
      const dbVar = queryMatch[1];
      const queryContent = queryMatch[2];
      
      // Determine the type of SQL operation
      let queryType = 'SELECT';
      if (queryContent.includes('INSERT')) queryType = 'INSERT';
      if (queryContent.includes('UPDATE')) queryType = 'UPDATE';
      if (queryContent.includes('DELETE')) queryType = 'DELETE';
      
      // Find parameter variables
      const paramMatches = queryContent.match(/["']\s*\+\s*([^+]+?)\s*\+\s*["']/g);
      const params: string[] = [];
      
      if (paramMatches) {
        for (const paramMatch of paramMatches) {
          // Extract the variable between + and +
          const param = paramMatch.match(/["']\s*\+\s*([^+]+?)\s*\+\s*["']/);
          if (param && param[1]) {
            params.push(param[1].trim());
          }
        }
      }
      
      // Replace the concatenation with placeholders
      let sqlQuery = queryContent;
      for (let i = 0; i < params.length; i++) {
        const paramPattern = new RegExp(`["']\\s*\\+\\s*${params[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\+\\s*["']`, 'g');
        sqlQuery = sqlQuery.replace(paramPattern, `$${i + 1}`);
      }
      
      // Clean up SQL string (remove extra quotes)
      sqlQuery = sqlQuery.replace(/["']\s*\+\s*["']/g, '');
      
      // Build the final fixed line
      return `${dbVar}.query(${sqlQuery}, [${params.join(', ')}])`;
    }
  }
  
  // If we can't apply an automated fix, return the original line
  return line;
}

/**
 * Apply automated fixes to all SQL injection vulnerabilities found in a directory
 */
async function fixDirectory(dir: string, dryRun = true): Promise<FixResult[]> {
  // Scan the directory for vulnerabilities
  const vulnerabilities = await scanDirectory(dir);
  
  // Group vulnerabilities by file
  const fileGroups: Record<string, SQLInjectionVulnerability[]> = {};
  
  for (const vuln of vulnerabilities) {
    if (!fileGroups[vuln.file]) {
      fileGroups[vuln.file] = [];
    }
    fileGroups[vuln.file].push(vuln);
  }
  
  // Apply fixes to each file
  const results: FixResult[] = [];
  
  for (const file in fileGroups) {
    const fileVulnerabilities = fileGroups[file];
    const result = await fixFile(file, fileVulnerabilities, dryRun);
    results.push(result);
  }
  
  return results;
}

/**
 * Generate a report of the fixes applied
 */
function generateFixReport(results: FixResult[]): string {
  if (results.length === 0) {
    return 'No files processed.';
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  let report = `SQL Injection Fix Report\n`;
  report += '=======================\n\n';
  report += `Processed ${results.length} files (${successCount} successful, ${failCount} failed)\n\n`;
  
  // Count total fixes
  const totalFixes = results.reduce((sum, result) => sum + result.fixes.length, 0);
  report += `Total fixes applied: ${totalFixes}\n\n`;
  
  // Generate detailed report
  for (const result of results) {
    report += `File: ${result.file}\n`;
    
    if (!result.success) {
      report += `  ERROR: ${result.error}\n`;
      continue;
    }
    
    if (result.fixes.length === 0) {
      report += `  No fixes applied\n`;
      continue;
    }
    
    report += `  Applied ${result.fixes.length} fixes:\n`;
    
    for (const fix of result.fixes) {
      report += `  Line ${fix.line}:\n`;
      report += `    Original: ${fix.original.trim()}\n`;
      report += `    Fixed:    ${fix.fixed.trim()}\n\n`;
    }
  }
  
  return report;
}

/**
 * Main function to run the SQL injection fixer
 */
async function main() {
  console.log('SQL Injection Vulnerability Fixer');
  console.log('=================================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRunArg = args.find(arg => arg === '--dry-run' || arg === '-d');
  const dryRun = dryRunArg !== undefined;
  
  if (dryRun) {
    console.log('Running in dry-run mode, no changes will be made');
  }
  
  // Set the directories to scan
  const dirsToScan = ['server', 'client', 'shared'];
  
  console.log('Processing directories:', dirsToScan.join(', '));
  
  // Fix vulnerabilities in each directory
  const allResults: FixResult[] = [];
  
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      const results = await fixDirectory(dir, dryRun);
      allResults.push(...results);
    }
  }
  
  // Generate and print the report
  const report = generateFixReport(allResults);
  console.log(report);
  
  // Save the report to a file
  const reportPath = path.join('reports', `sql_injection_fix_report_${dryRun ? 'dry_run' : 'applied'}.txt`);
  
  try {
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);
  } catch (error) {
    console.error('Error saving report:', error);
  }
  
  // Print summary
  const totalFixes = allResults.reduce((sum, result) => sum + result.fixes.length, 0);
  console.log(`\nFix summary: ${totalFixes} fixes ${dryRun ? 'would be' : 'were'} applied to ${allResults.length} files`);
  
  return allResults;
}

// Run the fixer if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running SQL injection fixer:', error);
    process.exit(1);
  });
}

// Export functionality for use as a module
export { 
  fixFile, 
  fixDirectory, 
  generateFixReport,
  FixResult
};