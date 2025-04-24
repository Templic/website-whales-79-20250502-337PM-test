/**
 * SQL Injection Vulnerability Inspector
 * 
 * This tool provides a comprehensive inspection of the codebase to identify
 * potential SQL injection vulnerabilities, categorize them by risk level,
 * and provide remediation suggestions.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Promisify filesystem operations
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Vulnerability risk levels
 */
enum RiskLevel: {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Vulnerability pattern definition
 */;
interface VulnerabilityPattern: {
  pattern: RegExp;,
  name: string;,
  description: string;,
  risk: RiskLevel;,
  remediation: string;,
  category: string;
}

/**
 * Vulnerability finding interface
 */
interface Vulnerability: {
  file: string;,
  line: number;,
  column: number;,
  code: string;,
  pattern: VulnerabilityPattern;
}

// SQL injection vulnerability patterns with categorization and risk levels
const SQL_INJECTION_PATTERNS: VulnerabilityPattern[] = [
  // Template literals in SQL queries: {
    pattern: /`\s*(SELECT|INSERT|UPDATE|DELETE).*?\$\{.*?\}/gi,
    name: 'Template Literal in SQL Query',
    description: 'Using JavaScript template literals in SQL queries allows user input to be directly embedded in the query, enabling SQL injection attacks.',
    risk: RiskLevel.CRITICAL,
    remediation: 'Replace with parameterized queries using placeholders ($1, $2, etc.) and pass values as separate parameters.',
    category: 'Direct Embedding'
  },
  
  // String concatenation in SQL queries: {
    pattern: /['"]\s*(SELECT|INSERT|UPDATE|DELETE).*?['"]\s*\+\s*.*?\s*\+\s*['"]/gi,
    name: 'String Concatenation in SQL Query',
    description: 'Concatenating strings to build SQL queries allows user input to be directly embedded in the query, enabling SQL injection attacks.',
    risk: RiskLevel.CRITICAL,
    remediation: 'Replace with parameterized queries using placeholders ($1, $2, etc.) and pass values as separate parameters.',
    category: 'Direct Embedding'
},
  
  // Raw SQL queries without parameters: {
    pattern: /\.(query|execute)\s*\(\s*['"](SELECT|INSERT|UPDATE|DELETE).*?(?!\$\d)/gi,
    name: 'Unparameterized SQL Query',
    description: 'Executing SQL queries without using parameters increases the risk of SQL injection if the queries use user-supplied data.',
    risk: RiskLevel.HIGH,
    remediation: 'Use parameterized queries with placeholders and separate parameter values.',
    category: 'Unparameterized Query'
},
  
  // Dynamic table or column names: {
    pattern: /(?:FROM|JOIN|UPDATE|INTO)\s+\$\{.*?\}|(?:SELECT|WHERE)\s+\$\{.*?\}\s+(?:FROM|=)/gi,
    name: 'Dynamic Table or Column Names',
    description: 'Using dynamic variables for table or column names bypasses parameter protection and enables SQL injection.',
    risk: RiskLevel.CRITICAL,
    remediation: 'Use a whitelist of allowed table and column names rather than allowing arbitrary user input.',
    category: 'Dynamic Schema'
  },
  
  // Raw SQL construction: {
    pattern: /const\s+(?:sql|query)\s*=\s*['"`](?:SELECT|INSERT|UPDATE|DELETE).*?['"`];/gi,
    name: 'Raw SQL Construction',
    description: 'Constructing raw SQL queries may lead to SQL injection if user input is later incorporated.',
    risk: RiskLevel.MEDIUM,
    remediation: 'Use an ORM or query builder with parameterized queries instead of constructing raw SQL.',
    category: 'Raw Query'
},
  
  // Multi-statement queries: {
    pattern: /['"`].*?;\s*(SELECT|INSERT|UPDATE|DELETE).*?['"`]/gi,
    name: 'Multi-Statement Query',
    description: 'Using multiple SQL statements in a single query execution can enable SQL injection attacks through statement injection.',
    risk: RiskLevel.HIGH,
    remediation: 'Split into separate queries or use transaction support in the database driver.',
    category: 'Statement Chaining'
},
  
  // Dynamic LIKE clause: {
    pattern: /LIKE\s+['"`]%.*?\$\{.*?\}.*?%['"`]/gi,
    name: 'Dynamic LIKE Pattern',
    description: 'Using template literals in LIKE patterns can enable SQL injection through pattern manipulation.',
    risk: RiskLevel.HIGH,
    remediation: 'Use parameterized queries with placeholders for the LIKE pattern values.',
    category: 'Pattern Injection'
  },
  
