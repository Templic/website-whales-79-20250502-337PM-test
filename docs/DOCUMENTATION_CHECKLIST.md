# Documentation Update Checklist

This checklist ensures that documentation updates are comprehensive, consistent, and properly integrate with existing documentation.

## Pre-Update Checklist

Before updating documentation:

- [ ] Review existing documentation for the feature/component being updated
- [ ] Identify all related documentation files that may need updates
- [ ] Check for cross-references that might be affected
- [ ] Review the most recent documentation style and formatting

## Component Documentation Checklist

When documenting a component:

- [ ] File header with proper JSDoc format:
  ```tsx
  /**
   * @file ComponentName.tsx
   * @description Brief description of the component's purpose
   * @author [Original Author]
   * @created [Creation Date]
   * @updated [Current Date]
   * @source [Original Source/Inspiration, if applicable]
   * @status [Active | Deprecated | Experimental]
   */
  ```

- [ ] Component JSDoc with detailed description:
  ```tsx
  /**
   * ComponentName
   * 
   * Detailed description of what the component does and its purpose.
   * Include any important implementation details or usage considerations.
   * 
   * @example
   * ```tsx
   * <ComponentName 
   *   prop1="value" 
   *   prop2={value2} 
   * />
   * ```
   * 
   * @see RelatedComponent - Link to related components
   */
  ```

- [ ] Props interface with JSDoc comments:
  ```tsx
  /**
   * Props for the ComponentName component
   */
  interface ComponentNameProps {
    /**
     * Description of what this prop does
     * @default default value (if applicable)
     */
    propName: PropType;
  }
  ```

- [ ] If deprecating a component:
  - [ ] Update status to "Deprecated" in file header
  - [ ] Add `@deprecated` tag with migration guidance
  - [ ] Add console warning
  - [ ] Update any README files that reference this component

## Feature Documentation Checklist

When documenting a feature:

- [ ] Update or create feature README.md with:
  - [ ] Feature description and purpose
  - [ ] List of components with brief descriptions
  - [ ] Usage examples
  - [ ] Integration guidance
  - [ ] Deprecated components and replacements (if applicable)

- [ ] Update architecture documentation if the feature changes the system architecture

- [ ] Update routes documentation if the feature adds or modifies routes

- [ ] Add security considerations if applicable

## General Documentation Update Checklist

For any documentation update:

- [ ] Check cross-references and update as needed
- [ ] Use consistent formatting and style
- [ ] Include code examples where appropriate
- [ ] Validate technical accuracy
- [ ] Update "Last Updated" date
- [ ] Update CHANGELOG.md with documentation changes

## Repository Structure Documentation

When updating repository structure:

- [ ] Update REPOSITORY_STRUCTURE.md with new directories
- [ ] Update directory descriptions
- [ ] Ensure the directory tree is current
- [ ] Update relevant section descriptions

## Security Documentation Checklist

When updating security-related features:

- [ ] Update security implementation details
- [ ] Document compliance impacts
- [ ] Update security best practices guide if applicable
- [ ] Document any security vulnerabilities addressed (without exposing exploits)
- [ ] Update security scan procedures if necessary

## Documentation Review Checklist

Before finalizing documentation:

- [ ] Check for spelling and grammar errors
- [ ] Ensure all code examples are functional and use current syntax
- [ ] Verify all file paths and references are accurate
- [ ] Confirm all links work properly
- [ ] Ensure documentation aligns with current codebase
- [ ] Get peer review for technical accuracy

## Post-Update Verification

After documentation update:

- [ ] Check rendering of markdown files
- [ ] Verify all links work
- [ ] Confirm navigation between documentation files is coherent
- [ ] Update documentation index if necessary
- [ ] Add entry to CHANGELOG.md regarding documentation updates

---

*Remember: Good documentation is clear, concise, accurate, and helpful to both new and experienced developers.*

*Last updated: 2025-04-15*