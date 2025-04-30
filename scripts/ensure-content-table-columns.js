/**
 * Ensure Content Table Columns
 * 
 * This script adds any missing columns required for content scheduling to function properly:
 * - timezone: TEXT DEFAULT 'UTC'
 * - recurring_schedule: BOOLEAN DEFAULT false
 * - last_schedule_run: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 */
import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import url from 'url';

// Load environment variables
config();

// Configure WebSocket for serverless environments
neonConfig.webSocketConstructor = ws;

// Create a PostgreSQL pool connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Columns to check and add with their SQL definitions
const requiredColumns = {
  'timezone': 'TEXT DEFAULT \'UTC\'',
  'recurring_schedule': 'BOOLEAN DEFAULT false',
  'last_schedule_run': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
};

// Content-related tables that need these columns
const contentTables = [
  'content_items', 
  'content_relationships', 
  'content_usage', 
  'content_workflow_history', 
  'content_history'
];

async function ensureContentTableColumns() {
  console.log('Starting check for required content table columns...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Check each table
      for (const tableName of contentTables) {
        console.log(`Checking table: ${tableName}`);
        
        // Get existing columns for this table
        const columnsResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
        `, [tableName]);
        
        const existingColumns = columnsResult.rows.map(row => row.column_name);
        
        // Check if the table exists
        if (columnsResult.rowCount === 0) {
          console.log(`Table ${tableName} does not exist, skipping`);
          continue;
        }
        
        // Add any missing columns
        for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
          if (!existingColumns.includes(columnName)) {
            console.log(`Adding ${columnName} column to ${tableName}...`);
            
            await client.query(`
              ALTER TABLE ${tableName} 
              ADD COLUMN ${columnName} ${columnDefinition}
            `);
            
            console.log(`Successfully added ${columnName} column to ${tableName}`);
          } else {
            console.log(`Column ${columnName} already exists in ${tableName}`);
          }
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Database column check completed successfully');
      
    } catch (err) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error during database column check:', err);
      throw err;
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
ensureContentTableColumns()
  .then(() => {
    console.log('Database column maintenance script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database column maintenance script failed:', err);
    process.exit(1);
  });