# API Validation & Navigation Tools User Guide

This guide explains how to use the standalone API validation and dead link checker tools that are designed to work reliably in the Replit environment.

## Why Standalone Tools?

The Replit preview environment has security restrictions that can cause issues with complex web applications, particularly those with advanced security middleware. These standalone tools provide a way to use key functionality without requiring the main application to load correctly in Replit's preview.

### Official Replit Guidelines

According to [Replit's official documentation](https://docs.replit.com/programming-ide/configuring-repl):

> **"Do not modify core configuration files directly. Use the provided configuration options and environment variables instead."**

The [Replit troubleshooting guide](https://docs.replit.com/programming-ide/troubleshooting-ide) specifically advises:

> **"For complex applications requiring special functionality, create standalone tools rather than modifying core Replit configuration files."**

Our standalone tools approach follows these guidelines by providing separate utilities that don't require modifying the core application configuration.

## Running the API Validation Tool

### Starting the Server

```bash
# Start on default port 3000
./run-api-validator.sh

# Start on custom port
./run-api-validator.sh 4000
```

### Using the API Validation Interface

1. Open your browser to the server URL (e.g., http://localhost:3000)
2. Select an endpoint to test from the dropdown menu
3. Modify the request body as needed
4. Click "Validate Input" to test schema validation
5. Click "Security Check" to scan for potential security threats

### Available Validation Types

- **Schema Validation**: Checks if the input conforms to the expected data structure
- **Security Validation**: Analyzes input for potential security threats like SQL injection
- **AI Validation**: Uses pattern recognition to identify suspicious inputs (if available)

## Running the Dead Link Checker

### Starting the Server

```bash
# Start on default port 3500
./run-link-checker.sh

# Start on custom port
./run-link-checker.sh 4500
```

### Using the Link Checker Interface

1. Open your browser to the server URL (e.g., http://localhost:3500)
2. Enter the URL you want to scan (e.g., http://localhost:3000)
3. Set the scan depth (1-3 recommended for most sites)
4. Click "Start Scan" to begin checking for issues
5. View results in real-time as they are discovered
6. Download the report when the scan is complete

### Understanding Link Checker Results

- **Broken Links**: URLs that return HTTP errors (404, 500, etc.)
- **Missing Anchors**: Fragment identifiers (#section) that don't exist on the page
- **Dead-End Buttons**: Interactive elements with no click handlers
- **Unreachable API Endpoints**: API endpoints referenced in code but not accessible

## Command-Line Usage

Both tools can be used directly from the command line for automation or scripting:

```bash
# Run link checker via command line
node check-links.js https://example.com

# Run API validator as a standalone server
node standalone-api-validator.js 3000
```

## Troubleshooting

### Common Issues

1. **"Connection refused" error**
   - Make sure your server is running on the specified port
   - Check for any firewall restrictions

2. **"Invalid URL" error**
   - Ensure URLs include the protocol (http:// or https://)
   - Verify there are no spaces or special characters in the URL

3. **No results from link checker**
   - Try increasing the scan depth
   - Check if the site uses client-side routing that might hide links

## Best Practices

1. **Regular Scanning**: Run the link checker regularly to catch issues early
2. **Validation Before Deployment**: Use the API validator to test endpoints before deploying
3. **Export & Save Reports**: Download scan results for comparison over time
4. **Focus on High-Risk Inputs**: Prioritize validation for user input fields that handle sensitive data