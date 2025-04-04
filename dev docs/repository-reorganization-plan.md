# Repository Reorganization Plan

This document outlines the plan for reorganizing the repository structure to improve maintainability, address conflicts between old page versions, and efficiently merge imported components from various sources.

## Goals

1. Create a consistent and organized directory structure
2. Properly categorize components by their function (common, layout, feature-specific, etc.)
3. Separate archived pages to prevent confusion
4. Clearly mark imported components with proper attribution
5. Update import paths throughout the codebase to reflect new locations
6. Provide a clean migration path with backup options if needed

## New Directory Structure

```
client/src/
├── assets/                     # Static assets (images, fonts, etc.)
├── components/
│   ├── common/                 # Common UI components (buttons, cards, etc.)
│   ├── layout/                 # Layout components (Header, Footer, etc.)
│   ├── features/               # Feature-specific components
│   │   ├── shop/               # Shop-related components  
│   │   ├── music/              # Music-related components
│   │   ├── audio/              # Audio-related components
│   │   ├── cosmic/             # Cosmic experience components
│   │   ├── admin/              # Admin-related components
│   │   ├── community/          # Community-related components
│   │   └── immersive/          # Immersive experience components
│   └── imported/               # Clearly marked components from other sources
│       ├── v0/                 # Components imported from v0
│       └── lovable/            # Components imported from lovable.dev
├── hooks/                      # Custom hooks
├── lib/                        # Utility functions and helpers
├── pages/
│   ├── shop/                   # Shop-related pages
│   ├── admin/                  # Admin portal pages
│   ├── music/                  # Music-related pages
│   ├── blog/                   # Blog-related pages
│   ├── community/              # Community-related pages
│   ├── experience/             # Experience-related pages
│   └── archived/               # Archived versions of pages (not in production)
│       └── test/               # Archived test pages
├── store/                      # State management
└── types/                      # TypeScript type definitions
```

## Implementation Plan

We've created several scripts to automate this reorganization process:

1. `scripts/repository-reorganization.js` - Creates the new directory structure
2. `scripts/component-migration.js` - Migrates components to their new locations
3. `scripts/page-reorganization.js` - Reorganizes pages and marks archived pages
4. `scripts/update-imports.js` - Updates import paths throughout the codebase
5. `scripts/create-backup.js` - Creates a backup before making changes

### How to Run the Reorganization

1. **Create a backup first**
   ```
   node scripts/create-backup.js
   ```
   This will create a backup in the `backups/` directory with a timestamp.

2. **Test the reorganization without making changes**
   ```
   node tmp/scripts/reorganize-all.js --test
   ```
   This will show what changes would be made without actually modifying files.

3. **Run the full reorganization**
   ```
   node tmp/scripts/reorganize-all.js
   ```
   This will execute all the reorganization steps in sequence.

4. **If needed, run individual scripts**
   ```
   node scripts/repository-reorganization.js
   node scripts/component-migration.js
   node scripts/page-reorganization.js
   node scripts/update-imports.js
   ```

### After Reorganization

Once the reorganization is complete:

1. Test the application thoroughly to ensure all components and pages work correctly
2. Check that all routes are functioning properly
3. Review any TypeScript errors and fix them (particularly related to import paths)
4. Update any documentation to reflect the new structure

## Component Migration Details

Components will be migrated based on their function:

- **Common Components**: General-purpose UI components like buttons, cards, etc.
- **Layout Components**: Components that define the overall structure like headers, footers, etc.
- **Feature Components**: Components specific to particular features of the application
- **Imported Components**: Components from external sources with clear attribution

Each migrated component will have a header comment added indicating:
- Its source
- When it was migrated
- Any special notes about compatibility

## Page Reorganization Details

Pages will be organized by feature area. Archived pages will:
- Be moved to the `pages/archived/` directory
- Have a special header comment indicating they are archived
- Display a banner at the top when rendered to indicate they are archived
- Have their routes commented out in the routing configuration

## Import Path Updates

The `update-imports.js` script will automatically update import paths throughout the codebase to reflect the new component locations. This includes:

- Fixing relative paths
- Updating alias paths (e.g., `@/components/...`)
- Ensuring proper pathing for components moved to feature-specific directories

## Rollback Plan

If issues arise after reorganization:

1. You can restore from the backup created in step 1
2. Or selectively copy files back from the backup as needed

## Future Maintenance

To maintain this organization going forward:

1. Keep components in their appropriate category directories
2. Mark deprecated components and pages clearly
3. Move truly obsolete code to the archived directories
4. Update this document as the organization evolves