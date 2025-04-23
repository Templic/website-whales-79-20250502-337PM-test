# Security Architecture

This directory contains the comprehensive security architecture for the application, providing advanced security features based on quantum-resistant cryptography, ML-based anomaly detection, and blockchain-based security logging.

## Overview

The security architecture consists of several key components:

1. **Security Fabric**: A core coordination layer that allows security components to register and communicate with each other.
2. **ML-based Anomaly Detection**: An advanced system for detecting unusual patterns in API requests that may indicate security threats.
3. **Blockchain-based Security Logging**: An immutable audit trail for security events.
4. **Quantum-Resistant Cryptography**: Future-proof cryptographic algorithms resistant to quantum computing attacks.
5. **Runtime Application Self-Protection (RASP)**: Real-time monitoring and protection of the application.

## Directory Structure

```
server/security/
├── advanced/             # Advanced security features
│   ├── blockchain/       # Blockchain-based security logging
│   ├── ml/               # ML-based anomaly detection
│   ├── quantum/          # Quantum-resistant cryptography
│   └── rasp/             # Runtime Application Self-Protection
├── cli/                  # Command-line tools for security management
│   ├── tools/            # CLI tool implementations
│   └── security.sh       # Main CLI entry script
├── docs/                 # Documentation for security features
│   ├── anomaly-detection.md   # Guide to the anomaly detection system
│   └── ergonomics-guide.md    # Guide to security ergonomics
├── examples/             # Example usage of security features
├── tests/                # Test scripts for security features
├── toolkit/              # Developer toolkit for easy integration
└── README.md             # This file
```

## For Developers

### Security Toolkit

The Security Toolkit provides an ergonomic API for integrating security features into your application code. It encapsulates the complexity of the underlying security mechanisms while providing simple, intuitive methods.

```typescript
import { 
  SecurityLevel,
  securityToolkit,
  createSecurityToolkit 
} from '@server/security/toolkit';

// Use default toolkit with standard security level
app.use(securityToolkit.createMiddleware());

// Or create a toolkit with custom security level
const highSecurityToolkit = createSecurityToolkit(SecurityLevel.HIGH);
app.use(highSecurityToolkit.createMiddleware());
```

See the full documentation in [docs/ergonomics-guide.md](docs/ergonomics-guide.md).

### Example Usage

The examples directory contains complete examples of how to use the security features:

```typescript
// Create a secure API endpoint
import { securityToolkit } from '@server/security/toolkit';

app.get('/api/data', securityToolkit.createMiddleware(), (req, res) => {
  // Your route handler code
});
```

See more examples in the [examples](examples/) directory.

## For Administrators

### Security Dashboard

The Security Dashboard provides a comprehensive view of your application's security status. Access it at `/admin/security` to monitor security events, run security scans, and configure security settings.

### Security CLI

The Security CLI provides a command-line interface for managing security features. It can be used to check system status, run security scans, query security events, and more.

To use the CLI:

```bash
# Navigate to the security CLI directory
cd server/security/cli

# Make the script executable (if not already)
chmod +x security.sh

# Run the CLI
./security.sh [command] [options]
```

Available commands:

- `status`: Get the current status of security systems
- `scan [level]`: Run a security scan (normal, deep, maximum)
- `events [options]`: Query security events
- `verify-chain`: Verify the blockchain integrity
- `analyze-config`: Analyze the security configuration
- `check-endpoint`: Test an endpoint for security issues
- `help`: Show help message

Examples:

```bash
# Check security status
./security.sh status

# Run a security scan
./security.sh scan deep

# Query security events
./security.sh events --limit 20 --severity HIGH

# Verify blockchain integrity
./security.sh verify-chain

# Check an endpoint for security issues
./security.sh check-endpoint --url http://localhost:3000/api/data

# Run in interactive mode
./security.sh check-endpoint --interactive
```

## Documentation

For detailed documentation on the security features, see:

- [Anomaly Detection Guide](docs/anomaly-detection.md): Documentation for the ML-based anomaly detection system
- [Security Ergonomics Guide](docs/ergonomics-guide.md): Guide to making security features easier to use

## Test Scripts

The test scripts directory contains scripts for testing the security features. To run the tests:

```bash
# Navigate to the security directory
cd server/security

# Run a specific test
npx ts-node tests/testAnomalyDetection.ts

# Or use the test CLI
./run-test.sh --sql-injection
```

## Customizing Security Features

The security features can be customized to meet your specific requirements:

1. **Security Levels**: Adjust the security levels in `toolkit/SecurityToolkit.ts`
2. **Anomaly Detection**: Customize the detection thresholds in `advanced/ml/AnomalyDetection.ts`
3. **Blockchain Logging**: Configure what events to log in `advanced/blockchain/ImmutableSecurityLogs.ts`
4. **RASP Protection**: Customize runtime protection in `advanced/rasp/RuntimeProtection.ts`

## Support

For questions or issues with the security architecture, please contact the security team.