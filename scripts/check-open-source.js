
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const OPEN_SOURCE_LICENSES = [
  'MIT', 'Apache', 'BSD', 'GPL', 'LGPL', 'ISC', 'MPL', 'CDDL',
  'EPL', 'Python', 'Artistic', 'Public Domain', 'WTFPL', 'Unlicense'
];

async function checkNodePackages() {
  console.log('\nChecking Node.js packages...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    const dependencies = { 
      ...packageJson.dependencies || {}, 
      ...packageJson.devDependencies || {} 
    };
    
    const nonOpenSourcePackages = [];
    
    for (const pkg of Object.keys(dependencies)) {
      try {
        const licenseInfo = execSync(`npm view ${pkg} license`, { encoding: 'utf8' }).trim();
        const isOpenSource = OPEN_SOURCE_LICENSES.some(license => 
          licenseInfo.toUpperCase().includes(license.toUpperCase())
        );
        
        if (!isOpenSource) {
          nonOpenSourcePackages.push({ name: pkg, license: licenseInfo });
        }
      } catch (error) {
        console.warn(`Warning: Could not check license for ${pkg}`);
      }
    }
    
    return nonOpenSourcePackages;
  } catch (error) {
    console.error('Error checking Node packages:', error.message);
    return [];
  }
}

async function checkPythonPackages() {
  console.log('\nChecking Python packages...');
  const nonOpenSourcePackages = [];
  
  try {
    // Get installed packages with their licenses
    const pipList = execSync('pip list --format=json', { encoding: 'utf8' });
    const packages = JSON.parse(pipList);
    
    for (const pkg of packages) {
      try {
        const licenseInfo = execSync(`pip show ${pkg.name} | grep License`, { encoding: 'utf8' })
          .toString()
          .replace('License:', '')
          .trim();
        
        const isOpenSource = OPEN_SOURCE_LICENSES.some(license => 
          licenseInfo.toUpperCase().includes(license.toUpperCase())
        );
        
        if (!isOpenSource) {
          nonOpenSourcePackages.push({ name: pkg.name, license: licenseInfo });
        }
      } catch (error) {
        console.warn(`Warning: Could not check license for ${pkg.name}`);
      }
    }
    
    return nonOpenSourcePackages;
  } catch (error) {
    console.error('Error checking Python packages:', error.message);
    return [];
  }
}

async function generateReport(nodePackages, pythonPackages) {
  const reportPath = path.join(process.cwd(), 'reports', 'license-audit.md');
  const timestamp = new Date().toISOString();
  
  let report = `# License Audit Report\nGenerated: ${timestamp}\n\n`;
  
  if (nodePackages.length > 0) {
    report += '## Non-Open Source Node.js Packages\n\n';
    nodePackages.forEach(pkg => {
      report += `- ${pkg.name}: ${pkg.license}\n`;
    });
  } else {
    report += '## Node.js Packages\nAll Node.js packages are open source.\n\n';
  }
  
  if (pythonPackages.length > 0) {
    report += '\n## Non-Open Source Python Packages\n\n';
    pythonPackages.forEach(pkg => {
      report += `- ${pkg.name}: ${pkg.license}\n`;
    });
  } else {
    report += '\n## Python Packages\nAll Python packages are open source.\n\n';
  }
  
  try {
    await fs.promises.mkdir(path.join(process.cwd(), 'reports'), { recursive: true });
    await writeFile(reportPath, report);
    console.log(`\nReport generated: ${reportPath}`);
  } catch (error) {
    console.error('Error generating report:', error.message);
  }
}

async function main() {
  console.log('Starting license audit...');
  
  const nodeResults = await checkNodePackages();
  const pythonResults = await checkPythonPackages();
  
  console.log('\nAudit Results:');
  console.log(`Node.js non-open source packages: ${nodeResults.length}`);
  console.log(`Python non-open source packages: ${pythonResults.length}`);
  
  await generateReport(nodeResults, pythonResults);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
