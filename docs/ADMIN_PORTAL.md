# Admin Portal Documentation

## Overview

The Admin Portal provides a centralized interface for authorized administrators to manage website content, monitor user activity, and configure system settings. This document details the structure, features, and usage of the Admin Portal with a focus on content management capabilities.

## Table of Contents

1. [Access and Authentication](#access-and-authentication)
2. [Admin Layout and Navigation](#admin-layout-and-navigation)
3. [Content Management System](#content-management-system)
4. [Content Versioning and History](#content-versioning-and-history)
5. [Content Usage Tracking and Reports](#content-usage-tracking-and-reports)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

## Access and Authentication

The Admin Portal is accessible only to users with admin privileges. The system supports role-based access control with:

- **Admin**: Access to most administrative functions
- **Super Admin**: Full access to all administrative functions including system settings

### Access Points

- **URL**: `/admin` - Main admin dashboard
- **URL**: `/admin/content` - Content Management interface

## Admin Layout and Navigation

The Admin Portal uses a consistent layout (`AdminLayout`) component that provides:

- Navigation sidebar for quick access to different admin modules
- Header with user information and global actions
- Main content area for specific administrative functions
- Responsive design that adapts to different screen sizes

## Content Management System

The Content Management System (CMS) allows administrators to create, edit, and delete dynamic content throughout the website without requiring code changes. This enables non-technical staff to maintain the website content efficiently.

### Content Types

The CMS supports multiple content types:

- **Text**: Simple text content displayed throughout the site
- **HTML**: Rich formatted content with text styling, links, and embedded media
- **Image**: Image content with metadata and styling options

### Content Structure

Each content item contains:

- **Key**: Unique identifier used for retrieval (e.g., `home_hero_title`)
- **Title**: Human-readable name for the content item
- **Content**: The actual content value (text, HTML, or image URL)
- **Type**: Content type (text, HTML, or image)
- **Page**: The website page this content belongs to
- **Section**: The section within the page where this content appears
- **Version**: Current version number of the content
- **Created/Updated dates**: Timestamps for creation and last update

### Content Management Interface

The Content Management Page (`ContentManagementPage.tsx`) provides:

- List view of all content items with filtering and search capabilities
- Content creation form for adding new content
- Content editing interface with WYSIWYG editor for HTML content
- Deletion confirmation with safety prompts
- Version history access
- Usage reporting

## Content Versioning and History

The system maintains a full history of all content changes, enabling administrators to track modifications and restore previous versions if needed.

### History Tracking

For each content update, the system automatically:
- Creates a new history record in the `content_history` table
- Increments the version number
- Records who made the change and when
- Stores the previous content state

### History Interface

The Content History interface (`ContentHistoryView.tsx`) provides:

- Chronological list of all versions of a content item
- Timestamps for each version with formatted date display
- Version numbers with visual badge indicators
- One-click restoration to previous versions with confirmation
- Ability to manually create new versions with custom descriptions

### Creating Manual Versions

Administrators can also manually create a version checkpoint:
- Click the "Create Version" button in the history view
- Add an optional description of the current state or changes
- This creates a snapshot that can be restored later

## Content Usage Tracking and Reports

The system tracks how and where content is used throughout the website, providing insights into content effectiveness and identifying unused or redundant content.

### Usage Tracking

The system automatically records:
- Each time content is viewed
- Where the content is displayed (location and path)
- When the content was last viewed
- Total view count for each content item

### Usage Reports

The Content Usage Report interface (`ContentUsageReport.tsx`) provides:

- Overview of content usage across the site
- Filtering by key, page, section, and type
- Analytics on most viewed content (sorted by view count)
- Display of locations where content is used
- Refresh capability to get up-to-date usage metrics

## API Reference

### Content Management Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/content` | GET | Get all content items | Admin |
| `/api/content/:id` | GET | Get a specific content item | Admin |
| `/api/content` | POST | Create a new content item | Admin |
| `/api/content/:id` | PUT | Update a content item | Admin |
| `/api/content/:id` | DELETE | Delete a content item | Admin |

### Content History Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/content/:id/history` | GET | Get version history for a content item | Admin |
| `/api/content/:id/version` | POST | Create a new version of content | Admin |
| `/api/content/history/:historyId/restore` | POST | Restore content to a previous version | Admin |

### Content Usage Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/content/:id/usage` | POST | Record usage of content | Public |
| `/api/content/:id/view` | POST | Increment view count | Public |
| `/api/content/report/usage` | GET | Get content usage report | Admin |

## Troubleshooting

### Common Issues

1. **Content not appearing on website**: Check that the content key matches exactly what's expected in the template.
2. **History not being recorded**: Ensure database permissions are properly set for the content_history table.
3. **Usage tracking not working**: Verify that the frontend components are correctly calling the usage tracking endpoints.

### Error Logging

All actions in the Content Management System are logged for audit and troubleshooting purposes. Check the server logs for the following prefixes:

- `[CONTENT_API]`: Content endpoint issues
- `[HISTORY_API]`: Version history issues
- `[USAGE_API]`: Usage tracking issues

*Last updated: April 12, 2025*