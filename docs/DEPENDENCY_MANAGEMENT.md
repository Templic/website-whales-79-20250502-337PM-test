# Dependency Management Guide

This document outlines the procedures for keeping dependencies up-to-date and secure in the project.

## Automated Dependency Updates

The project includes automated tools to help manage dependencies and identify security vulnerabilities.

### Using the Dependency Update Script

A Node.js script is available to automate the process of checking for outdated dependencies, updating them, and running security audits:

```bash
node scripts/update-dependencies.js
```

This script will:
1. Check for outdated packages
2. Run a security audit to identify vulnerabilities
3. Update dependencies to their latest compatible versions
4. Run a post-update security audit to verify which vulnerabilities were fixed
5. Generate a detailed log file in `logs/dependency-updates.log`

### CI/CD Integration (GitHub)

For GitHub deployments, a workflow file is included at `.github/workflows/dependency-updates.yml` that:

1. Runs automatically every Monday at 1:00 AM
2. Can be triggered manually when needed
3. Creates a pull request with the updated dependencies
4. Includes audit results in the PR description

## Manual Dependency Management

For manual dependency management, follow these steps:

### Checking for Outdated Dependencies

```bash
npm outdated
```

This will show a list of outdated packages with their current, wanted, and latest versions.

### Running Security Audits

```bash
npm audit
```

This will check your dependencies for known vulnerabilities.

### Updating Dependencies

To update all dependencies to their latest compatible versions:

```bash
npm update
```

To update a specific package:

```bash
npm update package-name
```

### Fixing Vulnerabilities

To fix vulnerabilities that have available remediations:

```bash
npm audit fix
```

For vulnerabilities that require major version updates:

```bash
npm audit fix --force
```

⚠️ Use `--force` with caution as it may break your application due to incompatible changes.

## Best Practices

1. **Regular Updates**: Run dependency updates at least monthly
2. **Verify After Updates**: Always test the application after updating dependencies
3. **Review Major Version Updates**: Carefully review changes for major version updates
4. **Keep Security Logs**: Retain logs of security audits and updates
5. **Monitor Security Bulletins**: Subscribe to security bulletins for critical dependencies

## Troubleshooting

### Common Issues

1. **Breaking Changes**: If updates introduce breaking changes, consult the package's changelog and make necessary code adjustments
2. **Peer Dependencies**: If you encounter peer dependency warnings, you may need to manually install compatible versions
3. **Audit Errors**: If npm audit reports errors, try clearing the npm cache with `npm cache clean --force`

For persistent issues, consult the documentation for the specific package causing problems.