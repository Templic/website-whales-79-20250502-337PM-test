/**
 * ShopManagement.tsx
 * 
 * Component for managing shop merchandise in the admin portal
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, Plus, Trash2, Edit, Package, Tag, Truck, 
  ShoppingBag, DollarSign, ImagePlus, ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  sku: string;
  inventory: number;
  categoryId: number;
  categoryName?: string;
  published: boolean;
  featured: boolean;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  createdAt: string;
  updatedAt?: string;
}

export function ShopManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('products');
  
  // Form state for new/edit product
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    salePrice: 0,
    sku: '',
    inventory: 0,
    categoryId: 0,
    published: false,
    featured: false,
  });

  // Form state for new/edit category
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: null as number | null,
  });

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => fetch('/api/products').then(res => {
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    })
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ProductCategory[]>({
    queryKey: ['/api/product-categories'],
    queryFn: () => fetch('/api/product-categories').then(res => {
      if (!res.ok) throw new Error('Failed to fetch product categories');
      return res.json();
    })
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'slug'>) => {
      return apiRequest('/api/products', 'POST', product);
    },
    onSuccess: () => {
      // Clear form
      setProductFormData({
        name: '',
        shortDescription: '',
        description: '',
        price: 0,
        salePrice: 0,
        sku: '',
        inventory: 0,
        categoryId: 0,
        published: false,
        featured: false,
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Success!",
        description: "Product created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, product }: { id: number, product: Partial<Product> }) => {
      return apiRequest(`/api/products/${id}`, 'PATCH', product);
    },
    onSuccess: () => {
      // Clear form and editing state
      setProductFormData({
        name: '',
        shortDescription: '',
        description: '',
        price: 0,
        salePrice: 0,
        sku: '',
        inventory: 0,
        categoryId: 0,
        published: false,
        featured: false,
      });
      setIsEditing(false);
      setEditingProductId(null);
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Success!",
        description: "Product updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/products/${id}`, 'DELETE');
    },
    onSuccess: () => {
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: "Success!",
        description: "Product deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (category: Omit<ProductCategory, 'id' | 'createdAt'>) => {
      return apiRequest('/api/product-categories', 'POST', category);
    },
    onSuccess: () => {
      // Clear form
      setCategoryFormData({
        name: '',
        slug: '',
        description: '',
        parentId: null,
      });
      
      // Refresh categories list
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
      
      toast({
        title: "Success!",
        description: "Category created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: number, category: Partial<ProductCategory> }) => {
      return apiRequest(`/api/product-categories/${id}`, 'PATCH', category);
    },
    onSuccess: () => {
      // Clear form and editing state
      setCategoryFormData({
        name: '',
        slug: '',
        description: '',
        parentId: null,
      });
      setIsEditingCategory(false);
      setEditingCategoryId(null);
      
      // Refresh categories list
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
      
      toast({
        title: "Success!",
        description: "Category updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/product-categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      // Refresh categories list
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
      
      toast({
        title: "Success!",
        description: "Category deleted successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle product form submission
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
      ...productFormData,
      price: Number(productFormData.price),
      salePrice: productFormData.salePrice ? Number(productFormData.salePrice) : undefined,
      inventory: Number(productFormData.inventory),
      categoryId: Number(productFormData.categoryId)
    };
    
    if (isEditing && editingProductId) {
      updateProductMutation.mutate({
        id: editingProductId,
        product: formattedData
      });
    } else {
      createProductMutation.mutate(formattedData as any);
    }
  };

  // Handle category form submission
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
      ...categoryFormData,
      // Generate slug if not provided
      slug: categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, '-')
    };
    
    if (isEditingCategory && editingCategoryId) {
      updateCategoryMutation.mutate({
        id: editingCategoryId,
        category: formattedData
      });
    } else {
      createCategoryMutation.mutate(formattedData as any);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setProductFormData({
      name: product.name,
      shortDescription: product.shortDescription || '',
      description: product.description,
      price: product.price,
      salePrice: product.salePrice || 0,
      sku: product.sku,
      inventory: product.inventory,
      categoryId: product.categoryId,
      published: product.published,
      featured: product.featured
    });
    setIsEditing(true);
    setEditingProductId(product.id);
    setActiveTab('new-product');
  };

  // Handle edit category
  const handleEditCategory = (category: ProductCategory) => {
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || null
    });
    setIsEditingCategory(true);
    setEditingCategoryId(category.id);
    setActiveTab('new-category');
  };

  // Handle delete product
  const handleDeleteProduct = (id: number) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(id);
    }
  };

  // Handle delete category
  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category? This may orphan products and cannot be undone.')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Generate a SKU
  const generateSku = () => {
    const prefix = 'DTW';  // Dale The Whale
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="products" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="new-product" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {isEditing ? 'Edit Product' : 'New Product'}
          </TabsTrigger>
          <TabsTrigger value="new-category" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {isEditingCategory ? 'Edit Category' : 'New Category'}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Products
            </h2>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setEditingProductId(null);
                setProductFormData({
                  name: '',
                  shortDescription: '',
                  description: '',
                  price: 0,
                  salePrice: 0,
                  sku: generateSku(),
                  inventory: 0,
                  categoryId: categories?.[0]?.id || 0,
                  published: false,
                  featured: false,
                });
                setActiveTab('new-product');
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </div>

          {isLoadingProducts ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!products || products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                        </TableCell>
                        <TableCell>{product.categoryName || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            {product.salePrice ? (
                              <div>
                                <span className="line-through text-muted-foreground mr-2">
                                  {product.price.toFixed(2)}
                                </span>
                                <span className="font-bold">{product.salePrice.toFixed(2)}</span>
                              </div>
                            ) : (
                              product.price.toFixed(2)
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`${product.inventory <= 5 ? 'text-red-500' : ''}`}>
                            {product.inventory} in stock
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 flex-wrap">
                            {product.published ? (
                              <Badge variant="default">Published</Badge>
                            ) : (
                              <Badge variant="outline">Draft</Badge>
                            )}
                            {product.featured && (
                              <Badge variant="secondary">Featured</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              Product Categories
            </h2>
            <Button 
              onClick={() => {
                setIsEditingCategory(false);
                setEditingCategoryId(null);
                setCategoryFormData({
                  name: '',
                  slug: '',
                  description: '',
                  parentId: null,
                });
                setActiveTab('new-category');
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Category
            </Button>
          </div>

          {isLoadingCategories ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!categories || categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell>
                          {category.parentId ? (
                            categories.find(c => c.id === category.parentId)?.name || 'Unknown'
                          ) : (
                            'None'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* New/Edit Product Tab */}
        <TabsContent value="new-product">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Update your product details below.' 
                  : 'Fill in the details to create a new product.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sku"
                        value={productFormData.sku}
                        onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                        placeholder="Product SKU"
                        required
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setProductFormData({...productFormData, sku: generateSku()})}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      value={productFormData.categoryId.toString()}
                      onValueChange={(value) => setProductFormData({...productFormData, categoryId: parseInt(value)})}
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Regular Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({...productFormData, price: parseFloat(e.target.value)})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salePrice">Sale Price ($) (Optional)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productFormData.salePrice}
                      onChange={(e) => setProductFormData({...productFormData, salePrice: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input
                    id="inventory"
                    type="number"
                    min="0"
                    step="1"
                    value={productFormData.inventory}
                    onChange={(e) => setProductFormData({...productFormData, inventory: parseInt(e.target.value)})}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={productFormData.shortDescription}
                    onChange={(e) => setProductFormData({...productFormData, shortDescription: e.target.value})}
                    placeholder="Brief description of the product"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={productFormData.description}
                    onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                    placeholder="Detailed product description"
                    rows={5}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Images</Label>
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                    <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      This feature is not yet implemented.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="published"
                      checked={productFormData.published}
                      onCheckedChange={(checked) => setProductFormData({...productFormData, published: checked})}
                    />
                    <Label htmlFor="published">Publish product on the store</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={productFormData.featured}
                      onCheckedChange={(checked) => setProductFormData({...productFormData, featured: checked})}
                    />
                    <Label htmlFor="featured">Feature on homepage and listings</Label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setProductFormData({
                        name: '',
                        shortDescription: '',
                        description: '',
                        price: 0,
                        salePrice: 0,
                        sku: '',
                        inventory: 0,
                        categoryId: 0,
                        published: false,
                        featured: false,
                      });
                      setIsEditing(false);
                      setEditingProductId(null);
                      setActiveTab('products');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending ? (
                      <>Saving...</>
                    ) : isEditing ? (
                      <>Update Product</>
                    ) : (
                      <>Create Product</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New/Edit Category Tab */}
        <TabsContent value="new-category">
          <Card>
            <CardHeader>
              <CardTitle>{isEditingCategory ? 'Edit Category' : 'Add New Category'}</CardTitle>
              <CardDescription>
                {isEditingCategory 
                  ? 'Update your category details below.' 
                  : 'Create a new product category.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categorySlug">Slug</Label>
                  <Input
                    id="categorySlug"
                    value={categoryFormData.slug}
                    onChange={(e) => setCategoryFormData({...categoryFormData, slug: e.target.value})}
                    placeholder="category-slug (leave blank to auto-generate)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs. Leave blank to auto-generate from name.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentCategory">Parent Category (Optional)</Label>
                  <Select
                    value={categoryFormData.parentId?.toString() || ""}
                    onValueChange={(value) => setCategoryFormData({
                      ...categoryFormData, 
                      parentId: value ? parseInt(value) : null
                    })}
                  >
                    <SelectTrigger id="parentCategory">
                      <SelectValue placeholder="None (top level category)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (top level category)</SelectItem>
                      {categories?.filter(c => c.id !== editingCategoryId).map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoryDescription">Description (Optional)</Label>
                  <Textarea
                    id="categoryDescription"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                    placeholder="Category description"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCategoryFormData({
                        name: '',
                        slug: '',
                        description: '',
                        parentId: null,
                      });
                      setIsEditingCategory(false);
                      setEditingCategoryId(null);
                      setActiveTab('categories');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                      <>Saving...</>
                    ) : isEditingCategory ? (
                      <>Update Category</>
                    ) : (
                      <>Create Category</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ShopManagement;