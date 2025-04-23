/**
 * Type System Demo Page
 * 
 * This page demonstrates the usage of our centralized type system and utility functions.
 * It shows how to use type guards, transformers, and branded type helpers.
 */

import React, { useState, useEffect } from 'react';
import { 
  Product, 
  User, 
  UtilTypes, 
  PaginatedResponse,
  PaginationParams 
} from '@/types';
import { isProduct, isUser } from '@/utils/typeGuards';
import { 
  productToListItem, 
  userToPublicProfile, 
  createApiResponse,
  createPaginatedResponse 
} from '@/utils/typeTransformers';
import {
  createProductId,
  createUserId,
  extractRawId
} from '@/utils/brandedTypeHelpers';
import ProductListExample from '@/components/examples/ProductListExample';

const TypeSystemDemo: React.FC = () => {
  // Example state using our type system
  const [user, setUser] = useState<UtilTypes.OptionalFields<User, 'lastLogin' | 'avatar'>>({
    id: createUserId('user-123'),
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isVerified: true,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  });

  // Example pagination using our type system
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
    totalItems: 100,
    totalPages: 10
  });

  // Example product using our type system
  const [product, setProduct] = useState<UtilTypes.DeepPartial<Product>>({
    name: 'Example Product',
    description: 'A product to demonstrate our type system',
    price: 9.99,
    currency: 'USD',
    images: ['image1.jpg', 'image2.jpg'],
    category: 'Electronics'
  });

  // Demo data for our type system
  const [demoData, setDemoData] = useState<{
    typeGuardTest: string;
    transformerTest: string;
    brandedTypeTest: string;
  }>({
    typeGuardTest: 'Running type guard tests...',
    transformerTest: 'Running transformer tests...',
    brandedTypeTest: 'Running branded type tests...',
  });

  // Run type system demos on component mount
  useEffect(() => {
    runTypeSystemDemo();
  }, []);

  const runTypeSystemDemo = () => {
    // Type Guard Test
    const sampleProduct = {
      id: 'product-123',
      name: 'Sample Product',
      price: 19.99,
      description: 'A sample product for testing',
      images: ['sample.jpg'],
      category: 'Test',
      tags: ['sample'],
      sku: 'TEST-123',
      stock: 10,
      isActive: true,
      isDigital: false,
      currency: 'USD',
      ratings: { average: 4.5, count: 10 },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    };

    const notAProduct = {
      id: 'not-a-product',
      name: 'Not A Product',
      description: 'This is not a valid product'
    };

    const typeGuardResults = [
      `isProduct(sampleProduct): ${isProduct(sampleProduct)}`,
      `isProduct(notAProduct): ${isProduct(notAProduct)}`,
      `isUser(user state): ${isUser(user)}`
    ].join('\n');

    // Transformer Test
    const productListItem = productToListItem(sampleProduct as Product);
    const userProfile = userToPublicProfile(user as User);
    const apiResponse = createApiResponse(productListItem, 'Success');
    const paginatedResponse = createPaginatedResponse(
      [productListItem],
      pagination.page,
      pagination.pageSize,
      pagination.totalItems
    );

    const transformerResults = [
      'Successfully transformed product to list item with fields:',
      Object.keys(productListItem).join(', '),
      '',
      'Successfully transformed user to public profile with fields:',
      Object.keys(userProfile).join(', '),
      '',
      `API Response success: ${apiResponse.success}`,
      `Paginated Response page: ${paginatedResponse.pagination.page}`,
      `Paginated Response total pages: ${paginatedResponse.pagination.totalPages}`
    ].join('\n');

    // Branded Type Test
    const productId = createProductId('product-456');
    const userId = createUserId('user-456');
    
    const rawProductId = extractRawId(productId);
    const rawUserId = extractRawId(userId);

    // Showcasing type safety with branded types
    // This would cause a compile-time error:
    // const wrongAssignment: UserId = productId;
    
    const brandedTypeResults = [
      `Created ProductId: ${productId}`,
      `Created UserId: ${userId}`,
      `Extracted raw ProductId: ${rawProductId}`,
      `Extracted raw UserId: ${rawUserId}`,
      '',
      'Type safety prevents assigning ProductId to UserId at compile time!',
      'This maintains type safety even though both are string underneath.'
    ].join('\n');

    // Update state with results
    setDemoData({
      typeGuardTest: typeGuardResults,
      transformerTest: transformerResults,
      brandedTypeTest: brandedTypeResults
    });

    // Update product with new values using DeepPartial
    setProduct(prev => ({
      ...prev,
      price: 14.99,
      stock: 50,
      ratings: { average: 4.8, count: 25 }  
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Type System Demo</h1>
      
      <p className="text-lg mb-6">
        This page demonstrates the centralized type system implemented in our application.
        Below you'll find examples of type guards, transformers, and branded type helpers in action.
      </p>
      
      <div className="mb-12">
        <ProductListExample />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User State (Using OptionalFields)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Product State (Using DeepPartial)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {JSON.stringify(product, null, 2)}
          </pre>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Type Guard Demo</h2>
          <p className="mb-2">Type guards provide runtime validation of types:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {demoData.typeGuardTest}
          </pre>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Type Transformer Demo</h2>
          <p className="mb-2">Type transformers help convert between different related types:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {demoData.transformerTest}
          </pre>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Branded Type Demo</h2>
          <p className="mb-2">Branded types enhance type safety for primitive types:</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            {demoData.brandedTypeTest}
          </pre>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Benefits of Our Type System</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Improved type safety with compile-time checking</li>
          <li>Runtime validation through type guards</li>
          <li>Centralized type definitions to reduce duplication</li>
          <li>Enhanced developer experience with better autocompletion</li>
          <li>Type transformations for converting between related types</li>
          <li>Branded types to distinguish between different string IDs</li>
        </ul>
      </div>
    </div>
  );
};

export default TypeSystemDemo;