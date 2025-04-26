/**
 * SQL Injection Vulnerability Migration Guide
 * 
 * This file demonstrates how to migrate existing code with SQL injection
 * vulnerabilities to secure code using our SQL injection prevention system.
 */

import { Pool } from 'pg';
import { secureDatabase } from '../security/preventSqlInjection';

// Create a database connection (example)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Secure the database connection
const db = secureDatabase(pool);

/**
 * Example 1: Simple query with string concatenation
 */

// VULNERABLE: Direct string concatenation
async function getUser_Vulnerable(userId: string) {
  // VULNERABLE: Using string concatenation - SQL injection possible with userId
  const query = 'SELECT * FROM users WHERE id = ' + userId;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function getUser_Secure(userId: string) {
  // SECURE: Using parameterized query
  return await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  
  // ALTERNATIVE: Using the select helper method
  // return await db.select('users', ['*'], { id: userId });
}

/**
 * Example 2: LIKE query with string interpolation
 */

// VULNERABLE: Template literals in query
async function searchUsers_Vulnerable(searchTerm: string) {
  // VULNERABLE: Using template literals - SQL injection possible with searchTerm
  const query = `SELECT * FROM users WHERE username LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%'`;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function searchUsers_Secure(searchTerm: string) {
  // SECURE: Using parameterized query with proper LIKE patterns
  return await db.query(
    'SELECT * FROM users WHERE username LIKE $1 OR email LIKE $1',
    [`%${searchTerm}%`]
  );
}

/**
 * Example 3: INSERT query with multiple values
 */

// VULNERABLE: Building query with string interpolation
async function createUser_Vulnerable(username: string, email: string, age: number) {
  // VULNERABLE: Using template literals - SQL injection possible
  const query = `
    INSERT INTO users (username, email, age, created_at)
    VALUES ('${username}', '${email}', ${age}, NOW())
    RETURNING *
  `;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function createUser_Secure(username: string, email: string, age: number) {
  // SECURE: Using the insert helper method
  return await db.insert('users', {
    username,
    email,
    age,
    created_at: new Date()
  });
  
  // ALTERNATIVE: Using parameterized query
  // return await db.query(
  //   'INSERT INTO users (username, email, age, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
  //   [username, email, age, new Date()]
  // );
}

/**
 * Example 4: UPDATE query with WHERE clause
 */

// VULNERABLE: Building query with string interpolation
async function updateUser_Vulnerable(userId: string, email: string, active: boolean) {
  // VULNERABLE: Using template literals - SQL injection possible
  const query = `
    UPDATE users
    SET email = '${email}', active = ${active}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING *
  `;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function updateUser_Secure(userId: string, email: string, active: boolean) {
  // SECURE: Using the update helper method
  return await db.update(
    'users',
    { email, active, updated_at: new Date() },
    { id: userId }
  );
  
  // ALTERNATIVE: Using parameterized query
  // return await db.query(
  //   'UPDATE users SET email = $1, active = $2, updated_at = $3 WHERE id = $4 RETURNING *',
  //   [email, active, new Date(), userId]
  // );
}

/**
 * Example 5: DELETE query with WHERE clause
 */

// VULNERABLE: Building query with string interpolation
async function deleteUser_Vulnerable(userId: string) {
  // VULNERABLE: Using template literals - SQL injection possible
  const query = `DELETE FROM users WHERE id = ${userId} RETURNING *`;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function deleteUser_Secure(userId: string) {
  // SECURE: Using the delete helper method
  return await db.delete('users', { id: userId });
  
  // ALTERNATIVE: Using parameterized query
  // return await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
}

/**
 * Example 6: Complex query with JOIN and ORDER BY
 */

// VULNERABLE: Building complex query with string interpolation
async function getUserOrders_Vulnerable(userId: string, sortBy: string, limit: number) {
  // VULNERABLE: Using template literals - SQL injection possible
  const query = `
    SELECT u.username, o.id as order_id, o.created_at, o.total_amount
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE u.id = ${userId}
    ORDER BY ${sortBy}
    LIMIT ${limit}
  `;
  return await pool.query(query);
}

// SECURE: Using parameterized query
async function getUserOrders_Secure(userId: string, sortBy: string, limit: number) {
  // Sanitize the sort column (can't be parameterized)
  const allowedSortColumns = ['o.created_at', 'o.total_amount'];
  const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'o.created_at';
  
  // SECURE: Using parameterized query
  return await db.query(`
    SELECT u.username, o.id as order_id, o.created_at, o.total_amount
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE u.id = $1
    ORDER BY ${sortColumn}
    LIMIT $2
  `, [userId, limit]);
}

/**
 * Example 7: Dynamic column selection (advanced)
 */

// VULNERABLE: Building dynamic column selection query
async function getUsers_Vulnerable(columns: string[]) {
  // VULNERABLE: Using array join - SQL injection possible if columns are not validated
  const columnList = columns.join(', ');
  const query = `SELECT ${columnList} FROM users`;
  return await pool.query(query);
}

// SECURE: Using column validation
async function getUsers_Secure(columns: string[]) {
  // Define allowed columns
  const allowedColumns = ['id', 'username', 'email', 'created_at', 'active'];
  
  // Filter columns to only include allowed ones
  const validColumns = columns.filter(col => allowedColumns.includes(col));
  
  // If no valid columns, default to id and username
  if (validColumns.length === 0) {
    validColumns.push('id', 'username');
  }
  
  // SECURE: Using the select helper method with validated columns
  return await db.select('users', validColumns);
}

/**
 * Example 8: Dynamic WHERE conditions (advanced)
 */

// VULNERABLE: Building dynamic WHERE conditions
async function searchUsers_Vulnerable(conditions: Record<string, unknown>) {
  // VULNERABLE: Building WHERE clauses with string interpolation
  const whereClauses = Object.entries(conditions)
    .map(([key, value]) => `${key} = '${value}'`)
    .join(' AND ');
  
  const query = `SELECT * FROM users ${whereClauses ? `WHERE ${whereClauses}` : ''}`;
  return await pool.query(query);
}

// SECURE: Using the select helper method
async function searchUsers_Secure(conditions: Record<string, unknown>) {
  // SECURE: Using the select helper method with conditions object
  return await db.select('users', ['*'], conditions);
}

/**
 * Example 9: IN clause (advanced)
 */

// VULNERABLE: Building IN clause with string interpolation
async function getUsersByIds_Vulnerable(userIds: string[]) {
  // VULNERABLE: Using array join - SQL injection possible
  const idList = userIds.join(', ');
  const query = `SELECT * FROM users WHERE id IN (${idList})`;
  return await pool.query(query);
}

// SECURE: Using parameterized query with IN clause
async function getUsersByIds_Secure(userIds: string[]) {
  // SECURE: Using the select helper method with IN clause
  return await db.select('users', ['*'], { id: userIds });
  
  // ALTERNATIVE: Using parameterized query with dynamic placeholders
  // const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
  // return await db.query(
  //   `SELECT * FROM users WHERE id IN (${placeholders})`,
  //   userIds
  // );
}

/**
 * Example 10: Transaction with multiple operations
 */

// VULNERABLE: Multiple operations without transaction
async function createOrderAndItems_Vulnerable(userId: string, items: any[]) {
  // VULNERABLE: Multiple operations that should be in a transaction
  const orderQuery = `
    INSERT INTO orders (user_id, created_at)
    VALUES (${userId}, NOW())
    RETURNING *
  `;
  const orderResult = await pool.query(orderQuery);
  const orderId = orderResult.rows[0].id;
  
  for (const item of items) {
    const itemQuery = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (${orderId}, ${item.productId}, ${item.quantity}, ${item.price})
    `;
    await pool.query(itemQuery);
  }
  
  return orderResult.rows[0];
}

// SECURE: Using transaction
async function createOrderAndItems_Secure(userId: string, items: any[]) {
  // SECURE: Using transaction for atomic operations
  return await db.transaction(async (txDb) => {
    // Create the order
    const order = await txDb.insert('orders', {
      user_id: userId,
      created_at: new Date()
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
}

export {
  getUser_Vulnerable,
  getUser_Secure,
  searchUsers_Vulnerable,
  searchUsers_Secure,
  createUser_Vulnerable,
  createUser_Secure,
  updateUser_Vulnerable,
  updateUser_Secure,
  deleteUser_Vulnerable,
  deleteUser_Secure,
  getUserOrders_Vulnerable,
  getUserOrders_Secure,
  getUsers_Vulnerable,
  getUsers_Secure,
  searchUsers_Vulnerable,
  searchUsers_Secure,
  getUsersByIds_Vulnerable,
  getUsersByIds_Secure,
  createOrderAndItems_Vulnerable,
  createOrderAndItems_Secure
};