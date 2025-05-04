# Application Architecture

This document provides an overview of the application architecture, including the frontend, backend, and database components. The architecture has been updated to remove the Flask dependency, with all routes now handled by the React frontend and Express backend.

## Architecture Overview

The application follows a modern web application architecture with the following components:

1. **React Frontend**: UI components and client-side logic
2. **Express Backend**: API endpoints, server-side logic, and advanced database maintenance
3. **PostgreSQL Database**: Data storage using Neon serverless database
4. **Shared Types**: TypeScript types shared between frontend and backend
5. **Background Services**: Database optimization, maintenance, and security scanning

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│ Express Backend │────▶│    PostgreSQL   │
│                 │◀────│                 │◀────│     Database    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │    Express &    │     │     Drizzle     │
│    TanStack     │     │  Background     │     │       ORM       │
│   React Query   │     │    Services     │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Server Initialization Process

The server has a multi-stage initialization process:

1. **Database Connection**: Establishes connection to PostgreSQL
2. **Background Services**: Initializes maintenance tasks for database health
3. **Security Scans**: Sets up periodic security vulnerability scanning
4. **WebSocket/Socket.IO**: Initializes real-time communication
5. **Vite Development Server**: Configures the frontend development server

This comprehensive initialization contributes to the server's startup time but ensures database health, security monitoring, and optimal performance.

## Frontend Architecture

The frontend is built with React and follows a component-based architecture:

### Key Technologies
- **React**: UI library
- **TypeScript**: Type safety
- **wouter**: Routing
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Styling
- **Shadcn/ui**: Component library

### Directory Structure
- **components/**: UI components organized by feature
- **pages/**: Page components that map to routes
- **hooks/**: Custom React hooks
- **lib/**: Utility functions and helper code
- **store/**: State management
- **types/**: TypeScript type definitions

### Component Hierarchy

```
App
├── AuthProvider
├── AccessibilityProvider
├── StarBackground
├── Layout
│   ├── Header
│   ├── MainNav
│   ├── Footer
│   └── Page content (routes)
└── Toaster
```

### Data Flow

1. **UI Events**: User interacts with the UI
2. **State Updates**: Local or global state is updated
3. **API Requests**: TanStack Query manages API requests
4. **Component Updates**: UI updates based on new data
5. **Side Effects**: Additional actions triggered by state changes

## Backend Architecture

The backend is built with Express and follows a RESTful API architecture with additional background services for database maintenance and security:

### Key Technologies
- **Express**: Web framework
- **TypeScript**: Type safety
- **Drizzle ORM**: Database access
- **Zod**: Schema validation
- **Express Session**: Authentication
- **Passport**: User authentication
- **PgBoss**: Background job processing
- **WebSockets**: Real-time communication

### Directory Structure
- **server/index.ts**: Main server initialization and setup
- **server/routes.ts**: API route definitions
- **server/storage.ts**: Data storage interface
- **server/db.ts**: Database connection and core functionality
- **server/db-optimize.ts**: Database optimization tasks
- **server/db-background.ts**: Background database maintenance services
- **server/securityScan.ts**: Security vulnerability scanning
- **server/middlewares/**: Express middlewares
- **server/controllers/**: Request handlers
- **server/services/**: Business logic
- **server/utils/**: Utility functions

### Background Services

The backend includes several background services for database maintenance:

1. **Database Optimization (db-optimize.ts)**:
   - Query performance monitoring
   - VACUUM ANALYZE scheduling
   - Database reindexing
   - Slow query analysis

2. **Background Jobs (db-background.ts)**:
   - Session cleanup
   - Database metrics collection
   - Automated table maintenance
   - Dead tuple management

3. **Security Scanning (securityScan.ts)**:
   - Vulnerability detection
   - Dependency checking
   - Security headers validation
   - Input validation assessment

### API Structure

```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── POST /register
├── /users
│   ├── GET /
│   ├── GET /:id
│   └── PATCH /:id
├── /music
│   ├── GET /
│   ├── GET /:id
│   └── POST /
├── /blog
│   ├── GET /
│   ├── GET /:id
│   └── POST /
└── /shop
    ├── GET /products
    ├── GET /products/:id
    └── POST /orders
```

## Database Architecture

The database is PostgreSQL with Drizzle ORM for schema definition and queries:

### Key Technologies
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Object-Relational Mapping
- **Drizzle Zod**: Schema validation
- **Neon**: Serverless PostgreSQL provider

### Schema Organization

```
shared/schema.ts
├── User table
├── Product table
├── Order table
├── Blog table
├── Music table
└── ... other tables
```

### Data Access Patterns

1. **Drizzle Schemas**: Define database tables and relationships
2. **Storage Interface**: Abstracts database operations
3. **API Routes**: Use storage interface to perform CRUD operations
4. **Validation**: Zod schemas validate input data

## Authentication and Authorization

The application uses a session-based authentication system:

1. **Login**: User credentials are validated and a session is created
2. **Session Management**: Express Session maintains user sessions
3. **Protected Routes**: React route guards protect authenticated routes
4. **Authorization**: Role-based access control for admin features

## Cross-Cutting Concerns

### Error Handling
- **Frontend**: Error boundaries catch and display errors
- **Backend**: Global error handler middleware
- **API**: Consistent error response format

### Logging
- **Frontend**: Google Analytics tracking
- **Backend**: Request logging middleware
- **Error Tracking**: Error reporting and monitoring

### Performance
- **Code Splitting**: Lazy loading of components
- **Caching**: TanStack Query caching of API responses
- **Server-Side Optimization**: Database query optimization

## Development Workflow

The development workflow integrates all these components:

1. **Schema Definition**: Define shared types in `shared/schema.ts`
2. **Backend Development**: Implement API routes in `server/routes.ts`
3. **Frontend Development**: Create UI components and pages
4. **Integration**: Connect frontend to backend via TanStack Query
5. **Testing**: Test functionality in development environment
6. **Deployment**: Deploy to production

## Conclusion

This architecture provides a scalable foundation for the application, with clear separation of concerns and a maintainable codebase. The modular structure allows for easy extension and modification as requirements evolve.
