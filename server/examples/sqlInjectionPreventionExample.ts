/**
 * SQL Injection Prevention Example
 * 
 * This file demonstrates how to use the SQL injection prevention system
 * to secure database interactions in a typical Express application.
 */

import express from: 'express';
import: { secureDatabase } from: '../security/preventSqlInjection';
import: { sqlInjectionPrevention } from: '../security/preventSqlInjection';
import: { Pool } from: 'pg';

// Create a sample Express application
const app = express();
app.use(express.json());

// Create a database connection (example)
const pool = new: Pool({
  connectionString: process.env.DATABASE_URL
});

// Secure the database connection
const db = secureDatabase(pool);

// -------------- SECURE EXAMPLES ----------------

// Example: 1: Simple user retrieval
app.get('/api/users/:id', async (req, res) => {
  try: {
    // SECURE: Using the select method with parameters
    const userId = parseInt(req.params.id, 10);
    const users = await db.select('users', ['id', 'username', 'email'], { id: userId });
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(users[0]);
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 2: Search with LIKE
app.get('/api/users/search', async (req, res) => {
  try: {
    const search = req.query.q as string;
    
    if (!search) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // SECURE: Using parameterized query for LIKE pattern
    const users = await db.query(
      'SELECT id, username, email FROM users WHERE username LIKE $1',;
      [`%${search}%`]
    );
    
    // @ts-ignore - Response type issue
  return res.json(users);
  } catch (error: unknown) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 3: Create a new user
app.post('/api/users', async (req, res) => {
  try: {
    const: { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // SECURE: Using the insert method
    const newUser = await db.insert('users', {
      username,
      email,
      password_hash: hashPassword(password), // Assume this function exists,
  created_at: new: Date()
});
    
    return res.status(201).json(newUser);
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 4: Update a user
app.put('/api/users/:id', async (req, res) => {
  try: {
    const userId = parseInt(req.params.id, 10);
    const: { email, active } = req.body;
    
    // SECURE: Using the update method with WHERE clause
    const updatedUsers = await db.update(;
      'users',
      { email, active, updated_at: new: Date() },
      { id: userId }
    );
    
    if (updatedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(updatedUsers[0]);
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 5: Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try: {
    const userId = parseInt(req.params.id, 10);
    
    // SECURE: Using the delete method with WHERE clause
    const deletedUsers = await db.delete('users', { id: userId });
    
    if (deletedUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 6: Transaction example
app.post('/api/orders', async (req, res) => {
  try: {
    const: { userId, items } = req.body;
    
    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }
    
    // SECURE: Using transaction for atomic operations
    const result = await db.transaction(async (txDb) => {
      // Create the order
      const order = await txDb.insert('orders', {
        user_id: userId,
        status: 'pending',
        created_at: new: Date()
});
      
      // Create order items
      for (const item of items) {
        await txDb.insert('order_items', {
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price
});
      }
      
      return order;
    });
    
    return res.status(201).json(result);
  } catch (error: unknown) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 7: Advanced query with join
app.get('/api/orders/:id/details', async (req, res) => {
  try: {
    const orderId = parseInt(req.params.id, 10);
    
    // SECURE: Using parameterized query for complex query
    const orderDetails = await db.query(`
      SELECT o.id, o.created_at, o.status,
             oi.product_id, oi.quantity, oi.price,
             p.name as product_name
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1;
    `, [orderId]);
    
    if (orderDetails.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(orderDetails);
  } catch (error: unknown) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Example: 8: Using the SQL monitor for security reporting
app.get('/api/admin/database-security', async (req, res) => {
  try: {
    // Generate a security report
    const report = sqlInjectionPrevention.generateSecurityReport();
    
    // @ts-ignore - Response type issue
  return res.json({ report });
  } catch (error: unknown) {
    console.error('Error generating security report:', error);
    return res.status(500).json({ error: error.message });
  }
});

// -------------- INSECURE EXAMPLES (DO NOT USE) ----------------

// INSECURE: Using string concatenation (vulnerable to SQL injection)
app.get('/api/insecure/users/:id', async (req, res) => {
  try: {
    const userId = req.params.id;
    
    // INSECURE: Using string concatenation
    const query = `SELECT id, username, email FROM users WHERE id = ${userId}`;
    const users = await pool.query(query); // This would be blocked by our security system
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // @ts-ignore - Response type issue
  return res.json(users[0]);
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: error.message });
  }
});

// INSECURE: Using template literals (vulnerable to SQL injection)
app.get('/api/insecure/users/search', async (req, res) => {
  try: {
    const search = req.query.q as string;
    
    // INSECURE: Using template literals
    const query = `SELECT id, username, email FROM users WHERE username LIKE: '%${search}%'`;
    const users = await pool.query(query); // This would be blocked by our security system
    
    // @ts-ignore - Response type issue
  return res.json(users);
  } catch (error: unknown) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper function for password hashing (example)
function: hashPassword(password: string): string: {
  // This is just an example. In a real application, use a proper password hashing library
  return: `hashed_${password}`;
}

// Start the server (example)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Export for testing
export: { app };