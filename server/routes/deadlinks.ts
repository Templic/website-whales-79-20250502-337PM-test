/**
 * Dead Link API Routes
 * 
 * This module provides API endpoints for checking and fixing dead links in the application.
 */
import { Router } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const scanJobs: Record<string, any> = {};

// Base directory for storing scan reports
const REPORTS_DIR = process.cwd();

// Ensure the reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Start a new scan for dead links
 */
router.post('/scan', (req, res) => {
  try {
    const scanId = uuidv4();
    const outputFile = path.join(REPORTS_DIR, 'deadlinks-simple-report.json');
    
    // Create a new scan job
    scanJobs[scanId] = {
      id: scanId,
      status: 'running',
      startTime: new Date().toISOString(),
      outputFile,
    };
    
    // Execute the dead link checker script
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple-deadlink-checker.js');
    const command = `node ${scriptPath}`;
    
    console.log(`Executing scan: ${scriptPath}`);
    
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        scanJobs[scanId].status = 'error';
        scanJobs[scanId].error = error.message;
        return;
      }
      
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }
      
      console.log(`Scan stdout: ${stdout.substring(0, 200)}...`);
      
      // Read the output file
      try {
        if (fs.existsSync(outputFile)) {
          const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
          scanJobs[scanId].status = 'completed';
          scanJobs[scanId].results = results;
          scanJobs[scanId].endTime = new Date().toISOString();
          console.log('Scan completed successfully, results loaded');
        } else {
          scanJobs[scanId].status = 'error';
          scanJobs[scanId].error = 'Output file not found';
          console.error(`Output file not found at ${outputFile}`);
        }
      } catch (readError) {
        console.error(`Error reading output file: ${readError.message}`);
        scanJobs[scanId].status = 'error';
        scanJobs[scanId].error = readError.message;
      }
    });
    
    res.json({ scanId });
  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

/**
 * Check the status of a scan job
 */
router.get('/status/:scanId', (req, res) => {
  const { scanId } = req.params;
  const job = scanJobs[scanId];
  
  if (!job) {
    return res.status(404).json({ error: 'Scan job not found' });
  }
  
  res.json({
    id: job.id,
    status: job.status,
    startTime: job.startTime,
    endTime: job.endTime,
    error: job.error,
    results: job.results,
  });
});

/**
 * Get the latest scan results
 */
router.get('/latest', (req, res) => {
  try {
    const outputFile = path.join(REPORTS_DIR, 'deadlinks-simple-report.json');
    const legacyOutputFile = path.join(REPORTS_DIR, 'deadlinks-report.json');
    
    if (fs.existsSync(outputFile)) {
      const results = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      res.json(results);
    } else if (fs.existsSync(legacyOutputFile)) {
      const results = JSON.parse(fs.readFileSync(legacyOutputFile, 'utf8'));
      res.json(results);
    } else {
      console.log(`No report files found at ${outputFile} or ${legacyOutputFile}`);
      res.status(404).json({ error: 'No scan results found' });
    }
  } catch (error) {
    console.error('Error retrieving latest results:', error);
    res.status(500).json({ error: 'Failed to retrieve latest results' });
  }
});

/**
 * Fix a broken link by creating a placeholder page
 */
