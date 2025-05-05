# Replit Compatibility Guide

## Overview

This document explains our approach to ensuring application compatibility with the Replit development and preview environment. It includes key design decisions, constraints, and solutions for common issues.

## Replit Environment Constraints

Replit has several environment-specific constraints that can affect application behavior:

1. **Security Middleware Conflicts**: Replit's preview pane has security constraints that can conflict with complex middleware stacks
2. **CSRF Protection**: Replit's preview can have issues with CSRF tokens and cross-origin requests
3. **Core Configuration Restrictions**: Modifying core configuration files like `server/vite.ts` is discouraged

## Design Decisions

Based on our experience, we've adopted the following approach for Replit compatibility:

### DO NOT:

1. **Modify Core Vite Configuration Files**: 
   - `server/vite.ts`
   - `vite.config.ts`

2. **Create Replit-Specific Middleware**: 
   - Don't create bypass middleware for Replit
   - Don't modify security middleware flow for Replit

3. **Use Hard-Coded Replit Detection**:
   - Don't add special-case Replit-specific logic to core files

### DO:

1. **Create Standalone Tools**: 
   - Build separate utilities that run independently from the main application
   - Use simple Express servers for validation tools

2. **Provide Execution Scripts**:
   - Create dedicated scripts to run standalone tools
   - Document usage patterns clearly

3. **Document Limitations**:
   - Be explicit about what works in Replit and what doesn't
   - Provide alternative workflows for Replit users

## Standalone Tools Approach

We've implemented two standalone tools that work reliably in the Replit environment:

### 1. API Validation Tool

- **File**: `standalone-api-validator.js`
- **Usage**: `./run-api-validator.sh [port]`
- **Purpose**: Test and validate API inputs against schemas and security rules

### 2. Dead Link Checker

- **File**: `check-links.js` and `link-checker-server.js`
- **Usage**: `./run-link-checker.sh [port]`
- **Purpose**: Find broken links, dead-end buttons, and navigation issues

## Environment Detection

When necessary (and only in standalone tools), detect the Replit environment using:

```javascript
const isReplitEnv = !!(process.env.REPLIT_DOMAINS || process.env.REPL_ID || process.env.REPL_SLUG);
```

## Troubleshooting

If you encounter issues with the application in Replit:

1. **Use the standalone tools** instead of trying to fix the main application
2. **Restart the Replit workspace** if you see persistent errors
3. **Check the console logs** for specific error messages
4. **Review this document** for guidance on the recommended approach

## References

- [Replit Documentation](https://docs.replit.com/)
- [API-VALIDATION-README.md](./API-VALIDATION-README.md)
- [API-VALIDATION-USER-GUIDE.md](./API-VALIDATION-USER-GUIDE.md)
- [API-VALIDATION-SUMMARY.md](./API-VALIDATION-SUMMARY.md)