/**
 * Dependency Update Manager
 * 
 * This module helps manage dependencies by:
 * 1. Detecting outdated packages
 * 2. Identifying packages with security vulnerabilities
 * 3. Recommending safe updates
 * 4. Generating update plans
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { log } from './logger';

const execPromise = util.promisify(exec);

// Configuration
const REPORT_DIR = path.join(process.cwd(), 'reports', 'dependencies');

/**
 * Package information interface
 */
export interface PackageInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  dependent: string;
  type: 'dependencies' | 'devDependencies';
  hasSecurityIssue: boolean;
  advisories?: string[];
}

/**
 * Update plan interface
 */
export interface UpdatePlan {
  safeUpdates: PackageInfo[];
  securityUpdates: PackageInfo[];
  majorUpdates: PackageInfo[];
  reportPath: string;
}

/**
 * Scan for outdated dependencies
 */
export async function scanDependencies(): Promise<PackageInfo[]> {
  try {
    log('Scanning for outdated dependencies...', 'dependency');
    
    // Create report directory if it doesn't exist
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    
    // Run npm outdated to get list of outdated packages
    const { stdout: outdatedOutput } = await execPromise('npm outdated --json', { maxBuffer: 1024 * 1024 });
    
    // Run npm audit to identify security issues
    const { stdout: auditOutput } = await execPromise('npm audit --json', { maxBuffer: 1024 * 1024 }).catch(error => {
      // npm audit exits with non-zero code if it finds vulnerabilities
      return { stdout: error.stdout, stderr: error.stderr };
    });
    
    // Parse outputs
    const outdated = JSON.parse(outdatedOutput || '{}');
    const audit = JSON.parse(auditOutput || '{}');
    
    // Read package.json to determine dependency type
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    // Build result
    const result: PackageInfo[] = [];
    
    // Process outdated packages
    for (const [name, info] of Object.entries(outdated)) {
      const packageInfo = info as any;
      
      // Determine if this is a regular or dev dependency
      const type = dependencies[name] ? 'dependencies' : 'devDependencies';
      
      // Check if it has security issues
      const hasSecurityIssue = audit.vulnerabilities && audit.vulnerabilities[name];
      
      // Get advisories
      const advisories: string[] = [];
      if (hasSecurityIssue && audit.vulnerabilities[name].via) {
        audit.vulnerabilities[name].via.forEach((via: any) => {
          if (typeof via === 'object' && via.title) {
            advisories.push(`${via.title} (${via.severity})`);
          }
        });
      }
      
      result.push({
        name,
        current: packageInfo.current,
        wanted: packageInfo.wanted,
        latest: packageInfo.latest,
        dependent: packageInfo.dependent,
        type,
        hasSecurityIssue,
        advisories: advisories.length > 0 ? advisories : undefined
      });
    }
    
    // Add packages with security issues that aren't outdated
    if (audit.vulnerabilities) {
      for (const [name, info] of Object.entries(audit.vulnerabilities)) {
        if (!result.some(pkg => pkg.name === name)) {
          const vulnerabilityInfo = info as any;
          
          // Determine if this is a regular or dev dependency
          const type = dependencies[name] ? 'dependencies' : 'devDependencies';
          
          // Get advisories
          const advisories: string[] = [];
          if (vulnerabilityInfo.via) {
            vulnerabilityInfo.via.forEach((via: any) => {
              if (typeof via === 'object' && via.title) {
                advisories.push(`${via.title} (${via.severity})`);
              }
            });
          }
          
          result.push({
            name,
            current: vulnerabilityInfo.version || 'unknown',
            wanted: vulnerabilityInfo.fixAvailable?.version || 'unknown',
            latest: vulnerabilityInfo.fixAvailable?.version || 'unknown',
            dependent: '',
            type,
            hasSecurityIssue: true,
            advisories
          });
        }
      }
    }
    
    // Sort by security issues first, then by name
    result.sort((a, b) => {
      if (a.hasSecurityIssue && !b.hasSecurityIssue) return -1;
      if (!a.hasSecurityIssue && b.hasSecurityIssue) return 1;
      return a.name.localeCompare(b.name);
    });
    
    // Log summary
    const securityIssues = result.filter(pkg => pkg.hasSecurityIssue).length;
    log(`Dependency scan completed: Found ${result.length} outdated packages, ${securityIssues} with security issues`, 'dependency');
    
    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error scanning dependencies: ${errorMessage}`, 'dependency');
    return [];
  }
}

/**
 * Generate an update plan
 */
export async function generateUpdatePlan(): Promise<UpdatePlan> {
  const packages = await scanDependencies();
  
  // Categorize updates
  const safeUpdates: PackageInfo[] = [];
  const securityUpdates: PackageInfo[] = [];
  const majorUpdates: PackageInfo[] = [];
  
  for (const pkg of packages) {
    // Security issues always go into security updates
    if (pkg.hasSecurityIssue) {
      securityUpdates.push(pkg);
      continue;
    }
    
    // Check if it's a major version jump
    const currentVersion = pkg.current.split('.');
    const wantedVersion = pkg.wanted.split('.');
    
    if (currentVersion[0] !== wantedVersion[0]) {
      // Major version change
      majorUpdates.push(pkg);
    } else {
      // Same major version, should be safe
      safeUpdates.push(pkg);
    }
  }
  
  // Generate report
  const reportPath = generateUpdateReport(packages, safeUpdates, securityUpdates, majorUpdates);
  
  return {
    safeUpdates,
    securityUpdates,
    majorUpdates,
    reportPath
  };
}

/**
 * Apply safe updates
 */
export async function applySafeUpdates(): Promise<string[]> {
  const plan = await generateUpdatePlan();
  return updatePackages(plan.safeUpdates);
}

/**
 * Apply security updates
 */
export async function applySecurityUpdates(): Promise<string[]> {
  const plan = await generateUpdatePlan();
  return updatePackages(plan.securityUpdates);
}

/**
 * Update specific packages
 */
async function updatePackages(packages: PackageInfo[]): Promise<string[]> {
  if (packages.length === 0) {
    log('No packages to update', 'dependency');
    return [];
  }
  
  const updated: string[] = [];
  
  try {
    log(`Updating ${packages.length} packages...`, 'dependency');
    
    // Group packages to minimize npm install calls
    const packageGroups: PackageInfo[][] = [];
    let currentGroup: PackageInfo[] = [];
    let currentGroupSize = 0;
    
    // Group packages, but limit to ~10 per group
    for (const pkg of packages) {
      if (currentGroupSize >= 10) {
        packageGroups.push(currentGroup);
        currentGroup = [];
        currentGroupSize = 0;
      }
      
      currentGroup.push(pkg);
      currentGroupSize++;
    }
    
    if (currentGroup.length > 0) {
      packageGroups.push(currentGroup);
    }
    
    // Update each group
    for (let i = 0; i < packageGroups.length; i++) {
      const group = packageGroups[i];
      const updateList = group.map(pkg => `${pkg.name}@${pkg.wanted}`).join(' ');
      
      log(`Updating package group ${i+1} of ${packageGroups.length}: ${updateList}`, 'dependency');
      
      try {
        const { stdout } = await execPromise(`npm install ${updateList}`, { maxBuffer: 1024 * 1024 });
        log(stdout, 'dependency');
        updated.push(...group.map(pkg => pkg.name));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error updating package group: ${errorMessage}`, 'dependency');
      }
    }
    
    log(`Updated ${updated.length} packages successfully`, 'dependency');
    return updated;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error updating packages: ${errorMessage}`, 'dependency');
    return updated;
  }
}

/**
 * Generate a detailed report about the update plan
 */
function generateUpdateReport(
  allPackages: PackageInfo[],
  safeUpdates: PackageInfo[],
  securityUpdates: PackageInfo[],
  majorUpdates: PackageInfo[]
): string {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(REPORT_DIR, `dependency-report-${timestamp}.txt`);
    
    let report = `Dependency Update Report\n`;
    report += `======================\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Summary
    report += `SUMMARY\n-------\n`;
    report += `Total outdated packages: ${allPackages.length}\n`;
    report += `Packages with security issues: ${securityUpdates.length}\n`;
    report += `Safe updates available: ${safeUpdates.length}\n`;
    report += `Major version updates: ${majorUpdates.length}\n\n`;
    
    // Security updates section
    if (securityUpdates.length > 0) {
      report += `SECURITY UPDATES (RECOMMENDED)\n----------------------------\n`;
      report += `The following packages have security vulnerabilities and should be updated:\n\n`;
      
      report += formatPackageTable(securityUpdates);
      report += '\n';
      
      report += `Update command:\n`;
      report += `npm install ${securityUpdates.map(pkg => `${pkg.name}@${pkg.wanted}`).join(' ')}\n\n`;
    }
    
    // Safe updates section
    if (safeUpdates.length > 0) {
      report += `SAFE UPDATES\n------------\n`;
      report += `The following packages can be safely updated:\n\n`;
      
      report += formatPackageTable(safeUpdates);
      report += '\n';
      
      report += `Update command:\n`;
      report += `npm install ${safeUpdates.map(pkg => `${pkg.name}@${pkg.wanted}`).join(' ')}\n\n`;
    }
    
    // Major updates section
    if (majorUpdates.length > 0) {
      report += `MAJOR VERSION UPDATES (CAUTION)\n----------------------------\n`;
      report += `The following packages have major version updates available.\n`;
      report += `These may contain breaking changes and should be tested carefully:\n\n`;
      
      report += formatPackageTable(majorUpdates);
      report += '\n';
      
      report += `Major version update command (use with caution):\n`;
      report += `npm install ${majorUpdates.map(pkg => `${pkg.name}@${pkg.latest}`).join(' ')}\n\n`;
    }
    
    // Detailed advisories
    const packagesWithAdvisories = allPackages.filter(pkg => pkg.advisories && pkg.advisories.length > 0);
    if (packagesWithAdvisories.length > 0) {
      report += `SECURITY ADVISORIES\n------------------\n`;
      
      for (const pkg of packagesWithAdvisories) {
        report += `Package: ${pkg.name}@${pkg.current}\n`;
        report += `Advisories:\n`;
        
        for (const advisory of pkg.advisories!) {
          report += `  - ${advisory}\n`;
        }
        
        report += `Fix Version: ${pkg.wanted}\n\n`;
      }
    }
    
    // Write report to file
    fs.writeFileSync(reportPath, report);
    log(`Dependency update report generated: ${reportPath}`, 'dependency');
    
    return reportPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Error generating dependency report: ${errorMessage}`, 'dependency');
    return '';
  }
}

/**
 * Format a table of packages for the report
 */
function formatPackageTable(packages: PackageInfo[]): string {
  if (packages.length === 0) return '';
  
  // Calculate column widths
  const nameWidth = Math.max(...packages.map(pkg => pkg.name.length), 'Package'.length);
  const currentWidth = Math.max(...packages.map(pkg => pkg.current.length), 'Current'.length);
  const wantedWidth = Math.max(...packages.map(pkg => pkg.wanted.length), 'Wanted'.length);
  const latestWidth = Math.max(...packages.map(pkg => pkg.latest.length), 'Latest'.length);
  const typeWidth = Math.max(...packages.map(pkg => pkg.type.length), 'Type'.length);
  
  // Build header
  let table = '';
  table += `${'Package'.padEnd(nameWidth)} | `;
  table += `${'Current'.padEnd(currentWidth)} | `;
  table += `${'Wanted'.padEnd(wantedWidth)} | `;
  table += `${'Latest'.padEnd(latestWidth)} | `;
  table += `${'Type'.padEnd(typeWidth)} | `;
  table += `Security\n`;
  
  // Add separator
  table += `${'-'.repeat(nameWidth)} | `;
  table += `${'-'.repeat(currentWidth)} | `;
  table += `${'-'.repeat(wantedWidth)} | `;
  table += `${'-'.repeat(latestWidth)} | `;
  table += `${'-'.repeat(typeWidth)} | `;
  table += `--------\n`;
  
  // Add rows
  for (const pkg of packages) {
    table += `${pkg.name.padEnd(nameWidth)} | `;
    table += `${pkg.current.padEnd(currentWidth)} | `;
    table += `${pkg.wanted.padEnd(wantedWidth)} | `;
    table += `${pkg.latest.padEnd(latestWidth)} | `;
    table += `${pkg.type.padEnd(typeWidth)} | `;
    table += `${pkg.hasSecurityIssue ? 'Yes' : 'No'}\n`;
  }
  
  return table;
}