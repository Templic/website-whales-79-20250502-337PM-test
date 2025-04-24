// Simple script to verify transaction logs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkTransactionLogs() {
  console.log('Checking transaction logs...');
  
  const logFilePath = path.join(process.cwd(), 'logs', 'payment', 'transaction_log.txt');
  
  if (!fs.existsSync(logFilePath)) {
    console.log('ERROR: Transaction log file does not exist at:', logFilePath);
    return false;
  }
  
  try {
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    // Basic validations
    console.log('Checking log content...');
    const containsTransactionId = logContent.includes('transactionId');
    const containsAmount = logContent.includes('amount');
    const containsTimestamp = logContent.includes('timestamp');
    
    console.log('Transaction ID references:', containsTransactionId);
    console.log('Amount references:', containsAmount);
    console.log('Timestamp references:', containsTimestamp);
    
    // Format validations
    const hasTRXPrefix = (logContent.match(/TRX/g) || []).length;
    const countSeparators = (logContent.match(/\|/g) || []).length;
    const hasFormatDocumentation = logContent.includes('# Format:');
    
    console.log('TRX prefix count:', hasTRXPrefix);
    console.log('Field separator count:', countSeparators);
    console.log('Format documentation:', hasFormatDocumentation ? 'Yes' : 'No');
    
    // Line validations
    const nonEmptyLines = logContent.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    
    console.log('Log entry count:', nonEmptyLines.length);
    
    if (nonEmptyLines.length > 0) {
      // Check field count in first line
      const firstLine = nonEmptyLines[0];
      const fields = firstLine.split('|');
      
      console.log('Fields in first entry:', fields.length);
      console.log('First log entry:', firstLine);
    }
    
    // Check if it meets all criteria
    const meetsAllCriteria = 
      containsTransactionId && 
      containsAmount && 
      containsTimestamp && 
      hasTRXPrefix >= 5 &&
      countSeparators > 0 &&
      hasFormatDocumentation &&
      nonEmptyLines.length >= 5;
    
    console.log('\nOverall validation result:', meetsAllCriteria ? 'PASS' : 'FAIL');
    return meetsAllCriteria;
    
  } catch (error) {
    console.error('Error checking transaction logs:', error);
    return false;
  }
}

// Check logs and print results
const result = checkTransactionLogs();
console.log('\nFinal result:', result ? 'Transaction logs are valid' : 'Transaction logs are invalid');