import { useEffect } from 'react';
import { useHeader, HeaderConfig } from '../contexts/HeaderContext';

/**
 * A hook for pages to set their header configuration
 * 
 * @param config The header configuration
 */
export function usePageHeader(config: HeaderConfig) {
  const { setHeaderConfig } = useHeader();
  
  // Set the header config when the component mounts or when key properties change
  useEffect(() => {
    setHeaderConfig(config);
    
    // Reset header to defaults when the component unmounts
    return () => {
      setHeaderConfig({
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
      });
    };
  }, [
    config.title,
    config.variant,
    config.showSearch,
    config.showLogo,
    config.className,
    // For style object, we can't rely on reference equality or stringify it safely
    // Instead, we track specific style properties that might change
    config.style?.backgroundColor,
    config.style?.color,
    config.style?.backdropFilter,
    config.style?.borderColor,
    // For scroll behavior options
    config.isScrollBehaviorEnabled,
    config.hideOnScroll,
    config.shrinkOnScroll,
    config.blurOnScroll,
    config.backdropBlur,
    config.glassmorphism,
    // For actions array, using length as a simple dependency
    // This won't catch all changes but will work for most cases
    config.actions?.length,
    setHeaderConfig
  ]);
}