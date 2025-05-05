# API Validation & Navigation Quality Tools

This repository contains a comprehensive set of tools for validating APIs and ensuring website navigation quality:

1. **API Validation Framework** - Test and validate API inputs against schemas and security requirements
2. **Dead Link Checker** - Find and fix broken links, missing anchors, and dead-end buttons

## 🚀 Getting Started

### API Validation Framework

The API validation framework provides robust input validation for your API endpoints, including schema validation, security validation, and more.

#### Running the API Validation Test Interface

```bash
# Start the standalone API validation server on port 3000
./run-api-validator.sh 3000

# Open in your browser
# http://localhost:3000
```

#### Features

- **Schema Validation** - Verify input conforms to expected data structures
- **Security Validation** - Detect potential security threats (SQL injection, XSS)
- **Validation Rules Management** - Create and manage validation rules for endpoints
- **Bypass Modes** - Test how your API behaves with validation disabled

### Dead Link Checker

The Dead Link Checker helps you find and fix navigation issues on your website.

#### Running the Dead Link Checker

```bash
# Start the link checker UI on port 3500
./run-link-checker.sh 3500

# Open in your browser
# http://localhost:3500
```

#### Features

- **Broken Link Detection** - Find URLs that return errors
- **Missing Anchor Detection** - Find anchor links that point to non-existent elements
- **Dead-End Button Detection** - Find buttons that don't have click handlers
- **API Endpoint Validation** - Find unreachable API endpoints
- **Progress Reporting** - Monitor scan progress in real-time
- **Export Results** - Save results as JSON or CSV

## 📊 Troubleshooting

### Common Issues

1. **"Unexpected end of input" errors in Replit preview**
   - The Replit preview environment has security restrictions that can cause issues with the main application
   - Use the standalone API validator and link checker tools instead
   - According to [Replit's documentation](https://docs.replit.com/programming-ide/troubleshooting-ide), modifying core configuration files can lead to these errors

2. **CSRF protection errors**
   - The API validation framework bypasses CSRF protection for testing
   - If you see CSRF errors, make sure you're using the correct endpoints
   - Replit's [security documentation](https://docs.replit.com/teams-pro/programming-environment/securing-applications) notes that their preview has specific security constraints

3. **Application doesn't load in Replit**
   - The standalone tools are designed to work reliably even when the main application has issues
   - This follows Replit's [best practices](https://docs.replit.com/programming-ide/configuring-repl) of creating separate utilities for specialized functions
   
4. **Middleware errors in Replit environment**
   - Never modify core Replit configuration files like `server/vite.ts` or `vite.config.ts`
   - Per [Replit guidelines](https://docs.replit.com/teams-pro/developing-on-replit): "Do not modify core configuration files directly."
   - Use standalone tools as recommended by [Replit's troubleshooting guide](https://docs.replit.com/programming-ide/troubleshooting-ide)

## 🛠️ Advanced Usage

### Command-Line Interface

Both tools can be used directly from the command-line:

```bash
# Run a link check from the command line
node check-links.js https://example.com

# Run the API validator as a standalone server
node standalone-api-validator.js 3000
```

### Integration with Your Application

You can integrate the API validation framework into your application:

1. Import validation rules from the framework
2. Apply validation to your routes
3. Customize validation behavior for specific endpoints

See `API-VALIDATION-USER-GUIDE.md` for detailed integration instructions.

## 📝 Documentation

Additional documentation:

- `API-VALIDATION-USER-GUIDE.md` - Detailed usage instructions
- `API-VALIDATION-SUMMARY.md` - Overview of the API validation framework
- `agent-deadlinks-report.json` - Sample dead link report