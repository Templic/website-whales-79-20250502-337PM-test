/**
 * Fix Last Schedule Run Column
 * 
 * This script adds the missing "last_schedule_run" column to the relevant tables in the database
 * to resolve the error: "error: column "last_schedule_run" does not exist"
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

async function addLastScheduleRunColumn() {
  console.log('Starting database last_schedule_run column fix...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Identify which tables need the last_schedule_run column
      // Based on the error logs and our database inspection, these are the content-related tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('content_items', 'content_relationships', 'content_usage', 'content_workflow_history', 'content_history')
      `);
      
      console.log(`Found ${tablesResult.rowCount} tables to check for last_schedule_run column`);
      
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        
        // Check if last_schedule_run column already exists
        const columnResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = 'last_schedule_run'
        `, [tableName]);
        
        if (columnResult.rowCount === 0) {
          console.log(`Adding last_schedule_run column to ${tableName}...`);
          
          // Add the last_schedule_run column with a default timestamp
          await client.query(`
            ALTER TABLE ${tableName} 
            ADD COLUMN last_schedule_run TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          `);
          
          console.log(`Successfully added last_schedule_run column to ${tableName}`);
        } else {
          console.log(`last_schedule_run column already exists in ${tableName}`);
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('Database last_schedule_run fix completed successfully');
      
    } catch (err) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error during database last_schedule_run column fix:', err);
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
addLastScheduleRunColumn()
  .then(() => {
    console.log('Database last_schedule_run fix script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Database last_schedule_run fix script failed:', err);
    process.exit(1);
  });