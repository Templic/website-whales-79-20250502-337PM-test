/**
 * Dead-End Link Checker
 * 
 * This script checks for dead-end buttons and links in the application.
 * It crawls the pages, identifies links that don't lead anywhere, and 
 * provides suggestions for fixing them.
 * 
 * Usage: node scripts/check-deadlinks.js [--fix] [--output=json|text]
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { execSync } = require('child_process');

// Configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  pagesDir: path.join(process.cwd(), 'client/src/pages'),
  componentsDir: path.join(process.cwd(), 'client/src/components'),
  outputFormat: 'text', // 'text' or 'json'
  fixLinks: false,
  maxDepth: 3,
  outputFile: 'deadlinks-report.json',
  validationRules: {
    ignoreExternalLinks: false,
    ignoreAnchors: false,
    requiredPrefix: '/'
  }
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg === '--fix') {
    config.fixLinks = true;
  } else if (arg.startsWith('--output=')) {
    config.outputFormat = arg.split('=')[1];
  } else if (arg.startsWith('--base=')) {
    config.baseUrl = arg.split('=')[1];
  } else if (arg.startsWith('--depth=')) {
    config.maxDepth = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--ignore-external')) {
    config.validationRules.ignoreExternalLinks = true;
  }
});

// State variables
let visitedUrls = new Set();
let brokenLinks = [];
let deadEndButtons = [];
let validPages = new Set();
let currentDepth = 0;

// Utility functions
function getAbsoluteUrl(baseUrl, href) {
  if (!href) return null;
  
  // Skip javascript: links
  if (href.startsWith('javascript:')) return null;
  
  // Skip mailto: links
  if (href.startsWith('mailto:')) return null;
  
  // Skip tel: links
  if (href.startsWith('tel:')) return null;
  
  // Handle anchor links
  if (href.startsWith('#')) {
    return baseUrl + href;
  }
  
  // Handle relative links
  if (href.startsWith('/')) {
    return new URL(href, baseUrl).toString();
  }
  
  // Handle absolute URLs
  if (href.startsWith('http')) {
    return href;
  }
  
  // Handle relative paths without leading slash
  return new URL(href, baseUrl).toString();
}

async function checkUrl(url) {
  try {
    const response = await axios.get(url, { 
      validateStatus: false,
      timeout: 5000
    });
    return {
      url,
      status: response.status,
      valid: response.status >= 200 && response.status < 400
    };
  } catch (error) {
    return {
      url,
      status: error.response ? error.response.status : 0,
      valid: false,
      error: error.message
    };
  }
}

async function crawlPage(url, parentUrl = null, depth = 0) {
  if (depth > config.maxDepth) return;
  if (visitedUrls.has(url)) return;
  
  currentDepth = depth;
  visitedUrls.add(url);
  
  console.log(`Crawling ${url} (depth: ${depth})`);
  
  try {
    const response = await axios.get(url, { 
      validateStatus: false,
      timeout: 10000
    });
    
    if (response.status >= 400) {
      brokenLinks.push({
        url,
        parentUrl,
        status: response.status,
        message: `HTTP Error: ${response.status}`,
        type: 'page',
        element: 'page'
      });
      return;
    }
    
    validPages.add(url);
    
    // Parse the HTML content
    const $ = cheerio.load(response.data);
    
    // Check links
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      const linkUrl = getAbsoluteUrl(url, href);
      
      if (!href || !linkUrl) {
        // Empty href or javascript:void(0), etc.
        deadEndButtons.push({
          url,
          element: 'a',
          text: text || '[No Text]',
          location: `${url} at index ${index}`
        });
        return;
      }
      
      // Skip external URLs if configured
      if (config.validationRules.ignoreExternalLinks && 
          !linkUrl.startsWith(config.baseUrl)) {
        return;
      }
      
      // Skip anchor links if configured
      if (config.validationRules.ignoreAnchors && href.startsWith('#')) {
        return;
      }
      
      // Schedule the link to be crawled if it's internal
      if (linkUrl.startsWith(config.baseUrl) && !visitedUrls.has(linkUrl)) {
        setTimeout(() => {
          crawlPage(linkUrl, url, depth + 1);
        }, 100);
      }
    });
    
    // Check buttons with onClick handlers or no actions
    $('button, .btn, [role="button"]').each((index, element) => {
      const onClick = $(element).attr('onclick');
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (!onClick && !href) {
        deadEndButtons.push({
          url,
          element: 'button',
          text: text || '[No Text]',
          location: `${url} at index ${index}`
        });
      }
    });
    
  } catch (error) {
    brokenLinks.push({
      url,
      parentUrl,
      status: 0,
      message: error.message,
      type: 'request',
      element: 'page'
    });
  }
}

function scanSourceFiles() {
  console.log('Scanning source files for links and buttons...');
  
  const validRoutes = new Set();
  
  // Scan all TSX files for route definitions
  const tsxFiles = findTsxFiles(config.pagesDir);
  
  tsxFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Extract the relative path from the pages directory
      const relativePath = file.replace(config.pagesDir, '');
      
      // Convert to route path
      let routePath = relativePath
        .replace(/\\/g, '/')
        .replace(/\.tsx$/, '')
        .replace(/\/index$/, '/')
        .replace(/\[(.+)\]/g, ':$1');
      
      // If the file is directly in pages and is not index.tsx
      if (!routePath.includes('/') && routePath !== '') {
        routePath = '/' + routePath;
      }
      
      // Special case for index.tsx in the root pages directory
      if (routePath === '') {
        routePath = '/';
      }
      
      validRoutes.add(routePath);
      
      // Look for Link components in the file
      const linkMatches = content.match(/<Link\s+[^>]*to=["']([^"']+)["'][^>]*>/g);
      
      if (linkMatches) {
        linkMatches.forEach(match => {
          const linkTo = match.match(/to=["']([^"']+)["']/);
          if (linkTo && linkTo[1]) {
            const path = linkTo[1];
            
            // Skip dynamic paths with variables
            if (path.includes('{') || path.includes('$')) return;
            
            validRoutes.add(path);
          }
        });
      }
    } catch (error) {
      console.error(`Error scanning file ${file}: ${error.message}`);
    }
  });
  
  return validRoutes;
}

function findTsxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTsxFiles(filePath));
    } else if (file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  
  return results;
}

function checkButtonsInComponents() {
  console.log('Checking for buttons in component files...');
  
  const componentFiles = findTsxFiles(config.componentsDir);
  const buttonsWithoutHandlers = [];
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineIndex) => {
        // Check for button elements without handlers
        if (line.includes('<button') || line.includes(' role="button"')) {
          const hasOnClick = line.includes('onClick={') || line.includes('onClick={(');
          const hasHref = line.includes('href={') || line.includes('href="');
          
          if (!hasOnClick && !hasHref) {
            const lineNumber = lineIndex + 1;
            const relativePath = path.relative(process.cwd(), file);
            
            buttonsWithoutHandlers.push({
              file: relativePath,
              line: lineNumber,
              content: line.trim(),
              suggestion: 'Add an onClick handler or href attribute'
            });
          }
        }
      });
    } catch (error) {
      console.error(`Error checking file ${file}: ${error.message}`);
    }
  });
  
  return buttonsWithoutHandlers;
}

function suggestFix(link, validRoutes) {
  // If it's an external link, we can't suggest a fix
  if (link.url.startsWith('http') && !link.url.includes(config.baseUrl)) {
    return 'Check if external URL is correct';
  }
  
  // For internal links, suggest the closest matching route
  const path = new URL(link.url).pathname;
  let bestMatch = null;
  let highestScore = 0;
  
  validRoutes.forEach(route => {
    const score = similarityScore(path, route);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = route;
    }
  });
  
  if (bestMatch && highestScore > 0.5) {
    return `Consider changing to "${bestMatch}"`;
  }
  
  return 'Create a new page for this link';
}

function similarityScore(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Quick check for exact match
  if (str1 === str2) return 1;
  
  // Check if one is a prefix of the other
  if (str1.startsWith(str2) || str2.startsWith(str1)) {
    return 0.8;
  }
  
  // Calculate Levenshtein distance
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] !== str2[j - 1] ? 1 : 0;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return 1 - distance / maxLen;
}

// Main function
async function main() {
  console.log('Dead-End Link Checker');
  console.log('===========================================');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Fix Mode: ${config.fixLinks ? 'Enabled' : 'Disabled'}`);
  console.log(`Output Format: ${config.outputFormat}`);
  console.log('===========================================');
  
  // Scan source files for routes
  const validRoutes = scanSourceFiles();
  console.log(`Found ${validRoutes.size} valid routes in the source code`);
  
  // Start crawling from the base URL
  await crawlPage(config.baseUrl);
  
  // Wait for remaining crawls to finish (simple approach)
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check buttons in component files
  const componentsWithIssues = checkButtonsInComponents();
  
  // Generate report
  console.log('===========================================');
  console.log('Results:');
  console.log(`Visited URLs: ${visitedUrls.size}`);
  console.log(`Broken Links: ${brokenLinks.length}`);
  console.log(`Dead-End Buttons: ${deadEndButtons.length}`);
  console.log(`Components with Button Issues: ${componentsWithIssues.length}`);
  
  // Detailed broken links
  if (brokenLinks.length > 0) {
    console.log('\nBroken Links:');
    brokenLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.url}`);
      console.log(`   Found on: ${link.parentUrl || 'Direct Access'}`);
      console.log(`   Status: ${link.status}`);
      console.log(`   Message: ${link.message}`);
      console.log(`   Suggestion: ${suggestFix(link, validRoutes)}`);
      console.log('---');
    });
  }
  
  // Detailed dead-end buttons
  if (deadEndButtons.length > 0) {
    console.log('\nDead-End Buttons:');
    deadEndButtons.forEach((button, index) => {
      console.log(`${index + 1}. ${button.element} "${button.text}"`);
      console.log(`   Found on: ${button.url}`);
      console.log(`   Location: ${button.location}`);
      console.log('---');
    });
  }
  
  // Component issues
  if (componentsWithIssues.length > 0) {
    console.log('\nComponent Button Issues:');
    componentsWithIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   Content: ${issue.content}`);
      console.log(`   Suggestion: ${issue.suggestion}`);
      console.log('---');
    });
  }
  
  // Save report to file
  const report = {
    meta: {
      baseUrl: config.baseUrl,
      timestamp: new Date().toISOString(),
      visitedUrls: Array.from(visitedUrls),
      validRoutes: Array.from(validRoutes)
    },
    summary: {
      visitedUrls: visitedUrls.size,
      brokenLinks: brokenLinks.length,
      deadEndButtons: deadEndButtons.length,
      componentsWithIssues: componentsWithIssues.length
    },
    brokenLinks,
    deadEndButtons,
    componentsWithIssues
  };
  
  fs.writeFileSync(config.outputFile, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${config.outputFile}`);
  
  // Exit with appropriate code
  const hasIssues = brokenLinks.length > 0 || deadEndButtons.length > 0 || componentsWithIssues.length > 0;
  process.exit(hasIssues ? 1 : 0);
}

// Execute the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});