// One-time script to update passwords for existing users
import crypto from 'crypto';
import { promisify } from 'util';
import pg from 'pg';
const { Pool } = pg;

// Hash password utility
async function hashPassword(password) {
  const scryptAsync = promisify(crypto.scrypt);
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting password update for existing users...');
    
    // Standard password mappings - in production you would use randomly generated secure passwords
    const passwordMap = {
      'admin': 'admin123',
      'superadmin': 'superadmin123',
      'user': 'user123'
    };
    
    // Get existing users
    const { rows: users } = await pool.query('SELECT id, username FROM users');
    console.log(`Found ${users.length} users to update`);
    
    // Update each user's password
    for (const user of users) {
      const defaultPassword = passwordMap[user.username] || 'password123';
      const hashedPassword = await hashPassword(defaultPassword);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      
      console.log(`Updated password for user: ${user.username}`);
    }
    
    console.log('Password update complete!');
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);