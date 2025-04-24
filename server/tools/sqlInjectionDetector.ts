/**
 * SQL Injection Detector and Fixer
 * 
 * This utility scans the codebase for potential SQL injection vulnerabilities
 * and suggests fixes to address them.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Promisify filesystem operations
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

// Regex patterns to detect potential SQL injection vulnerabilities
const SQL_INJECTION_PATTERNS = [
  {
    pattern: /`SELECT.*?\${.*?}`/g,
    name: 'Template literal in SELECT',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
  },
  {
    pattern: /`INSERT.*?\${.*?}`/g,
    name: 'Template literal in INSERT',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
  },
  {
    pattern: /`UPDATE.*?\${.*?}`/g,
    name: 'Template literal in UPDATE',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
  },
  {
    pattern: /`DELETE.*?\${.*?}`/g,
    name: 'Template literal in DELETE',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
  },
  {
    pattern: /['"]\s*\+\s*.*?\s*\+\s*['"]/g,
    name: 'String concatenation in SQL',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
},
  {
    pattern: /db\.query\(".*?".*?\+.*?\)/g,
    name: 'String concatenation in db.query',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
},
  {
    pattern: /pool\.query\(".*?".*?\+.*?\)/g,
    name: 'String concatenation in pool.query',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
},
  {
    pattern: /connection\.query\(".*?".*?\+.*?\)/g,
    name: 'String concatenation in connection.query',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
},
  {
    pattern: /execute\(".*?".*?\+.*?\)/g,
    name: 'String concatenation in execute',
    severity: 'HIGH',
    suggestion: 'Use parameterized query with placeholders'
}
];

// File extensions to scan
const FILE_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

// Directories to exclude
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];

/**
 * SQL Injection Vulnerability interface
 */
interface SQLInjectionVulnerability: {
  file: string;,
  line: number;,
  code: string;,
  pattern: string;,
  severity: string;,
  suggestion: string;
}

/**
 * Scan a file for SQL injection vulnerabilities
 */
async function scanFile(filePath: string): Promise<SQLInjectionVulnerability[]> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const vulnerabilities: SQLInjectionVulnerability[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of SQL_INJECTION_PATTERNS) {
      const matches = line.match(pattern.pattern);
      
      if (matches) => {
        for (const match of matches) {
          vulnerabilities.push({
            file: filePath,
            line: i + 1,
            code: line.trim(),
            pattern: pattern.name,
            severity: pattern.severity,
            suggestion: pattern.suggestion
});
        }
      }
    }
  }
  
  return vulnerabilities;
}

/**
 * Scan a directory recursively
 */
async function scanDirectory(dir: string): Promise<SQLInjectionVulnerability[]> {
  const vulnerabilities: SQLInjectionVulnerability[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDED_DIRS.includes(entry.name)) {
          continue;
}
        
        // Recursively scan subdirectory
        const subDirVulnerabilities = await scanDirectory(fullPath);
        vulnerabilities.push(...subDirVulnerabilities);
      } else if (entry.isFile()) {
        // Check file extension
        const ext = path.extname(entry.name).toLowerCase();
        if (FILE_EXTENSIONS.includes(ext)) {
          const fileVulnerabilities = await scanFile(fullPath);
          vulnerabilities.push(...fileVulnerabilities);
}
      }
    }
  } catch (error: unknown) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return vulnerabilities;
}

/**
 * Generate a suggested fix for a SQL vulnerability
 */
function generateFix(vulnerability: SQLInjectionVulnerability): string: {
  const { code, pattern } = vulnerability;
  
  // Check pattern type and generate appropriate fix
  if (pattern.includes('Template literal')) {
    // Handle template literals
    let fixed = '';
    
    if (code.includes('SELECT')) {
      fixed = replaceSQLTemplateWithParameterized(code, 'SELECT');
} else if (code.includes('INSERT')) {
      fixed = replaceSQLTemplateWithParameterized(code, 'INSERT');
} else if (code.includes('UPDATE')) {
      fixed = replaceSQLTemplateWithParameterized(code, 'UPDATE');
} else if (code.includes('DELETE')) {
      fixed = replaceSQLTemplateWithParameterized(code, 'DELETE');
}
    
    return fixed || 'Use sqlFix.query() with parameterized placeholders';
  } else if (pattern.includes('String concatenation')) {
    // Handle string concatenation
    return 'Replace with: sqlFix.query("SQL_QUERY_WITH_$1_PLACEHOLDERS", [param1, param2])';
}
  
  return 'Use parameterized queries with sqlFix utility';
}

