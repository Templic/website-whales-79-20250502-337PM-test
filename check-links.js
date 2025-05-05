/**
 * Dead Link Checker
 * 
 * This script checks a page for broken links, dead-end buttons, and other navigation issues.
 * It can be run as a standalone script or integrated with the API validation server.
 * 
 * Usage: node check-links.js [url]
 */

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set default URL if not provided
const targetUrl = process.argv[2] || 'http://localhost:3000';

// Configuration
const DEFAULT_CONFIG = {
  checkExternal: false,
  checkAnchors: true,
  includeButtons: true,
  includeImages: true,
  checkAPIEndpoints: true,
  maxDepth: 2,
  maxRequests: 100,
  timeout: 5000,
  userAgent: 'Dead-Link-Checker/1.0',
  showProgressBar: true
};

// Result storage
const results = {
  checkedUrls: new Set(),
  pendingUrls: new Set(),
  brokenLinks: [],
  missingAnchors: [],
  deadEndButtons: [],
  unreachableAPIs: [],
  redirects: [],
  stats: {
    totalLinks: 0,
    totalButtons: 0,
    totalAPIs: 0,
    totalAnchors: 0,
    totalChecked: 0,
    totalBroken: 0
  }
};

// Load or create results file
async function loadResults() {
  try {
    const filePath = path.join(__dirname, 'deadlinks-report.json');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (fileExists) {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not load previous results:', error.message);
  }
  
  return {
    timestamp: new Date().toISOString(),
    targetUrl,
    brokenLinks: [],
    missingAnchors: [],
    deadEndButtons: [],
    unreachableAPIs: [],
    stats: {
      totalLinks: 0,
      totalButtons: 0,
      totalAPIs: 0, 
      totalChecked: 0,
      totalBroken: 0
    }
  };
}

// Save results to file
async function saveResults(data) {
  try {
    const filePath = path.join(__dirname, 'deadlinks-report.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Results saved to ${filePath}`);
  } catch (error) {
    console.error('Error saving results:', error.message);
  }
}

// Process a page
async function processPage(url, depth = 0) {
  if (depth > DEFAULT_CONFIG.maxDepth || results.checkedUrls.size >= DEFAULT_CONFIG.maxRequests) {
    return;
  }
  
  if (results.checkedUrls.has(url)) {
    return;
  }
  
  results.pendingUrls.add(url);
  console.log(`Checking ${url}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_CONFIG.userAgent
      },
      timeout: DEFAULT_CONFIG.timeout
    });
    
    if (!response.ok) {
      results.brokenLinks.push({
        url,
        statusCode: response.status,
        statusText: response.statusText
      });
      console.log(`❌ Broken link: ${url} (${response.status} ${response.statusText})`);
    } else if (response.redirected) {
      results.redirects.push({
        from: url,
        to: response.url,
        statusCode: response.status
      });
      console.log(`↪️ Redirect: ${url} -> ${response.url}`);
    }
    
    // Only process HTML responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      await processHTML(html, url, depth);
    }
    
  } catch (error) {
    results.brokenLinks.push({
      url,
      error: error.message
    });
    console.log(`❌ Error fetching ${url}: ${error.message}`);
  } finally {
    results.checkedUrls.add(url);
    results.pendingUrls.delete(url);
    results.stats.totalChecked++;
  }
}

// Process HTML content
async function processHTML(html, baseUrl, depth) {
  const dom = new JSDOM(html, { url: baseUrl });
  const { document } = dom.window;
  
  // Check links
  const links = document.querySelectorAll('a');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;
    
    results.stats.totalLinks++;
    
    // Handle different link types
    if (href.startsWith('#')) {
      // Anchor link
      const anchorId = href.substring(1);
      const target = document.getElementById(anchorId) || document.querySelector(`[name="${anchorId}"]`);
      
      if (!target && DEFAULT_CONFIG.checkAnchors) {
        results.missingAnchors.push({
          page: baseUrl,
          anchor: href,
          text: link.textContent.trim()
        });
        console.log(`❌ Missing anchor: ${href} on ${baseUrl}`);
      }
    } else if (href.startsWith('javascript:')) {
      // JavaScript link - nothing to check
      continue;
    } else if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      // Mail or telephone links - nothing to check
      continue;
    } else {
      // Regular link - handle relative URLs
      let absoluteUrl;
      
      try {
        absoluteUrl = new URL(href, baseUrl).href;
      } catch (error) {
        console.log(`⚠️ Invalid URL: ${href}`);
        continue;
      }
      
      const isExternal = !absoluteUrl.startsWith(targetUrl);
      
      if (!isExternal || (isExternal && DEFAULT_CONFIG.checkExternal)) {
        if (!results.checkedUrls.has(absoluteUrl) && !results.pendingUrls.has(absoluteUrl)) {
          await processPage(absoluteUrl, depth + 1);
        }
      }
    }
  }
  
  // Check buttons
  if (DEFAULT_CONFIG.includeButtons) {
    const buttons = document.querySelectorAll('button, [role="button"], .btn, input[type="button"], input[type="submit"]');
    
    for (const button of buttons) {
      results.stats.totalButtons++;
      
      // Check if button has click handler or form submission
      const hasOnClick = button.hasAttribute('onclick');
      const isFormSubmit = button.tagName === 'BUTTON' && 
                          (!button.hasAttribute('type') || button.getAttribute('type') === 'submit') && 
                          button.closest('form');
      const hasHref = button.hasAttribute('href');
      
      if (!hasOnClick && !isFormSubmit && !hasHref) {
        results.deadEndButtons.push({
          page: baseUrl,
          text: button.textContent.trim(),
          element: button.outerHTML.substring(0, 100) + (button.outerHTML.length > 100 ? '...' : '')
        });
        console.log(`⚠️ Possible dead-end button: "${button.textContent.trim()}" on ${baseUrl}`);
      }
    }
  }
  
  // Check API endpoints from script tags
  if (DEFAULT_CONFIG.checkAPIEndpoints) {
    const scripts = document.querySelectorAll('script:not([src])');
    const apiUrlPattern = /(["'])((\/api\/[^"'\s]+)|((https?:)?\/\/[^"'\s]+\/api\/[^"'\s]+))\1/g;
    
    for (const script of scripts) {
      const content = script.textContent;
      let match;
      
      while ((match = apiUrlPattern.exec(content)) !== null) {
        const apiUrl = match[2];
        results.stats.totalAPIs++;
        
        // Convert to absolute URL if needed
        let absoluteApiUrl;
        try {
          absoluteApiUrl = new URL(apiUrl, baseUrl).href;
        } catch (error) {
          console.log(`⚠️ Invalid API URL: ${apiUrl}`);
          continue;
        }
        
        // Check the API endpoint
        try {
          const response = await fetch(absoluteApiUrl, {
            headers: {
              'User-Agent': DEFAULT_CONFIG.userAgent,
              'Accept': 'application/json'
            },
            timeout: DEFAULT_CONFIG.timeout
          });
          
          if (!response.ok) {
            results.unreachableAPIs.push({
              url: absoluteApiUrl,
              statusCode: response.status,
              statusText: response.statusText
            });
            console.log(`❌ Unreachable API: ${absoluteApiUrl} (${response.status} ${response.statusText})`);
          }
        } catch (error) {
          results.unreachableAPIs.push({
            url: absoluteApiUrl,
            error: error.message
          });
          console.log(`❌ Error fetching API ${absoluteApiUrl}: ${error.message}`);
        }
      }
    }
  }
}

// Main function
async function main() {
  console.log('Dead Link Checker');
  console.log('================');
  console.log(`Target URL: ${targetUrl}`);
  console.log(`Max depth: ${DEFAULT_CONFIG.maxDepth}`);
  console.log(`Max requests: ${DEFAULT_CONFIG.maxRequests}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Process the starting page
    await processPage(targetUrl);
    
    // Update statistics
    results.stats.totalBroken = results.brokenLinks.length;
    
    // Format and save results
    const formattedResults = {
      timestamp: new Date().toISOString(),
      targetUrl,
      brokenLinks: results.brokenLinks,
      missingAnchors: results.missingAnchors,
      deadEndButtons: results.deadEndButtons,
      unreachableAPIs: results.unreachableAPIs,
      redirects: results.redirects,
      stats: results.stats
    };
    
    await saveResults(formattedResults);
    
    // Print summary
    const duration = (Date.now() - startTime) / 1000;
    console.log('');
    console.log('Scan Complete');
    console.log('=============');
    console.log(`Total checked: ${results.stats.totalChecked}`);
    console.log(`Broken links: ${results.brokenLinks.length}`);
    console.log(`Missing anchors: ${results.missingAnchors.length}`);
    console.log(`Dead-end buttons: ${results.deadEndButtons.length}`);
    console.log(`Unreachable APIs: ${results.unreachableAPIs.length}`);
    console.log(`Redirects: ${results.redirects.length}`);
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    
  } catch (error) {
    console.error('Error during scan:', error);
  }
}

// Run the script
main().catch(console.error);