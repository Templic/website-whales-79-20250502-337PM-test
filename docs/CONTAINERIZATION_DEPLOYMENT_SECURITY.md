# Containerization and Deployment Security Guide

This comprehensive guide explains how to use the containerization and deployment security tools implemented for the Cosmic Music Application.

## Table of Contents

1. [Overview](#overview)
2. [Security Documentation](#security-documentation)
3. [Security Scripts](#security-scripts)
4. [Templates](#templates)
5. [Recommended Workflow](#recommended-workflow)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The containerization and deployment security components address four critical areas:

1. **Container Security Checks**: Scanning container images for vulnerabilities and ensuring secure container configuration
2. **Docker Configuration Security**: Securing the Docker daemon and runtime environment
3. **Deployment Pipeline Security**: Implementing secure CI/CD practices and secrets management
4. **Runtime Environment Security**: Monitoring and protecting containers at runtime

These components work together to provide a comprehensive security solution for containerized applications.

## Security Documentation

- **[CONTAINERIZATION_SECURITY.md](./CONTAINERIZATION_SECURITY.md)**: Primary documentation covering all aspects of containerization and deployment security

## Security Scripts

The following security scripts have been implemented to help secure your containerized deployment:

### 1. Container Image Scanner (`scripts/scan-container-image.sh`)

Scans Docker images for vulnerabilities and security issues.

```bash
# Basic usage
./scripts/scan-container-image.sh myapp:latest

# With options
./scripts/scan-container-image.sh -t trivy -s HIGH,CRITICAL -f json -o scan-results.json -e myapp:latest
```

Options:
- `-t, --tool`: Scanning tool to use (trivy, clair, snyk)
- `-s, --severity`: Severity levels to report (LOW,MEDIUM,HIGH,CRITICAL)
- `-f, --format`: Output format (table, json)
- `-o, --output`: Write results to file
- `-e, --exit-on-failure`: Exit with non-zero code if vulnerabilities are found
- `-v, --verbose`: Enable verbose output

### 2. Docker Configuration Security (`scripts/secure-docker-config.sh`)

Generates a secure Docker daemon configuration.

```bash
# Basic usage
sudo ./scripts/secure-docker-config.sh

# With options
sudo ./scripts/secure-docker-config.sh --user-remap default --enable-content-trust --verbose
```

Options:
- `--config-dir`: Directory for Docker configuration
- `--config-file`: Configuration filename
- `--user-remap`: User namespace remapping
- `--no-seccomp`: Disable seccomp profile
- `--no-live-restore`: Disable live restore capability
- `--enable-content-trust`: Enable Docker Content Trust
- `--experimental`: Enable experimental features
- `--verbose`: Enable verbose output

### 3. Docker Network Security (`scripts/setup-docker-networks.sh`)

Sets up secure network segmentation for Docker containers.

```bash
# Basic usage
./scripts/setup-docker-networks.sh

# With options
./scripts/setup-docker-networks.sh --prefix myapp --cleanup --verbose
```

Options:
- `--prefix`: Network name prefix
- `--cleanup`: Remove existing networks before creating
- `--verbose`: Enable verbose output

### 4. Container Runtime Security (`scripts/container-runtime-security.sh`)

Monitors running containers for security issues.

```bash
# Basic usage
./scripts/container-runtime-security.sh

# With options
./scripts/container-runtime-security.sh --interval 60 --resource-threshold 80 --verbose
```

Options:
- `--interval`: Monitoring interval in seconds
- `--log-dir`: Directory for logs
- `--resource-threshold`: Alert threshold for resource usage
- `--runtime-limit`: Max container runtime in minutes
- `--alert-command`: Command to run when an alert is triggered
- `--containers`: Comma-separated list of containers to monitor
- Various options to disable specific checks
- `--daemonize`: Run in background
- `--verbose`: Enable verbose output

### 5. Container Secrets Management (`scripts/container-secrets-manager.sh`)

Manages secrets for containerized applications.

```bash
# Add a secret
./scripts/container-secrets-manager.sh add --name DB_PASSWORD --value "secure-password"

# List secrets
./scripts/container-secrets-manager.sh list

# Apply secrets to a container
./scripts/container-secrets-manager.sh apply --container my-app
```

Operations:
- `add`: Add a new secret
- `remove`: Remove a secret
- `list`: List all secrets
- `apply`: Apply secrets to a container

Options:
- `--name`: Secret name
- `--value`: Secret value
- `--file`: Read secret from file
- `--container`: Container name
- `--secrets-dir`: Directory to store secrets
- `--env-file`: Use env file instead of Docker secrets
- `--encrypt`: Encrypt secrets
- `--encryption-key`: Key for encrypting/decrypting secrets
- `--verbose`: Enable verbose output

### 6. Docker Security Audit (`scripts/docker-security-audit.sh`)

Performs a comprehensive security audit of Docker installations and configurations.

```bash
# Basic usage
./scripts/docker-security-audit.sh

# With options
./scripts/docker-security-audit.sh --compose docker-compose.yml --dockerfile Dockerfile --output markdown --output-file audit-report.md
```

Options:
- `--compose`: Docker Compose file to audit
- `--dockerfile`: Dockerfile to audit
- `--config`: Docker daemon config file to audit
- `--output`: Output format (text, json, markdown)
- `--output-file`: Write output to file
- Various options to disable specific checks
- `--verbose`: Enable verbose output

### 7. Secure Deployment Checker (`scripts/secure-deployment-checker.sh`)

Combines all security checks into a comprehensive deployment security validation.

```bash
# Basic usage
./scripts/secure-deployment-checker.sh

# With options
./scripts/secure-deployment-checker.sh --compose docker-compose.yml --dockerfile Dockerfile --full-check --verbose
```

Options:
- `--compose`: Docker Compose file to check
- `--dockerfile`: Dockerfile to check
- `--config`: Docker daemon config file
- `--logs-dir`: Directory for logs
- `--report-dir`: Directory for reports
- `--output`: Output format (text, json, markdown)
- `--full-check`: Run all available checks
- `--remediate`: Attempt to fix common issues automatically
- `--verbose`: Enable verbose output

## Templates

The following templates demonstrate secure configurations:

### 1. Secure Dockerfile (`templates/Dockerfile.secure`)

A template Dockerfile that implements security best practices:
- Multi-stage builds to minimize image size
- Running as non-root user
- Proper permission management
- Using specific version tags
- Minimal base images
- Security-focused configuration

### 2. Secure Docker Compose (`templates/docker-compose.secure.yml`)

A template Docker Compose file with security configurations:
- Network segmentation
- Resource limits
- Health checks
- Secure volume mounts
- Capability restrictions
- Security options
- Proper service isolation

## Recommended Workflow

Follow these steps to secure your containerized deployment:

1. **Initial Security Review**
   ```bash
   ./scripts/secure-deployment-checker.sh --verbose
   ```

2. **Secure Docker Configuration**
   ```bash
   sudo ./scripts/secure-docker-config.sh --verbose
   ```

3. **Set Up Network Segmentation**
   ```bash
   ./scripts/setup-docker-networks.sh --prefix cosmic --cleanup --verbose
   ```

4. **Build Application with Secure Dockerfile**
   - Use the provided template as a starting point
   - Build with the container image scanner:
   ```bash
   ./scripts/scan-container-image.sh cosmic-app:latest -e
   ```

5. **Manage Secrets Securely**
   ```bash
   ./scripts/container-secrets-manager.sh add --name DB_URL --value "your-db-url" --encrypt
   ```

6. **Deploy with Secure Docker Compose**
   - Use the provided template as a starting point
   - Deploy your application

7. **Enable Runtime Monitoring**
   ```bash
   ./scripts/container-runtime-security.sh --daemonize --verbose
   ```

8. **Regular Security Audits**
   ```bash
   ./scripts/docker-security-audit.sh --output markdown --output-file audit-$(date +%Y%m%d).md
   ```

## Security Best Practices

1. **Always run containers as non-root users**
   - Create dedicated users in your Dockerfile
   - Use the USER directive to switch to non-root

2. **Apply the principle of least privilege**
   - Drop all capabilities by default: `--cap-drop=ALL`
   - Add only required capabilities: `--cap-add=NET_BIND_SERVICE`
   - Use `--security-opt no-new-privileges=true`

3. **Implement proper network segmentation**
   - Use internal networks for databases and sensitive services
   - Expose only necessary ports
   - Use explicit access controls between services

4. **Manage secrets securely**
   - Never store secrets in images or Docker Compose files
   - Use environment variables or Docker secrets
   - Implement encryption for sensitive data

5. **Use resource limits**
   - Set memory limits to prevent DoS attacks
   - Set CPU limits to ensure fair resource allocation
   - Configure appropriate ulimits

6. **Regular vulnerability scanning**
   - Scan all images before deployment
   - Implement automated scanning in CI/CD
   - Check for updates to base images

7. **Monitor container runtime behavior**
   - Implement logging and monitoring
   - Use tools like Falco for runtime security
   - Set up alerts for suspicious activities

## Troubleshooting

### Common Issues

#### Permission Denied
```
Error: Got permission denied while trying to connect to the Docker daemon socket
```
Solution: Add your user to the docker group or use sudo:
```bash
sudo usermod -aG docker $USER  # Requires logout/login
```

#### Network Conflicts
```
Error: Pool overlaps with other one on this address space
```
Solution: Use different subnet ranges or clean up existing networks:
```bash
docker network prune
```

#### Container Won't Start
Check for security-related issues:
```bash
docker logs container_name
```

For capability-related issues, check if your container needs specific capabilities:
```bash
docker run --cap-add=SYS_PTRACE container_name
```

### Getting Help

For more information on the security tools:
```bash
./scripts/secure-deployment-checker.sh --help
```

Refer to the documentation in `docs/CONTAINERIZATION_SECURITY.md` for detailed security information.