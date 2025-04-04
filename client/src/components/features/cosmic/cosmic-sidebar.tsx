/**
 * cosmic-sidebar.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the sidebar variants
const sidebarVariants = cva(
  'fixed top-0 z-40 h-screen transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white',
        cosmic: 'bg-cosmic-900/90 backdrop-blur-md text-white border-r border-cosmic-primary/20',
        frosted: 'bg-gray-900/60 backdrop-blur-md text-white border-r border-white/10',
        minimal: 'bg-gray-950 text-white',
        glow: 'bg-cosmic-900/80 backdrop-blur-sm text-white border-r border-cosmic-primary/30 shadow-cosmic shadow-cosmic-primary/10',
      },
      position: {
        left: 'left-0',
        right: 'right-0',
      },
      animation: {
        none: '',
        slide: '',
        fade: 'transition-opacity',
        zoom: 'transition-all',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'left',
      animation: 'slide',
    },
  }
);

// Define the sidebar overlay variants
const overlayVariants = cva(
  'fixed inset-0 z-30 transition-opacity duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
        cosmic: 'bg-cosmic-950/60 backdrop-blur-sm',
        frosted: 'bg-black/40 backdrop-blur-sm',
        minimal: 'bg-black/70',
        glow: 'bg-black/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the header variants
const headerVariants = cva(
  'flex items-center justify-between p-4',
  {
    variants: {
      variant: {
        default: 'border-b border-gray-800',
        cosmic: 'border-b border-cosmic-primary/20',
        frosted: 'border-b border-white/10',
        minimal: 'border-b border-gray-800',
        glow: 'border-b border-cosmic-primary/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define types for the sidebar item and section
export type SidebarItemType = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  badgeColor?: string;
  items?: SidebarItemType[];
};

export type SidebarSectionType = {
  title?: string;
  items: SidebarItemType[];
};

export interface CosmicSidebarProps extends VariantProps<typeof sidebarVariants> {
  isOpen?: boolean;
  onClose?: () => void;
  width?: string;
  collapsedWidth?: string;
  collapsible?: boolean;
  sections?: SidebarSectionType[];
  footer?: React.ReactNode;
  header?: React.ReactNode;
  title?: string;
  logo?: React.ReactNode;
  mobileBreakpoint?: string;
  className?: string;
  overlayClassName?: string;
  closeOnNavigation?: boolean;
  activeItemId?: string;
  onItemClick?: (item: SidebarItemType) => void;
}

export const CosmicSidebar: React.FC<CosmicSidebarProps> = ({
  isOpen = true,
  onClose,
  width = '280px',
  collapsedWidth = '80px',
  collapsible = true,
  sections = [],
  footer,
  header,
  title,
  logo,
  mobileBreakpoint = '768px',
  className,
  overlayClassName,
  closeOnNavigation = true,
  activeItemId,
  variant = 'default',
  position = 'left',
  animation = 'slide',
  onItemClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Check window size on mount and resize
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < parseInt(mobileBreakpoint));
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    
    return () => window.removeEventListener('resize', checkSize);
  }, [mobileBreakpoint]);

  // Handle section toggle
  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Handle item click
  const handleItemClick = (item: SidebarItemType) => {
    if (item.onClick) {
      item.onClick();
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
    
    if (closeOnNavigation && isMobile && onClose) {
      onClose();
    }
  };

  // Calculate sidebar width style
  const sidebarWidth = isMobile 
    ? isOpen ? width : '0px'
    : collapsed ? collapsedWidth : width;

  // Calculate content transformations for animations
  const contentTransform = (() => {
    if (animation === 'slide') {
      if (position === 'left') {
        return isOpen ? 'translateX(0)' : `translateX(-100%)`;
      } else {
        return isOpen ? 'translateX(0)' : `translateX(100%)`;
      }
    } else if (animation === 'zoom') {
      return isOpen ? 'scale(1)' : 'scale(0.95)';
    }
    return undefined;
  })();

  return (
    <>
      {/* Backdrop/Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className={cn(
            overlayVariants({ variant }),
            'md:hidden',
            overlayClassName
          )}
          style={{ opacity: isOpen ? 1 : 0 }}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          sidebarVariants({ variant, position, animation }),
          className
        )}
        style={{ 
          width: sidebarWidth,
          transform: contentTransform,
          opacity: animation === 'fade' ? (isOpen ? 1 : 0) : 1,
        }}
      >
        {/* Sidebar Header */}
        {(header || title || logo) && (
          <div className={cn(headerVariants({ variant }))}>
            {header || (
              <>
                <div className="flex items-center space-x-3">
                  {logo && <div className="flex-shrink-0">{logo}</div>}
                  {(!collapsed || isMobile) && title && (
                    <h2 className="font-semibold truncate">{title}</h2>
                  )}
                </div>
                <div className="flex items-center">
                  {collapsible && !isMobile && (
                    <button
                      onClick={() => setCollapsed(prev => !prev)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                      {collapsed 
                        ? position === 'left' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                        : position === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                  )}
                  
                  {isMobile && (
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Sidebar Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          <nav className="flex-1 px-4 py-4">
            {sections.map((section, index) => (
              <div key={index} className="mb-6">
                {section.title && (!collapsed || isMobile) && (
                  <h3 className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.id === activeItemId;
                    const hasSubItems = item.items ? item.items.length > 0 : false;
                    const isOpen = openSections.includes(item.id);
                    
                    return (
                      <li key={item.id}>
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (hasSubItems) {
                                toggleSection(item.id);
                              } else {
                                handleItemClick(item);
                              }
                            }}
                            className={cn(
                              "flex items-center w-full px-3 py-2 rounded-md transition-colors",
                              isActive 
                                ? "bg-cosmic-primary/20 text-white" 
                                : "text-gray-300 hover:bg-gray-800 hover:text-white",
                              collapsed && !isMobile && "justify-center",
                            )}
                          >
                            {item.icon && (
                              <span className={cn(
                                "flex-shrink-0",
                                (!collapsed || isMobile) && "mr-3"
                              )}>
                                {item.icon}
                              </span>
                            )}
                            
                            {(!collapsed || isMobile) && (
                              <span className="flex-1 truncate">{item.label}</span>
                            )}
                            
                            {item.badge && (!collapsed || isMobile) && (
                              <span className={cn(
                                "ml-2 px-2 py-0.5 text-xs rounded-full",
                                item.badgeColor || "bg-cosmic-primary/20 text-cosmic-primary"
                              )}>
                                {item.badge}
                              </span>
                            )}
                            
                            {hasSubItems && (!collapsed || isMobile) && (
                              <ChevronRight className={cn(
                                "w-4 h-4 transition-transform ml-2",
                                isOpen && "transform rotate-90"
                              )} />
                            )}
                          </button>
                        </div>
                        
                        {/* Sub-items */}
                        {hasSubItems && isOpen && (!collapsed || isMobile) && (
                          <ul className="mt-1 ml-4 pl-4 border-l border-gray-800 space-y-1">
                            {item.items?.map(subItem => {
                              const isSubActive = subItem.id === activeItemId;
                              
                              return (
                                <li key={subItem.id}>
                                  <button
                                    onClick={() => handleItemClick(subItem)}
                                    className={cn(
                                      "flex items-center w-full px-3 py-2 rounded-md transition-colors",
                                      isSubActive 
                                        ? "bg-cosmic-primary/10 text-white" 
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    )}
                                  >
                                    {subItem.icon && (
                                      <span className="mr-3 flex-shrink-0">{subItem.icon}</span>
                                    )}
                                    <span className="flex-1 truncate">{subItem.label}</span>
                                    
                                    {subItem.badge && (
                                      <span className={cn(
                                        "ml-2 px-2 py-0.5 text-xs rounded-full",
                                        subItem.badgeColor || "bg-cosmic-primary/20 text-cosmic-primary"
                                      )}>
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          
          {/* Footer */}
          {footer && (
            <div className={cn(
              "mt-auto p-4 border-t",
              variant === 'cosmic' ? "border-cosmic-primary/20" : "border-gray-800"
            )}>
              {(!collapsed || isMobile) ? footer : (
                <div className="flex justify-center">{footer}</div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};