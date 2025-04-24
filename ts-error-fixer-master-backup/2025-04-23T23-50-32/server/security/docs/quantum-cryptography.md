# Quantum-Resistant Cryptography Guide

## Overview

The Quantum-Resistant Cryptography module provides advanced cryptographic functions that are resistant to attacks from quantum computers, ensuring long-term security for sensitive data even in the face of future developments in quantum computing.

This module implements several post-quantum cryptographic algorithms:

1. **CRYSTALS-Kyber**: Key encapsulation mechanism (KEM)
2. **CRYSTALS-Dilithium**: Digital signature algorithm
3. **SPHINCS+**: Hash-based signature scheme
4. **NewHope**: Lattice-based key exchange
5. **Frodo**: Lattice-based key exchange with more conservative parameters

## Key Features

- **Quantum-resistant key generation**: Generate key pairs that resist quantum attacks
- **Secure encryption/decryption**: Protect data with quantum-resistant algorithms
- **Digital signatures**: Sign and verify data with quantum-resistant signatures
- **Quantum-resistant hashing**: Create secure hashes using quantum-resistant algorithms
- **Secure tokens**: Create and verify secure tokens with quantum-resistant protection
- **Middleware integration**: Easily apply quantum protection to Express endpoints
- **Developer-friendly helpers**: High-level functions for common cryptographic operations

## Getting Started

### Basic Usage

Import the module and use the cryptographic functions directly:

```typescript
import { 
  generateKeyPair, 
  encrypt, 
  decrypt, 
  sign, 
  verify, 
  hash 
} from '@server/security/advanced/quantum';

// Generate a quantum-resistant key pair
const keyPair = await generateKeyPair({
  algorithm: 'kyber',
  strength: 'high'
});

// Encrypt data
const encryptedData = await encrypt('sensitive data', keyPair.publicKey, {
  algorithm: 'kyber',
  strength: 'high'
});

// Decrypt data
const decryptedData = await decrypt(encryptedData, keyPair.privateKey, {
  algorithm: 'kyber',
  strength: 'high'
});

// Sign data
const signatureResult = await sign('data to sign', keyPair.privateKey, {
  algorithm: 'dilithium',
  strength: 'high'
});

// Verify signature
const verificationResult = await verify(
  'data to verify', 
  signatureResult.signature, 
  signatureResult.publicKey, 
  {
    algorithm: 'dilithium',
    strength: 'high'
  }
);

// Hash data
const hashedData = await hash('data to hash', {
  strength: 'high'
});
```

### Middleware Integration

Apply quantum protection to your Express routes with middleware:

```typescript
import express from 'express';
import { createQuantumMiddleware } from '@server/security/advanced/quantum';

const app = express();

// Apply quantum middleware to all routes
app.use(createQuantumMiddleware({
  verifySignature: 'optional',
  signResponses: 'sensitive',
  encryption: 'sensitive',
  algorithm: 'kyber',
  strength: 'high'
}));

// Now all routes have quantum protection
app.get('/api/data', (req, res) => {
  res.json({ 
    message: 'This response will be signed with quantum-resistant signatures'
  });
});
```

### High-Level Helpers

Use the helper functions for common operations:

```typescript
import { 
  secureData, 
  processSecuredData, 
  secureHash,
  createSecureToken,
  verifySecureToken
} from '@server/security/advanced/quantum';

// Secure data for transmission
const { encryptedData, signature, publicKey } = await secureData(
  sensitiveData,
  recipientPublicKey
);

// Process secured data
const { data, verified } = await processSecuredData(
  encryptedData,
  privateKey,
  { signature, publicKey }
);

// Create a secure hash
const hash = await secureHash(data);

// Create a secure token
const token = await createSecureToken(
  { userId: 123, role: 'admin' },
  privateKey,
  { expiresIn: 3600000 }
);

// Verify a secure token
const { payload, valid } = await verifySecureToken(token);
```

## Configuration Options

### Security Strength Levels

The module supports three security strength levels:

- **standard**: Basic protection, balanced with performance
- **high**: Enhanced protection for sensitive operations (default)
- **paranoid**: Maximum protection for critical operations

### Algorithm Selection

Choose from multiple quantum-resistant algorithms:

- **kyber**: General-purpose key encapsulation (default)
- **dilithium**: Digital signatures
- **sphincs**: Hash-based signatures
- **newhope**: Key exchange
- **frodo**: Conservative key exchange

### Middleware Options

The quantum middleware supports various options:

