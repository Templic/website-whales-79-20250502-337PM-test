# API Validation & Link Checker Tools

This repository contains a set of standalone tools for validating APIs and checking website navigation that are designed to work reliably in the Replit environment.

## 🚀 Quick Start

```bash
# Run both tools simultaneously (recommended)
./run-validation-tools.sh

# Run API validation only
./run-api-validator.sh 3000

# Run link checker only
./run-link-checker.sh 3500
```

## 📚 Documentation

- [API Validation README](./API-VALIDATION-README.md) - Overview of the API validation tools
- [API Validation User Guide](./API-VALIDATION-USER-GUIDE.md) - Detailed usage instructions
- [API Validation Summary](./API-VALIDATION-SUMMARY.md) - Technical details of the validation framework
- [Replit Compatibility Guide](./REPLIT-COMPATIBILITY.md) - Important guidelines for Replit environment

## ⚠️ Important Note on Replit Compatibility

According to [Replit's official documentation](https://docs.replit.com/programming-ide/configuring-repl):

> **"Do not modify core configuration files directly. Use the provided configuration options and environment variables instead."**

For this reason, we've created standalone tools rather than modifying the main application's core configuration to work in Replit. These tools provide the same functionality without requiring changes to restricted configuration files.

## 🔧 Available Tools

### API Validation Tool

Tests API endpoints against schema and security requirements:

```bash
./run-api-validator.sh [port]
```

### Dead Link Checker

Finds broken links, missing anchors, and navigation issues:

```bash
./run-link-checker.sh [port]
```

### Combined Tools Runner

Runs both tools simultaneously:

```bash
./run-validation-tools.sh [api_port] [link_port]
```

## 🛠 Support

If you encounter any issues with these tools, please refer to the [Troubleshooting](./API-VALIDATION-README.md#troubleshooting) section in the API Validation README.