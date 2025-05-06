import { useEffect } from 'react';
import { useHeader, HeaderConfig } from '../contexts/HeaderContext';

/**
 * A hook for pages to set their header configuration
 * 
 * @param config The header configuration
 */
export function usePageHeader(config: HeaderConfig) {
  const { setHeaderConfig } = useHeader();
  
  useEffect(() => {
    // Set the header config when the component mounts
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
      });
    };
  }, [config, setHeaderConfig]);
}