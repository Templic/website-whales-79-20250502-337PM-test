# Community Components

This directory contains components related to community features, user interaction, social engagement, and collaborative experiences.

## Components

### Active Components

| Component | Description | Status |
|-----------|-------------|--------|
| `CommunityFeed` | Social feed display with interaction | Active |
| `UserProfile` | User profile display and editing | Active |
| `CommentSection` | Comment system for content | Active |
| `MemberDirectory` | Directory of community members | Active |
| `EventCalendar` | Community events calendar | Active |
| `ChatSystem` | Real-time chat functionality | Active |
| `DiscussionForum` | Threaded discussion board | Active |
| `NotificationCenter` | User notification system | Active |
| `GroupManagement` | Community group functionality | Active |
| `BadgeSystem` | Achievement and recognition system | Active |

## Usage

### Community Feed Implementation

```tsx
import { CommunityFeed, NotificationCenter } from '@/components/features/community';

export default function CommunityPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-3/4">
          <h1 className="text-2xl font-bold mb-4">Community Feed</h1>
          
          <CommunityFeed 
            postLimit={10}
            showFilters={true}
            allowPosting={true}
            currentUserId="user-123"
          />
        </div>
        
        <div className="md:w-1/4">
          <NotificationCenter 
            userId="user-123"
            maxNotifications={5}
          />
        </div>
      </div>
    </div>
  );
}
```

### Discussion Forum Example

```tsx
import { DiscussionForum } from '@/components/features/community';
import { useState } from 'react';

export default function ForumPage() {
  const [categories] = useState([
    { id: 'music', name: 'Music Discussion' },
    { id: 'cosmic', name: 'Cosmic Experiences' },
    { id: 'events', name: 'Upcoming Events' },
    { id: 'feedback', name: 'Site Feedback' },
  ]);
  
  const [selectedCategory, setSelectedCategory] = useState('music');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Community Forums</h1>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded ${
              selectedCategory === category.id 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      <DiscussionForum 
        categoryId={selectedCategory}
        currentUserId="user-123"
        allowReplies={true}
        allowVoting={true}
      />
    </div>
  );
}
```

## Component Relationships

```
CommunityPage
├── CommunityNav
├── CommunityFeed
│   ├── FeedPost
│   ├── CommentSection
│   └── ReactionSystem
├── NotificationCenter
│   └── NotificationItem
└── UserWidget
    └── UserAvatar

DiscussionForum
├── ForumCategory
├── ForumThread
│   ├── ThreadPost
│   └── ReplyThread
└── UserBadges
```

## Props Documentation

### CommentSection Props

```tsx
interface CommentSectionProps {
  /**
   * ID of the content being commented on
   * @required
   */
  contentId: string;
  
  /**
   * Type of content (post, product, etc.)
   * @default "post"
   */
  contentType?: 'post' | 'product' | 'event' | 'music' | 'article';
  
  /**
   * Current user ID (for highlighting user's own comments)
   */
  currentUserId?: string;
  
  /**
   * Whether comments should be loaded immediately
   * @default true
   */
  loadOnMount?: boolean;
  
  /**
   * Number of comments to display initially
   * @default 5
   */
  initialCommentCount?: number;
  
  /**
   * Whether to show comment threading (replies)
   * @default true
   */
  showThreading?: boolean;
  
  /**
   * Whether to allow comment editing
   * @default true
   */
  allowEditing?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}
```

## Moderation Features

Community components include moderation capabilities to maintain a positive environment:

1. **Content Flagging**: Users can flag inappropriate content
2. **User Reporting**: System for reporting problematic user behavior
3. **Content Filters**: Optional automatic filtering of inappropriate language
4. **Moderation Queue**: Admin interface for handling reported content
5. **User Restrictions**: Ability to restrict user capabilities based on behavior

## Feature Roadmap

### Upcoming Features

- [ ] Enhanced group collaboration tools
- [ ] Content recommendation system
- [ ] Community challenges and events system
- [ ] Reputation and trust level system
- [ ] Advanced media sharing capabilities
- [ ] Integrated voice chat for community interactions

## Maintainers

- Community Team (@communityTeam)

## Last Updated

April 9, 2025
