/**
 * cosmic-tabs.tsx
 * 
 * Component Type: common
 * Migrated as part of the repository reorganization.
 */
import React, { useState } from 'react';
import { cn } from "@/lib/utils"
import { cn } from '../../lib/utils';

export interface CosmicTabsProps {
  tabs: {
    id: string;
    label: React.ReactNode;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'cosmic' | 'underline';
  alignment?: 'start' | 'center' | 'end' | 'stretch';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

const CosmicTabs: React.FC<CosmicTabsProps> = ({
  tabs,
  defaultTab,
  variant = 'default',
  alignment = 'start',
  size = 'md',
  animated = true,
  className,
  tabClassName,
  contentClassName,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  
  // Base tabs container styles
  const baseContainerStyles = 'mb-4';
  
  // Tab alignment styles
  const alignmentStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    stretch: 'justify-start grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2',
  };
  
  // Base tab styles
  const baseTabStyles = 'inline-flex items-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cosmic-primary/30 text-sm';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-2.5 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };
  
  // Variant styles
  const variantStyles = {
    default: 'border-b-2 border-transparent hover:text-cosmic-primary text-cosmic-text-light data-[active=true]:border-cosmic-primary data-[active=true]:text-cosmic-primary',
    pills: 'rounded-full hover:bg-cosmic-primary/10 hover:text-cosmic-primary text-cosmic-text-light data-[active=true]:bg-cosmic-primary/20 data-[active=true]:text-cosmic-primary',
    cosmic: 'border border-transparent rounded-md text-cosmic-text-light hover:border-cosmic-primary/30 hover:bg-cosmic-primary/10 hover:text-cosmic-primary data-[active=true]:border-cosmic-primary/50 data-[active=true]:bg-cosmic-primary/20 data-[active=true]:text-cosmic-primary',
    underline: 'pb-1 border-b-2 border-transparent text-cosmic-text-light hover:text-cosmic-primary data-[active=true]:border-cosmic-primary data-[active=true]:text-cosmic-primary',
  };
  
  // Content styles
  const contentStyles = 'outline-none';
  
  // Container class
  const containerClassName = cn(
    baseContainerStyles,
    'flex',
    alignmentStyles[alignment],
    alignment === 'stretch' ? '' : 'border-b border-white/10',
    className,
  );
  
  // Compose tab styles
  const getTabClassName = (id: string) => {
    return cn(
      baseTabStyles,
      sizeStyles[size],
      variantStyles[variant],
      id === activeTab ? 'font-medium' : '',
      tabClassName,
    );
  };
  
  // Content animation classes
  const getContentClassName = (id: string) => {
    return cn(
      contentStyles,
      animated ? 'cosmic-fade-in' : 'block',
      animated && id === activeTab ? 'cosmic-animate in' : '',
      contentClassName,
    );
  };
  
  return (
    <div>
      {/* Tab List */}
      <div className={containerClassName} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={getTabClassName(tab.id)}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            data-active={activeTab === tab.id}
            type="button"
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className={activeTab === tab.id ? getContentClassName(tab.id) : ''}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CosmicTabs;