router.post('/fix', (req, res) => {
  try {
    const { url, parentUrl, suggestion } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Extract the path from the URL
    let pathname = url;
    try {
      if (url.startsWith('http')) {
        pathname = new URL(url).pathname;
      }
    } catch (parseError) {
      console.error(`Error parsing URL: ${parseError.message}`);
    }
    
    // Skip root path
    if (pathname === '/' || !pathname) {
      return res.status(400).json({ error: 'Cannot fix root path' });
    }
    
    // Normalize the path
    pathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    
    // Generate a path for the page component
    const pageName = pathname
      .split('/')
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('');
    
    const componentName = `${pageName}Page`;
    const componentPath = path.join(process.cwd(), 'client/src/pages', `${componentName}.tsx`);
    
    // Check if file already exists
    if (fs.existsSync(componentPath)) {
      return res.status(409).json({ error: 'Page component already exists' });
    }
    
    // Create a simple placeholder page
    const pageContent = `import { Helmet } from 'react-helmet';

export const ${componentName} = () => {
  return (
    <div className="container mx-auto py-8">
      <Helmet>
        <title>${pageName.replace(/([A-Z])/g, ' $1').trim()} | Dale Loves Whales</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">${pageName.replace(/([A-Z])/g, ' $1').trim()}</h1>
      
      <div className="bg-muted p-6 rounded-lg">
        <p className="text-lg mb-4">
          This is a placeholder page for <strong>${url}</strong>
        </p>
        <p>
          This page was automatically created to fix a broken link found on ${parentUrl || 'the website'}.
        </p>
      </div>
    </div>
  );
};

export default ${componentName};
`;
    
    // Write the file
    fs.writeFileSync(componentPath, pageContent);
    
    // Update the App.tsx to include the new route
    const appPath = path.join(process.cwd(), 'client/src/App.tsx');
    
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf8');
      
      // Check if the import and route already exist
      const importExists = appContent.includes(`import ${componentName} from './pages/${componentName}'`);
      const routeExists = appContent.includes(`<Route path="/${pathname}"`);
      
      if (!importExists) {
        // Add import statement before the last import
        const lastImportIndex = appContent.lastIndexOf('import');
        const lastImportEndIndex = appContent.indexOf('\n', lastImportIndex);
        
        const newImport = `import ${componentName} from './pages/${componentName}';\n`;
        
        appContent = 
          appContent.substring(0, lastImportEndIndex + 1) + 
          newImport + 
          appContent.substring(lastImportEndIndex + 1);
      }
      
      if (!routeExists) {
        // Add route before the closing Switch tag
        const switchEndIndex = appContent.lastIndexOf('</Switch>');
        
        const newRoute = `        <Route path="/${pathname}" component={${componentName}} />\n        `;
        
        appContent = 
          appContent.substring(0, switchEndIndex) + 
          newRoute + 
          appContent.substring(switchEndIndex);
      }
      
      // Save the updated App.tsx
      fs.writeFileSync(appPath, appContent);
    }
    
    res.json({ 
      success: true, 
      message: `Created placeholder page for ${url}`, 
      componentPath: componentPath.replace(process.cwd(), '') 
    });
  } catch (error) {
    console.error('Error fixing link:', error);
    res.status(500).json({ error: 'Failed to fix link' });
  }
});

/**
 * Fix a dead-end button by adding an event handler
 */
router.post('/fix-button', (req, res) => {
  try {
    const { url, element, text, location } = req.body;
    
    if (!url || !location) {
      return res.status(400).json({ error: 'URL and location are required' });
    }
    
    // For now, we'll just return success without actually modifying anything
    // In a real implementation, we would parse the HTML and modify the button
    
    res.json({ 
      success: true, 
      message: `Added mock handler for button "${text}" at ${location}`, 
      note: "This is a simulated fix. In a real implementation, the button would be updated in the source code."
    });
  } catch (error) {
    console.error('Error fixing button:', error);
    res.status(500).json({ error: 'Failed to fix button' });
  }
});

/**
 * Run the CLI version of the dead link checker
 */
router.post('/run-cli', (req, res) => {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'simple-deadlink-checker.js');
    
    console.log(`Executing script: ${scriptPath}`);
    
    // Execute the script and capture output
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return res.status(500).json({ error: error.message, stdout, stderr });
      }
      
      console.log('Script executed successfully');
      res.json({ success: true, stdout, stderr });
    });
  } catch (error) {
    console.error('Error running CLI script:', error);
    res.status(500).json({ error: 'Failed to run CLI script' });
  }
});

export default router;