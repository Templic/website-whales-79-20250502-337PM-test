/**
 * @file ExampleComponent.tsx
 * @description A well-documented example component showing documentation best practices
 * @author Documentation Team
 * @created 2025-04-06
 * @updated 2025-04-06
 * @status Active
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * ExampleComponent
 * 
 * This is an example component that demonstrates proper documentation
 * standards. It includes a card with a title, description, content,
 * and interactive buttons.
 * 
 * @example
 * ```tsx
 * <ExampleComponent 
 *   title="Example Card" 
 *   description="This is an example card component"
 *   onAction={() => console.log('Action clicked')}
 * />
 * ```
 * 
 * @see CardWithForm - For a card with an embedded form
 * @see InteractiveCard - For a card with more interactive elements
 */

/**
 * Props for the ExampleComponent
 */
interface ExampleComponentProps {
  /**
   * The title to display in the card header
   * @required
   */
  title: string;
  
  /**
   * A descriptive text to display below the title
   * @default "No description provided"
   */
  description?: string;
  
  /**
   * Optional custom content to render inside the card
   */
  children?: React.ReactNode;
  
  /**
   * CSS class names to apply to the card element
   */
  className?: string;
  
  /**
   * Whether the card should have a border
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Called when the primary action button is clicked
   */
  onAction?: () => void;
  
  /**
   * Text for the primary action button
   * @default "Submit"
   */
  actionText?: string;
  
  /**
   * Whether the component is in a loading state
   * @default false
   */
  isLoading?: boolean;
}

/**
 * ExampleComponent implementation
 */
const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  description = "No description provided",
  children,
  className,
  bordered = true,
  onAction,
  actionText = "Submit",
  isLoading = false
}) => {
  // Example of a simple state
  const [clicked, setClicked] = useState<boolean>(false);
  
  // Example of an effect with cleanup
  useEffect(() => {
    console.log('ExampleComponent mounted');
    
    return () => {
      console.log('ExampleComponent unmounted');
    };
  }, []);
  
  /**
   * Handles the click on the action button
   */
  const handleActionClick = () => {
    setClicked(true);
    
    if (onAction) {
      onAction();
    }
    
    // Reset the clicked state after 1 second
    setTimeout(() => {
      setClicked(false);
    }, 1000);
  };
  
  return (
    <Card 
      className={cn(
        bordered ? 'border border-gray-200' : '',
        className
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <CardContent>
        {children || (
          <p className="text-gray-600">
            This is an example card component with proper documentation.
            Replace this content with your own or pass children.
          </p>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setClicked(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleActionClick}
          disabled={isLoading}
          className={cn(
            clicked ? 'bg-green-600 hover:bg-green-700' : ''
          )}
        >
          {isLoading ? 'Loading...' : actionText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExampleComponent;
