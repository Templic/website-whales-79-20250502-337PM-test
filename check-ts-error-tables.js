/**
 * Check if TypeScript Error Management Tables Exist
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    console.log('Checking TypeScript error management tables...');
    
    // Query to check if tables exist
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('typescript_scan_results', 'typescript_errors', 'typescript_error_fixes');
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('No TypeScript error management tables found');
    } else {
      console.log('Found tables:');
      result.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      // Check total table count
      console.log(`${result.rows.length} of 3 required tables exist`);
      
      if (result.rows.length === 3) {
        // Check if tables have the correct structure
        console.log('\nChecking table structures:');
        
        // Check scan results table
        try {
          const scanTableStructure = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'typescript_scan_results'
            ORDER BY ordinal_position;
          `);
          
          console.log('✅ Scan results table exists with structure:');
          scanTableStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
          });
        } catch (error) {
          console.error('❌ Error checking scan table structure:', error.message);
        }
        
        // Check errors table
        try {
          const errorsTableStructure = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'typescript_errors'
            ORDER BY ordinal_position;
          `);
          
          console.log('\n✅ Errors table exists with structure:');
          errorsTableStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
          });
        } catch (error) {
          console.error('❌ Error checking errors table structure:', error.message);
        }
        
        // Check fixes table
        try {
          const fixesTableStructure = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'typescript_error_fixes'
            ORDER BY ordinal_position;
          `);
          
          console.log('\n✅ Fixes table exists with structure:');
          fixesTableStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
          });
        } catch (error) {
          console.error('❌ Error checking fixes table structure:', error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
checkTables()
  .then(() => {
    console.log('\nCheck complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });