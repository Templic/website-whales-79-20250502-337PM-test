import React from 'react';
import { 
  Product,
  User,
  CartItem,
  FormatAction,
  Branded,
  ProductId,
  UserId,
  Optional,
  DeepPartial,
  PaginationParams,
  FilterParams,
  contactFormSchema
} from '@/types';

/**
 * TypeSystemDemo
 * 
 * This page demonstrates the use of the centralized type system.
 * It shows how to import and use the various types defined in the system.
 */
const TypeSystemDemo: React.FC = () => {
  // Example of using branded types
  const createProductId = (id: string): ProductId => id as ProductId;
  const productId = createProductId("prod_123");
  
  // Example of optional types
  type OptionalUser = Optional<User, 'avatar' | 'lastLogin'>;
  
  // Example of deep partial types
  type EditableProduct = DeepPartial<Product>;
  
  // Example of a function using the FormatAction type
  const applyFormat = (format: FormatAction, text: string): string => {
    switch (format) {
      case 'bold':
        return `<strong>${text}</strong>`;
      case 'italic':
        return `<em>${text}</em>`;
      case 'underline':
        return `<u>${text}</u>`;
      default:
        return text;
    }
  };
  
  // Example of using the pagination params
  const pagination: PaginationParams = {
    page: 1,
    pageSize: 10,
    totalCount: 100,
    totalPages: 10
  };
  
  // Example of using the filter params
  const filter: FilterParams = {
    field: 'price',
    operator: 'gt',
    value: 50
  };
  
  // Example of using a validation schema
  const validateContactForm = (data: any) => {
    const result = contactFormSchema.safeParse(data);
    return result.success;
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Type System Demo</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Branded Types</h2>
        <p className="mb-2">Product ID: {String(productId)}</p>
        <p className="text-gray-600 text-sm">
          Branded types provide type safety for string IDs to prevent them from being used interchangeably.
        </p>
        <pre className="bg-gray-100 p-4 rounded mt-4 overflow-x-auto">
          {`
const createProductId = (id: string): ProductId => id as ProductId;
const productId = createProductId("prod_123");

// This would cause a type error:
// const userId: UserId = productId; // Error!
          `}
        </pre>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Utility Types</h2>
        <p className="mb-2">Optional, DeepPartial, etc.</p>
        <p className="text-gray-600 text-sm">
          Utility types provide powerful type transformations to ensure type safety.
        </p>
        <pre className="bg-gray-100 p-4 rounded mt-4 overflow-x-auto">
          {`
type OptionalUser = Optional<User, 'avatar' | 'lastLogin'>;
// The avatar and lastLogin fields are optional, but other fields are required

type EditableProduct = DeepPartial<Product>;
// All fields and nested fields are optional
          `}
        </pre>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Domain Types</h2>
        <p className="mb-2">Product, User, CartItem, etc.</p>
        <p className="text-gray-600 text-sm">
          Domain types represent the core data structures of the application.
        </p>
        <pre className="bg-gray-100 p-4 rounded mt-4 overflow-x-auto">
          {`
// Example of Product type
interface Product {
  id: ProductId;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  // etc.
}
          `}
        </pre>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Validation Schemas</h2>
        <p className="mb-2">Form validation with Zod</p>
        <p className="text-gray-600 text-sm">
          Validation schemas ensure that data meets specified requirements.
        </p>
        <pre className="bg-gray-100 p-4 rounded mt-4 overflow-x-auto">
          {`
// Contact form schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  message: z.string()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message must be less than 2000 characters' }),
});
          `}
        </pre>
      </div>
    </div>
  );
};

export default TypeSystemDemo;