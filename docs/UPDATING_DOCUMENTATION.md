# Updating Documentation Guide

This guide provides instructions on how to update documentation when making changes to the repository structure, components, or architecture.

## When to Update Documentation

Documentation should be updated in the following cases:

1. Adding new features or components
2. Modifying existing components
3. Reorganizing directory structure
4. Deprecating components or features
5. Changing API endpoints
6. Updating the database schema

## Documentation Files to Update

### Repository Structure Documentation

When changing the repository structure:

1. Update `docs/REPOSITORY_STRUCTURE.md` with the new directory structure
2. Update any affected feature README files
3. Create README files for new directories

Example update to REPOSITORY_STRUCTURE.md:

```diff
 client/src/
 ├── components/
 │   ├── features/
 │   │   ├── shop/
+│   │   ├── payment/        # New payment processing components
 │   │   ├── music/
 │   │   └── ...
```

### Component Documentation

When adding or modifying components:

1. Update or create component JSDoc comments
2. Update the corresponding feature README.md
3. Update `docs/COMPONENT_DOCUMENTATION_GUIDE.md` if documentation standards change

Example component documentation:

```tsx
/**
 * @file PaymentForm.tsx
 * @description Handles payment form processing and validation
 * @author Jane Smith
 * @created 2025-04-10
 * @status Active
 */

/**
 * PaymentForm
 * 
 * A form component for processing payments securely.
 * Integrates with the payment gateway API.
 * 
 * @example
 * ```tsx
 * <PaymentForm 
 *   amount={50}
 *   currency="USD"
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
```

### Route Documentation

When changing routes:

1. Update `docs/ROUTES.md` with the new routes
2. Update the route comments in `App.tsx`

Example update to ROUTES.md:

```diff
 ### Shop Routes
 | Route | Component | Description |
 |-------|-----------|-------------|
 | `/shop` | `ShopPage` | Main shop page |
+| `/shop/payment` | `PaymentPage` | Payment processing page |
 | `/shop/product/:slug` | `ProductPage` | Individual product page |
```

### Architecture Documentation

When changing architectural components:

1. Update `docs/ARCHITECTURE.md` with the new architecture
2. Update any affected diagrams or flowcharts

Example update to ARCHITECTURE.md:

```diff
 ### API Structure
 
 ```
 /api
 ├── /auth
 │   ├── POST /login
 │   ├── POST /logout
 │   └── POST /register
 ├── /users
+├── /payments
+│   ├── POST /process
+│   └── GET /status/:id
 ├── /music
 ```
```

## Documentation Process

### 1. Identify Documentation Needs

Before making changes, identify which documentation will need to be updated.

### 2. Update Documentation In Sync with Code Changes

Update documentation as part of the same commit or pull request as the code changes. This ensures documentation stays in sync with the code.

### 3. Review Documentation Changes

When reviewing code changes, also review documentation changes for accuracy and completeness.

### 4. Test Documentation

Ensure that any code examples in documentation are correct and up-to-date with the current API.

## Documentation Best Practices

### Keep It Simple and Clear

- Use clear, concise language
- Use examples to illustrate usage
- Use lists and tables for easy scanning

### Maintain Consistency

- Follow the established documentation format
- Use consistent terminology
- Adhere to the directory structure conventions

### Document Decisions

When making significant changes, document the reasoning:

```markdown
## Migration from v1 to v2 API

The v1 API has been deprecated in favor of the v2 API for the following reasons:

1. Improved performance through pagination
2. Better error handling with detailed error responses
3. Support for new features not possible with the v1 architecture
```

### Update Changelogs

When making significant changes, update the changelog with:

```markdown
### Added
- New payment processing components
- Support for multiple payment methods

### Changed
- Refactored shop checkout flow
- Updated product page layout

### Deprecated
- Old payment form (`OldPaymentForm.tsx`)
```

## Conclusion

By following this guide, we ensure that documentation remains accurate and up-to-date as the codebase evolves. Proper documentation is essential for maintainability and developer experience.
