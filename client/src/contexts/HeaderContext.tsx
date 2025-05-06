import React, { createContext, useContext, useState, ReactNode, CSSProperties } from 'react';

// Define the interface for an action that can appear in the header
export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

// Define the header configuration interface with expanded styling options
export interface HeaderConfig {
  title: string;
  actions: HeaderAction[];
  showSearch?: boolean;
  showLogo?: boolean;
  variant?: 'default' | 'transparent' | 'minimal';
  className?: string;
  style?: CSSProperties;
  isScrollBehaviorEnabled?: boolean;
  hideOnScroll?: boolean;
  shrinkOnScroll?: boolean;
  blurOnScroll?: boolean;
  backdropBlur?: boolean;
  glassmorphism?: boolean;
}

// Default header configuration
const defaultHeaderConfig: HeaderConfig = {
  title: '',
  actions: [],
  showSearch: true,
  showLogo: true,
  variant: 'default',
  className: '',
  style: {},
  isScrollBehaviorEnabled: true,
  hideOnScroll: false,
  shrinkOnScroll: true,
  blurOnScroll: true,
  backdropBlur: true,
  glassmorphism: true
};

// Create the context with default values
interface HeaderContextType {
  headerConfig: HeaderConfig;
  setHeaderConfig: React.Dispatch<React.SetStateAction<HeaderConfig>>;
  updateHeaderConfig: (updates: Partial<HeaderConfig>) => void;
  resetHeaderConfig: () => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

// Create the provider component
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultHeaderConfig);

  // Helper function to update only specific parts of the header config
  const updateHeaderConfig = (updates: Partial<HeaderConfig>) => {
    setHeaderConfig(prevConfig => ({
      ...prevConfig,
      ...updates
    }));
  };
  
  // Helper function to reset to default config
  const resetHeaderConfig = () => {
    setHeaderConfig(defaultHeaderConfig);
  };

  return (
    <HeaderContext.Provider value={{ 
      headerConfig, 
      setHeaderConfig, 
      updateHeaderConfig,
      resetHeaderConfig 
    }}>
      {children}
    </HeaderContext.Provider>
  );
};

// Create a custom hook to use the header context
export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};