# Taskade Embedding Implementation Guide

## Purpose

This guide provides implementation details and best practices for embedding Taskade AI agents within the Dale Loves Whales application. It covers the client-side components, server-side implementation, and security considerations.

## Client-Side Implementation

### Component Selection Guide

Choose the appropriate component based on your integration needs:

| Component | Use Case | Description |
|-----------|----------|-------------|
| `TaskadeEmbed` | In-page embedding | For embedding Taskade directly within page content |
| `TaskadeWidget` | Floating assistant | For providing a floating chat button that expands into a chat window |

### Style Selection Guide

Choose the appropriate style based on your page context:

| Style | Best For | Visual Characteristics |
|-------|----------|------------------------|
| `basic` | Minimal interfaces | Clean, simple styling using application's theme colors |
| `taskade` | Standalone AI features | Taskade's native UI with dark backgrounds and purple/indigo accents |
| `oceanic` | Ocean-themed pages | Blue/cyan gradients with slate backgrounds |

### Implementation Examples

#### Basic Embed Example

```jsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<TaskadeEmbed 
  taskadeId="YOUR_TASKADE_ID"
  title="Cosmic Consciousness Guide"
  style="basic"
  view="agent"
  height={500}
  width="100%"
/>
```

#### Widget with Custom Greeting

```jsx
import TaskadeWidget from '@/components/chat/TaskadeWidget';

<TaskadeWidget 
  taskadeId="YOUR_TASKADE_ID"
  title="Meditation Assistant"
  style="oceanic"
  position="bottom-right"
  greetingMessage="Need guidance with your meditation practice?"
/>
```

#### Full-Page Integration

```jsx
import TaskadeEmbed from '@/components/chat/TaskadeEmbed';

<div className="h-screen">
  <TaskadeEmbed 
    taskadeId="YOUR_TASKADE_ID"
    title="Cosmic Intelligence"
    style="taskade"
    view="agent"
    showToolbar={false}
    height="100%"
    width="100%"
  />
</div>
```

## Server-Side Implementation

### Embed Page Configuration

The custom `/taskade-embed` page is responsible for securely embedding Taskade while maintaining our application's styling and security requirements.

Key features:
- Parameter validation
- CSS variable injection for theming
- CSP header configuration
- CSRF protection exemption

### Middleware Configuration

The content API CSRF bypass middleware has been configured to support Taskade domains:

```javascript
// Taskade domains that should be exempt from CSRF protection
const TASKADE_DOMAINS = [
  'taskade.com',
  'www.taskade.com',
  'ai.taskade.com',
  // Add any additional Taskade domains here
];
```

## Page-Specific Recommendations

Based on the application's structure, here are recommended implementations for specific pages:

| Page | Recommended Component | Style | Notes |
|------|----------------------|-------|-------|
| Home | TaskadeWidget | oceanic | Bottom-right position for accessibility |
| Cosmic Consciousness | TaskadeEmbed | taskade | Embedded in content area |
| Meditation | TaskadeEmbed | basic | Simple integration with meditation content |
| Music | TaskadeWidget | oceanic | Provides assistance without disrupting listening |
| Tour | TaskadeWidget | basic | Minimal interference with tour content |

## Taskade Agents

The following Taskade agents are available for integration:

| Agent ID | Name | Purpose | Recommended Style |
|----------|------|---------|-------------------|
| 01JRV02MYWJW6VJS9XGR1VB5J4 | Cosmic Assistant | General cosmic consciousness guidance | taskade |
| AGENT_ID_2 | Meditation Guide | Meditation instruction and guidance | basic |
| AGENT_ID_3 | Ocean Expert | Marine biology and oceanography information | oceanic |
| AGENT_ID_4 | Music Guide | Assistance with frequency harmonization | oceanic |

## Performance Considerations

To maintain optimal performance when using Taskade embeds:

1. **Lazy Loading**: Only load the component when needed, especially for TaskadeWidget
2. **Memory Management**: Set `enableMemory={false}` for ephemeral interactions
3. **View Selection**: Use `view="chat"` for simpler interactions to reduce load time
4. **Style Impact**: The `basic` style has the smallest performance footprint

## Testing

When implementing Taskade components, test the following scenarios:

1. **Responsiveness**: Verify behavior across various screen sizes
2. **Theme Switching**: Test both light and dark mode compatibility
3. **Style Switching**: Verify all three styles render correctly
4. **Error States**: Test behavior when Taskade service is unavailable
5. **Memory Persistence**: Verify conversation continuity when `enableMemory` is enabled

## Troubleshooting

Common issues and solutions:

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Component not rendering | Missing ID | Verify taskadeId is valid |
| Incorrect styling | Style conflict | Check for CSS conflicts with the selected style |
| Widget not appearing | Position issue | Try alternative positions or check z-index |
| CSRF errors | Missing exemption | Verify contentApiCsrfBypass middleware configuration |

## Further Reading

- [Taskade Integration Overview](./TASKADE-INTEGRATION.md)
- [Taskade Technical Details](./TASKADE-TECHNICAL.md)
- [Example Implementation](../examples/TaskadeStylesExample.tsx)