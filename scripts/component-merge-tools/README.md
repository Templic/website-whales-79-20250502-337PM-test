# Component Merge and Analysis Tools

This directory contains a set of tools for analyzing, merging, and consolidating React components in the codebase. These tools help identify duplicate or similar components and reorganize them according to a consistent architecture.

## Overview of Tools

1. **enhanced-merge-components.js** - An improved component merging system that analyzes components and places them in appropriate feature directories based on their content and purpose.

2. **analyze-similar-components.js** - Analyzes all components to identify similar or duplicate components that could be consolidated.

3. **consolidate-components.js** - Helps consolidate similar components based on a consolidation plan.

4. **enhanced-update-imports.js** - Updates import paths for components that were moved or renamed during reorganization.

5. **run-component-merge.js** - Orchestration script that runs the various tools in the correct sequence.

## How to Use

### Quick Start

For a guided process with confirmation prompts:

```bash
node scripts/run-component-merge.js
```

This will:
1. Create a backup of your components
2. Run the enhanced component merge
3. Analyze components for similarities
4. (Optionally) Run the consolidation process if enabled

By default, the script runs in test mode, which shows what would happen without making actual changes.

### Step-by-Step Process

For more control, you can run each script individually:

1. **Merge Components**:
   ```bash
   node scripts/enhanced-merge-components.js
   ```
   This will analyze each component and place it in the appropriate feature directory.

2. **Analyze Similar Components**:
   ```bash
   node scripts/analyze-similar-components.js
   ```
   This generates reports in the `reports/` directory with details about similar components.

3. **Consolidate Components** (after reviewing the reports):
   ```bash
   node scripts/consolidate-components.js
   ```
   This consolidates components based on the generated consolidation plan.

4. **Update Import Paths**:
   ```bash
   node scripts/enhanced-update-imports.js
   ```
   This updates import paths throughout the codebase to reflect the new component locations.

## Configuration

Each script has a configuration section at the top of the file. Important options include:

- **testRun**: When set to `true`, the scripts will only simulate operations without making actual changes.
- **createBackup**: Creates a backup of components before making changes.
- **deleteOriginals**: Whether to delete original component files after consolidation.
- **addDeprecationNotices**: Adds deprecation notices to original components pointing to their consolidated versions.

## Reports

The analysis tools generate several reports in the `reports/` directory:

- `component-analysis.json`: Detailed analysis of all components
- `similar-components.json`: Groups of similar components
- `consolidation-plan.json`: Plan for consolidating similar components
- `component-report.html`: Human-readable HTML report
- `broken-imports.json`: List of files with potentially broken imports after reorganization

## Enhanced Component Categorization

Components are categorized into these main areas:

- **features/audio**: Audio playback, visualization, and music-related components
- **features/cosmic**: Cosmic visuals, particles, backgrounds, and geometry
- **features/immersive**: Immersive experiences and ceremonies
- **features/shop**: E-commerce, product showcases, and shopping
- **features/community**: Community engagement, feedback, and newsletter
- **features/admin**: Admin panels and management tools
- **ui**: Generic UI components like buttons, cards, etc.
- **layout**: Page layouts, headers, footers, and navigation
- **common/accessibility**: Accessibility controls and features
- **common/system**: Theme providers, fonts, and system utilities

## Best Practices

1. **Always back up your components** before running these tools.
2. **Run in test mode first** to see what changes would be made.
3. **Review the reports** thoroughly before running the consolidation process.
4. **Test your application** after each step to catch issues early.
5. **Update your import paths** after consolidation to fix broken references.

## Troubleshooting

- If you encounter import errors after running these tools, check the `broken-imports.json` report and update the imports manually or run `enhanced-update-imports.js`.
- If the consolidation introduces bugs, restore from your backup and consider a more selective consolidation approach.
- For components that should not be merged, you can edit the `consolidation-plan.json` file to remove them from the plan.
