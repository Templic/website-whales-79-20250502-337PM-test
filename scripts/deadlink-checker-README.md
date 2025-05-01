# Dead Link Checker

A standalone utility for finding broken links and dead-end buttons on your website.

## Overview

The Dead Link Checker is a command-line tool that crawls your website and identifies:

1. Broken links (URLs that return error status codes)
2. Dead-end buttons (buttons without click handlers or href attributes)
3. General information about links and interactive elements

This tool runs without user interaction, making it ideal for automated testing and continuous integration workflows.

## Features

- Fast, lightweight crawling with timeouts to prevent long-running processes
- Detailed reporting in JSON format
- Configurable depth and timeout settings
- Support for both internal and external links
- Detection of various interactive elements including buttons and links

## Usage

```bash
# Basic usage
node scripts/check-deadlinks.js

# With custom options
node scripts/check-deadlinks.js --url http://localhost:3000 --depth 3 --timeout 10000 --output custom-report.json

# Show help
node scripts/check-deadlinks.js --help
```

## Options

- `--url <url>`: Base URL to check (default: http://localhost:5000)
- `--depth <n>`: Maximum crawl depth (default: 2)
- `--timeout <ms>`: Request timeout in milliseconds (default: 5000)
- `--output <file>`: Output file path (default: agent-deadlinks-report.json)
- `--help`: Show help message

## Report Format

The tool generates a JSON report with the following structure:

```json
{
  "meta": {
    "baseUrl": "http://localhost:5000",
    "startTime": "2025-05-01T00:19:11.154Z",
    "endTime": "2025-05-01T00:19:16.305Z",
    "duration": 5.151,
    "maxDepth": 1
  },
  "summary": {
    "pagesVisited": 1,
    "internalLinksFound": 0,
    "brokenLinks": 0,
    "deadEndButtons": 0
  },
  "homepage": {
    "links": {
      "total": 1,
      "deadEnds": 0,
      "items": [],
      "allLinks": [...]
    },
    "buttons": {
      "total": 0,
      "deadEnds": 0,
      "items": [],
      "allButtons": []
    }
  },
  "brokenLinks": [],
  "deadEndButtons": [],
  "visitedPages": [...]
}
```

## Implementation Notes

The tool uses a two-phase approach:
1. First performs a simple check of the homepage
2. Then does a more comprehensive crawl if the homepage is accessible

This ensures that you get results even if the tool times out during deep crawling.

## Requirements

- Node.js 16 or higher
- ES Modules support
- The following npm packages:
  - axios
  - cheerio