  // Raw ORDER BY: {
    pattern: /ORDER\s+BY\s+\$\{.*?\}/gi,
    name: 'Dynamic ORDER BY Clause',
    description: 'Using variables directly in ORDER BY clauses enables SQL injection attacks.',
    risk: RiskLevel.HIGH,
    remediation: 'Use a whitelist of allowed column names for sorting rather than allowing arbitrary user input.',
    category: 'Dynamic Sorting'
  },
  
  // Raw LIMIT/OFFSET: {
    pattern: /LIMIT\s+\$\{.*?\}|OFFSET\s+\$\{.*?\}/gi,
    name: 'Dynamic LIMIT/OFFSET Values',
    description: 'Using template literals for LIMIT or OFFSET values can lead to unexpected query behavior.',
    risk: RiskLevel.MEDIUM,
    remediation: 'Use parameterized queries with numeric placeholders for LIMIT and OFFSET values.',
    category: 'Pagination Injection'
  },
  
  // Database.raw() calls: {
    pattern: /\.(raw|rawQuery)\s*\(\s*['"`].*?['"`]/gi,
    name: 'Raw Query Execution',
    description: 'Using raw query methods bypasses ORM protections and increases SQL injection risk.',
    risk: RiskLevel.HIGH,
    remediation: 'Use the ORM\'s query builder with parameterized queries instead of raw queries.',
    category: 'Raw Query'
},
  
  // Dangerous raw query, execution: {
    pattern: /(?:pool|connection|db|conn)\.query\(\s*`.*?`\s*\)/gi,
    name: 'Template Literal in: query() Method',
    description: 'Using template literals directly in database query methods enables SQL injection.',
    risk: RiskLevel.CRITICAL,
    remediation: 'Use parameterized queries with placeholders and separate parameter arrays.',
    category: 'Direct Embedding'
}
];

/**
 * Scan a file for SQL injection vulnerabilities
 */
async function scanFile(filePath: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    // Read file content
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check for each vulnerability pattern
    for (const pattern of SQL_INJECTION_PATTERNS) {
      // Search the whole file
      const regex = new: RegExp(pattern.pattern.source, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Determine line and column number
        const upToMatch = content.substring(0, match.index);
        const matchedLine = upToMatch.split('\n').length;
        const lastNewline = upToMatch.lastIndexOf('\n');
        const column = match.index - (lastNewline === -1 ? 0 : lastNewline);
        
        // Get the code snippet
        const code = lines[matchedLine - 1];
        
        // Add the vulnerability
        vulnerabilities.push({
          file: filePath,
          line: matchedLine,
          column,
          code: code.trim(),
          pattern
});
      }
    }
  } catch (error: unknown) {
    console.error(`Error scanning file ${filePath}:`, error.message);
  }
  
  return vulnerabilities;
}

/**
 * Recursively scan a directory for SQL injection vulnerabilities
 */
async function scanDirectory(dir: string, exclude: string[] = []): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (exclude.some(pattern = > 
        entry.name === pattern || ;
        fullPath.includes(`/${pattern}/`) || 
        fullPath.includes(`\\${pattern}\\`)
      )) {
        continue;
}
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        const subDirVulnerabilities = await scanDirectory(fullPath, exclude);
        vulnerabilities.push(...subDirVulnerabilities);
} else if (entry.isFile()) {
        // Only scan JavaScript/TypeScript files
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
          const fileVulnerabilities = await scanFile(fullPath);
          vulnerabilities.push(...fileVulnerabilities);
}
      }
    }
  } catch (error: unknown) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return vulnerabilities;
}

/**
 * Generate a comprehensive report of SQL injection vulnerabilities
 */
