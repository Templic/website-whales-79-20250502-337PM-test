/**
 * Page Reorganization Helper Script
 * 
 * This script helps reorganize pages from their current locations
 * to the new structure according to the repository reorganization plan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Page migration mapping
// Format: [source path, destination path, status]
// status can be 'active' or 'archived'
const pageMigrations = [
  // Main pages - Keep in their current location
  ['client/src/pages/HomePage.tsx', 'client/src/pages/HomePage.tsx', 'active'],
  ['client/src/pages/AboutPage.tsx', 'client/src/pages/AboutPage.tsx', 'active'],
  ['client/src/pages/EngagePage.tsx', 'client/src/pages/EngagePage.tsx', 'active'],
  ['client/src/pages/NewsletterPage.tsx', 'client/src/pages/NewsletterPage.tsx', 'active'],
  ['client/src/pages/ContactPage.tsx', 'client/src/pages/ContactPage.tsx', 'active'],
  ['client/src/pages/CollaborationPage.tsx', 'client/src/pages/CollaborationPage.tsx', 'active'],
  ['client/src/pages/TourPage.tsx', 'client/src/pages/TourPage.tsx', 'active'],
  ['client/src/pages/PrivacyPolicy.tsx', 'client/src/pages/PrivacyPolicy.tsx', 'active'],
  ['client/src/pages/TermsOfService.tsx', 'client/src/pages/TermsOfService.tsx', 'active'],
  ['client/src/pages/SitemapPage.tsx', 'client/src/pages/SitemapPage.tsx', 'active'],
  ['client/src/pages/not-found.tsx', 'client/src/pages/not-found.tsx', 'active'],
  
  // Auth pages - Keep in current location
  ['client/src/pages/AuthPage.tsx', 'client/src/pages/AuthPage.tsx', 'active'],
  ['client/src/pages/PasswordRecoveryPage.tsx', 'client/src/pages/PasswordRecoveryPage.tsx', 'active'],
  ['client/src/pages/user-portal.tsx', 'client/src/pages/user-portal.tsx', 'active'],
  
  // Shop pages - Move to /shop folder
  ['client/src/pages/ShopPage.tsx', 'client/src/pages/shop/ShopPage.tsx', 'active'],
  ['client/src/pages/ProductPage.tsx', 'client/src/pages/shop/ProductPage.tsx', 'active'],
  ['client/src/pages/CartPage.tsx', 'client/src/pages/shop/CartPage.tsx', 'active'],
  ['client/src/pages/CheckoutPage.tsx', 'client/src/pages/shop/CheckoutPage.tsx', 'active'],
  ['client/src/pages/CollaborativeShoppingPage.tsx', 'client/src/pages/shop/CollaborativeShoppingPage.tsx', 'active'],
  ['client/src/pages/CosmicMerchandisePage.tsx', 'client/src/pages/shop/CosmicMerchandisePage.tsx', 'active'],
  
  // Music & Blog pages
  ['client/src/pages/MusicReleasePage.tsx', 'client/src/pages/music/MusicReleasePage.tsx', 'active'],
  ['client/src/pages/ArchivedMusic.tsx', 'client/src/pages/music/ArchivedMusic.tsx', 'active'],
  ['client/src/pages/BlogPage.tsx', 'client/src/pages/blog/BlogPage.tsx', 'active'],
  ['client/src/pages/BlogPostPage.tsx', 'client/src/pages/blog/BlogPostPage.tsx', 'active'],
  
  // Community & Experience pages
  ['client/src/pages/CommunityPage.tsx', 'client/src/pages/community/CommunityPage.tsx', 'active'],
  ['client/src/pages/EnhancedCommunityPage.tsx', 'client/src/pages/community/EnhancedCommunityPage.tsx', 'active'],
  ['client/src/pages/ImmersivePage.tsx', 'client/src/pages/experience/ImmersivePage.tsx', 'active'],
  ['client/src/pages/CosmicConnectivityPage.tsx', 'client/src/pages/experience/CosmicConnectivityPage.tsx', 'active'],
  ['client/src/pages/CosmicExperiencePage.tsx', 'client/src/pages/experience/CosmicExperiencePage.tsx', 'active'],
  ['client/src/pages/ArchivePage.tsx', 'client/src/pages/archived/ArchivePage.tsx', 'archived'],
  
  // Admin pages - Some are already in admin folder, others need to be moved
  ['client/src/pages/AdminPortalPage.tsx', 'client/src/pages/admin/AdminPortalPage.tsx', 'active'],
  ['client/src/pages/AnalyticsPage.tsx', 'client/src/pages/admin/AnalyticsPage.tsx', 'active'],
  
  // Archived pages - Move old versions to archived folder
  ['client/src/pages/test/OldCosmicTest.tsx', 'client/src/pages/archived/test/OldCosmicTest.tsx', 'archived'],
  ['client/src/pages/test/ButtonDemo.tsx', 'client/src/pages/archived/test/ButtonDemo.tsx', 'archived'],
];

/**
 * Adds a comment header to page components
 */
