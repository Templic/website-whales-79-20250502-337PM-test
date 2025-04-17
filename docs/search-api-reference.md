# Search API Reference

## Overview
This document provides detailed information about the search API endpoints available in the application. These endpoints enable searching across different content types with various filtering options.

## Base URL
All API endpoints are relative to the application's base URL.

## Global Search Endpoint

### GET `/api/search`
Universal search across all content types.

**Query Parameters:**
- `q` (string, required): The search query
- `type` (string, optional): Content type to search
  - Options: `all`, `music`, `products`, `posts`, `users`, `newsletters`, `suggestions`
  - Default: `all`
- `limit` (number, optional): Maximum results to return per content type
  - Default: `20`
- `page` (number, optional): Page number for pagination
  - Default: `1`
- `sort` (string, optional): Sort order
  - Options: `newest`, `oldest`, `relevance`
  - Default: `relevance`

**Response:**
```json
{
  "music": [
    {
      "id": 1,
      "title": "Cosmic Whale Song",
      "artist": "Dale",
      "frequency": "432",
      "description": "Meditation track",
      "duration": "5:32",
      "audioUrl": "/audio/cosmic-whale-song.mp3"
    }
  ],
  "products": [
    {
      "id": 1,
      "name": "Cosmic T-shirt",
      "price": 29.99,
      "category": "Apparel",
      "description": "100% organic cotton t-shirt",
      "images": ["/images/cosmic-tshirt.jpg"]
    }
  ],
  "posts": [
    {
      "id": 1,
      "title": "Exploring Cosmic Frequencies",
      "excerpt": "A journey through healing sounds",
      "author": "Dale",
      "publishDate": "2025-03-15T12:00:00Z",
      "tags": ["meditation", "healing"]
    }
  ],
  "users": [],
  "newsletters": [],
  "suggestions": []
}
```

## Specialized Search Endpoints

### GET `/api/music/search`
Music-specific search with specialized filtering.

**Query Parameters:**
- `q` (string, required): The search query
- `filter` (string, optional): Field to search
  - Options: `title`, `artist`, `frequency`, `description`, `all`
  - Default: `all`
- `frequency` (string, optional): Filter by frequency value
- `artist` (string, optional): Filter by artist name
- `minDuration` (number, optional): Minimum duration in seconds
- `maxDuration` (number, optional): Maximum duration in seconds

**Response:**
```json
[
  {
    "id": 1,
    "title": "Cosmic Whale Song",
    "artist": "Dale",
    "frequency": "432",
    "description": "Meditation track",
    "duration": "5:32",
    "audioUrl": "/audio/cosmic-whale-song.mp3",
    "createdAt": "2025-02-10T10:30:00Z"
  }
]
```

### GET `/api/shop/search`
E-commerce product search.

**Query Parameters:**
- `q` (string, required): The search query
- `filter` (string, optional): Field to search
  - Options: `name`, `category`, `description`, `all`
  - Default: `all`
- `category` (string, optional): Filter by product category
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `inStock` (boolean, optional): Filter by availability

**Response:**
```json
[
  {
    "id": 1,
    "name": "Cosmic T-shirt",
    "price": 29.99,
    "category": "Apparel",
    "description": "100% organic cotton t-shirt",
    "images": ["/images/cosmic-tshirt.jpg"],
    "inStock": true,
    "ratings": {
      "average": 4.8,
      "count": 25
    }
  }
]
```

## Content-Specific Search Parameters

### Blog Posts
Additional parameters for `/api/search?type=posts`:

- `tags` (string[], optional): Filter by blog post tags
  - Format: `tags=meditation&tags=healing`
- `author` (string, optional): Filter by author name
- `startDate` (string, optional): Filter posts published after date
  - Format: ISO date string (YYYY-MM-DD)
- `endDate` (string, optional): Filter posts published before date
  - Format: ISO date string (YYYY-MM-DD)
- `featured` (boolean, optional): Filter by featured status

### Newsletters
Additional parameters for `/api/search?type=newsletters`:

- `sent` (boolean, optional): Filter by sent status
- `category` (string, optional): Filter by newsletter category
- `openRate` (number, optional): Filter by minimum open rate
- `dateFrom` (string, optional): Filter by send date range start
- `dateTo` (string, optional): Filter by send date range end

### Community Suggestions
Additional parameters for `/api/search?type=suggestions`:

- `status` (string, optional): Filter by status
  - Options: `pending`, `approved`, `rejected`, `implemented`
- `category` (string, optional): Filter by suggestion category
- `dateFrom` (string, optional): Filter by submission date range start
- `dateTo` (string, optional): Filter by submission date range end
- `minVotes` (number, optional): Filter by minimum votes
- `hideImplemented` (boolean, optional): Hide implemented suggestions
- `hideDeclined` (boolean, optional): Hide declined suggestions

## Query Sanitization
All search queries are sanitized server-side to prevent SQL injection attacks. Special characters like `%` and `_` are escaped before processing.

## Request Rate Limiting
The search API is rate-limited to prevent abuse. Clients should implement proper throttling and debouncing on their end to avoid hitting these limits.

## Error Responses

**400 Bad Request**
```json
{
  "error": "Missing required parameter 'q'"
}
```

**500 Internal Server Error**
```json
{
  "error": "An error occurred while searching"
}
```

## Implementation Notes
- Search is performed using PostgreSQL's text search capabilities
- Results are ranked by relevance when using the `relevance` sort option
- Searching with empty query strings will return empty result sets
- Admin users have access to additional fields in search results
- API responses include only public fields unless the user has appropriate permissions