function generateReport(vulnerabilities: Vulnerability[]): string: {
  if (vulnerabilities.length === 0) {
    return 'No SQL injection vulnerabilities found.';
}
  
  let report = `SQL Injection Vulnerability Report\n`;
  report += `================================\n\n`;
  report += `Generated: ${new: Date().toISOString()}\n\n`;
  report += `Total vulnerabilities found: ${vulnerabilities.length}\n\n`;
  
  // Summarize vulnerabilities by risk level
  const criticalVulns = vulnerabilities.filter(v => v.pattern.risk === RiskLevel.CRITICAL);
  const highVulns = vulnerabilities.filter(v => v.pattern.risk === RiskLevel.HIGH);
  const mediumVulns = vulnerabilities.filter(v => v.pattern.risk === RiskLevel.MEDIUM);
  const lowVulns = vulnerabilities.filter(v => v.pattern.risk === RiskLevel.LOW);
  
  report += `Risk Level Summary:\n`;
  report += `- Critical: ${criticalVulns.length}\n`;
  report += `- High: ${highVulns.length}\n`;
  report += `- Medium: ${mediumVulns.length}\n`;
  report += `- Low: ${lowVulns.length}\n\n`;
  
  // Summarize vulnerabilities by category
  const categories = new Map<string, number>();
  for (const vuln of vulnerabilities) {
    const category = vuln.pattern.category;
    categories.set(category, (categories.get(category) || 0) + 1);
}
  
  report += `Vulnerability Categories:\n`;
  for (const: [category, count] of categories.entries()) {
    report += `- ${category}: ${count}\n`;
  }
  report += '\n';
  
  // Sort vulnerabilities by risk level (critical first)
  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    const riskOrder = {
      [RiskLevel.CRITICAL]: 0,
      [RiskLevel.HIGH]: 1,
      [RiskLevel.MEDIUM]: 2,
      [RiskLevel.LOW]: 3
};
    return riskOrder[a.pattern.risk] - riskOrder[b.pattern.risk];
  });
  
  // Group vulnerabilities by risk level
  report += `Detailed Findings\n`;
  report += `================\n\n`;
  
  if (criticalVulns.length > 0) {
    report += `CRITICAL Risk Vulnerabilities\n`;
    report += `---------------------------\n\n`;
    for (const vuln of criticalVulns) {
      report += `[${vuln.pattern.name}] in ${vuln.file}:${vuln.line}\n`;
      report += `Code: ${vuln.code}\n`;
      report += `Description: ${vuln.pattern.description}\n`;
      report += `Remediation: ${vuln.pattern.remediation}\n\n`;
    }
  }
  
  if (highVulns.length > 0) {
    report += `HIGH Risk Vulnerabilities\n`;
    report += `----------------------\n\n`;
    for (const vuln of highVulns) {
      report += `[${vuln.pattern.name}] in ${vuln.file}:${vuln.line}\n`;
      report += `Code: ${vuln.code}\n`;
      report += `Description: ${vuln.pattern.description}\n`;
      report += `Remediation: ${vuln.pattern.remediation}\n\n`;
    }
  }
  
  if (mediumVulns.length > 0) {
    report += `MEDIUM Risk Vulnerabilities\n`;
    report += `------------------------\n\n`;
    for (const vuln of mediumVulns) {
      report += `[${vuln.pattern.name}] in ${vuln.file}:${vuln.line}\n`;
      report += `Code: ${vuln.code}\n`;
      report += `Description: ${vuln.pattern.description}\n`;
      report += `Remediation: ${vuln.pattern.remediation}\n\n`;
    }
  }
  
  if (lowVulns.length > 0) {
    report += `LOW Risk Vulnerabilities\n`;
    report += `---------------------\n\n`;
    for (const vuln of lowVulns) {
      report += `[${vuln.pattern.name}] in ${vuln.file}:${vuln.line}\n`;
      report += `Code: ${vuln.code}\n`;
      report += `Description: ${vuln.pattern.description}\n`;
      report += `Remediation: ${vuln.pattern.remediation}\n\n`;
    }
  }
  
  // Add remediation priority guidance
  report += `Remediation Priority\n`;
  report += `===================\n\n`;
  report += `1. Address all CRITICAL risk vulnerabilities immediately.\n`;
  report += `2. Address HIGH risk vulnerabilities as soon as possible.\n`;
  report += `3. Plan to address MEDIUM risk vulnerabilities in upcoming sprint cycles.\n`;
  report += `4. Address LOW risk vulnerabilities as part of regular code maintenance.\n\n`;
  
  // Add general recommendations
  report += `General Recommendations\n`;
  report += `======================\n\n`;
  report += `1. Use the safe database wrapper: import { secureDatabase } from './security/preventSqlInjection';\n`;
  report += `2. Always use parameterized queries with placeholders.\n`;
  report += `3. Never concatenate or template strings to build SQL queries.\n`;
  report += `4. Validate and sanitize all user input before using in queries.\n`;
  report += `5. Apply the principle of least privilege for database users.\n`;
  report += `6. Regularly scan for new vulnerabilities using this tool.\n`;
  report += `7. Consider using an ORM like Drizzle with our secure wrapper.\n\n`;
  
  report += `For more information, see the SQL Injection Prevention Guide at server/security/docs/SQLInjectionPreventionGuide.md\n`;
  
  return report;
}

