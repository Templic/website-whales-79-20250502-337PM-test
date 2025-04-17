# Container Security Scripts

This directory contains security scripts for securing containerized applications.

## Quick Start

Use the main entry point script for accessing all security features:

```bash
./container-security.sh [operation] [options]
```

For help and available operations:

```bash
./container-security.sh help
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `container-security.sh` | Main entry point for all security features |
| `container-image-signing.sh` | Scan, sign and verify container images |
| `cis-docker-benchmark.sh` | Run CIS benchmark checks for Docker |
| `runtime-protection.sh` | Create and manage runtime protection profiles |
| `zero-trust-networking.sh` | Implement zero-trust network policies |
| `ephemeral-storage-manager.sh` | Manage secure ephemeral storage |
| `iac-security-scanner.sh` | Scan infrastructure-as-code files |
| `registry-security-manager.sh` | Secure container registry operations |
| `container-observability.sh` | Set up container monitoring and observability |

## Common Operations

### Security Audit

Run a comprehensive security audit:

```bash
./container-security.sh audit --full
```

### Image Security

Scan an image for vulnerabilities:

```bash
./container-security.sh scan-image --repo myorg/myapp --tag latest
```

Sign an image for verification:

```bash
./container-security.sh sign-image --repo myorg/myapp --tag latest --signing-key ./keys/myapp.key
```

### Runtime Security

Create a runtime security profile:

```bash
./container-security.sh runtime --create --type seccomp --profile web-app --app-type web
```

Apply the profile to a container:

```bash
./container-security.sh runtime --apply --type seccomp --profile web-app --container myapp
```

### Network Security

Set up zero-trust networking:

```bash
./container-security.sh network --setup --prefix myapp
```

### Storage Security

Create a secure volume:

```bash
./container-security.sh storage --create --volume secure-data --encrypted --key ./keys/volume.key
```

### Observability

Set up observability infrastructure:

```bash
./container-security.sh observe --setup --metrics prometheus --tracing otel --dashboard grafana
```

## Documentation

For comprehensive documentation on containerization security, refer to the following:

- `docs/CONTAINERIZATION_SECURITY.md` - Core security principles
- `docs/CONTAINERIZATION_SECURITY_GUIDE.md` - Detailed usage guide