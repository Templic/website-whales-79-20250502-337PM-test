# Content Scheduling System

This document outlines the features and functionality of the Content Scheduling System, which allows for precise control over when content is published and expired.

## Core Features

### 1. Precise Date-Time Scheduling

The system allows content to be scheduled with precise date and time settings:

- **Date Selection**: Calendar-based date picker with validation
- **Time Selection**: Time input with HH:MM format
- **Combined Date-Time**: Accurate to the minute for publishing and expiration
- **Future Scheduling**: Can only schedule content for future dates
- **Immediate Publishing**: Option to publish content immediately

### 2. Timezone Support

Content scheduling supports multiple timezones:

- **Global Scheduling**: Set different timezones for content from around the world
- **Standard Timezones**: Support for all major timezones (UTC, ET, PT, GMT, etc.)
- **Timezone Display**: Clear indication of which timezone is being used
- **Consistent Timing**: Server-side timezone conversion to ensure accuracy

### 3. Content Preview

Preview how scheduled content will appear before publication:

- **Pre-publication Preview**: See exactly how content will look when published
- **Device Simulation**: Preview content on desktop, tablet, or mobile views
- **Full Content Display**: Renders text, HTML, markdown, and media elements
- **Timezone Context**: Shows scheduled time with timezone context
- **Expiration Information**: Displays expiration information when applicable

### 4. Advanced Fallback Mechanisms

Sophisticated error handling for failed publication attempts:

- **Retry Strategy**: Automatically retry failed publications (default)
- **Notification Only**: Alert administrators but don't retry
- **Abort**: Cancel publication attempt entirely
- **Logging**: Complete error logging with timestamps and error details
- **Metrics Tracking**: Monitors success/failure rates for publications

### 5. Security Features

Enhanced security measures for all scheduling operations:

- **Input Validation**: Comprehensive validation of all date inputs
- **Parameter Sanitization**: Protection against injection attacks
- **Permission Controls**: Only authorized administrators can schedule content
- **Audit Logging**: All scheduling actions are logged with user information
- **Secure Previews**: Content previews respect authentication requirements

### 6. Recurring Schedule Support

Support for repeating publication schedules:

- **Daily Publications**: Content that refreshes each day
- **Weekly Schedules**: Content published on specific days of the week
- **Monthly Patterns**: Content published on specific days of the month
- **Custom Intervals**: Support for custom publication intervals
- **Pattern Management**: Easy management of recurring patterns

## Technical Implementation

### Scheduler Service

The content scheduler runs every 5 minutes and performs the following operations:

1. Scan for content scheduled for publication
2. Process any recurring schedules
3. Identify content scheduled for expiration
4. Update content status based on schedule
5. Log all activities and update metrics

### Database Schema 

The content scheduling functionality is supported by the following schema fields:

- `scheduledPublishAt`: ISO timestamp for when content should be published
- `expirationDate`: ISO timestamp for when content should be archived
- `timezone`: String identifier for the timezone (e.g., "America/New_York")
- `recurringSchedule`: JSON object defining recurring publication patterns
- `fallbackStrategy`: String enum ('retry', 'notify', 'abort')
- `previewEnabled`: Boolean indicating if preview is allowed

### Preview Component

The ContentPreview component offers the following features:

- **Responsive Design**: Adapts to different device sizes
- **Media Support**: Properly displays images and other media
- **Content Formatting**: Preserves original content formatting
- **Metadata Display**: Shows relevant scheduling metadata
- **Interactive Controls**: Device toggles and other interactive elements

## Best Practices

### For Content Scheduling

1. Always check the timezone when scheduling content for global audiences
2. Use the preview feature to verify content appearance before scheduling
3. Consider setting appropriate expiration dates for time-sensitive content
4. Use detailed notes to document the purpose of scheduled content
5. Regularly review upcoming scheduled content

### For Content Preview

1. Check content on multiple device views
2. Verify that all media displays correctly
3. Ensure text formatting is preserved
4. Confirm scheduling information is accurate
5. Test interactive elements if applicable

## Security Considerations

The content scheduling system implements the following security measures:

1. Input validation for all date/time fields
2. Parameterized queries for all database operations
3. Permission checks for all scheduling operations
4. Rate limiting for scheduling API endpoints
5. Audit logging for all scheduling actions
6. Secure URL handling for media in previews

## Troubleshooting

Common issues and their solutions:

1. **Content Not Publishing**: Check timezone settings and server time
2. **Preview Not Working**: Verify content ID and access permissions
3. **Recurring Schedule Issues**: Check pattern configuration
4. **Timezone Discrepancies**: Verify client and server timezone settings
5. **Media Not Showing in Preview**: Check URL validity and permissions