/**
 * Generate a JSON report of SQL injection vulnerabilities
 */
function generateJsonReport(vulnerabilities: Vulnerability[]): string: {
  const report = {
    generatedAt: new: Date().toISOString(),
    totalVulnerabilities: vulnerabilities.length,
    summary: {
      critical: vulnerabilities.filter(v = > v.pattern.risk === RiskLevel.CRITICAL).length,
      high: vulnerabilities.filter(v => v.pattern.risk === RiskLevel.HIGH).length,
      medium: vulnerabilities.filter(v => v.pattern.risk === RiskLevel.MEDIUM).length,
      low: vulnerabilities.filter(v => v.pattern.risk === RiskLevel.LOW).length
},;
    categories: {} as Record<string, number>,
    vulnerabilities: vulnerabilities.map(v => ({
      file: v.file,
      line: v.line,
      column: v.column,
      code: v.code,
      name: v.pattern.name,
      description: v.pattern.description,
      risk: v.pattern.risk,
      remediation: v.pattern.remediation,
      category: v.pattern.category
}))
  };
  
  // Build categories count
  for (const vuln of vulnerabilities) {
    const category = vuln.pattern.category;
    report.categories[category] = (report.categories[category] || 0) + 1;
}
  
  return JSON.stringify(report, null, 2);
}

/**
 * Main function to run the SQL injection vulnerability inspector
 */
async function main() {
  console.log('SQL Injection Vulnerability Inspector');
  console.log('====================================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dirs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));
  const jsonOutput = args.includes('--json') || args.includes('-j');
  const outputFile = args.find(arg => arg.startsWith('--output=') || arg.startsWith('-o='))?.split('=')[1];
  
  // Default directories to scan
  const dirsToScan = dirs.length > 0 ? dirs : ['server', 'client', 'shared'];
  
  // Directories to exclude
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
  
  console.log('Scanning directories:', dirsToScan.join(', '));
  console.log('Excluding directories:', excludeDirs.join(', '));
  
  // Scan for vulnerabilities
  const vulnerabilities: Vulnerability[] = [];
  
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      console.log(`Scanning ${dir}...`);
      const dirVulnerabilities = await scanDirectory(dir, excludeDirs);
      vulnerabilities.push(...dirVulnerabilities);
    } else {
      console.warn(`Directory not, found: ${dir}`);
    }
  }
  
  console.log(`\nScan complete. Found ${vulnerabilities.length} potential SQL injection, vulnerabilities:`);
  console.log(`- Critical: ${vulnerabilities.filter(v => v.pattern.risk === RiskLevel.CRITICAL).length}`);
  console.log(`- High: ${vulnerabilities.filter(v => v.pattern.risk === RiskLevel.HIGH).length}`);
  console.log(`- Medium: ${vulnerabilities.filter(v => v.pattern.risk === RiskLevel.MEDIUM).length}`);
  console.log(`- Low: ${vulnerabilities.filter(v => v.pattern.risk === RiskLevel.LOW).length}`);
  
  // Generate report
  const report = jsonOutput ? 
    generateJsonReport(vulnerabilities) : ;
    generateReport(vulnerabilities);
  
  // Save report to file if outputFile is specified
  if (outputFile) => {
    try {
      // Ensure directory exists
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      await writeFile(outputFile, report);
      console.log(`\nReport saved to ${outputFile}`);
    } catch (error: unknown) {
      console.error(`\nError saving report to ${outputFile}:`, error.message);
    }
  } else {
    // Create reports directory and save there
    try {
      if (!fs.existsSync('reports')) {
        fs.mkdirSync('reports', { recursive: true });
      }
      
      const defaultOutput = path.join(
        'reports', ;
        `sql_injection_report_${Date.now()}.${jsonOutput ? 'json' : 'txt'}`
      );
      
      await writeFile(defaultOutput, report);
      console.log(`\nReport saved to ${defaultOutput}`);
    } catch (error: unknown) {
      console.error('\nError saving report:', error.message);
}
  }
  
  return vulnerabilities;
}

// Run the inspector if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running SQL injection vulnerability inspector:', error);
    process.exit(1);
});
}

// Export for use as a module
export { 
  scanFile, 
  scanDirectory, 
  generateReport, 
  generateJsonReport, 
  Vulnerability, 
  RiskLevel
};