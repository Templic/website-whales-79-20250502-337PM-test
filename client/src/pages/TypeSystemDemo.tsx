import { FormEvent, useState } from 'react';
import { 
  Product, 
  CartItem, 
  User,
  Order,
  Track,
  Album,
  TourDate,
  BlogPost,
  Comment 
} from '@/types/models';
import { DeepPartial, OptionalFields, RequiredFields, ReadonlyFields, ProductId, Branded } from '@/types/utils';
import { AdminButtonVariant, AdminButtonSize, FormatAction, FormatValue } from '@/types/admin';
import { SortParams, FilterParams, PaginationParams } from '@/types';

/**
 * TypeSystemDemo
 * 
 * This page is used to demonstrate the centralized type system.
 * It shows how the types can be imported from a central location and used consistently
 * across the application.
 */
const TypeSystemDemo = () => {
  // Using domain models from models.ts
  const [product, setProduct] = useState<DeepPartial<Product>>({
    name: 'Sample Product',
    price: 99.99
  });

  // Using utility types from utils.ts
  const [user, setUser] = useState<OptionalFields<User, 'avatar' | 'lastLogin'>>({
    id: '123' as Branded<string, 'UserId'>,
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  });

  // Using admin types from admin.ts
  const [buttonVariant, setButtonVariant] = useState<AdminButtonVariant>('default');
  const [buttonSize, setButtonSize] = useState<AdminButtonSize>('default');
  const [formatAction, setFormatAction] = useState<FormatAction>('bold');
  const [formatValue, setFormatValue] = useState<FormatValue>({ type: 'bold' });

  // Using pagination and sorting types
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
    totalCount: 100,
    totalPages: 10
  });

  const [sortParams, setSortParams] = useState<SortParams>({
    field: 'name',
    direction: 'asc'
  });

  const [filterParams, setFilterParams] = useState<FilterParams>({
    field: 'category',
    operator: 'eq',
    value: 'electronics'
  });

  // Event handlers
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Product:', product);
    console.log('User:', user);
  };

  // Demonstrating type enforcement
  const updateProduct = () => {
    // TypeScript will enforce the correct types here
    setProduct({
      ...product,
      price: 149.99,
      stock: 10,
      rating: 4.5
    });
  };

  const updateUser = () => {
    // TypeScript will enforce the correct types here
    setUser({
      ...user,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'admin' // Type-safe: only 'user', 'admin', or 'artist' allowed
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Type System Demo</h1>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Domain Models</h2>
        <p className="mb-4">
          This section demonstrates the use of domain models imported from the 
          centralized type system.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium mb-2">Product Model</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(product, null, 2)}
            </pre>
            <button 
              onClick={updateProduct}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update Product
            </button>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">User Model</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify({
                ...user,
                id: String(user.id) // Convert branded type for display
              }, null, 2)}
            </pre>
            <button 
              onClick={updateUser}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update User
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Utility Types</h2>
        <p className="mb-4">
          These are examples of utility types that can be used throughout the application.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">DeepPartial&lt;Product&gt;</h3>
            <p className="text-sm text-gray-600 mb-2">
              Makes all properties and nested properties optional.
            </p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {`const product: DeepPartial<Product> = {
  name: 'Sample Product',
  price: 99.99
  // All other properties are optional
};`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">OptionalFields&lt;User, 'avatar' | 'lastLogin'&gt;</h3>
            <p className="text-sm text-gray-600 mb-2">
              Makes specific properties optional.
            </p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {`const user: OptionalFields<User, 'avatar' | 'lastLogin'> = {
  id: '123' as UserId,
  email: 'user@example.com',
  // avatar and lastLogin are optional
  // other fields are required
};`}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Admin UI Types</h2>
        <p className="mb-4">
          These types are specific to the admin UI components.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">AdminButtonVariant</h3>
            <p className="text-sm text-gray-600 mb-2">
              Defines the allowed button variants.
            </p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {`type AdminButtonVariant = 
  | 'default'
  | 'cosmic'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary';

// Current value: ${buttonVariant}`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">FormatAction</h3>
            <p className="text-sm text-gray-600 mb-2">
              Defines text formatting actions for rich text editors.
            </p>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {`type FormatAction = 
  | 'bold'
  | 'italic'
  | 'underline'
  | 'code'
  | 'link'
  // ...and many more

// Current value: ${formatAction}`}
            </pre>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Data Access Types</h2>
        <p className="mb-4">
          These types are used for data access patterns like pagination, sorting, and filtering.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2">PaginationParams</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(pagination, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">SortParams</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(sortParams, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">FilterParams</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(filterParams, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypeSystemDemo;