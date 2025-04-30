/**
 * Database Tables Check
 * 
 * This script lists all tables in the database to help identify which ones need the timezone column
 */
import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Load environment variables
config();

// Configure WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

// Create a PostgreSQL pool connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

async function listAllTables() {
  console.log('Listing all tables in the database...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Query all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log(`Found ${tablesResult.rowCount} tables:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      
      // Find any tables with 'schedule' or 'content' in their name
      const relevantTables = tablesResult.rows
        .filter(row => row.table_name.includes('schedule') || row.table_name.includes('content'))
        .map(row => row.table_name);
      
      if (relevantTables.length > 0) {
        console.log('\nTables potentially related to content scheduling:');
        relevantTables.forEach((table, index) => {
          console.log(`${index + 1}. ${table}`);
        });
      } else {
        console.log('\nNo tables found that might be related to content scheduling.');
      }
      
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
  } catch (err) {
    console.error('Failed to connect to database:', err);
    throw err;
  } finally {
    // Close the pool to exit properly
    await pool.end();
  }
}

// Execute the function
listAllTables()
  .then(() => {
    console.log('Database tables check completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database tables check failed:', err);
    process.exit(1);
  });