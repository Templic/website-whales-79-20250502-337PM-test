import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the interface for an action that can appear in the header
export interface HeaderAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

// Define the header configuration interface
export interface HeaderConfig {
  title: string;
  actions: HeaderAction[];
  showSearch?: boolean;
  showLogo?: boolean;
  variant?: 'default' | 'transparent' | 'minimal';
  className?: string;
}

// Default header configuration
const defaultHeaderConfig: HeaderConfig = {
  title: '',
  actions: [],
  showSearch: true,
  showLogo: true,
  variant: 'default',
  className: '',
};

// Create the context with default values
interface HeaderContextType {
  headerConfig: HeaderConfig;
  setHeaderConfig: React.Dispatch<React.SetStateAction<HeaderConfig>>;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

// Create the provider component
export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(defaultHeaderConfig);

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig }}>
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