```typescript
createQuantumMiddleware({
  // Signature verification level
  // - 'none': No verification
  // - 'optional': Verify if signature is present
  // - 'required': Require and verify signature
  verifySignature: 'optional',
  
  // Response signing level
  // - 'none': Don't sign responses
  // - 'sensitive': Sign only sensitive responses
  // - 'all': Sign all responses
  signResponses: 'sensitive',
  
  // Encryption level
  // - 'none': No encryption
  // - 'sensitive': Encrypt only sensitive fields
  // - 'all': Encrypt all data
  encryption: 'sensitive',
  
  // Quantum algorithm to use
  algorithm: 'kyber',
  
  // Security strength level
  strength: 'high',
  
  // Fields to consider sensitive (for selective encryption/signing)
  sensitiveFields: ['password', 'token', 'key', 'secret'],
  
  // Whether to log operations to the blockchain
  logToBlockchain: true
});
```

## Advanced Usage

### Custom Algorithm Parameters

You can customize algorithm parameters for specific requirements:

```typescript
const keyPair = await generateKeyPair({
  algorithm: 'kyber',
  strength: 'custom',
  // Custom parameters
  params: {
    keySize: 4096,
    iterations: 7500
  }
});
```

### Hybrid Cryptography

For critical applications, you can use hybrid cryptography combining traditional and quantum-resistant algorithms:

```typescript
import { createHybridEncryption } from '@server/security/advanced/quantum/hybrid';

// Encrypt with both traditional and quantum-resistant algorithms
const encryptedData = await createHybridEncryption().encrypt(
  sensitiveData,
  recipientPublicKey
);
```

### Header Integration

The middleware will add appropriate headers to responses:

- `X-Quantum-Signature`: Quantum-resistant signature
- `X-Quantum-Public-Key`: Public key used for the signature
- `X-Quantum-Algorithm`: Algorithm used
- `X-Quantum-Strength`: Security strength level used

Clients can verify these signatures to ensure the response hasn't been tampered with.

## Best Practices

1. **Use appropriate strength levels**: Choose the strength level based on the sensitivity of your data.
   - `standard`: For regular data
   - `high`: For sensitive data (PII, financial data)
   - `paranoid`: For highly sensitive data (encryption keys, authentication tokens)

2. **Key management**: Properly manage and protect private keys.
   - Store private keys in a secure key management service
   - Rotate keys regularly
   - Never expose private keys in client-side code

3. **Algorithm selection**: Choose the appropriate algorithm for each use case.
   - Use `kyber` for general encryption
   - Use `dilithium` for signatures
   - Use `sphincs` when hash-based signatures are preferred

4. **Performance considerations**: Higher security levels will impact performance.
   - Use higher levels only for sensitive operations
   - Consider caching results when appropriate
   - Profile your application to identify bottlenecks

5. **Error handling**: Properly handle cryptographic errors.
   - Never expose detailed error messages to clients
   - Log cryptographic errors securely
   - Fail securely (don't fall back to insecure methods)

## Example Implementation

See the example implementation in `server/security/examples/QuantumExample.ts` for a complete working example.

## Technical Details

### Algorithm Specifications

#### CRYSTALS-Kyber

- **Type**: Lattice-based key encapsulation mechanism (KEM)
- **Security basis**: Module Learning With Errors (MLWE) problem
- **Key sizes**: 
  - Standard: 2048 bits
  - High: 3072 bits
  - Paranoid: 4096 bits

#### CRYSTALS-Dilithium

- **Type**: Lattice-based digital signature algorithm
- **Security basis**: Module Learning With Errors (MLWE) problem
- **Key sizes**:
  - Standard: 2048 bits
  - High: 3072 bits
  - Paranoid: 4096 bits

#### SPHINCS+

- **Type**: Stateless hash-based signature scheme
- **Security basis**: Security of the underlying hash function
- **Parameters**:
  - Standard: 32-byte hash, depth 16
  - High: 48-byte hash, depth 20
  - Paranoid: 64-byte hash, depth 24

#### NewHope

- **Type**: Lattice-based key exchange
- **Security basis**: Ring Learning With Errors (RLWE) problem
- **Key sizes**:
  - Standard: 2048 bits
  - High: 3072 bits
  - Paranoid: 4096 bits

#### Frodo

- **Type**: Lattice-based key exchange
- **Security basis**: Learning With Errors (LWE) problem
- **Parameters**:
  - Standard: dimension 640
  - High: dimension 976
  - Paranoid: dimension 1344

### Implementation Notes

- This implementation uses placeholder implementations that will be replaced with actual quantum-resistant algorithms as they become standardized and available in production libraries.
- The current implementation logs operations to the security blockchain for audit purposes.