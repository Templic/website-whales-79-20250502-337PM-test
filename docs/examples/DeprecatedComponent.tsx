/**
 * @file DeprecatedComponent.tsx
 * @description An example of a deprecated component with proper documentation
 * @author Documentation Team
 * @created 2024-10-15
 * @updated 2025-04-06
 * @status Deprecated
 */

import React, { useEffect } from 'react';

/**
 * DeprecatedComponent
 * 
 * @deprecated This component is deprecated and will be removed in a future version.
 * Please use ExampleComponent from '@/components/examples/ExampleComponent' instead,
 * which provides better performance and additional features.
 * 
 * Migration guide:
 * ```diff
 * - import DeprecatedComponent from '@/components/deprecated/DeprecatedComponent';
 * + import ExampleComponent from '@/components/examples/ExampleComponent';
 * 
 * - <DeprecatedComponent title="My Title" text="My Text" />
 * + <ExampleComponent title="My Title" description="My Text" />
 * ```
 * 
 * @example
 * ```tsx
 * <DeprecatedComponent
 *   title="Old Component"
 *   text="This component is deprecated"
 * />
 * ```
 */

/**
 * Props for the DeprecatedComponent
 */
interface DeprecatedComponentProps {
  /**
   * The title to display
   */
  title: string;
  
  /**
   * The text content to display
   */
  text: string;
  
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * DeprecatedComponent implementation
 */
const DeprecatedComponent: React.FC<DeprecatedComponentProps> = ({
  title,
  text,
  onClick
}) => {
  // Log deprecation warning
  useEffect(() => {
    console.warn(
      '[Deprecated] DeprecatedComponent is deprecated and will be removed in a future version. ' +
      'Please use ExampleComponent from @/components/examples/ExampleComponent instead.'
    );
  }, []);
  
  return (
    <div 
      className="p-4 border border-gray-300 rounded"
      onClick={onClick}
    >
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-4">
        <p className="text-yellow-700">
          ⚠️ This component is deprecated. Please use ExampleComponent instead.
        </p>
      </div>
      
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p>{text}</p>
    </div>
  );
};

export default DeprecatedComponent;
