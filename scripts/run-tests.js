#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script runs all the tests for the TypeScript error handling system.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Run a command and return the output
 */
async function runCommand(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const message = data.toString();
      stdout += message;
      process.stdout.write(message);
    });

    child.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;
      process.stderr.write(message);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * Find all test files
 */
function findTestFiles(dir) {
  const testFiles = [];
  
  function scanDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.test.ts') || file.endsWith('.test.js')) {
        testFiles.push(filePath);
      }
    }
  }
  
  scanDir(dir);
  return testFiles;
}

/**
 * Run a test file using Node.js
 */
async function runTestFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  console.log(`\n\n=== Running test: ${relativePath} ===\n`);
  
  try {
    if (filePath.endsWith('.ts')) {
      await runCommand('tsx', [filePath]);
    } else {
      await runCommand('node', [filePath]);
    }
    console.log(`\n✅ Test passed: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`\n❌ Test failed: ${relativePath}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('=== Running TypeScript Error Handling System Tests ===\n');
  
  const testDir = path.join(projectRoot, 'server', 'tests');
  const testFiles = findTestFiles(testDir);
  
  console.log(`Found ${testFiles.length} test files to run:`);
  testFiles.forEach(file => console.log(` - ${path.relative(projectRoot, file)}`));
  
  let passed = 0;
  let failed = 0;
  
  for (const testFile of testFiles) {
    const success = await runTestFile(testFile);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n=== Test Results ===');
  console.log(`Total tests: ${testFiles.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});