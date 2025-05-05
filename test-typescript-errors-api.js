/**
 * TypeScript Error Management API Test Script
 * 
 * This script tests the TypeScript error management API endpoints
 * to ensure they're working properly.
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Base URL for API calls
const BASE_URL = 'http://localhost:5000';

// Test the TypeScript error management API
async function testTypescriptErrorsAPI() {
  console.log('Testing TypeScript errors API...');
  
  try {
    // Test 1: Create a new scan
    console.log('\nTest 1: Create a new scan');
    const scanResponse = await fetch(`${BASE_URL}/api/admin/typescript-errors/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ aiEnabled: false })
    });
    
    if (!scanResponse.ok) {
      throw new Error(`Failed to create scan: ${scanResponse.status} ${scanResponse.statusText}`);
    }
    
    const scanData = await scanResponse.json();
    console.log('Created scan:', scanData);
    
    // Test 2: Get scan list
    console.log('\nTest 2: Get scan list');
    const listResponse = await fetch(`${BASE_URL}/api/admin/typescript-errors/scans`);
    
    if (!listResponse.ok) {
      throw new Error(`Failed to get scan list: ${listResponse.status} ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json();
    console.log(`Found ${listData.length} scans`);
    
    // Use the first scan for testing if we didn't create one
    const scanId = scanData?.id || (listData.length > 0 ? listData[0].id : null);
    
    if (!scanId) {
      throw new Error('No scan ID available for testing');
    }
    
    // Test 3: Get scan details
    console.log('\nTest 3: Get scan details');
    const detailsResponse = await fetch(`${BASE_URL}/api/admin/typescript-errors/scans/${scanId}`);
    
    if (!detailsResponse.ok) {
      throw new Error(`Failed to get scan details: ${detailsResponse.status} ${detailsResponse.statusText}`);
    }
    
    const detailsData = await detailsResponse.json();
    console.log('Scan details:', {
      id: detailsData.id,
      status: detailsData.status,
      errorCount: detailsData.errorCount,
      fixedCount: detailsData.fixedCount,
      aiEnabled: detailsData.aiEnabled
    });
    
    // If there are errors, test the fix APIs
    if (detailsData.errors && detailsData.errors.length > 0) {
      const errorId = detailsData.errors[0].id;
      
      // Test 4: Generate AI fix
      console.log('\nTest 4: Generate AI fix');
      try {
        const aiFixResponse = await fetch(`${BASE_URL}/api/admin/typescript-errors/scans/${scanId}/errors/${errorId}/ai-fix`, {
          method: 'POST'
        });
        
        if (aiFixResponse.ok) {
          const aiFixData = await aiFixResponse.json();
          console.log('AI fix generated:', aiFixData);
        } else {
          console.log(`Failed to generate AI fix: ${aiFixResponse.status} ${aiFixResponse.statusText}`);
        }
      } catch (error) {
        console.log('Error generating AI fix:', error.message);
      }
      
      // Test 5: Ignore error
      console.log('\nTest 5: Ignore error');
      try {
        const ignoreResponse = await fetch(`${BASE_URL}/api/admin/typescript-errors/scans/${scanId}/errors/${errorId}/ignore`, {
          method: 'POST'
        });
        
        if (ignoreResponse.ok) {
          const ignoreData = await ignoreResponse.json();
          console.log('Error ignored:', ignoreData);
        } else {
          console.log(`Failed to ignore error: ${ignoreResponse.status} ${ignoreResponse.statusText}`);
        }
      } catch (error) {
        console.log('Error ignoring error:', error.message);
      }
    } else {
      console.log('No errors found to test fix APIs');
    }
    
    console.log('\nAPI testing completed successfully');
    
  } catch (error) {
    console.error('Error testing TypeScript errors API:', error);
  }
}

// Run the tests
testTypescriptErrorsAPI();