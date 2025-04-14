# Taskade AI Chat Integration Documentation

## Overview

This document provides comprehensive information about the Taskade AI chat integration implemented within the application. The integration provides multiple access points (menu page, widget, and popup) for a sitewide chat experience that works seamlessly across the entire application. It features a beautiful cosmic-sea-whale-geometric-conversational-portal wrapper for the Taskade Agent that enhances the chat experience with oceanic and cosmic themes.

## Key Features

- **Multiple Access Points**: Users can access the chat functionality through different entry points:
  - Dedicated chat page (/chat or /ai-assistant)
  - Floating chat widget in the bottom corner
  - Inline chat access within specific pages
  
- **Cosmic-Sea-Whale Theme**: Custom designed interface incorporating:
  - Animated cosmic elements
  - Ocean-inspired color palette
  - Sacred geometry patterns
  - Responsive animations and interactions
  
- **Accessibility Focused**:
  - Screen reader support
  - High contrast mode
  - Text size adjustment
  - Reduced motion options
  - Keyboard navigation

- **State Management**: Centralized state using React Context for consistent chat experience across the application

## Architecture

### Components Structure

```
client/src/
├── components/
│   └── chat/
│       ├── ChatInterface.tsx       # Custom chat UI implementation
│       ├── ChatWidget.tsx          # Floating chat widget
│       ├── OceanicPortal.tsx       # Themed wrapper for Taskade Agent
│       └── TaskadeEmbed.tsx        # Taskade AI Agent iframe integration
├── contexts/
│   ├── AccessibilityContext.tsx    # Manages accessibility settings
│   └── ChatContext.tsx             # Manages chat state across the app
└── pages/
    └── AIChatMenuPage.tsx          # Dedicated chat page with options
```

### State Management

The chat functionality uses two primary context providers:

1. **ChatContext**: Manages chat-specific state including:
   - Widget visibility and position
   - Chat history
   - User preferences for the chat UI

2. **AccessibilityContext**: Manages accessibility settings including:
   - Reduced motion preferences
   - High contrast mode
   - Text size adjustments
   - Screen reader optimization

### Data Flow

1. User interacts with a chat entry point (widget, menu, inline)
2. The chat state is managed by ChatContext
3. User messages are processed and stored locally
4. Taskade Agent provides AI responses through embedded iframe
5. The UI updates to reflect the conversation flow

## Component Details

### ChatInterface

Provides a custom chat UI for direct messaging. Features include:

- Message history display with user/assistant differentiation
- Text input with enter-to-send functionality
- Typing indicators
- Auto-scrolling message list
- Accessibility features integration

### OceanicPortal

A themed wrapper around the Taskade Agent that creates an immersive cosmic-sea-whale experience:

- Animated background with cosmic elements
- Sacred geometry patterns
- Animated whale and bubble effects
- Expandable/collapsible interface
- Fullscreen mode
- Media upload capabilities

### ChatWidget

A floating chat button that appears on all pages:

- Position customization (top/bottom, left/right)
- Animation effects for open/close
- Persistence across page navigation
- Auto-opening capabilities

### TaskadeEmbed

Handles the embedding of the Taskade AI Agent:

- Responsive iframe integration
- Loading states
- Error handling
- Resize handling

## Usage

### For End Users

Users can access the chat functionality in several ways:

1. **Widget**: Click the floating chat button in the corner of any page
2. **Menu**: Navigate to /chat or /ai-assistant in the application
3. **Settings**: Customize chat behavior in the settings panel on the chat page

### For Developers

To extend or modify the chat functionality:

1. **Add New Chat Entry Point**:
   ```jsx
   import { useChat } from '@/contexts/ChatContext';
   
   function MyComponent() {
     const { openWidget } = useChat();
     
     return (
       <button onClick={openWidget}>
         Open Chat
       </button>
     );
   }
   ```

2. **Customize OceanicPortal Theme**:
   - Modify the OceanicPortal.tsx component
   - Change colors, animations, and geometric elements
   - Add new interactive features

3. **Add New AI Capabilities**:
   - Update the TaskadeEmbed component with new AI agent URLs
   - Extend the ChatInterface to support new message types

## Taskade AI Agent Configuration

The Taskade AI Agent is embedded using an iframe with the following configuration:

```jsx
const taskadeUrl = 'https://app.taskade.com/embed/agent/YOUR_AGENT_ID';
```

To configure the agent:

1. Replace 'YOUR_AGENT_ID' with your actual Taskade Agent ID
2. Set permissions in the iframe sandbox attribute as needed
3. Configure agent parameters via URL query parameters

## Accessibility Considerations

The chat integration prioritizes accessibility:

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Screen Reader Support**: Proper ARIA labels and semantic HTML
3. **Reduced Motion**: Animations can be disabled for users with vestibular disorders
4. **High Contrast**: Alternative color schemes for users with visual impairments
5. **Text Size**: Adjustable font sizing for readability

## Troubleshooting

Common issues and solutions:

1. **Taskade Agent Not Loading**:
   - Check if the Taskade URL is correct
   - Verify internet connectivity
   - Ensure iframe permissions are properly set

2. **Chat Widget Not Appearing**:
   - Check ChatContext configuration
   - Verify that showWidget() is being called
   - Check CSS z-index conflicts

3. **Animations Not Working**:
   - Ensure Framer Motion is properly installed
   - Check for reduced motion settings
   - Verify CSS transitions are not being overridden

## Future Enhancements

Planned improvements for the chat integration:

1. Multi-language support
2. Voice input and text-to-speech
3. Enhanced media sharing capabilities
4. AI personalization based on user preferences
5. Chat history search and filtering

## Credits

- Sacred Geometry components by Cosmic Design Team
- Whale animation inspired by marine conservation projects
- Taskade AI integration using official Taskade embedding API