function addPageHeader(filePath, status) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  let header = '';
  if (status === 'archived') {
    header = `/**
 * ${path.basename(filePath)}
 * 
 * ARCHIVED PAGE
 * 
 * This page is no longer in active use and has been archived.
 * It is kept for reference purposes only.
 * 
 * Please use the current implementation for any new development.
 */
`;
  } else {
    header = `/**
 * ${path.basename(filePath)}
 * 
 * Migrated as part of the repository reorganization.
 */
`;
  }
  
  // Add the header if it doesn't already have one
  if (!content.startsWith('/**')) {
    fs.writeFileSync(filePath, header + content);
  }
}

/**
 * Adds a banner to archived pages
 */
function addArchivedBanner(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find the beginning of the component's return statement
  const returnIdx = content.indexOf('return (');
  
  if (returnIdx === -1) {
    console.warn(`Could not add archived banner to ${filePath}: Return statement not found`);
    return;
  }
  
  // Insert the archived banner component after the first tag in the return
  const openingTagEnd = content.indexOf('>', returnIdx);
  if (openingTagEnd === -1) return;
  
  const bannerComponent = `
      {/* Archived Page Banner */}
      <div className="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
        <p className="font-bold">Archived Page</p>
        <p>This page is no longer actively maintained and is kept for reference only.</p>
      </div>
`;
  
  const modifiedContent = 
    content.substring(0, openingTagEnd + 1) + 
    bannerComponent + 
    content.substring(openingTagEnd + 1);
  
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`Added archived banner to: ${filePath}`);
}

/**
 * Migrates a page from source to destination path
 */
function migratePage(source, destination, status) {
  // Create the destination directory if it doesn't exist
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Check if the source exists
  if (!fs.existsSync(source)) {
    console.error(`Source file does not exist: ${source}`);
    return false;
  }
  
  try {
    // Copy the page to the new location
    fs.copyFileSync(source, destination);
    
    // Add a header comment to the file
    addPageHeader(destination, status);
    
    // If the page is archived, add a visual banner
    if (status === 'archived') {
      addArchivedBanner(destination);
    }
    
    console.log(`Migrated: ${source} → ${destination} (${status})`);
    return true;
  } catch (error) {
    console.error(`Error migrating ${source}: ${error.message}`);
    return false;
  }
}

/**
 * Updates the App.tsx routing for archived pages
 */
function updateRouting() {
  const appPath = 'client/src/App.tsx';
  
  if (!fs.existsSync(appPath)) {
    console.error(`App.tsx not found at ${appPath}`);
    return;
  }
  
  let content = fs.readFileSync(appPath, 'utf8');
  
  // Find archived pages from migration list
  const archivedPages = pageMigrations
    .filter(([_, __, status]) => status === 'archived')
    .map(([_, destPath]) => {
      const baseName = path.basename(destPath, path.extname(destPath));
      return baseName;
    });
  
  // Update each route for archived pages
  archivedPages.forEach(pageName => {
    // Find route for this page
    const routeRegex = new RegExp(`<Route path="([^"]+)" component={${pageName}} />`, 'g');
    
    // Comment out the route and add an explanation
    content = content.replace(routeRegex, (match, routePath) => {
      return `{/* Archived Page - ${routePath} */}\n        {/* ${match} */}`;
    });
  });
  
  fs.writeFileSync(appPath, content);
  console.log('Updated routing in App.tsx');
}

/**
 * Main function
 */
function main() {
  // Check if running in test mode
  const testMode = process.argv.includes('--test');
  
  console.log('Starting page reorganization...');
  
  if (testMode) {
    console.log('Running in test mode - will only show what would be migrated');
    pageMigrations.forEach(([source, destination, status]) => {
      console.log(`Would migrate: ${source} → ${destination} (${status})`);
    });
    console.log('Would update routing in App.tsx for archived pages');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  
  pageMigrations.forEach(([source, destination, status]) => {
    if (migratePage(source, destination, status)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  // Update routing for archived pages
  updateRouting();
  
  console.log(`Page reorganization completed. Success: ${successCount}, Failed: ${failCount}`);
}

// Run the script
main();