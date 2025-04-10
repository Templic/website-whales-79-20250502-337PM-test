/**
 * TypeSystemDemo Page
 * 
 * A comprehensive demonstration of the centralized type system
 * showing how to use various type features in a real-world application.
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import ProductListExample from '@/components/examples/ProductListExample';
import ContactFormExample from '@/components/examples/ContactFormExample';
import { createUserId, createProductId, createPagination } from '@/utils/typeHelpers';
import { Models, API, Schemas } from '@/types';
import { UserId, ProductId } from '@/types/utils';

/**
 * Type System Demo Page
 */
const TypeSystemDemo: React.FC = () => {
  /**
   * Demo of branded types for type safety
   */
  const demoTypeConversion = () => {
    // Create strongly typed IDs
    const userId: UserId = createUserId('user-123');
    const productId: ProductId = createProductId('prod-456');
    
    // This demonstrates type safety - the following would cause a type error:
    // const productId2: ProductId = userId; // Error: Type 'UserId' is not assignable to type 'ProductId'
    
    console.log('Created user ID:', userId);
    console.log('Created product ID:', productId);
    
    // Demo pagination params with utility
    const paginationParams = createPagination({ page: 2, pageSize: 20 });
    console.log('Pagination params:', paginationParams);
    
    // Demo type-safe API responses
    const mockProductResponse: API.ProductListResponse = {
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    };
    
    console.log('Mock API response:', mockProductResponse);
  };
  
  // Run the demo
  React.useEffect(() => {
    demoTypeConversion();
  }, []);
  
  return (
    <div className="container py-10">
      <div className="space-y-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold">Centralized Type System Demo</h1>
          <p className="text-muted-foreground mt-2">
            Demonstrating the power of a well-organized TypeScript type system
          </p>
        </div>
        
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertTitle>Type System Improvements</AlertTitle>
          <AlertDescription>
            This page demonstrates the centralized type system with proper type definitions,
            API response types, form schemas, utility types, and branded types.
            Check the browser console for additional demos.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="product-list">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="product-list">Product List Demo</TabsTrigger>
            <TabsTrigger value="form-demo">Form Validation Demo</TabsTrigger>
            <TabsTrigger value="type-info">Type System Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="product-list" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Product List with TypeScript</CardTitle>
                <CardDescription>
                  This component demonstrates using API response types with React Query.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductListExample initialCategory="all" pageSize={6} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="form-demo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Type-Safe Form Validation</CardTitle>
                <CardDescription>
                  This form uses centralized Zod schemas for consistent validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactFormExample 
                  onSubmitSuccess={(data) => {
                    console.log('Form submitted with data:', data);
                  }} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="type-info" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Centralized Type System</CardTitle>
                  <CardDescription>
                    Key features of our TypeScript type organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold">Type Files Structure</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><code>/types/models.ts</code> - Core data models</li>
                    <li><code>/types/api.ts</code> - API response types</li>
                    <li><code>/types/schemas.ts</code> - Zod validation schemas</li>
                    <li><code>/types/utils.ts</code> - Utility types and helpers</li>
                    <li><code>/types/shop.ts</code> - Shop-specific component types</li>
                    <li><code>/types/admin.ts</code> - Admin-specific component types</li>
                    <li><code>/types/index.ts</code> - Centralized exports</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Type Safety Benefits</CardTitle>
                  <CardDescription>
                    Why we've implemented this type system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold">Key Advantages</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Consistent data structures across the application</li>
                    <li>Better developer experience with autocompletion</li>
                    <li>Reduced bugs from type mismatches</li>
                    <li>Self-documenting code with JSDoc comments</li>
                    <li>Easier onboarding for new developers</li>
                    <li>Enhanced refactoring safety</li>
                    <li>Improved code maintainability</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TypeSystemDemo;