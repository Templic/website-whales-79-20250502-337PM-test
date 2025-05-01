/**
 * Simple Dead Link Checker
 * 
 * A simpler version of the dead link checker script that focuses on basic functionality.
 * This script scans a website for broken links and generates a report.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import { fileURLToPath } from 'url';

// For ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  baseUrl: 'http://localhost:5000',
  maxDepth: 2,
  outputFile: path.join(process.cwd(), 'deadlinks-simple-report.json'),
  includeExternal: false
};

// Store for visited links and issues
const visitedUrls = new Set();
const brokenLinks = [];
const deadEndButtons = [];

/**
 * Get the absolute URL from a relative URL
 */
function getAbsoluteUrl(baseUrl, href) {
  if (!href) return null;
  
  // Skip special links
  if (href.startsWith('javascript:') || 
      href.startsWith('mailto:') || 
      href.startsWith('tel:') || 
      href === '#') {
    return null;
  }
  
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

/**
 * Check if a URL is valid and accessible
 */
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
    console.error(`Error checking URL ${url}: ${error.message}`);
    return {
      url,
      status: error.response ? error.response.status : 0,
      valid: false,
      error: error.message
    };
  }
}

/**
 * Crawl a page and check for broken links
 */
async function crawlPage(url, parentUrl = null, depth = 0) {
  // Skip if we've already visited this URL or reached max depth
  if (visitedUrls.has(url) || depth > config.maxDepth) {
    return;
  }
  
  console.log(`Crawling ${url} (depth: ${depth})`);
  visitedUrls.add(url);
  
  try {
    // Fetch the page
    const response = await axios.get(url, { 
      validateStatus: false,
      timeout: 10000 
    });
    
    // If the page is broken, add it to the list
    if (response.status >= 400) {
      brokenLinks.push({
        url,
        parentUrl,
        status: response.status,
        message: `HTTP Error: ${response.status}`
      });
      return;
    }
    
    // Parse the page content
    const $ = cheerio.load(response.data);
    
    // Check all links on the page
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (!href) {
        // Add empty links to the dead-end buttons list
        deadEndButtons.push({
          url,
          element: 'a',
          text: text || '[No Text]',
          location: `${url} (index: ${index})`
        });
        return;
      }
      
      const linkUrl = getAbsoluteUrl(url, href);
      
      // Skip if the link is null or we're skipping external links
      if (!linkUrl) return;
      if (!config.includeExternal && linkUrl.startsWith('http') && !linkUrl.includes(config.baseUrl)) return;
      
      // Schedule the link to be crawled (only internal links)
      if (linkUrl.startsWith(config.baseUrl) && !visitedUrls.has(linkUrl)) {
        setTimeout(() => {
          crawlPage(linkUrl, url, depth + 1);
        }, 100);
      }
    });
    
    // Check buttons
    $('button, .btn, [role="button"]').each((index, element) => {
      const onClick = $(element).attr('onclick');
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (!onClick && !href) {
        deadEndButtons.push({
          url,
          element: 'button',
          text: text || '[No Text]',
          location: `${url} (index: ${index})`
        });
      }
    });
    
  } catch (error) {
    brokenLinks.push({
      url,
      parentUrl,
      status: 0,
      message: error.message
    });
  }
}

/**
 * Main function to run the link checker
 */
async function main() {
  console.log('Simple Dead Link Checker');
  console.log('=====================================');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Max Depth: ${config.maxDepth}`);
  console.log(`Include External: ${config.includeExternal}`);
  console.log('=====================================');
  
  // Start crawling from the base URL
  await crawlPage(config.baseUrl);
  
  // Wait for remaining crawls to finish
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Generate report
  console.log('Results:');
  console.log(`Visited URLs: ${visitedUrls.size}`);
  console.log(`Broken Links: ${brokenLinks.length}`);
  console.log(`Dead-End Buttons: ${deadEndButtons.length}`);
  
  // Print broken links
  if (brokenLinks.length > 0) {
    console.log('\nBroken Links:');
    brokenLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.url}`);
      console.log(`   Found on: ${link.parentUrl || 'Direct Access'}`);
      console.log(`   Status: ${link.status}`);
      console.log(`   Message: ${link.message}`);
      console.log('---');
    });
  }
  
  // Print dead-end buttons
  if (deadEndButtons.length > 0) {
    console.log('\nDead-End Buttons:');
    deadEndButtons.forEach((button, index) => {
      console.log(`${index + 1}. ${button.element} "${button.text}"`);
      console.log(`   Found on: ${button.url}`);
      console.log(`   Location: ${button.location}`);
      console.log('---');
    });
  }
  
  // Save report to file
  const report = {
    meta: {
      baseUrl: config.baseUrl,
      timestamp: new Date().toISOString(),
      visitedUrls: Array.from(visitedUrls)
    },
    summary: {
      visitedUrls: visitedUrls.size,
      brokenLinks: brokenLinks.length,
      deadEndButtons: deadEndButtons.length
    },
    brokenLinks,
    deadEndButtons
  };
  
  try {
    fs.writeFileSync(config.outputFile, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to ${config.outputFile}`);
  } catch (error) {
    console.error(`Error saving report: ${error.message}`);
    const fallbackPath = path.join(__dirname, 'deadlinks-report.json');
    try {
      fs.writeFileSync(fallbackPath, JSON.stringify(report, null, 2));
      console.log(`\nReport saved to fallback location: ${fallbackPath}`);
    } catch (fallbackError) {
      console.error(`Failed to save report to fallback location: ${fallbackError.message}`);
    }
  }
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});