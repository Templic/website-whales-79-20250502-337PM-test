/**
 * XSS Vulnerability Detector
 * 
 * This module provides tools to detect potential Cross-Site Scripting (XSS)
 * vulnerabilities in source code.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Promisify filesystem operations
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

/**
 * XSS vulnerability risk levels
 */
export enum XssRiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * XSS vulnerability types
 */
export enum XssVulnerabilityType {
  STORED = 'STORED',
  REFLECTED = 'REFLECTED',
  DOM = 'DOM'
}

/**
 * XSS vulnerability pattern definition
 */
export interface XssVulnerabilityPattern {
  pattern: RegExp;
  name: string;
  description: string;
  risk: XssRiskLevel;
  type: XssVulnerabilityType;
  remediation: string;
}

/**
 * XSS vulnerability finding
 */
export interface XssVulnerability {
  file: string;
  line: number;
  column: number;
  code: string;
  pattern: XssVulnerabilityPattern;
}

/**
 * XSS vulnerability patterns to detect
 */
export const XSS_VULNERABILITY_PATTERNS: XssVulnerabilityPattern[] = [
  // DOM-based XSS: innerHTML
  {
    pattern: /\.(innerHTML|outerHTML)\s*=\s*(?!DOMPurify\.sanitize)/,
    name: 'Unsafe innerHTML Assignment',
    description: 'Assignment to innerHTML or outerHTML without proper sanitization can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Use DOMPurify.sanitize() or textContent instead.'
  },
  
  // DOM-based XSS: document.write
  {
    pattern: /document\.(write|writeln)\s*\(/,
    name: 'Unsafe document.write Usage',
    description: 'Using document.write or document.writeln can lead to XSS attacks if user input is included.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Avoid document.write and use safe DOM manipulation methods instead.'
  },
  
  // DOM-based XSS: eval and similar
  {
    pattern: /\b(eval|setTimeout|setInterval|Function)\s*\(\s*(["'`](?:\${|\$\{|.*\+)|\w+)\s*\)/,
    name: 'Unsafe Code Execution',
    description: 'Dynamically executing code with user input can lead to XSS attacks.',
    risk: XssRiskLevel.CRITICAL,
    type: XssVulnerabilityType.DOM,
    remediation: 'Avoid dynamically executing code with user input.'
  },
  
  // React: dangerouslySetInnerHTML
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?!DOMPurify\.sanitize)/,
    name: 'Unsafe React dangerouslySetInnerHTML',
    description: 'Using dangerouslySetInnerHTML without proper sanitization can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Use DOMPurify.sanitize() before setting content with dangerouslySetInnerHTML.'
  },
  
  // URL-based XSS: location
  {
    pattern: /location\.(href|hash|search|pathname)\s*=\s*(?!encodeURI)/,
    name: 'Unsafe Location Assignment',
    description: 'Setting location properties without proper encoding can lead to XSS attacks.',
    risk: XssRiskLevel.MEDIUM,
    type: XssVulnerabilityType.REFLECTED,
    remediation: 'Use encodeURI() or encodeURIComponent() to encode values.'
  },
  
  // DOM insertion: insertAdjacentHTML
  {
    pattern: /insertAdjacentHTML\s*\(\s*["'`].*["'`]\s*,\s*(?!DOMPurify\.sanitize)/,
    name: 'Unsafe insertAdjacentHTML Usage',
    description: 'Using insertAdjacentHTML without proper sanitization can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Use DOMPurify.sanitize() before inserting content with insertAdjacentHTML.'
  },
  
  // Unsafe jQuery methods
  {
    pattern: /\$\(.*\)\.(html|append|prepend|after|before|replaceWith)\s*\(\s*(?!DOMPurify\.sanitize)/,
    name: 'Unsafe jQuery DOM Manipulation',
    description: 'Using jQuery DOM manipulation methods without proper sanitization can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Use DOMPurify.sanitize() before manipulating DOM with jQuery.'
  },
  
  // Reflected XSS: Express response.send
  {
    pattern: /res\.(send|write|end)\s*\(\s*(?!escapeHtml\(|sanitize\(|DOMPurify)/,
    name: 'Unsafe Express Response',
    description: 'Sending user input in Express responses without proper sanitization can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.REFLECTED,
    remediation: 'Use escapeHtml() or a template engine with automatic escaping.'
  },
  
  // unsafe attribute setting
  {
    pattern: /setAttribute\s*\(\s*["'`](?:on\w+|src|href|data|formaction)["'`]\s*,\s*(?!encodeURI|sanitize)/,
    name: 'Unsafe Attribute Setting',
    description: 'Setting attributes like event handlers or URLs without proper validation can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Validate and sanitize values before setting attributes, especially for event handlers and URLs.'
  },
  
  // Template rendering with variables
  {
    pattern: /render\s*\(\s*["'`][^"'`]*["'`]\s*,\s*\{[^}]*\}\s*\)/,
    name: 'Potential Template Injection',
    description: 'Rendering templates with user data might lead to XSS if the template engine does not escape by default.',
    risk: XssRiskLevel.MEDIUM,
    type: XssVulnerabilityType.REFLECTED,
    remediation: 'Ensure template engine escapes by default or manually escape variables.'
  },
  
  // URL parsing without validation
  {
    pattern: /(req\.query|req\.params|req\.body)\.(\w+)\s*(?!\s*=|\)|,|\.)/,
    name: 'Unvalidated Request Data Usage',
    description: 'Using request data without validation can lead to XSS and injection attacks.',
    risk: XssRiskLevel.MEDIUM,
    type: XssVulnerabilityType.REFLECTED,
    remediation: 'Validate and sanitize all request data before use.'
  },
  
  // Embedded user data in HTML
  {
    pattern: /<[^>]*\$\{(?!escapeHtml|sanitize).*\}/,
    name: 'Unescaped Data in HTML Template',
    description: 'Embedding user data in HTML templates without escaping can lead to XSS attacks.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.REFLECTED,
    remediation: 'Use escapeHtml() or template engine auto-escaping.'
  },
  
  // HTML encoding in JS context
  {
    pattern: /<script[^>]*>.*\$\{(?!encodeURIComponent|JSON\.stringify).*\}.*<\/script>/,
    name: 'Unescaped Data in JavaScript Context',
    description: 'Embedding user data in JavaScript context requires proper JSON encoding.',
    risk: XssRiskLevel.HIGH,
    type: XssVulnerabilityType.DOM,
    remediation: 'Use JSON.stringify() for data in JavaScript context.'
  }
];

/**
 * Scan a file for XSS vulnerabilities
 */
export async function scanFileForXssVulnerabilities(filePath: string): Promise<XssVulnerability[]> {
  const vulnerabilities: XssVulnerability[] = [];
  
  try {
    // Read file content
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check each pattern
    for (const pattern of XSS_VULNERABILITY_PATTERNS) {
      const regex = new RegExp(pattern.pattern.source, 'g');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Find line number and column
        const upToMatch = content.substring(0, match.index);
        const lineNumber = upToMatch.split('\n').length;
        const lastNewline = upToMatch.lastIndexOf('\n');
        const column = match.index - (lastNewline === -1 ? 0 : lastNewline);
        
        // Get the code snippet
        const line = lines[lineNumber - 1] || '';
        
        // Add vulnerability
        vulnerabilities.push({
          file: filePath,
          line: lineNumber,
          column,
          code: line.trim(),
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
 * Recursively scan a directory for XSS vulnerabilities
 */
export async function scanDirectoryForXssVulnerabilities(
  dir: string,
  exclude: string[] = ['node_modules', '.git', 'dist', 'build']
): Promise<XssVulnerability[]> {
  const vulnerabilities: XssVulnerability[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (exclude.some(pattern => entry.name === pattern)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        // Scan subdirectory
        const subDirVulnerabilities = await scanDirectoryForXssVulnerabilities(fullPath, exclude);
        vulnerabilities.push(...subDirVulnerabilities);
      } else if (entry.isFile()) {
        // Scan files with matching extensions
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.ejs', '.pug'].includes(ext)) {
          const fileVulnerabilities = await scanFileForXssVulnerabilities(fullPath);
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
 * Generate a report of XSS vulnerabilities
 */
export function generateXssReport(vulnerabilities: XssVulnerability[]): string {
  if (vulnerabilities.length === 0) {
    return 'No XSS vulnerabilities found.';
  }
  
  let report = `XSS Vulnerability Report\n`;
  report += `======================\n\n`;
  report += `Total vulnerabilities found: ${vulnerabilities.length}\n\n`;
  
  // Group by risk level
  const criticalVulns = vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.CRITICAL);
  const highVulns = vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.HIGH);
  const mediumVulns = vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.MEDIUM);
  const lowVulns = vulnerabilities.filter(v => v.pattern.risk === XssRiskLevel.LOW);
  
  report += `Risk Level Summary:\n`;
  report += `- Critical: ${criticalVulns.length}\n`;
  report += `- High: ${highVulns.length}\n`;
  report += `- Medium: ${mediumVulns.length}\n`;
  report += `- Low: ${lowVulns.length}\n\n`;
  
  // Group by XSS type
  const storedVulns = vulnerabilities.filter(v => v.pattern.type === XssVulnerabilityType.STORED);
  const reflectedVulns = vulnerabilities.filter(v => v.pattern.type === XssVulnerabilityType.REFLECTED);
  const domVulns = vulnerabilities.filter(v => v.pattern.type === XssVulnerabilityType.DOM);
  
  report += `Vulnerability Type Summary:\n`;
  report += `- Stored XSS: ${storedVulns.length}\n`;
  report += `- Reflected XSS: ${reflectedVulns.length}\n`;
  report += `- DOM-based XSS: ${domVulns.length}\n\n`;
  
  // Group vulnerabilities by risk level
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
  
  // Provide general recommendations
  report += `General Recommendations\n`;
  report += `=====================\n\n`;
  report += `1. Use DOMPurify to sanitize any HTML before rendering: import DOMPurify from 'dompurify';\n`;
  report += `2. Prefer textContent over innerHTML when not rendering HTML.\n`;
  report += `3. Use framework escaping mechanisms (React escapes content by default).\n`;
  report += `4. Validate and sanitize all user inputs, especially URL parameters.\n`;
  report += `5. Implement Content-Security-Policy headers to restrict script execution.\n`;
  report += `6. Encode data appropriately based on context (HTML, JS, URL, CSS).\n`;
  
  return report;
}

/**
 * Example usage:
 * 
 * const vulnerabilities = await scanDirectoryForXssVulnerabilities('./src');
 * const report = generateXssReport(vulnerabilities);
 * console.log(report);
 */