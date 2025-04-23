/**
 * cosmic-table.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React from 'react';
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const tableContainerVariants = cva(
  'w-full overflow-auto',
  {
    variants: {
      variant: {
        default: 'bg-gray-800/20 rounded-lg border border-gray-700',
        cosmic: 'bg-gray-900/30 rounded-lg border border-cosmic-primary/30',
        frosted: 'bg-gray-900/20 backdrop-blur-sm rounded-lg border border-white/10',
        minimal: 'bg-transparent'
      },
      padding: {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6'
      },
      maxHeight: {
        none: '',
        sm: 'max-h-[300px]',
        md: 'max-h-[500px]',
        lg: 'max-h-[700px]',
        xl: 'max-h-[900px]'
      }
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      maxHeight: 'none'
    }
  }
);

const tableVariants = cva(
  'w-full border-collapse text-sm',
  {
    variants: {
      variant: {
        default: 'text-gray-200',
        cosmic: 'text-white',
        muted: 'text-gray-400'
      },
      textAlign: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
      },
      spacing: {
        compact: '',
        normal: '',
        relaxed: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      textAlign: 'left',
      size: 'md',
      spacing: 'normal'
    }
  }
);

const tableHeaderVariants = cva(
  'border-b font-medium',
  {
    variants: {
      variant: {
        default: 'border-gray-700 bg-gray-800/40',
        cosmic: 'border-cosmic-primary/30 bg-gray-900/60',
        gradient: 'border-gray-700 bg-gradient-to-r from-cosmic-primary/10 to-cosmic-accent/10',
        minimal: 'border-gray-700'
      },
      sticky: {
        true: 'sticky top-0',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      sticky: false
    }
  }
);

const tableCellVariants = cva(
  'px-4 py-3',
  {
    variants: {
      variant: {
        default: '',
        hover: 'group-hover:bg-gray-700/30',
        cosmic: 'group-hover:bg-cosmic-primary/10'
      },
      border: {
        none: '',
        x: 'border-x border-gray-700',
        y: 'border-y border-gray-700',
        all: 'border border-gray-700'
      }
    },
    defaultVariants: {
      variant: 'default',
      border: 'none'
    }
  }
);

const tableRowVariants = cva(
  'group transition-colors',
  {
    variants: {
      variant: {
        default: 'hover:bg-gray-700/20',
        cosmic: 'hover:bg-cosmic-primary/5',
        striped: 'even:bg-gray-800/20',
        stripedCosmic: 'even:bg-cosmic-primary/5 hover:bg-cosmic-primary/10',
        highlight: 'hover:bg-cosmic-highlight/10',
        none: ''
      },
      border: {
        none: '',
        bottom: 'border-b border-gray-700/50',
        top: 'border-t border-gray-700/50',
        all: 'border-b border-t border-gray-700/50'
      }
    },
    defaultVariants: {
      variant: 'default',
      border: 'bottom'
    }
  }
);

// Define types for the components
export interface CosmicTableContainerProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tableContainerVariants> {}

export interface CosmicTableProps 
  extends React.TableHTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {}

export interface CosmicTableHeaderProps 
  extends React.TableHTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {}

export interface CosmicTableRowProps 
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

export interface CosmicTableCellProps 
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

export interface CosmicTableHeadCellProps 
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

// Create components
const CosmicTableContainer = React.forwardRef<HTMLDivElement, CosmicTableContainerProps>(
  ({ className, variant, padding, maxHeight, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(tableContainerVariants({ variant, padding, maxHeight }), className)}
      {...props}
    />
  )
);
CosmicTableContainer.displayName = 'CosmicTableContainer';

const CosmicTable = React.forwardRef<HTMLTableElement, CosmicTableProps>(
  ({ className, variant, textAlign, size, spacing, ...props }, ref) => (
    <table
      ref={ref}
      className={cn(tableVariants({ variant, textAlign, size, spacing }), className)}
      {...props}
    />
  )
);
CosmicTable.displayName = 'CosmicTable';

const CosmicTableHeader = React.forwardRef<HTMLTableSectionElement, CosmicTableHeaderProps>(
  ({ className, variant, sticky, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(tableHeaderVariants({ variant, sticky }), className)}
      {...props}
    />
  )
);
CosmicTableHeader.displayName = 'CosmicTableHeader';

const CosmicTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={className}
      {...props}
    />
  )
);
CosmicTableBody.displayName = 'CosmicTableBody';

const CosmicTableRow = React.forwardRef<HTMLTableRowElement, CosmicTableRowProps>(
  ({ className, variant, border, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ variant, border }), className)}
      {...props}
    />
  )
);
CosmicTableRow.displayName = 'CosmicTableRow';

const CosmicTableCell = React.forwardRef<HTMLTableCellElement, CosmicTableCellProps>(
  ({ className, variant, border, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(tableCellVariants({ variant, border }), className)}
      {...props}
    />
  )
);
CosmicTableCell.displayName = 'CosmicTableCell';

const CosmicTableHeadCell = React.forwardRef<HTMLTableCellElement, CosmicTableHeadCellProps>(
  ({ className, variant, border, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(tableCellVariants({ variant, border }), className)}
      {...props}
    />
  )
);
CosmicTableHeadCell.displayName = 'CosmicTableHeadCell';

const CosmicTableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('border-t border-gray-700 bg-gray-800/40 font-medium', className)}
      {...props}
    />
  )
);
CosmicTableFooter.displayName = 'CosmicTableFooter';

export {
  CosmicTableContainer,
  CosmicTable,
  CosmicTableHeader,
  CosmicTableBody,
  CosmicTableFooter,
  CosmicTableRow,
  CosmicTableCell,
  CosmicTableHeadCell
};