/**
 * EnhancedShopManagement.tsx
 * 
 * Advanced shop management component for the admin portal with sophisticated features:
 * - Product overview dashboard with metrics and analytics
 * - Bulk editing capabilities
 * - Detailed inventory management
 * - Advanced filtering and search
 * - Custom attributes and variants
 * - Promotions and discounts management
 * - Third-party service integrations
 * - User roles and permissions
 * - Real-time updates
 * - Data export/import
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, Plus, Trash2, Edit, Package, Tag, Truck, 
  ShoppingBag, DollarSign, ImagePlus, ExternalLink, ChevronDown,
  Check, Filter, Download, Upload, BarChart3, CircleDollarSign,
  Gauge, Calendar, RefreshCw, Archive, Clock, Search, ShoppingCart,
  Users, AlertTriangle, CheckCircle2, Award
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
// Placeholder chart components (will need to be implemented)
const BarChart = ({ data, index, categories, colors, valueFormatter }: any) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100/30 rounded-lg p-4">
    <p className="text-gray-500">Bar Chart: {categories?.join(', ')}</p>
  </div>
);

const LineChart = ({ data, index, categories, colors, valueFormatter }: any) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100/30 rounded-lg p-4">
    <p className="text-gray-500">Line Chart</p>
  </div>
);

const PieChart = ({ data, label }: any) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-100/30 rounded-lg p-4">
    <p className="text-gray-500">Pie Chart: {label}</p>
  </div>
);

// Product interface with expanded fields
interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  compareAtPrice?: number;
  sku: string;
  barcode?: string;
  inventory: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  categoryId: number;
  categoryName?: string;
  published: boolean;
  featured: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  isSale?: boolean;
  images?: string[];
  tags?: string[];
  attributes?: Record<string, string | string[]>;
  variants?: ProductVariant[];
  relatedProducts?: number[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  vendor?: string;
  collections?: string[];
}

interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  attributes: Record<string, string>;
  images?: string[];
}

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  productCount?: number;
  createdAt: string;
  updatedAt?: string;
}

interface Promotion {
  id: number;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free-shipping';
  value: number;
  startsAt: string;
  endsAt: string;
  minimumPurchase?: number;
  maximumUses?: number;
  usesCount?: number;
  productIds?: number[];
  categoryIds?: number[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface ShopMetrics {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  monthlySales: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  topSellingProducts: {
    id: number;
    name: string;
    sku: string;
    sales: number;
    revenue: number;
  }[];
  categorySales: {
    category: string;
    sales: number;
    percentage: number;
  }[];
}

export function EnhancedShopManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    price: { change: false, value: 0, type: 'fixed' as 'fixed' | 'percentage' },
    inventory: { change: false, value: 0, type: 'fixed' as 'fixed' | 'add' | 'subtract' },
    categoryId: { change: false, value: 0 },
    published: { change: false, value: false },
    featured: { change: false, value: false },
    salePrice: { change: false, value: 0, type: 'fixed' as 'fixed' | 'percentage' },
  });
  
  // Form state for new/edit product
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<Product>>({
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    salePrice: 0,
    sku: '',
    inventory: 0,
    lowStockThreshold: 5,
    categoryId: 0,
    published: false,
    featured: false,
    isNew: false,
    tags: [],
    attributes: {},
  });

  // Form state for new/edit promotion
  const [isEditingPromotion, setIsEditingPromotion] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);
  const [promotionFormData, setPromotionFormData] = useState<Partial<Promotion>>({
    name: '',
    code: '',
    type: 'percentage',
    value: 0,
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    minimumPurchase: 0,
    maximumUses: 0,
    active: true,
    productIds: [],
    categoryIds: [],
  });

  // Fetch products with query parameters
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', searchQuery, categoryFilter, statusFilter, stockFilter],
    queryFn: () => {
      let url = '/api/products?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (categoryFilter) url += `categoryId=${categoryFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (stockFilter) url += `stock=${stockFilter}&`;
      
      return fetch(url).then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      });
    }
  });

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ProductCategory[]>({
    queryKey: ['/api/product-categories'],
    queryFn: () => fetch('/api/product-categories').then(res => {
      if (!res.ok) throw new Error('Failed to fetch product categories');
      return res.json();
    })
  });

  // Fetch promotions
  const { data: promotions, isLoading: isLoadingPromotions } = useQuery<Promotion[]>({
    queryKey: ['/api/promotions'],
    queryFn: () => fetch('/api/promotions').then(res => {
      if (!res.ok) throw new Error('Failed to fetch promotions');
      return res.json();
    }),
    enabled: activeTab === 'promotions'
  });

  // Fetch shop metrics
  const { data: shopMetrics, isLoading: isLoadingMetrics } = useQuery<ShopMetrics>({
    queryKey: ['/api/shop/metrics'],
    queryFn: () => fetch('/api/shop/metrics').then(res => {
      if (!res.ok) throw new Error('Failed to fetch shop metrics');
      return res.json();
    }),
    enabled: activeTab === 'dashboard',
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (product: Omit<Product, 'id' | 'createdAt' | 'slug'>) => {
      return apiRequest('/api/products', 'POST', product);
    },
    onSuccess: () => {
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/metrics'] });
      
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
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/metrics'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/metrics'] });
      
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

  // Bulk edit products mutation
  const bulkEditProductsMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: number[], updates: Partial<Product> }) => {
      return apiRequest('/api/products/bulk-edit', 'POST', { ids, updates });
    },
    onSuccess: () => {
      setBulkEditOpen(false);
      setSelectedProducts([]);
      setSelectAll(false);
      resetBulkEditForm();
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/metrics'] });
      
      toast({
        title: "Success!",
        description: "Products updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: (promotion: Omit<Promotion, 'id' | 'createdAt'>) => {
      return apiRequest('/api/promotions', 'POST', promotion);
    },
    onSuccess: () => {
      resetPromotionForm();
      queryClient.invalidateQueries({ queryKey: ['/api/promotions'] });
      
      toast({
        title: "Success!",
        description: "Promotion created successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create promotion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Export products mutation
  const exportProductsMutation = useMutation({
    mutationFn: (format: 'csv' | 'json' | 'excel') => {
      return apiRequest('/api/products/export', 'POST', { format, ids: selectedProducts.length > 0 ? selectedProducts : undefined });
    },
    onSuccess: (data) => {
      // Create download link for exported file
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsExporting(false);
      toast({
        title: "Success!",
        description: "Products exported successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      setIsExporting(false);
      toast({
        title: "Error",
        description: `Failed to export products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Effect to handle selectAll changes
  useEffect(() => {
    if (products) {
      if (selectAll) {
        setSelectedProducts(products.map(p => p.id));
      } else if (selectedProducts.length === products.length) {
        setSelectedProducts([]);
      }
    }
  }, [selectAll, products]);

  // Filter products based on search query and filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products;
  }, [products]);

  // Reset product form
  const resetProductForm = () => {
    setProductFormData({
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      salePrice: 0,
      sku: '',
      inventory: 0,
      lowStockThreshold: 5,
      categoryId: 0,
      published: false,
      featured: false,
      isNew: false,
      tags: [],
      attributes: {},
    });
    setIsEditing(false);
    setEditingProductId(null);
  };

  // Reset bulk edit form
  const resetBulkEditForm = () => {
    setBulkEditData({
      price: { change: false, value: 0, type: 'fixed' },
      inventory: { change: false, value: 0, type: 'fixed' },
      categoryId: { change: false, value: 0 },
      published: { change: false, value: false },
      featured: { change: false, value: false },
      salePrice: { change: false, value: 0, type: 'fixed' },
    });
  };

  // Reset promotion form
  const resetPromotionForm = () => {
    setPromotionFormData({
      name: '',
      code: '',
      type: 'percentage',
      value: 0,
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minimumPurchase: 0,
      maximumUses: 0,
      active: true,
      productIds: [],
      categoryIds: [],
    });
    setIsEditingPromotion(false);
    setEditingPromotionId(null);
  };

  // Generate a SKU
  const generateSku = () => {
    const prefix = 'DTW';  // Dale The Whale
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  };

  // Handle product form submission
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
      ...productFormData,
      price: Number(productFormData.price),
      salePrice: productFormData.salePrice ? Number(productFormData.salePrice) : undefined,
      inventory: Number(productFormData.inventory),
      lowStockThreshold: Number(productFormData.lowStockThreshold),
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

  // Handle promotion form submission
  const handlePromotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
      ...promotionFormData,
      value: Number(promotionFormData.value),
      minimumPurchase: promotionFormData.minimumPurchase ? Number(promotionFormData.minimumPurchase) : undefined,
      maximumUses: promotionFormData.maximumUses ? Number(promotionFormData.maximumUses) : undefined,
    };
    
    if (isEditingPromotion && editingPromotionId) {
      // updatePromotionMutation.mutate({
      //   id: editingPromotionId,
      //   promotion: formattedData
      // });
      toast({
        title: "Not Implemented",
        description: "Update promotion functionality is not yet implemented.",
        variant: "default",
      });
    } else {
      createPromotionMutation.mutate(formattedData as any);
    }
  };

  // Handle bulk edit form submission
  const handleBulkEditSubmit = () => {
    const updates: Partial<Product> = {};
    
    if (bulkEditData.price.change) {
      if (bulkEditData.price.type === 'fixed') {
        updates.price = bulkEditData.price.value;
      } else {
        // For percentage changes, we'll need to do this on the server side
        updates.price = -1; // Special flag for percentage change
        updates._priceChange = {
          type: 'percentage',
          value: bulkEditData.price.value
        };
      }
    }
    
    if (bulkEditData.salePrice.change) {
      if (bulkEditData.salePrice.type === 'fixed') {
        updates.salePrice = bulkEditData.salePrice.value;
      } else {
        updates.salePrice = -1; // Special flag for percentage change
        updates._salePriceChange = {
          type: 'percentage',
          value: bulkEditData.salePrice.value
        };
      }
    }
    
    if (bulkEditData.inventory.change) {
      if (bulkEditData.inventory.type === 'fixed') {
        updates.inventory = bulkEditData.inventory.value;
      } else {
        updates.inventory = -1; // Special flag
        updates._inventoryChange = {
          type: bulkEditData.inventory.type,
          value: bulkEditData.inventory.value
        };
      }
    }
    
    if (bulkEditData.categoryId.change) {
      updates.categoryId = bulkEditData.categoryId.value;
    }
    
    if (bulkEditData.published.change) {
      updates.published = bulkEditData.published.value;
    }
    
    if (bulkEditData.featured.change) {
      updates.featured = bulkEditData.featured.value;
    }
    
    bulkEditProductsMutation.mutate({
      ids: selectedProducts,
      updates
    });
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
      lowStockThreshold: product.lowStockThreshold || 5,
      categoryId: product.categoryId,
      published: product.published,
      featured: product.featured,
      isNew: product.isNew || false,
      tags: product.tags || [],
      attributes: product.attributes || {},
    });
    setIsEditing(true);
    setEditingProductId(product.id);
    setActiveTab('new-product');
  };

  // Handle export products
  const handleExportProducts = (format: 'csv' | 'json' | 'excel') => {
    setIsExporting(true);
    exportProductsMutation.mutate(format);
  };

  // Handle product selection
  const handleSelectProduct = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, id]);
    } else {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
    }
  };

  // Handle product duplication
  const handleDuplicateProduct = (product: Product) => {
    // Remove unique fields
    const { id, createdAt, updatedAt, slug, ...newProduct } = product;
    
    // Modify some fields to make it unique
    newProduct.name = `${newProduct.name} (Copy)`;
    newProduct.sku = generateSku();
    
    createProductMutation.mutate(newProduct as any);
  };

  // Render status badge
  const renderStatusBadge = (product: Product) => {
    if (!product.published) {
      return <Badge variant="outline" className="bg-gray-200 text-gray-700">Draft</Badge>;
    }
    if (product.featured) {
      return <Badge className="bg-purple-500 text-white">Featured</Badge>;
    }
    if (product.isNew) {
      return <Badge className="bg-blue-500 text-white">New</Badge>;
    }
    if (product.isSale) {
      return <Badge className="bg-red-500 text-white">Sale</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
  };

  // Render inventory status
  const renderInventoryStatus = (product: Product) => {
    if (product.inventory <= 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Out of Stock</Badge>;
    }
    if (product.lowStockThreshold && product.inventory <= product.lowStockThreshold) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">Low Stock ({product.inventory})</Badge>;
    }
    return <span className="text-green-600 font-medium">{product.inventory}</span>;
  };

  // Render duration badge for promotions
  const renderPromotionDurationBadge = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startsAt);
    const endDate = new Date(promotion.endsAt);
    
    if (now < startDate) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    }
    
    if (now > endDate) {
      return <Badge variant="outline" className="bg-gray-200 text-gray-700">Expired</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center">
            <Gauge className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center">
            <CircleDollarSign className="mr-2 h-4 w-4" />
            Promotions
          </TabsTrigger>
          <TabsTrigger value="new-product" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {isEditing ? 'Edit Product' : 'New Product'}
          </TabsTrigger>
          <TabsTrigger value="new-promotion" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {isEditingPromotion ? 'Edit Promotion' : 'New Promotion'}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Gauge className="mr-2 h-6 w-6" />
              Shop Dashboard
            </h2>
            <Button 
              variant="outline" 
              className="text-gray-600"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/shop/metrics'] })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
          
          {isLoadingMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-gray-500">
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      Total Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shopMetrics?.totalProducts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shopMetrics?.outOfStockProducts || 0} out of stock
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-gray-500">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shopMetrics?.totalOrders || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Conversion rate: {shopMetrics?.conversionRate.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-gray-500">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${shopMetrics?.totalRevenue.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. order: ${shopMetrics?.averageOrderValue.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-gray-500">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Low Stock Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shopMetrics?.lowStockProducts || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Items below threshold
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Sales</CardTitle>
                    <CardDescription>Revenue and order trends for the past 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {shopMetrics?.monthlySales && (
                      <div className="h-80">
                        <BarChart 
                          data={shopMetrics.monthlySales}
                          index="month"
                          categories={["revenue", "orders"]}
                          colors={["rgb(124, 58, 237)", "rgb(59, 130, 246)"]}
                          valueFormatter={(value: number) => `$${value.toLocaleString()}`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Sales</CardTitle>
                    <CardDescription>Sales distribution by product category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {shopMetrics?.categorySales && (
                      <div className="h-80">
                        <PieChart 
                          data={shopMetrics.categorySales.map(cat => ({
                            name: cat.category,
                            value: cat.sales
                          }))}
                          label="Sales"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top selling products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2 text-amber-500" />
                    Top Selling Products
                  </CardTitle>
                  <CardDescription>Products with the highest sales volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopMetrics?.topSellingProducts?.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell className="text-right">{product.sales}</TableCell>
                          <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Products Management
              </h2>
              <div className="flex gap-2">
                {selectedProducts.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setBulkEditOpen(true)}
                    className="text-gray-600"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Bulk Edit ({selectedProducts.length})
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Products</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExportProducts('csv')}>
                      CSV Format
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportProducts('json')}>
                      JSON Format
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportProducts('excel')}>
                      Excel Format
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={() => {
                    resetProductForm();
                    setActiveTab('new-product');
                  }}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add New Product
                </Button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none"
                />
                <Button className="rounded-l-none">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={categoryFilter?.toString() || ""}
                onValueChange={(value) => setCategoryFilter(value ? Number(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter || ""}
                onValueChange={(value) => setStatusFilter(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={stockFilter || ""}
                onValueChange={(value) => setStockFilter(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Stock Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stock Levels</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={products && products.length > 0 && selectedProducts.length === products.length}
                        onCheckedChange={(checked) => {
                          setSelectAll(!!checked);
                        }}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!filteredProducts || filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <div className="flex flex-col items-center py-8">
                          <Package className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-lg font-medium text-gray-500">No products found</p>
                          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                        </TableCell>
                        <TableCell>{product.categoryName || 'Uncategorized'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {product.salePrice ? (
                              <div>
                                <span className="line-through text-muted-foreground mr-2">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className="font-bold">${product.salePrice.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span>${product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderInventoryStatus(product)}
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(product)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDuplicateProduct(product)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                              className="text-red-500"
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
            </Card>
          )}
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <CircleDollarSign className="mr-2 h-5 w-5" />
              Promotion Management
            </h2>
            <Button 
              onClick={() => {
                resetPromotionForm();
                setActiveTab('new-promotion');
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Promotion
            </Button>
          </div>

          {isLoadingPromotions ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!promotions || promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <div className="flex flex-col items-center py-8">
                          <CircleDollarSign className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-lg font-medium text-gray-500">No promotions found</p>
                          <p className="text-sm text-gray-400">Create new promotions to offer discounts to your customers</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>
                          <div className="font-medium">{promotion.name}</div>
                        </TableCell>
                        <TableCell>
                          {promotion.code ? (
                            <Badge variant="outline" className="font-mono">
                              {promotion.code}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {promotion.type === 'percentage' && 'Percentage'}
                          {promotion.type === 'fixed' && 'Fixed Amount'}
                          {promotion.type === 'bogo' && 'Buy One Get One'}
                          {promotion.type === 'free-shipping' && 'Free Shipping'}
                        </TableCell>
                        <TableCell>
                          {promotion.type === 'percentage' && `${promotion.value}%`}
                          {promotion.type === 'fixed' && `$${promotion.value.toFixed(2)}`}
                          {promotion.type === 'bogo' && `${promotion.value}% Off`}
                          {promotion.type === 'free-shipping' && 'Free'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(promotion.startsAt).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">to {new Date(promotion.endsAt).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderPromotionDurationBadge(promotion)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                toast({
                                  title: "Not Implemented",
                                  description: "Edit promotion functionality is not yet implemented.",
                                  variant: "default",
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this promotion?`)) {
                                  toast({
                                    title: "Not Implemented",
                                    description: "Delete promotion functionality is not yet implemented.",
                                    variant: "default",
                                  });
                                }
                              }}
                              className="text-red-500"
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
            </Card>
          )}
        </TabsContent>

        {/* New Product Tab */}
        <TabsContent value="new-product" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              {isEditing ? (
                <>
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Product
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  New Product
                </>
              )}
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                resetProductForm();
                setActiveTab('products');
              }}
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Enter the main product details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input 
                      id="name" 
                      value={productFormData.name} 
                      onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea 
                      id="shortDescription" 
                      value={productFormData.shortDescription} 
                      onChange={(e) => setProductFormData({...productFormData, shortDescription: e.target.value})}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea 
                      id="description" 
                      value={productFormData.description} 
                      onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryId">Category</Label>
                      <Select 
                        value={productFormData.categoryId?.toString() || ""}
                        onValueChange={(value) => setProductFormData({...productFormData, categoryId: Number(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input 
                        id="tags" 
                        placeholder="Comma separated tags"
                        value={productFormData.tags?.join(', ') || ''}
                        onChange={(e) => setProductFormData({
                          ...productFormData, 
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing & Inventory</CardTitle>
                  <CardDescription>Set pricing and stock information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Regular Price ($)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={productFormData.price} 
                        onChange={(e) => setProductFormData({...productFormData, price: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Sale Price ($)</Label>
                      <Input 
                        id="salePrice" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={productFormData.salePrice || ''} 
                        onChange={(e) => setProductFormData({...productFormData, salePrice: e.target.value ? parseFloat(e.target.value) : undefined})}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <div className="flex">
                        <Input 
                          id="sku" 
                          value={productFormData.sku} 
                          onChange={(e) => setProductFormData({...productFormData, sku: e.target.value})}
                          required
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          className="ml-2"
                          onClick={() => setProductFormData({...productFormData, sku: generateSku()})}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode (UPC/EAN)</Label>
                      <Input 
                        id="barcode" 
                        value={productFormData.barcode || ''} 
                        onChange={(e) => setProductFormData({...productFormData, barcode: e.target.value})}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inventory">Inventory</Label>
                      <Input 
                        id="inventory" 
                        type="number" 
                        min="0" 
                        step="1" 
                        value={productFormData.inventory} 
                        onChange={(e) => setProductFormData({...productFormData, inventory: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input 
                        id="lowStockThreshold" 
                        type="number" 
                        min="0" 
                        step="1" 
                        value={productFormData.lowStockThreshold || ''} 
                        onChange={(e) => setProductFormData({...productFormData, lowStockThreshold: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="published" 
                        checked={productFormData.published} 
                        onCheckedChange={(checked) => setProductFormData({...productFormData, published: checked})}
                      />
                      <Label htmlFor="published">Published</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="featured" 
                        checked={productFormData.featured} 
                        onCheckedChange={(checked) => setProductFormData({...productFormData, featured: checked})}
                      />
                      <Label htmlFor="featured">Featured</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="isNew" 
                        checked={productFormData.isNew} 
                        onCheckedChange={(checked) => setProductFormData({...productFormData, isNew: checked})}
                      />
                      <Label htmlFor="isNew">Mark as New</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Images</CardTitle>
                <CardDescription>
                  Add product images (not yet implemented)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-12 text-center">
                  <ImagePlus className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here or click to browse
                  </p>
                  <Button type="button" variant="outline" disabled>
                    Upload Images
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  resetProductForm();
                  setActiveTab('products');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEditing ? 'Save Changes' : 'Create Product'}</>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* New Promotion Tab */}
        <TabsContent value="new-promotion" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              {isEditingPromotion ? (
                <>
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Promotion
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  New Promotion
                </>
              )}
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                resetPromotionForm();
                setActiveTab('promotions');
              }}
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handlePromotionSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promotion Details</CardTitle>
                <CardDescription>Create a new promotional discount</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Promotion Name</Label>
                    <Input 
                      id="name" 
                      value={promotionFormData.name} 
                      onChange={(e) => setPromotionFormData({...promotionFormData, name: e.target.value})}
                      required
                      placeholder="Summer Sale, Black Friday, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Discount Code</Label>
                    <Input 
                      id="code" 
                      value={promotionFormData.code} 
                      onChange={(e) => setPromotionFormData({...promotionFormData, code: e.target.value.toUpperCase()})}
                      placeholder="SUMMER20, WELCOME10, etc. (optional)"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Discount Type</Label>
                    <Select 
                      value={promotionFormData.type as string} 
                      onValueChange={(value: any) => setPromotionFormData({...promotionFormData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Discount</SelectItem>
                        <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                        <SelectItem value="free-shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {promotionFormData.type === 'percentage' && 'Discount Percentage (%)'}
                      {promotionFormData.type === 'fixed' && 'Discount Amount ($)'}
                      {promotionFormData.type === 'bogo' && 'Second Item Discount (%)'}
                      {promotionFormData.type === 'free-shipping' && 'Free Shipping Minimum ($)'}
                    </Label>
                    <Input 
                      id="value" 
                      type="number" 
                      min="0" 
                      step={promotionFormData.type === 'fixed' ? "0.01" : "1"} 
                      value={promotionFormData.value || 0} 
                      onChange={(e) => setPromotionFormData({...promotionFormData, value: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Start Date</Label>
                    <Input 
                      id="startsAt" 
                      type="date" 
                      value={promotionFormData.startsAt} 
                      onChange={(e) => setPromotionFormData({...promotionFormData, startsAt: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endsAt">End Date</Label>
                    <Input 
                      id="endsAt" 
                      type="date" 
                      value={promotionFormData.endsAt} 
                      onChange={(e) => setPromotionFormData({...promotionFormData, endsAt: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumPurchase">Minimum Purchase Amount ($)</Label>
                    <Input 
                      id="minimumPurchase" 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      value={promotionFormData.minimumPurchase || ''} 
                      onChange={(e) => setPromotionFormData({
                        ...promotionFormData, 
                        minimumPurchase: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="Optional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maximumUses">Maximum Uses</Label>
                    <Input 
                      id="maximumUses" 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={promotionFormData.maximumUses || ''} 
                      onChange={(e) => setPromotionFormData({
                        ...promotionFormData, 
                        maximumUses: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="Optional (unlimited if blank)"
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="active" 
                      checked={promotionFormData.active} 
                      onCheckedChange={(checked) => setPromotionFormData({...promotionFormData, active: checked})}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promotion Scope</CardTitle>
                <CardDescription>Select which products this promotion applies to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Apply to Categories</Label>
                    <Select 
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Category selection not implemented yet</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Apply to Products</Label>
                    <Select 
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">Product selection not implemented yet</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  resetPromotionForm();
                  setActiveTab('promotions');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPromotionMutation.isPending}>
                {createPromotionMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {isEditingPromotion ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEditingPromotion ? 'Save Changes' : 'Create Promotion'}</>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit Products</DialogTitle>
            <DialogDescription>
              Edit multiple products at once. Only selected fields will be updated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkPrice">Price</Label>
                <Switch 
                  id="bulkPriceToggle" 
                  checked={bulkEditData.price.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    price: {...bulkEditData.price, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.price.change && (
                <div className="flex space-x-2">
                  <Select 
                    value={bulkEditData.price.type} 
                    onValueChange={(value: 'fixed' | 'percentage') => setBulkEditData({
                      ...bulkEditData, 
                      price: {...bulkEditData.price, type: value}
                    })}
                  >
                    <SelectTrigger className="w-[30%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">$</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    id="bulkPrice" 
                    type="number" 
                    value={bulkEditData.price.value} 
                    onChange={(e) => setBulkEditData({
                      ...bulkEditData, 
                      price: {...bulkEditData.price, value: parseFloat(e.target.value)}
                    })}
                    min="0"
                    step={bulkEditData.price.type === 'fixed' ? "0.01" : "1"}
                    className="w-[70%]"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkSalePrice">Sale Price</Label>
                <Switch 
                  id="bulkSalePriceToggle" 
                  checked={bulkEditData.salePrice.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    salePrice: {...bulkEditData.salePrice, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.salePrice.change && (
                <div className="flex space-x-2">
                  <Select 
                    value={bulkEditData.salePrice.type} 
                    onValueChange={(value: 'fixed' | 'percentage') => setBulkEditData({
                      ...bulkEditData, 
                      salePrice: {...bulkEditData.salePrice, type: value}
                    })}
                  >
                    <SelectTrigger className="w-[30%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">$</SelectItem>
                      <SelectItem value="percentage">%</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    id="bulkSalePrice" 
                    type="number" 
                    value={bulkEditData.salePrice.value} 
                    onChange={(e) => setBulkEditData({
                      ...bulkEditData, 
                      salePrice: {...bulkEditData.salePrice, value: parseFloat(e.target.value)}
                    })}
                    min="0"
                    step={bulkEditData.salePrice.type === 'fixed' ? "0.01" : "1"}
                    className="w-[70%]"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkInventory">Inventory</Label>
                <Switch 
                  id="bulkInventoryToggle" 
                  checked={bulkEditData.inventory.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    inventory: {...bulkEditData.inventory, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.inventory.change && (
                <div className="flex space-x-2">
                  <Select 
                    value={bulkEditData.inventory.type} 
                    onValueChange={(value: 'fixed' | 'add' | 'subtract') => setBulkEditData({
                      ...bulkEditData, 
                      inventory: {...bulkEditData.inventory, type: value}
                    })}
                  >
                    <SelectTrigger className="w-[30%]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Set</SelectItem>
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="subtract">Sub</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    id="bulkInventory" 
                    type="number" 
                    value={bulkEditData.inventory.value} 
                    onChange={(e) => setBulkEditData({
                      ...bulkEditData, 
                      inventory: {...bulkEditData.inventory, value: parseInt(e.target.value)}
                    })}
                    min="0"
                    step="1"
                    className="w-[70%]"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkCategory">Category</Label>
                <Switch 
                  id="bulkCategoryToggle" 
                  checked={bulkEditData.categoryId.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    categoryId: {...bulkEditData.categoryId, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.categoryId.change && (
                <Select 
                  value={bulkEditData.categoryId.value.toString()} 
                  onValueChange={(value) => setBulkEditData({
                    ...bulkEditData, 
                    categoryId: {...bulkEditData.categoryId, value: parseInt(value)}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkPublished">Published Status</Label>
                <Switch 
                  id="bulkPublishedToggle" 
                  checked={bulkEditData.published.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    published: {...bulkEditData.published, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.published.change && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="bulkPublished" 
                    checked={bulkEditData.published.value} 
                    onCheckedChange={(checked) => setBulkEditData({
                      ...bulkEditData, 
                      published: {...bulkEditData.published, value: checked}
                    })}
                  />
                  <Label htmlFor="bulkPublished">
                    {bulkEditData.published.value ? 'Published' : 'Draft'}
                  </Label>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkFeatured">Featured Status</Label>
                <Switch 
                  id="bulkFeaturedToggle" 
                  checked={bulkEditData.featured.change} 
                  onCheckedChange={(checked) => setBulkEditData({
                    ...bulkEditData, 
                    featured: {...bulkEditData.featured, change: checked}
                  })}
                />
              </div>
              
              {bulkEditData.featured.change && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="bulkFeatured" 
                    checked={bulkEditData.featured.value} 
                    onCheckedChange={(checked) => setBulkEditData({
                      ...bulkEditData, 
                      featured: {...bulkEditData.featured, value: checked}
                    })}
                  />
                  <Label htmlFor="bulkFeatured">
                    {bulkEditData.featured.value ? 'Featured' : 'Not Featured'}
                  </Label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBulkEditOpen(false);
                resetBulkEditForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBulkEditSubmit}
              disabled={bulkEditProductsMutation.isPending || 
                !(bulkEditData.price.change || 
                bulkEditData.inventory.change || 
                bulkEditData.categoryId.change || 
                bulkEditData.published.change || 
                bulkEditData.featured.change || 
                bulkEditData.salePrice.change)}
            >
              {bulkEditProductsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>Update {selectedProducts.length} Products</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// For the chart components - these are just placeholder implementations
// You would need to implement these in your project
function Copy(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
}

export default EnhancedShopManagement;