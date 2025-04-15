# Component Optimization Guide

This guide outlines best practices and techniques for optimizing React components in our application. Following these guidelines will improve performance, reduce unnecessary renders, and ensure efficient resource allocation.

## Table of Contents

1. [Render Optimization](#render-optimization)
2. [State Management](#state-management)
3. [Handling Events](#handling-events)
4. [Data Fetching](#data-fetching)
5. [DOM Interaction](#dom-interaction)
6. [Large Lists and Tables](#large-lists-and-tables)
7. [Code Splitting](#code-splitting)
8. [Asset Optimization](#asset-optimization)
9. [Testing Performance](#testing-performance)
10. [Common Anti-Patterns](#common-anti-patterns)

## Render Optimization

### Component Memoization

Use `React.memo` for functional components that render often but don't need to update with every parent render:

```tsx
// Before
export function ExpensiveComponent(props) {
  // Component logic
}

// After
export const ExpensiveComponent = React.memo(function ExpensiveComponent(props) {
  // Component logic
});
```

### Optimization with useMemo

Use `useMemo` for expensive calculations:

```tsx
// Before
function ProductList({ products, category }) {
  const filteredProducts = products.filter(product => product.category === category);
  return (
    // Render filtered products
  );
}

// After
function ProductList({ products, category }) {
  const filteredProducts = useMemo(() => {
    return products.filter(product => product.category === category);
  }, [products, category]);
  
  return (
    // Render filtered products
  );
}
```

### Custom Equality Checks

Provide custom equality functions for complex props:

```tsx
const areEqual = (prevProps, nextProps) => {
  return prevProps.complexData.id === nextProps.complexData.id;
};

export const MemoizedComponent = React.memo(Component, areEqual);
```

## State Management

### Optimize useState Updates

Use functional updates with `useState` to avoid stale closures:

```tsx
// Before - may cause issues with stale state
const incrementCounter = () => {
  setCounter(counter + 1);
};

// After - always uses the most current state
const incrementCounter = () => {
  setCounter(prevCounter => prevCounter + 1);
};
```

### Batch State Updates

Group related state updates:

```tsx
// Before - causes multiple renders
function handleSubmit() {
  setIsLoading(true);
  setErrors([]);
  setSubmitCount(c => c + 1);
}

// After - batches updates in React 18+
function handleSubmit() {
  setIsLoading(true);
  setErrors([]);
  setSubmitCount(c => c + 1);
  // React 18 automatically batches these updates
}
```

### Context Optimization

Prevent unnecessary re-renders with context by splitting contexts:

```tsx
// Before - all consumers re-render when any part of state changes
const AppContext = createContext();

// After - split into specific contexts
const UserContext = createContext();
const ThemeContext = createContext();
const CartContext = createContext();
```

## Handling Events

### useCallback for Event Handlers

Use `useCallback` for event handlers passed to child components:

```tsx
// Before
function ParentComponent() {
  const handleClick = () => {
    // handle click
  };
  
  return <ChildComponent onClick={handleClick} />;
}

// After
function ParentComponent() {
  const handleClick = useCallback(() => {
    // handle click
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
}
```

### Debounce Input Handlers

Debounce rapidly firing events:

```tsx
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      // Perform search
    }, 300),
    []
  );
  
  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  
  return <input value={searchTerm} onChange={handleChange} />;
}
```

## Data Fetching

### Optimized Query Patterns

Use TanStack Query for efficient data fetching:

```tsx
function ProductDetails({ productId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Render based on query state
}
```

### Prefetching Data

Prefetch data for anticipated user actions:

```tsx
function ProductList() {
  const queryClient = useQueryClient();
  
  const prefetchProduct = (productId) => {
    queryClient.prefetchQuery({
      queryKey: ['/api/products', productId],
      queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
    });
  };
  
  return (
    <div>
      {products.map(product => (
        <div 
          key={product.id}
          onMouseEnter={() => prefetchProduct(product.id)}
        >
          {product.name}
        </div>
      ))}
    </div>
  );
}
```

## DOM Interaction

### Virtualized Lists

Use virtualization for long lists:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }) {
  const parentRef = useRef(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // row height estimate
  });
  
  return (
    <div 
      ref={parentRef}
      style={{ height: '500px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### useLayoutEffect for DOM Measurements

Use `useLayoutEffect` when measuring DOM elements to avoid layout flickers:

```tsx
function MeasuredComponent() {
  const ref = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);
  
  return (
    <div ref={ref}>
      <div style={{ width: dimensions.width / 2 }}>
        Half width content
      </div>
    </div>
  );
}
```

## Large Lists and Tables

### Pagination

Implement pagination for large datasets:

```tsx
function PaginatedList({ data, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleItems = data.slice(startIndex, startIndex + itemsPerPage);
  
  return (
    <div>
      <div className="items-container">
        {visibleItems.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
      
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        
        <span>Page {currentPage} of {totalPages}</span>
        
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Windowing for Large Tables

Apply windowing techniques for large tables:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTable({ rows, columns }) {
  const parentRef = useRef(null);
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });
  
  return (
    <div 
      ref={parentRef}
      style={{ height: '500px', overflow: 'auto' }}
    >
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.name}</th>
            ))}
          </tr>
        </thead>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => (
            <tr
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columns.map(column => (
                <td key={column.key}>
                  {rows[virtualRow.index][column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Code Splitting

### Dynamic Imports

Use dynamic imports for route-based code splitting:

```tsx
import { lazy, Suspense } from 'react';

// Instead of importing directly
// import Dashboard from './Dashboard';

// Use lazy loading
const Dashboard = lazy(() => import('./Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### Component-Level Splitting

Split large components:

```tsx
import { lazy, Suspense } from 'react';

// Heavy component loaded only when needed
const DataVisualization = lazy(() => import('./DataVisualization'));

function Dashboard({ showVisualizations }) {
  return (
    <div>
      <DashboardSummary />
      
      {showVisualizations && (
        <Suspense fallback={<div>Loading visualizations...</div>}>
          <DataVisualization />
        </Suspense>
      )}
    </div>
  );
}
```

## Asset Optimization

### Image Loading Optimization

Implement lazy loading for images:

```tsx
function Gallery({ images }) {
  return (
    <div className="gallery">
      {images.map(image => (
        <img
          key={image.id}
          src={image.thumbnail}
          loading="lazy"
          width={300}
          height={200}
          alt={image.alt}
        />
      ))}
    </div>
  );
}
```

### Responsive Images

Use responsive images with srcset:

```tsx
function ResponsiveImage({ image }) {
  return (
    <img
      src={image.medium}
      srcSet={`
        ${image.small} 400w,
        ${image.medium} 800w,
        ${image.large} 1200w
      `}
      sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
      alt={image.alt}
    />
  );
}
```

## Testing Performance

### Component Profiling

Use React's Profiler API:

```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id, // the "id" prop of the Profiler tree
  phase, // "mount" or "update"
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
) {
  console.log(`${id} rendering took ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="Application" onRender={onRenderCallback}>
      <YourComponent />
    </Profiler>
  );
}
```

### Performance Monitoring

Add performance marks and measures:

```tsx
function ComponentWithPerformanceMarks() {
  useEffect(() => {
    // Start timing
    performance.mark('component-mount-start');
    
    // Do expensive setup...
    
    // End timing
    performance.mark('component-mount-end');
    
    // Measure between marks
    performance.measure(
      'component-mount',
      'component-mount-start',
      'component-mount-end'
    );
    
    return () => {
      // Clear performance entries on unmount
      performance.clearMarks('component-mount-start');
      performance.clearMarks('component-mount-end');
      performance.clearMeasures('component-mount');
    };
  }, []);
  
  return <div>Component Content</div>;
}
```

## Common Anti-Patterns

### Using Index as Key

Avoid using array index as key:

```tsx
// Bad practice
{items.map((item, index) => (
  <Item key={index} {...item} />
))}

// Good practice
{items.map(item => (
  <Item key={item.id} {...item} />
))}
```

### Inline Objects and Functions

Avoid creating objects or functions in render:

```tsx
// Bad practice - creates new object on every render
<Component style={{ margin: '0 auto' }} />

// Good practice
const styles = { margin: '0 auto' };
<Component style={styles} />

// Bad practice - creates new function on every render
<Button onClick={() => handleClick(id)} />

// Good practice
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);

<Button onClick={handleButtonClick} />
```

### Excessive Re-rendering

Prevent excessive re-renders with proper component splitting:

```tsx
// Before - entire form re-renders when typing in any field
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // More fields...
  
  return (
    <form>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {/* More fields... */}
    </form>
  );
}

// After - components are isolated
function Form() {
  return (
    <form>
      <FormField name="name" />
      <FormField name="email" />
      {/* More fields... */}
    </form>
  );
}

const FormField = memo(function FormField({ name }) {
  const [value, setValue] = useState('');
  return (
    <input value={value} onChange={e => setValue(e.target.value)} />
  );
});
```

## Performance Checklist

When optimizing a component, consider these questions:

- [ ] Is the component rendering more often than necessary?
- [ ] Are there expensive calculations that could be memoized?
- [ ] Could event handlers benefit from useCallback?
- [ ] Is data fetching optimized with proper caching?
- [ ] Are large lists virtualized or paginated?
- [ ] Could any part of the component be code-split?
- [ ] Are images and other assets optimized?
- [ ] Are there any unnecessary state updates causing re-renders?
- [ ] Is context usage optimized to prevent unnecessary re-renders?
- [ ] Are there any performance anti-patterns present?

## Conclusion

Applying these optimization techniques strategically across the codebase will significantly improve the performance of our application. Remember that premature optimization can lead to more complex code, so focus optimization efforts on components with actual performance issues.

Regularly profile and measure performance to identify opportunities for improvement.

---

*Last updated: April 15, 2025*