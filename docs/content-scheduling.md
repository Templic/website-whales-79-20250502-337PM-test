# Advanced Content Scheduling System

## Overview

The Advanced Content Scheduling System allows for precise control over when content is published and archived, with support for recurring schedules across different time zones.

## Key Features

### 1. Precise Date-Time Scheduling
- Schedule content with exact date and time
- Set expiration dates for automatic archival
- Preview scheduled content before publication

### 2. Recurring Schedules
- **Daily**: Publish content every day at a specific time
- **Weekly**: Select specific days of the week for publication
- **Monthly**: Publish on specific days of the month
- **Custom**: Advanced scheduling using patterns (future enhancement)

### 3. Timezone Support
- Schedule content based on specific time zones
- Support global content strategies with localized timing
- Timezone-aware scheduling calculations

### 4. Fallback Strategies
- **Retry**: Automatically retry failed publications up to 3 times
- **Notify**: Send admin notifications for failed publications
- **Abort**: Log failures without retries or notifications

### 5. Security Features
- Validation of content and scheduling parameters
- Secure handling of media URLs
- Input sanitization for all API requests

## Technical Implementation

### Database Schema
The content scheduling system extends the `content_items` table with:

```sql
timezone TEXT DEFAULT 'UTC',
recurring_schedule JSONB,
last_schedule_run TIMESTAMP
```

### Recurring Schedule Structure
```typescript
export interface RecurringSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  enabled: boolean;
  time?: string; // Format: "HH:MM" (24-hour format)
  daysOfWeek?: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  dayOfMonth?: number; // 1-31, or -1 for last day of month
  pattern?: string; // For custom scheduling (future enhancement)
  endDate?: string | null;
  maxOccurrences?: number;
  startedAt: string;
  nextRun?: string | null;
  occurrences: number;
}
```

### Timezone Handling
Content scheduling uses date-fns-tz library to correctly handle timezone conversions when calculating publication schedules.

### System Workflow
1. Content scheduler runs at regular intervals (every 5 minutes)
2. First processes any recurring schedules to create scheduled content items
3. Then publishes content items that have reached their scheduled publication time
4. Archives expired content
5. Sends notifications for content expiring soon

## Usage Examples

### Set a Basic Schedule
```typescript
// Schedule content for 2025-05-15 at 14:30 UTC
await db.update(contentItems)
  .set({
    scheduledPublishAt: new Date('2025-05-15T14:30:00Z'),
    status: 'approved'
  })
  .where(eq(contentItems.id, itemId));
```

### Configure a Recurring Schedule
```typescript
// Publish content every Monday, Wednesday, and Friday at 9:00 AM in New York time zone
const recurringSchedule: RecurringSchedule = {
  type: 'weekly',
  enabled: true,
  time: '09:00',
  daysOfWeek: ['monday', 'wednesday', 'friday'],
  startedAt: new Date().toISOString(),
  occurrences: 0
};

await db.update(contentItems)
  .set({
    recurringSchedule: JSON.stringify(recurringSchedule),
    timezone: 'America/New_York',
    status: 'draft'
  })
  .where(eq(contentItems.id, itemId));
```

### Set Expiration
```typescript
// Set content to expire after 30 days from publication
const thirtyDaysLater = new Date();
thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

await db.update(contentItems)
  .set({
    expirationDate: thirtyDaysLater
  })
  .where(eq(contentItems.id, itemId));
```

## Metrics and Monitoring

The content scheduling system maintains metrics on:
- Total scheduled items
- Successfully published items
- Failed publications
- Retry attempts and successes
- Upcoming expiring content
- Overall success rate

These metrics can be accessed via the `getSchedulingMetrics()` function.