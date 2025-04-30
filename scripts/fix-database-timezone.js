/**
 * Script to add missing 'timezone' column to relevant tables
 * Run this script to fix the "column timezone does not exist" error
 */

const { pool } = require('../server/db');

async function fixTimezoneColumn() {
  console.log('Starting database timezone column fix...');
  
  try {
    // Find which table is missing the timezone column
    const query = `
      SELECT 
        table_name 
      FROM 
        information_schema.tables 
      WHERE 
        table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('content_schedules', 'scheduled_content', 'scheduler_config', 'events')
    `;
    
    const { rows } = await pool.query(query);
    console.log('Found tables to check:', rows.map(r => r.table_name).join(', '));
    
    // Check each potential table for timezone column and add if missing
    for (const row of rows) {
      const tableName = row.table_name;
      
      // Check if timezone column exists
      const columnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = 'timezone'
      `;
      
      const { rows: columnRows } = await pool.query(columnQuery, [tableName]);
      
      if (columnRows.length === 0) {
        console.log(`Table '${tableName}' is missing timezone column. Adding it...`);
        
        // Add the timezone column
        await pool.query(`
          ALTER TABLE "${tableName}"
          ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'UTC'
        `);
        
        console.log(`Added timezone column to '${tableName}' table.`);
      } else {
        console.log(`Table '${tableName}' already has timezone column.`);
      }
    }
    
    console.log('Database timezone column fix completed successfully!');
  } catch (error) {
    console.error('Error fixing timezone column:', error);
  } finally {
    await pool.end();
  }
}

fixTimezoneColumn()
  .then(() => console.log('Script execution completed.'))
  .catch(err => console.error('Script execution failed:', err));