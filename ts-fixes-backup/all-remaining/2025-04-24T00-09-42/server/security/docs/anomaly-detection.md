# ML-Based Anomaly Detection System

## Overview

The ML-Based Anomaly Detection System provides advanced security monitoring for detecting and preventing malicious activities and unusual behavior patterns that might indicate security threats. By analyzing request patterns, user behavior, and data flows, the system can identify potential security issues that traditional rule-based security measures might miss.

## Features

- **Request Pattern Analysis**: Identifies unusual request patterns based on historical data.
- **Rate Monitoring with Adaptive Thresholds**: Monitors request rates and adapts thresholds based on historical patterns.
- **Data Exfiltration Detection**: Detects attempts to extract sensitive data through API calls.
- **Behavior-Based Anomaly Detection**: Builds behavioral profiles for users and IPs to detect deviations.
- **Advanced Statistical Analysis**: Uses statistical methods to identify outliers and unusual patterns.
- **Multiple Detection Approaches**: Combines content analysis, behavioral analysis, statistical analysis, and rate analysis to achieve high accuracy.
- **Quantum-Resistant Security**: Designed with future-proof security in mind.

## Components

The anomaly detection system consists of the following components:

1. **Pattern Repository**: Stores historical data about requests, users, and known behavior patterns.
2. **Anomaly Detection Engine**: Analyzes incoming requests against known patterns to detect anomalies.
3. **Blockchain Logging Integration**: Records anomalies in an immutable blockchain for audit purposes.
4. **Middleware Integration**: Seamlessly integrates with Express middleware for easy deployment.
5. **Testing Tools**: Command-line tools for testing and benchmarking the system.

## Detection Methods

### Statistical Analysis

Analyzes request patterns against historical data to identify statistical outliers:

- Path frequency analysis
- Method frequency analysis
- Query parameter analysis

### Behavioral Analysis

Builds behavioral profiles for users and IPs and detects deviations:

- Request timing patterns
- Path access patterns
- Method usage patterns
- User agent consistency

### Content Analysis

Inspects request content for potential attack signatures:

- SQL injection patterns
- XSS attack patterns
- Path traversal attempts
- Command injection patterns
- NoSQL injection patterns
- Data exfiltration patterns
- Sensitive data patterns

### Rate Analysis

Monitors request rates and identifies unusual spikes:

- Request frequency monitoring
- Request acceleration analysis
- Comparative rate analysis against global baseline

## Implementation

### Basic Usage

To integrate the anomaly detection system into your application, use the provided middleware:

```typescript
import { createAnomalyDetectionMiddleware } from '@server/security/advanced/ml/AnomalyDetection';
import express from 'express';

const app = express();

// Create middleware with custom options
const anomalyDetection = createAnomalyDetectionMiddleware({
  confidenceThreshold: 0.7,      // Anomaly threshold (0-1)
  blockAnomalies: true,          // Block requests that exceed the threshold
  logAnomalies: true,            // Log anomalies to blockchain
  enableAdaptiveThresholds: true // Dynamically adjust thresholds
});

// Apply middleware to all routes
app.use(anomalyDetection);

// Or apply to specific routes
app.post('/api/sensitive-data', anomalyDetection, (req, res) => {
  // This handler only runs if the request is not anomalous
  res.json({ success: true });
});
```

### Advanced Usage

For more fine-grained control, you can use the `detectAnomaly` function directly:

```typescript
import { detectAnomaly } from '@server/security/advanced/ml/AnomalyDetection';

app.post('/api/data', async (req, res, next) => {
  try {
    // Run anomaly detection
    const result = await detectAnomaly(req);
    
    if (result.isAnomaly) {
      // Custom handling based on anomaly severity
      if (result.score > 0.9) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (result.score > 0.7) {
        // Log high-confidence anomalies
        console.warn(`Anomaly detected: ${result.reason}`);
      }
    }
    
    // Continue normal processing if not blocked
    next();
  } catch (error) {
    next(error);
  }
});
```

## Configuration Options

The anomaly detection system supports the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `confidenceThreshold` | number | 0.7 | Confidence threshold for anomaly detection (0-1) |
| `blockAnomalies` | boolean | false | Whether to block detected anomalies |
| `logAnomalies` | boolean | true | Whether to log detected anomalies |
| `excludePaths` | string[] | [...] | Paths to exclude from anomaly detection |
| `enableAdaptiveThresholds` | boolean | true | Enable adaptive thresholding based on historical data |
| `enableStatisticalAnalysis` | boolean | true | Enable statistical outlier detection |
| `enableBehavioralAnalysis` | boolean | true | Enable behavioral analysis |
| `enableDataExfiltrationDetection` | boolean | true | Enable data exfiltration detection |
| `maxIpHistoryLength` | number | 100 | Maximum history to retain per IP |
| `maxUserHistoryLength` | number | 200 | Maximum history to retain per user |
| `learningPhaseDuration` | number | 300000 | Initial learning phase duration in milliseconds |

## Testing

The anomaly detection system includes comprehensive testing tools to validate its functionality:

```bash
# Navigate to the security folder
cd server/security

# Make the test script executable
chmod +x run-test.sh

# Run all tests
./run-test.sh --all

# Run specific tests
./run-test.sh --sql-injection
./run-test.sh --xss
./run-test.sh --path-traversal
./run-test.sh --rate-limit
./run-test.sh --data-exfiltration
./run-test.sh --sensitive-data
./run-test.sh --unusual-behavior
```

## Examples

See the `server/security/examples/secureApiEndpoint.ts` file for a complete example of integrating the anomaly detection system into an API endpoint.

## Best Practices

1. **Start with learning mode**: Initially configure the system with a learning phase to establish normal patterns before enabling blocking.
2. **Tune thresholds carefully**: Start with a higher threshold (e.g., 0.8) and gradually lower it as false positives are minimized.
3. **Log extensively before blocking**: Enable logging but disable blocking initially to observe system behavior.
4. **Exclude non-sensitive paths**: Use `excludePaths` to avoid analyzing public endpoints or health checks.
5. **Combine with traditional security**: Use alongside input validation, CSRF protection, and other security measures.
6. **Review logs regularly**: Analyze the blockchain logs to identify potential threats and adjustment needs.
7. **Update attack signatures**: Periodically update the attack signatures to detect new threat patterns.

## Integration with Security Fabric

The anomaly detection system is fully integrated with the security fabric architecture, allowing communication with other security components:

```typescript
import { securityFabric } from '@server/security/advanced/SecurityFabric';
import { createAnomalyDetectionMiddleware } from '@server/security/advanced/ml/AnomalyDetection';

// Register with security fabric
securityFabric.registerComponent('anomaly-detection', {
  name: 'ML Anomaly Detection',
  version: '1.0.0',
  status: 'active',
  type: 'detection',
  events: ['anomaly.detected', 'anomaly.blocked', 'learning.complete']
});

// Create middleware with integration
const anomalyDetection = createAnomalyDetectionMiddleware({
  // Regular options...
});

// Apply middleware
app.use(anomalyDetection);
```