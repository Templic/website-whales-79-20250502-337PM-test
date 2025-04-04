# Repository Reorganization Scripts

This directory contains scripts to help with reorganizing the repository structure to ensure better organization, maintainability, and separation between current, imported, and archived components.

## Overview

The reorganization follows the plan outlined in `docs/REPOSITORY_ORGANIZATION.md`. These scripts automate the migration process to reduce manual effort and potential errors.

## Scripts Included

1. **repository-reorganization.js**
   - Creates the new directory structure
   - Adds README files to document each directory's purpose

2. **component-migration.js**
   - Migrates components to their new locations
   - Adds header comments indicating component source and purpose
   - Separates components into common, layout, feature-specific, and imported categories

3. **page-reorganization.js**
   - Reorganizes page components
   - Clearly marks archived pages with headers and visual banners
   - Updates routing in App.tsx to comment out archived pages

4. **update-imports.js**
   - Updates import paths throughout the codebase
   - Ensures references to migrated components are maintained

5. **reorganize-all.js**
   - Orchestrates the entire reorganization process
   - Runs scripts in the correct sequence
   - Creates a backup before making changes
   - Provides interactive prompts for confirmation

## Preparation

Before running these scripts, you should:

1. **Customize the migration mappings**
   - Edit `component-migration.js` to list the actual components to migrate
   - Edit `page-reorganization.js` to list the pages to reorganize
   - Edit `update-imports.js` to map old import paths to new ones

2. **Commit or backup your code**
   - Ensure all current work is committed to version control
   - The main script will create a backup, but having a clean Git state is recommended

## Usage

1. **Run the complete reorganization**:
   ```
   node scripts/reorganize-all.js
   ```
   This will guide you through the entire process with confirmation prompts.

2. **Run individual scripts** (if you prefer a step-by-step approach):
   ```
   node scripts/repository-reorganization.js
   node scripts/component-migration.js
   node scripts/page-reorganization.js
   node scripts/update-imports.js
   ```

## After Reorganization

After running the scripts, you should:

1. **Review the changes**
   - Check that components and pages have been moved correctly
   - Verify imports have been updated

2. **Run tests**
   - Ensure the application still functions correctly
   - Check for any runtime errors

3. **Update documentation**
   - Ensure project documentation reflects the new structure

## Troubleshooting

If you encounter issues:

1. **Import errors**: Manually update any imports that weren't correctly transformed
2. **Missing components**: Check the console output for any migration failures
3. **Restore from backup**: If needed, you can restore from the backup created at the start

## Customization

These scripts are templates that need to be customized for your specific codebase. The key areas to modify are:

- Component migration mappings in `component-migration.js`
- Page migration mappings in `page-reorganization.js`
- Import path mappings in `update-imports.js`
