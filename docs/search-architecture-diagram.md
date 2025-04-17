# Search Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client Components                          │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│UniversalSear│ Advanced    │ Specialized Search Components       │
│chBar        │ Search Page │                                     │
│             │             ├─────────────┬───────────────┬──────┤
│ - Basic     │ - Filter UI │ MusicSearch │ ProductSearch │ Blog │
│   Search    │ - Sort      │ Component   │ Component     │Search│
│ - Instant   │ - Filtering │             │               │      │
│   Results   │ - Results   │             │               │      │
└──────┬──────┴──────┬──────┴──────┬──────┴───────┬───────┴──────┘
       │             │             │              │               
       │             │             │              │               
       ▼             ▼             ▼              ▼               
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Services                        │
├─────────────────────────┬───────────────────────────────────────┤
│   useDebounce Hook      │          TanStack React Query         │
│                         │                                       │
│ - Throttle Input        │ - API Data Fetching                   │
│ - Prevent Excess Calls  │ - Search Results Caching              │
└─────────────┬───────────┴──────────────────┬───────────────────┘
              │                              │                    
              │                              │                    
              ▼                              ▼                    
┌─────────────────────────────────────────────────────────────────┐
│                            API Layer                             │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ /api/search │ /api/music/ │ /api/shop/      │ Other Specialized │
│             │    search   │    search       │ Search Endpoints  │
│             │             │                 │                   │
│ - Universal │ - Music     │ - Product       │ - Newsletter      │
│   Search    │   Specific  │   Specific      │ - Community       │
│             │   Filters   │   Filters       │ - Admin           │
└──────┬──────┴──────┬──────┴──────┬─────────┴──────────────────┘
       │             │             │                             
       │             │             │                             
       ▼             ▼             ▼                             
┌─────────────────────────────────────────────────────────────────┐
│                        Search Functions                          │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│ searchMusic │searchProduct│  searchPosts    │  Other Search     │
│             │             │                 │  Functions        │
│             │             │                 │                   │
│             │             │                 │ - searchUsers     │
│             │             │                 │ - searchNewsletters│
└──────┬──────┴──────┬──────┴──────┬─────────┴──────────────────┘
       │             │             │                             
       │             │             │                             
       ▼             ▼             ▼                             
┌─────────────────────────────────────────────────────────────────┐
│                        Database Layer                            │
├─────────────┬─────────────┬─────────────────┬──────────────────┤
│   Tracks    │  Products   │    Posts        │   Other Tables    │
│   Table     │   Table     │    Table        │                   │
│             │             │                 │  - Users          │
│             │             │                 │  - Newsletters    │
│             │             │                 │  - Suggestions    │
└─────────────┴─────────────┴─────────────────┴──────────────────┘
```

## Search Data Flow

1. **User Input**
   - User enters search query in UniversalSearchBar or specialized component
   - Input is debounced to prevent excessive API calls

2. **Frontend Processing**
   - For instant results, debounced query is sent to API with limited scope
   - For full search, query is sent with all filters and parameters
   - TanStack Query manages data fetching, caching, and state

3. **API Request**
   - Query parameters are assembled based on component state
   - Request is sent to appropriate endpoint based on content type
   - Authentication status determines available search scopes

4. **Backend Processing**
   - Search query is sanitized to prevent SQL injection
   - Parameters are validated and normalized
   - Appropriate search functions are called based on content type

5. **Database Querying**
   - SQL queries are constructed with proper filtering and sorting
   - Full-text search is used where appropriate
   - Results are paginated based on limit parameter

6. **Response Processing**
   - Results are formatted according to content type
   - Sensitive fields are filtered based on user permissions
   - Metadata for pagination is included

7. **Frontend Rendering**
   - Results are rendered in appropriate component
   - Loading states are managed by TanStack Query
   - Error handling provides user feedback
   
8. **User Interaction**
   - Filter changes trigger new searches
   - Pagination fetches additional results
   - Result selection navigates to details view