-- Create sessions table for Replit Auth if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Create index for sessions expiration
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Modify users table to accommodate Replit Auth fields if needed
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);

-- Update users table to change id to VARCHAR if it's currently integer
DO $$
BEGIN
  -- Check if id column exists and is integer type
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND data_type = 'integer'
  ) THEN
    -- Copy data to a temporary table
    CREATE TEMP TABLE users_temp AS SELECT * FROM users;
    
    -- Drop the original table
    DROP TABLE users;
    
    -- Recreate the table with VARCHAR id
    CREATE TABLE users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      bio TEXT,
      profile_image_url VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      is_banned BOOLEAN DEFAULT FALSE,
      two_factor_enabled BOOLEAN DEFAULT FALSE,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert data from the temporary table, converting id to string
    INSERT INTO users (
      id, username, email, role, is_banned, two_factor_enabled, 
      last_login, created_at, updated_at
    )
    SELECT 
      id::VARCHAR, username, email, role, is_banned, two_factor_enabled,
      last_login, created_at, updated_at
    FROM users_temp;
    
    -- Drop the temporary table
    DROP TABLE users_temp;
  END IF;
END $$;