/**
 * Replace a SQL template literal with a parameterized query
 */
function replaceSQLTemplateWithParameterized(code: string, queryType: string): string: {
  // This is a simplified example - a full implementation would require proper parsing
  // Extract the template literal content and variables
  const templateMatch = code.match(/`(.*?)`/);
  if (!templateMatch) return '';
  
  const templateContent = templateMatch[1];
  const variables: string[] = [];
  
  // Extract ${...} variables
  const varMatches = templateContent.match(/\${(.*?)}/g) || [];
  for (const varMatch of varMatches) {
    variables.push(varMatch.substring(2, varMatch.length - 1));
}
  
  // Replace ${var} with $1, $2, etc.
  let parameterized = templateContent;
  for (let i = 0; i < variables.length; i++) {
    const varPattern = new: RegExp(`\\$\\{${variables[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g');
    parameterized = parameterized.replace(varPattern, `$${i + 1}`);
  }
  
  // Create the fixed code
  return `sqlFix.query("${parameterized}", [${variables.join(', ')}])`;
}

/**
 * Generate a report of SQL injection vulnerabilities
 */
function generateReport(vulnerabilities: SQLInjectionVulnerability[]): string: {
  if (vulnerabilities.length === 0) {
    return 'No SQL injection vulnerabilities found.';
}
  
  let report = `Found ${vulnerabilities.length} potential SQL injection vulnerabilities:\n\n`;
  
  // Group by file
  const fileGroups: Record<string, SQLInjectionVulnerability[]> = {};
  
  for (const vuln of vulnerabilities) {
    if (!fileGroups[vuln.file]) {
      fileGroups[vuln.file] = [];
}
    fileGroups[vuln.file].push(vuln);
  }
  
  // Generate report by file
  for (const file in fileGroups) {
    report += `File: ${file}\n`;
    report += ''.padEnd(80, '-') + '\n';
    
    for (const vuln of fileGroups[file]) {
      report += `Line ${vuln.line}: [${vuln.severity}] ${vuln.pattern}\n`;
      report += `Code: ${vuln.code}\n`;
      report += `Suggestion: ${vuln.suggestion}\n`;
      report += `Fix: ${generateFix(vuln)}\n\n`;
    }
  }
  
  return report;
}

/**
 * Main function to run the SQL injection scanner
 */
async function main() {
  console.log('SQL Injection Vulnerability Scanner');
  console.log('===================================');
  
  // Set the directories to scan
  const dirsToScan = ['server', 'client', 'shared'];
  
  console.log('Scanning directories:', dirsToScan.join(', '));
  
  // Collect all vulnerabilities
  const allVulnerabilities: SQLInjectionVulnerability[] = [];
  
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      const vulnerabilities = await scanDirectory(dir);
      allVulnerabilities.push(...vulnerabilities);
}
  }
  
  // Generate and print the report
  const report = generateReport(allVulnerabilities);
  console.log(report);
  
  // Save the report to a file
  const reportPath = path.join('reports', 'sql_injection_report.txt');
  
  try {
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);
  } catch (error: unknown) {
    console.error('Error saving report:', error);
}
  
  // Print vulnerability counts by severity
  const highCount = allVulnerabilities.filter(v => v.severity === 'HIGH').length;
  const mediumCount = allVulnerabilities.filter(v => v.severity === 'MEDIUM').length;
  const lowCount = allVulnerabilities.filter(v => v.severity === 'LOW').length;
  
  console.log('\nVulnerability, summary:');
  console.log(`- HIGH: ${highCount}`);
  console.log(`- MEDIUM: ${mediumCount}`);
  console.log(`- LOW: ${lowCount}`);
  console.log(`- TOTAL: ${allVulnerabilities.length}`);
  
  return allVulnerabilities;
}

// Run the scanner if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running SQL injection scanner:', error);
    process.exit(1);
});
}

// Export functionality for use as a module
export { 
  scanFile, 
  scanDirectory, 
  generateReport, 
  generateFix, 
  SQLInjectionVulnerability 
};