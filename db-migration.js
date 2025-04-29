// Database migration script
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';

async function runMigration() {
  // Create a new connection pool
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Initializing Drizzle ORM...');
  const db = drizzle(pool);

  // First, let's check if the contentItems table already exists
  console.log('Checking for existing tables...');
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'content_items'
      );
    `);
    
    const contentItemsExists = tableCheck.rows[0].exists;
    console.log(`Content items table exists: ${contentItemsExists}`);

    // Add enums first
    console.log('Creating enum types...');
    await pool.query(`
      DO $$ 
      BEGIN
        -- Content type enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
          CREATE TYPE content_type AS ENUM (
            'text', 'html', 'image', 'video', 'audio', 'document', 'json'
          );
        END IF;
        
        -- Content status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
          CREATE TYPE content_status AS ENUM (
            'draft', 'review', 'approved', 'published', 'archived', 'scheduled'
          );
        END IF;
        
        -- Review status enum
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
          CREATE TYPE review_status AS ENUM (
            'pending', 'in_progress', 'approved', 'rejected', 'changes_requested'
          );
        END IF;
      END $$;
    `);
    
    console.log('Enum types created successfully');

    // For existing table, alter it to match our enhanced schema
    if (contentItemsExists) {
      console.log('Upgrading content_items table schema...');
      
      // Check if columns exist before altering table
      const columnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'content_items';
      `);
      
      const columns = columnCheck.rows.map(row => row.column_name);
      console.log('Existing columns:', columns);
      
      // Start transaction
      await pool.query('BEGIN');
      
      try {
        // Add default to section if not already exists
        if (columns.includes('section')) {
          console.log('Setting default value for section column...');
          await pool.query(`
            ALTER TABLE content_items 
            ALTER COLUMN section SET DEFAULT 'main';
          `);
        }
        
        // Add new columns if they don't exist
        if (!columns.includes('tags')) {
          console.log('Adding tags column...');
          await pool.query(`
            ALTER TABLE content_items 
            ADD COLUMN tags text[];
          `);
        }
        
        if (!columns.includes('locale_code')) {
          console.log('Adding locale_code column...');
          await pool.query(`
            ALTER TABLE content_items 
            ADD COLUMN locale_code text DEFAULT 'en-US';
          `);
        }
        
        if (!columns.includes('is_active')) {
          console.log('Adding is_active column...');
          await pool.query(`
            ALTER TABLE content_items 
            ADD COLUMN is_active boolean NOT NULL DEFAULT true;
          `);
        }
        
        // Add created_by column if it doesn't exist
        if (!columns.includes('created_by')) {
          console.log('Adding created_by column...');
          await pool.query(`
            ALTER TABLE content_items 
            ADD COLUMN created_by varchar(255) REFERENCES users(id);
          `);
        }
        
        // Convert type column to use enum
        console.log('Converting type column to use enum...');
        await pool.query(`
          ALTER TABLE content_items 
          ALTER COLUMN type TYPE content_type USING type::content_type;
        `);
        
        // Set default for type column
        await pool.query(`
          ALTER TABLE content_items 
          ALTER COLUMN type SET DEFAULT 'text';
        `);
        
        // Convert status column to use enum
        console.log('Converting status column to use enum...');
        await pool.query(`
          ALTER TABLE content_items 
          ALTER COLUMN status TYPE content_status USING status::content_status;
        `);
        
        // Set default for status column
        await pool.query(`
          ALTER TABLE content_items 
          ALTER COLUMN status SET DEFAULT 'draft';
        `);
        
        // Convert review_status column to use enum if it exists
        if (columns.includes('review_status')) {
          console.log('Converting review_status column to use enum...');
          await pool.query(`
            ALTER TABLE content_items 
            ALTER COLUMN review_status TYPE review_status USING 
              CASE 
                WHEN review_status IS NULL THEN NULL 
                ELSE review_status::review_status 
              END;
          `);
        }
        
        await pool.query('COMMIT');
        console.log('Content items table upgraded successfully');
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error upgrading content items table:', error);
      }
    }
    
    // Now create/alter the related tables
    console.log('Creating related content tables...');
    
    // Content history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_history (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        type content_type NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        page TEXT NOT NULL,
        section TEXT NOT NULL,
        image_url TEXT,
        status content_status NOT NULL,
        metadata JSONB,
        tags TEXT[],
        modified_at TIMESTAMP DEFAULT NOW() NOT NULL,
        modified_by VARCHAR(255) REFERENCES users(id),
        change_description TEXT,
        diff_data JSONB,
        is_autosave BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);
    
    // Content usage table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_usage (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        location TEXT NOT NULL,
        path TEXT NOT NULL,
        views INTEGER NOT NULL DEFAULT 0,
        unique_views INTEGER NOT NULL DEFAULT 0,
        click_events INTEGER NOT NULL DEFAULT 0,
        average_dwell_time_seconds INTEGER DEFAULT 0,
        last_viewed TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        device_types JSONB DEFAULT '{}',
        referrers JSONB DEFAULT '{}'
      );
    `);
    
    // Content relationships table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_relationships (
        id SERIAL PRIMARY KEY,
        source_content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        target_content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        relationship_type TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by VARCHAR(255) REFERENCES users(id),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);
    
    // Content workflow history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_workflow_history (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        previous_status content_status NOT NULL,
        new_status content_status NOT NULL,
        changed_by VARCHAR(255) REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        comments TEXT,
        metadata JSONB
      );
    `);
    
    console.log('Related content tables created successfully');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the migration
runMigration().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});