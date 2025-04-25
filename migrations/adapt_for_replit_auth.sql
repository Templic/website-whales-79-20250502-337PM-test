-- Create a map_id column to store Replit user IDs
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS replit_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);

-- Create a function to handle user updates from Replit Auth
CREATE OR REPLACE FUNCTION update_user_from_replit()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user columns from Replit data
    UPDATE users
    SET 
        username = NEW.username,
        email = NEW.email,
        first_name = NEW.first_name,
        last_name = NEW.last_name,
        bio = NEW.bio,
        profile_image_url = NEW.profile_image_url,
        updated_at = NOW()
    WHERE replit_id = NEW.replit_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Return current users table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';