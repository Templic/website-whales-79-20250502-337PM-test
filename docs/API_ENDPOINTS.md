# API Endpoints Documentation

This document provides detailed information about the API endpoints available in the application, including their security requirements and usage examples.

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Management Endpoints](#user-management-endpoints)
3. [Secure API Endpoints](#secure-api-endpoints)
4. [Content Management Endpoints](#content-management-endpoints)
5. [Security Administration Endpoints](#security-administration-endpoints)

## API Security Headers

All secure API endpoints require the following headers:

```
Authorization: Bearer <token>
```

Where `<token>` is a valid JWT token obtained through the authentication endpoints.

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/jwt/login`

**Description:** Authenticates a user and returns a JWT token.

**Authentication Required:** No

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid request format

**Rate Limiting:** 30 requests per 15 minutes

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' http://localhost:3000/api/jwt/login
```

### Refresh Token

**Endpoint:** `POST /api/jwt/refresh`

**Description:** Refreshes an existing JWT token.

**Authentication Required:** Yes (via refresh token)

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid refresh token
- `400 Bad Request`: Invalid request format

**Rate Limiting:** 30 requests per 15 minutes

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"refreshToken":"your-refresh-token"}' http://localhost:3000/api/jwt/refresh
```

## User Management Endpoints

### Get Current User

**Endpoint:** `GET /api/user`

**Description:** Returns information about the currently authenticated user.

**Authentication Required:** Yes

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "role": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated

**Rate Limiting:** 100 requests per 15 minutes

**Example:**
```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/api/user
```

### Get All Users

**Endpoint:** `GET /api/users`

**Description:** Returns a list of all users.

**Authentication Required:** Yes (admin role)

**Response:**
```json
[
  {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient privileges

**Rate Limiting:** 50 requests per 15 minutes

**Example:**
```bash
curl -H "Authorization: Bearer your-admin-jwt-token" http://localhost:3000/api/users
```

## Secure API Endpoints

These endpoints demonstrate the secure API implementation with comprehensive security controls.

### Get API Status

**Endpoint:** `GET /api/secure/status`

**Description:** Returns the status of the API.

**Authentication Required:** No

**Response:**
```json
{
  "status": "ok",
  "timestamp": "string",
  "message": "API is operational"
}
```

**Rate Limiting:** 200 requests per 15 minutes

**Example:**
```bash
curl http://localhost:3000/api/secure/status
```

### Get User Profile

**Endpoint:** `GET /api/secure/profile`

**Description:** Returns the profile of the authenticated user.

**Authentication Required:** Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Error retrieving user profile

**Rate Limiting:** 100 requests per 15 minutes

**Example:**
```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/api/secure/profile
```

### Get All Users (Secure)

**Endpoint:** `GET /api/secure/users`

**Description:** Returns a list of all users.

**Authentication Required:** Yes (admin role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient privileges
- `500 Internal Server Error`: Error retrieving users

**Rate Limiting:** 50 requests per 15 minutes

**Example:**
```bash
curl -H "Authorization: Bearer your-admin-jwt-token" http://localhost:3000/api/secure/users
```

### Create User

**Endpoint:** `POST /api/secure/users`

**Description:** Creates a new user.

**Authentication Required:** Yes (admin role)

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient privileges
- `400 Bad Request`: Invalid request format or validation error
- `409 Conflict`: Username already exists
- `500 Internal Server Error`: Error creating user

**Rate Limiting:** 50 requests per 15 minutes

**Input Validation:**
- `username`: String, 3-50 characters
- `email`: Valid email address
- `password`: String, 8-100 characters
- `role`: One of: "user", "admin", "super_admin" (defaults to "user")

**Example:**
```bash
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer your-admin-jwt-token" -d '{"username":"newuser","email":"newuser@example.com","password":"password123","role":"user"}' http://localhost:3000/api/secure/users
```

### Update User

**Endpoint:** `PATCH /api/secure/users/:userId`

**Description:** Updates an existing user.

**Authentication Required:** Yes (admin role)

**Path Parameters:**
- `userId`: The ID of the user to update

**Request Body:**
```json
{
  "username": "string", // optional
  "email": "string", // optional
  "role": "string" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient privileges
- `400 Bad Request`: Invalid request format or validation error
- `404 Not Found`: User not found
- `500 Internal Server Error`: Error updating user

**Rate Limiting:** 50 requests per 15 minutes

**Input Validation:**
- `username`: String, 3-50 characters (optional)
- `email`: Valid email address (optional)
- `role`: One of: "user", "admin", "super_admin" (optional)

**Example:**
```bash
curl -X PATCH -H "Content-Type: application/json" -H "Authorization: Bearer your-admin-jwt-token" -d '{"email":"updated@example.com"}' http://localhost:3000/api/secure/users/1
```

### Delete User

**Endpoint:** `DELETE /api/secure/users/:userId`

**Description:** Deletes a user.

**Authentication Required:** Yes (super_admin role)

**Path Parameters:**
- `userId`: The ID of the user to delete

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient privileges
- `404 Not Found`: User not found
- `500 Internal Server Error`: Error deleting user

**Rate Limiting:** 50 requests per 15 minutes

**Example:**
```bash
curl -X DELETE -H "Authorization: Bearer your-super-admin-jwt-token" http://localhost:3000/api/secure/users/1
```

## Security Administration Endpoints

### Verify API Security

**Endpoint:** `GET /api/security/verify-api`

**Description:** Verifies that API security measures are properly implemented.

**Authentication Required:** Yes (admin role)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "string",
      "details": "string",
      "recommendation": "string",
      "severity": "string",
      "timestamp": "string"
    }
  ],
  "timestamp": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient privileges
- `500 Internal Server Error`: Error running security verification

**Rate Limiting:** 10 requests per 15 minutes

**Example:**
```bash
curl -H "Authorization: Bearer your-admin-jwt-token" http://localhost:3000/api/security/verify-api
```

## Rate Limiting

The API implements tiered rate limiting based on the type of endpoint:

- **Public Endpoints**: 200 requests per 15 minutes
- **Authenticated Endpoints**: 100 requests per 15 minutes
- **Admin Endpoints**: 50 requests per 15 minutes
- **Authentication Endpoints**: 30 requests per 15 minutes
- **Security Endpoints**: 10 requests per 15 minutes

When rate limits are exceeded, the API returns a `429 Too Many Requests` response with a message indicating when the rate limit will reset.

## Security Best Practices

When using these API endpoints, follow these best practices:

1. **Store Tokens Securely**: Store JWT tokens in secure, HttpOnly cookies or in a secure client-side storage mechanism.

2. **Use HTTPS**: Always use HTTPS to ensure secure communication between the client and server.

3. **Validate Input**: Validate all input on both the client and server side.

4. **Handle Errors Properly**: Implement proper error handling to avoid exposing sensitive information.

5. **Implement Proper Logging**: Log all API requests and responses for security monitoring.

6. **Use Strong Passwords**: Ensure that all users use strong, unique passwords.

7. **Implement MFA**: Consider implementing multi-factor authentication for sensitive operations.

8. **Regularly Review Access**: Regularly review and audit API access and permissions.

For more information, refer to the [API Security Guidelines](API_SECURITY_GUIDELINES.md) and [API Security Implementation](API_SECURITY_IMPLEMENTATION.md) documents.