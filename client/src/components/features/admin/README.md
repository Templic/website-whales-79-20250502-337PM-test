# Admin Components

This directory contains administrative components for managing the application, including user management, content control, analytics, and security settings.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `AdminDashboard` | Main dashboard with overview metrics | Active |
| `UserManagement` | User account administration | Active |
| `ContentManager` | Blog and content management | Active |
| `AnalyticsDisplay` | Data visualization for site metrics | Active |
| `SecuritySettings` | Security configuration interface | Active |
| `ProductManager` | Manage shop products and inventory | Active |
| `OrderManagement` | View and process customer orders | Active |
| `AuditLogs` | Review system activity logs | Active |
| `BackupControls` | Manage system backups | Active |
| `SystemSettings` | General system configuration | Active |

## Usage

### Admin Dashboard Implementation

```tsx
import { AdminDashboard, AnalyticsDisplay } from '@/components/features/admin';

export default function AdminPortalPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
      
      <AdminDashboard 
        userName="Admin User"
        lastLogin="2025-04-09 09:30 AM"
      />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
        <AnalyticsDisplay 
          timeRange="last-7-days"
          showVisitors={true}
          showConversions={true}
          showRevenue={true}
        />
      </div>
    </div>
  );
}
```

### User Management

```tsx
import { UserManagement } from '@/components/features/admin';
import { useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active' },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', role: 'user', status: 'inactive' },
  ]);
  
  const handleStatusChange = (userId, newStatus) => {
    setUsers(prev => 
      prev.map(user => user.id === userId ? {...user, status: newStatus} : user)
    );
  };
  
  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => 
      prev.map(user => user.id === userId ? {...user, role: newRole} : user)
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      
      <UserManagement 
        users={users}
        onStatusChange={handleStatusChange}
        onRoleChange={handleRoleChange}
        onDeleteUser={(userId) => handleDeleteUser(userId)}
      />
    </div>
  );
}
```

## Component Relationships

```
AdminPortal
├── AdminDashboard
│   └── QuickStats
├── MainNavigation
│   └── NavItems
└── AdminContent
    ├── UserManagement
    ├── ContentManager
    ├── AnalyticsDisplay
    ├── SecuritySettings
    ├── ProductManager
    ├── OrderManagement
    └── SystemSettings
```

## Props Documentation

### AnalyticsDisplay Props

```tsx
interface AnalyticsDisplayProps {
  /**
   * Time range for displaying analytics data
   * @default "last-30-days"
   */
  timeRange?: 'today' | 'last-7-days' | 'last-30-days' | 'last-90-days' | 'year-to-date' | 'custom';
  
  /**
   * Custom date range start (only used when timeRange is 'custom')
   */
  customRangeStart?: Date;
  
  /**
   * Custom date range end (only used when timeRange is 'custom')
   */
  customRangeEnd?: Date;
  
  /**
   * Whether to show visitor statistics
   * @default true
   */
  showVisitors?: boolean;
  
  /**
   * Whether to show conversion statistics
   * @default true
   */
  showConversions?: boolean;
  
  /**
   * Whether to show revenue statistics
   * @default true
   */
  showRevenue?: boolean;
  
  /**
   * Refresh interval in seconds (0 for no auto-refresh)
   * @default 0
   */
  refreshInterval?: number;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}
```

## Security Considerations

All admin components implement role-based access control and audit logging. Any sensitive operations require appropriate permissions and are logged for security purposes. See the [Security Documentation](docs/SECURITY.md) for more details on the permission model.

## Feature Roadmap

### Upcoming Features

- [ ] Advanced role management with custom permissions
- [ ] Multi-factor authentication management
- [ ] Enhanced analytics with export capabilities
- [ ] Scheduled content publishing
- [ ] Bulk operations for user and content management

## Maintainers

- Admin Team (@adminTeam)

## Last Updated

April 9, 2025
