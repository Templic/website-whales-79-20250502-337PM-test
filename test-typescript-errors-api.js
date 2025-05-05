/**
 * TypeScript Error Management API Test Script
 * 
 * This script tests the TypeScript error management API endpoints
 * to ensure they're working properly.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE = 'http://localhost:3000/api/admin/typescript-errors';

/**
 * Test the TypeScript errors API
 */
async function testTypescriptErrorsAPI() {
  console.log('Testing TypeScript Errors API');
  console.log('-----------------------------');

  try {
    // 1. Create a new scan
    console.log('1. Creating a new scan...');
    const createResponse = await fetch(`${API_BASE}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aiEnabled: true
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create scan: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log('Scan created successfully:', createData);
    const scanId = createData.id;

    // 2. Wait for the scan to complete
    console.log(`2. Waiting for scan ${scanId} to complete...`);
    let scanCompleted = false;
    let scanDetails = null;
    
    // Poll every 2 seconds for up to 5 minutes
    for (let i = 0; i < 150 && !scanCompleted; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const scanResponse = await fetch(`${API_BASE}/scans/${scanId}`);
      
      if (!scanResponse.ok) {
        throw new Error(`Failed to get scan details: ${scanResponse.status} ${scanResponse.statusText}`);
      }
      
      scanDetails = await scanResponse.json();
      console.log(`   Status: ${scanDetails.status} (${scanDetails.errors?.length || 0} errors found)`);
      
      if (scanDetails.status === 'COMPLETED' || scanDetails.status === 'FAILED') {
        scanCompleted = true;
      }
    }

    if (!scanCompleted) {
      throw new Error('Scan timed out after 5 minutes');
    }

    // 3. View scan details
    console.log('3. Scan completed. Details:');
    console.log(`   Scan ID: ${scanDetails.id}`);
    console.log(`   Status: ${scanDetails.status}`);
    console.log(`   Errors found: ${scanDetails.errorCount}`);
    console.log(`   Fixes applied: ${scanDetails.fixedCount}`);
    console.log(`   AI enabled: ${scanDetails.aiEnabled}`);
    console.log(`   Start time: ${scanDetails.startTime}`);
    console.log(`   End time: ${scanDetails.endTime}`);
    
    // 4. Show a sample of errors
    if (scanDetails.errors && scanDetails.errors.length > 0) {
      console.log('\n4. Sample of errors:');
      const sampleErrors = scanDetails.errors.slice(0, 3);
      
      sampleErrors.forEach((error, index) => {
        console.log(`\n   Error #${index + 1}:`);
        console.log(`   - Code: ${error.code}`);
        console.log(`   - File: ${error.file}`);
        console.log(`   - Line: ${error.line}`);
        console.log(`   - Message: ${error.message}`);
        console.log(`   - Severity: ${error.severity}`);
        console.log(`   - Status: ${error.status}`);
        
        if (error.fixDetails && error.fixDetails.suggestion) {
          console.log(`   - Fix suggestion: ${error.fixDetails.suggestion}`);
        }
      });
      
      // 5. Generate AI fix for one error
      if (scanDetails.errors.length > 0 && scanDetails.aiEnabled) {
        const errorToFix = scanDetails.errors.find(e => !e.fixDetails || !e.fixDetails.suggestion);
        
        if (errorToFix) {
          console.log(`\n5. Generating AI fix for error ${errorToFix.id}...`);
          
          const generateFixResponse = await fetch(`${API_BASE}/scans/${scanId}/errors/${errorToFix.id}/ai-fix`, {
            method: 'POST'
          });
          
          if (!generateFixResponse.ok) {
            console.error(`   Failed to generate fix: ${generateFixResponse.status} ${generateFixResponse.statusText}`);
          } else {
            const generateFixData = await generateFixResponse.json();
            console.log('   Fix generation initiated:', generateFixData);
            
            // Wait for fix to be generated
            console.log('   Waiting for fix to be generated...');
            let fixGenerated = false;
            
            for (let i = 0; i < 30 && !fixGenerated; i++) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const errorResponse = await fetch(`${API_BASE}/scans/${scanId}`);
              const scanData = await errorResponse.json();
              
              const updatedError = scanData.errors.find(e => e.id === errorToFix.id);
              
              if (updatedError && updatedError.status !== 'FIXING' && updatedError.fixDetails) {
                fixGenerated = true;
                console.log('   Fix generated successfully!');
                console.log(`   - Suggestion: ${updatedError.fixDetails.suggestion}`);
                console.log(`   - Explanation: ${updatedError.fixDetails.explanation}`);
                console.log(`   - Confidence: ${updatedError.fixDetails.confidence}`);
              }
            }
            
            if (!fixGenerated) {
              console.log('   Fix generation timed out after 1 minute');
            }
          }
        } else {
          console.log('\n5. All errors already have fix suggestions');
        }
      }
      
      // 6. Apply fix to one error
      if (scanDetails.errors.length > 0) {
        const errorWithFix = scanDetails.errors.find(e => 
          e.status !== 'FIXED' && 
          e.status !== 'IGNORED' && 
          e.fixDetails && 
          e.fixDetails.suggestion
        );
        
        if (errorWithFix) {
          console.log(`\n6. Applying fix for error ${errorWithFix.id}...`);
          
          const applyFixResponse = await fetch(`${API_BASE}/scans/${scanId}/errors/${errorWithFix.id}/fix`, {
            method: 'POST'
          });
          
          if (!applyFixResponse.ok) {
            console.error(`   Failed to apply fix: ${applyFixResponse.status} ${applyFixResponse.statusText}`);
          } else {
            const applyFixData = await applyFixResponse.json();
            console.log('   Fix applied successfully:', applyFixData);
          }
        } else {
          console.log('\n6. No eligible errors found for applying fixes');
        }
      }
      
      // 7. Ignore one error
      if (scanDetails.errors.length > 0) {
        const errorToIgnore = scanDetails.errors.find(e => 
          e.status !== 'FIXED' && 
          e.status !== 'IGNORED'
        );
        
        if (errorToIgnore) {
          console.log(`\n7. Ignoring error ${errorToIgnore.id}...`);
          
          const ignoreResponse = await fetch(`${API_BASE}/scans/${scanId}/errors/${errorToIgnore.id}/ignore`, {
            method: 'POST'
          });
          
          if (!ignoreResponse.ok) {
            console.error(`   Failed to ignore error: ${ignoreResponse.status} ${ignoreResponse.statusText}`);
          } else {
            const ignoreData = await ignoreResponse.json();
            console.log('   Error ignored successfully:', ignoreData);
          }
        } else {
          console.log('\n7. No eligible errors found for ignoring');
        }
      }
    } else {
      console.log('\n4. No errors found in scan');
    }
    
    // 8. Get all scans
    console.log('\n8. Getting all scans...');
    const scansResponse = await fetch(`${API_BASE}/scans`);
    
    if (!scansResponse.ok) {
      throw new Error(`Failed to get scans: ${scansResponse.status} ${scansResponse.statusText}`);
    }
    
    const scansData = await scansResponse.json();
    console.log(`   Found ${scansData.length} scans`);
    
    if (scansData.length > 0) {
      console.log('   Recent scans:');
      scansData.slice(0, 3).forEach((scan, index) => {
        console.log(`   - Scan #${index + 1}: ${scan.id} (${scan.status}, ${scan.errorCount} errors)`);
      });
    }
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Error testing TypeScript errors API:', error);
  }
}

// Run the test
testTypescriptErrorsAPI().catch(console.error);