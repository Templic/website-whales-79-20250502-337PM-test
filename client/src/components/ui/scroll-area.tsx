import React from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportRef?: React.RefObject<HTMLDivElement>;
}

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children, viewportRef, ...props }, ref) => {
    const internalViewportRef = React.useRef<HTMLDivElement>(null);
    const actualViewportRef = viewportRef || internalViewportRef;

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        <div
          ref={actualViewportRef}
          className="h-full w-full overflow-auto"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {children}
        </div>
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ orientation = 'vertical', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`absolute flex touch-none select-none transition-colors ${
          orientation === 'vertical'
            ? 'h-full w-2.5 right-0 top-0'
            : 'h-2.5 w-full bottom-0 right-0'
        } ${className}`}
        {...props}
      >
        <div className="relative flex-1 rounded-full bg-slate-700/30 hover:bg-slate-700/50" />
      </div>
    );
  }
);
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea };