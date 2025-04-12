# Content Management Implementation Guide

> **Technical guide for developers working with the Content Management System, Content Versioning, and Usage Tracking.**

## Architecture Overview

The Content Management System (CMS) follows a layered architecture with clear separation of concerns:

1. **Database Layer**: Schema definitions and entities in `shared/schema.ts`
2. **Storage Layer**: CRUD operations in `server/storage.ts`
3. **API Layer**: REST endpoints in `server/routes/content.ts`
4. **UI Layer**: React components in `client/src/components/admin/` and `client/src/pages/admin/`
5. **Integration Layer**: Content consumption with `client/src/components/content/DynamicContent.tsx`

## Database Schema

The CMS uses three main tables:

### 1. Content Items Table
```typescript
export const contentItems = pgTable('content_items', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type', { enum: ['text', 'html', 'image'] }).notNull(),
  page: text('page').notNull(),
  section: text('section').notNull(),
  imageUrl: text('image_url'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
});
```

### 2. Content History Table
```typescript
export const contentHistory = pgTable('content_history', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type', { enum: ['text', 'html', 'image'] }).notNull(),
  page: text('page').notNull(),
  section: text('section').notNull(),
  imageUrl: text('image_url'),
  modifiedAt: timestamp('modified_at').notNull().defaultNow(),
  modifiedBy: integer('modified_by').references(() => users.id),
  changeDescription: text('change_description'),
});
```

### 3. Content Usage Table
```typescript
export const contentUsage = pgTable('content_usage', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contentItems.id, { onDelete: 'cascade' }),
  location: text('location').notNull(),
  path: text('path').notNull(),
  views: integer('views').notNull().default(0),
  lastViewed: timestamp('last_viewed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
});
```

## Storage Layer Implementation

The `PostgresStorage` class in `server/storage.ts` provides all necessary methods for content operations:

### Content CRUD Methods
- `getAllContentItems()`: Retrieves all content items
- `getContentItemById(id)`: Gets a specific content item
- `getContentItemByKey(key)`: Gets content by its unique key
- `createContentItem(contentData)`: Creates a new content item
- `updateContentItem(contentData)`: Updates an existing content item
- `deleteContentItem(id)`: Deletes a content item

### Content Versioning Methods
- `getContentHistory(contentId)`: Retrieves version history for a content item
- `createContentVersion(contentId, version, userId, changeDescription)`: Creates a manual version
- `restoreContentVersion(historyId)`: Restores content to a previous version

### Content Usage Methods
- `recordContentUsage(contentId, location, path)`: Records content usage
- `incrementContentViews(contentId)`: Increments view count
- `getContentUsageReport(contentId?)`: Generates usage reports

## API Endpoints

The content API routes in `server/routes/content.ts` provide RESTful endpoints:

### Content Management Endpoints
- **GET** `/api/content`: List all content items
- **GET** `/api/content/:id`: Get specific content
- **GET** `/api/content/key/:key`: Get content by key
- **GET** `/api/content/page/:page`: Get all content for a page
- **POST** `/api/content`: Create new content
- **PUT** `/api/content/:id`: Update content
- **DELETE** `/api/content/:id`: Delete content

### Content History Endpoints
- **GET** `/api/content/:id/history`: Get content version history
- **POST** `/api/content/:id/version`: Create a new version
- **POST** `/api/content/history/:historyId/restore`: Restore a previous version

### Content Usage Endpoints
- **POST** `/api/content/:id/usage`: Record content usage
- **POST** `/api/content/:id/view`: Increment view count
- **GET** `/api/content/report/usage`: Get usage reports

## UI Components

### Admin Editor Component
The `AdminEditor` component (`client/src/components/admin/AdminEditor.tsx`) provides:
- Form for creating/editing content
- TinyMCE integration for rich text editing
- Image uploading and management
- Validation for all content types

### Content History View Component
The `ContentHistoryView` component (`client/src/components/admin/ContentHistoryView.tsx`) provides:
- Tabular view of version history
- Restore functionality
- Version comparison
- Manual version creation

### Content Usage Report Component
The `ContentUsageReport` component (`client/src/components/admin/ContentUsageReport.tsx`) provides:
- Analytics dashboard for content usage
- Filtering and sorting options
- Chart visualizations
- Export functionality

## Content Integration

The `DynamicContent` component (`client/src/components/content/DynamicContent.tsx`) serves as the bridge between the CMS and the website:

```tsx
// Example usage in a page component:
<DynamicContent 
  contentKey="home_hero_title"
  defaultContent="Welcome to our website"
  page="home"
  section="hero"
/>
```

This component:
1. Fetches content by key or uses default if not found
2. Renders based on content type
3. Records usage and increments view count
4. Provides edit links for admins

## Extending the CMS

### Adding a New Content Type

1. Update the type enum in `shared/schema.ts`:
```typescript
type: text('type', { enum: ['text', 'html', 'image', 'new_type'] }).notNull(),
```

2. Modify the `AdminEditor` component to handle the new type
3. Extend the `DynamicContent` component to render the new type
4. Update validation in storage methods and API routes

### Implementing New Analytics

1. Add new aggregation methods in `server/storage.ts`
2. Create a new endpoint in `server/routes/content.ts`
3. Develop a new reporting component in `client/src/components/admin/`
4. Add UI elements to the admin dashboard to access the new report

## Testing

Content management has comprehensive test coverage:

- Unit tests for storage methods
- API endpoint tests
- React component tests
- End-to-end integration tests

When extending functionality, ensure you maintain test coverage by:

1. Writing unit tests for new storage methods
2. Testing API endpoints with different user roles
3. Testing UI components with mocked data
4. Adding integration tests for the full feature flow

## Performance Considerations

The CMS includes optimization strategies:

- Query caching for frequently accessed content
- Pagination for large content lists
- Lazy loading of content history
- Optimized database indices on frequently queried columns
- Compression of large content fields

## Security Considerations

1. All endpoints enforce proper authorization checks
2. Content validation prevents XSS attacks
3. Rate limiting on public content endpoints
4. Audit logging for all admin actions
5. Sanitization of HTML content to prevent script injection

*Last updated: April 12, 2025*