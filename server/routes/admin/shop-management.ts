/**
 * Admin Shop Management API Routes
 * 
 * Provides endpoints for managing shop products and orders in the admin panel
 */
import express from 'express';
import { db } from '../../db';
import { storage } from '../../storage';
import { 
  products, 
  productCategories, 
  orders, 
  orderItems, 
  users 
} from '../../../shared/schema';
import { eq, and, desc, asc, sql, like, not, gt, lt, isNotNull, isNull } from 'drizzle-orm';

const router = express.Router();

// Authentication middleware for admin-only access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // @ts-ignore: User role property should exist
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  
  next();
};

/**
 * GET /api/admin/shop/products
 * 
 * Retrieve all products with pagination and filtering
 */
router.get('/products', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const published = req.query.published ? req.query.published === 'true' : undefined;
    const featured = req.query.featured ? req.query.featured === 'true' : undefined;
    const search = req.query.search as string | undefined;
    
    // Build the query
    let query = db.select({
      ...products,
      categoryName: productCategories.name
    }).from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id));
    
    // Apply filters
    const conditions = [];
    
    if (categoryId !== undefined) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    
    if (published !== undefined) {
      conditions.push(eq(products.published, published));
    }
    
    if (featured !== undefined) {
      conditions.push(eq(products.featured, featured));
    }
    
    if (search) {
      conditions.push(
        sql`lower(${products.name}) LIKE lower(${'%' + search + '%'}) OR 
            lower(${products.description}) LIKE lower(${'%' + search + '%'}) OR
            lower(${products.sku}) LIKE lower(${'%' + search + '%'})`
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(products.createdAt));
    } else if (sortField === 'name') {
      query = query.orderBy(sortOrder(products.name));
    } else if (sortField === 'price') {
      query = query.orderBy(sortOrder(products.price));
    } else if (sortField === 'inventory') {
      query = query.orderBy(sortOrder(products.inventory));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const productsList = await query;
    
    // Return products with pagination metadata
    res.json({
      products: productsList,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/admin/shop/products/:id
 * 
 * Retrieve a specific product by ID
 */
router.get('/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // Get product with category information
    const [product] = await db.select({
      ...products,
      categoryName: productCategories.name
    }).from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(eq(products.id, productId));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get recent orders that include this product
    const recentOrders = await db.select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      orderDate: orders.createdAt,
      status: orders.status,
      customerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`
    }).from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orderItems.productId, productId))
      .orderBy(desc(orders.createdAt))
      .limit(5);
    
    res.json({
      ...product,
      recentOrders
    });
  } catch (error) {
    console.error(`Error fetching product with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/admin/shop/products
 * 
 * Create a new product
 */
router.post('/products', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      salePrice,
      sku,
      inventory,
      weight,
      dimensions,
      featured,
      published,
      categoryId,
      images
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !sku || !categoryId || !price) {
      return res.status(400).json({ 
        error: 'Required fields missing', 
        required: ['name', 'description', 'sku', 'categoryId', 'price'] 
      });
    }
    
    // Validate category exists
    const [category] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId));
    
    if (!category) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    
    // Check for duplicate slug
    if (slug) {
      const [existingProduct] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug));
      
      if (existingProduct) {
        return res.status(400).json({ error: 'A product with this slug already exists' });
      }
    }
    
    // Create the product
    const [newProduct] = await db.insert(products)
      .values({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        shortDescription: shortDescription || null,
        price,
        salePrice: salePrice || null,
        sku,
        inventory: inventory || 0,
        weight: weight || null,
        dimensions: dimensions || null,
        featured: featured || false,
        published: published || false,
        categoryId,
        images: images || [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * PUT /api/admin/shop/products/:id
 * 
 * Update a product
 */
router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const updates = req.body;
    
    // Validate product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check for duplicate slug if changing
    if (updates.slug && updates.slug !== existingProduct.slug) {
      const [duplicateSlug] = await db
        .select()
        .from(products)
        .where(eq(products.slug, updates.slug))
        .where(not(eq(products.id, productId)));
      
      if (duplicateSlug) {
        return res.status(400).json({ error: 'A product with this slug already exists' });
      }
    }
    
    // Validate category if changing
    if (updates.categoryId) {
      const [category] = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.id, updates.categoryId));
      
      if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
    }
    
    // Always update the updatedAt field
    updates.updatedAt = new Date();
    
    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId))
      .returning();
    
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error updating product with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/admin/shop/products/:id
 * 
 * Delete a product
 */
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    // Validate product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if product has been ordered
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderItems)
      .where(eq(orderItems.productId, productId));
    
    if (orderCount.count > 0) {
      // If product has been ordered, just unpublish it instead of deleting
      await db
        .update(products)
        .set({ 
          published: false, 
          updatedAt: new Date() 
        })
        .where(eq(products.id, productId));
      
      return res.json({ 
        success: true, 
        message: 'Product has existing orders; it has been unpublished instead of deleted',
        unpublished: true
      });
    }
    
    // Delete the product if no orders
    await db
      .delete(products)
      .where(eq(products.id, productId));
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully',
      deleted: true
    });
  } catch (error) {
    console.error(`Error deleting product with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/**
 * GET /api/admin/shop/categories
 * 
 * Retrieve all product categories
 */
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    // Build the query
    let query = db.select().from(productCategories);
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'name';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'desc' ? desc : asc;
    
    // Apply sorting
    if (sortField === 'name') {
      query = query.orderBy(sortOrder(productCategories.name));
    } else if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(productCategories.createdAt));
    }
    
    // Execute the query
    const categories = await query;
    
    // Get product counts for each category
    const categoryCounts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`
      })
      .from(products)
      .groupBy(products.categoryId);
    
    // Map counts to categories
    const categoriesWithCounts = categories.map(category => {
      const countInfo = categoryCounts.find(c => c.categoryId === category.id);
      return {
        ...category,
        productCount: countInfo ? countInfo.count : 0
      };
    });
    
    res.json(categoriesWithCounts);
  } catch (error) {
    console.error('Error fetching product categories:', error);
    res.status(500).json({ error: 'Failed to fetch product categories' });
  }
});

/**
 * POST /api/admin/shop/categories
 * 
 * Create a new product category
 */
router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      image
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Check for duplicate slug or name
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const [existingCategory] = await db
      .select()
      .from(productCategories)
      .where(
        sql`lower(${productCategories.name}) = lower(${name}) OR 
            ${productCategories.slug} = ${generatedSlug}`
      );
    
    if (existingCategory) {
      return res.status(400).json({ error: 'A category with this name or slug already exists' });
    }
    
    // Create the category
    const [newCategory] = await db.insert(productCategories)
      .values({
        name,
        slug: generatedSlug,
        description: description || null,
        image: image || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating product category:', error);
    res.status(500).json({ error: 'Failed to create product category' });
  }
});

/**
 * PUT /api/admin/shop/categories/:id
 * 
 * Update a product category
 */
router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const {
      name,
      slug,
      description,
      image
    } = req.body;
    
    // Validate category exists
    const [existingCategory] = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId));
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check for duplicate slug or name
    if (
      (name && name !== existingCategory.name) || 
      (slug && slug !== existingCategory.slug)
    ) {
      const checkSlug = slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || existingCategory.slug;
      
      const [duplicateCategory] = await db
        .select()
        .from(productCategories)
        .where(
          sql`(lower(${productCategories.name}) = lower(${name}) OR 
               ${productCategories.slug} = ${checkSlug}) AND
               ${productCategories.id} <> ${categoryId}`
        );
      
      if (duplicateCategory) {
        return res.status(400).json({ error: 'A category with this name or slug already exists' });
      }
    }
    
    // Create updates object with only provided fields
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    
    // Update the category
    const [updatedCategory] = await db
      .update(productCategories)
      .set(updates)
      .where(eq(productCategories.id, categoryId))
      .returning();
    
    res.json(updatedCategory);
  } catch (error) {
    console.error(`Error updating product category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product category' });
  }
});

/**
 * DELETE /api/admin/shop/categories/:id
 * 
 * Delete a product category
 */
router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Check if category has products
    const [productCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, categoryId));
    
    if (productCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products', 
        productCount: productCount.count 
      });
    }
    
    // Delete the category
    await db
      .delete(productCategories)
      .where(eq(productCategories.id, categoryId));
    
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error(`Error deleting product category with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete product category' });
  }
});

/**
 * GET /api/admin/shop/orders
 * 
 * Retrieve all orders with pagination and filtering
 */
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Parse sorting parameters
    const sortField = (req.query.sort as string) || 'createdAt';
    const sortOrder = (req.query.order as string)?.toLowerCase() === 'asc' ? asc : desc;
    
    // Parse filter parameters
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    
    // Build the query
    let query = db.select({
      ...orders,
      customerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      customerEmail: users.email
    }).from(orders)
      .leftJoin(users, eq(orders.userId, users.id));
    
    // Apply filters
    const conditions = [];
    
    if (status) {
      conditions.push(eq(orders.status, status));
    }
    
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    
    if (fromDate) {
      conditions.push(sql`${orders.createdAt} >= ${new Date(fromDate)}`);
    }
    
    if (toDate) {
      conditions.push(sql`${orders.createdAt} <= ${new Date(toDate)}`);
    }
    
    if (conditions.length > 0) {
      query = query.where(sql.and(...conditions));
    }
    
    // Count total records for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(() => conditions.length > 0 ? sql.and(...conditions) : undefined);
    
    // Apply sorting and pagination to the query
    if (sortField === 'createdAt') {
      query = query.orderBy(sortOrder(orders.createdAt));
    } else if (sortField === 'status') {
      query = query.orderBy(sortOrder(orders.status));
    } else if (sortField === 'total') {
      query = query.orderBy(sortOrder(orders.total));
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const ordersList = await query;
    
    // Return orders with pagination metadata
    res.json({
      orders: ordersList,
      pagination: {
        total: countResult.count,
        page,
        limit,
        totalPages: Math.ceil(countResult.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/admin/shop/orders/:id
 * 
 * Retrieve a specific order by ID with its items
 */
router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Get order with customer information
    const [order] = await db.select({
      ...orders,
      customerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      customerEmail: users.email
    }).from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId));
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get order items with product information
    const orderItems = await db.select({
      ...orderItems,
      productName: products.name,
      productSku: products.sku
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
    
    res.json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    console.error(`Error fetching order with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * PUT /api/admin/shop/orders/:id/status
 * 
 * Update an order's status
 */
router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    // Validate status
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate order exists
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update the order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();
    
    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order status with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * POST /api/admin/shop/products/export
 * 
 * Export products to CSV
 */
router.post('/products/export', requireAdmin, async (req, res) => {
  try {
    // Get all products with category names
    const allProducts = await db.select({
      ...products,
      categoryName: productCategories.name
    }).from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id));
    
    // Create CSV header
    const header = [
      'ID', 'Name', 'Slug', 'SKU', 'Category', 'Price', 'Sale Price', 
      'Inventory', 'Published', 'Featured', 'Created At'
    ];
    
    // Create CSV rows
    const rows = allProducts.map(product => [
      product.id,
      // Escape any commas in the name
      `"${product.name.replace(/"/g, '""')}"`,
      product.slug,
      product.sku,
      product.categoryName || '',
      product.price,
      product.salePrice || '',
      product.inventory,
      product.published ? 'true' : 'false',
      product.featured ? 'true' : 'false',
      product.createdAt ? new Date(product.createdAt).toISOString() : ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    // Return CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
});

/**
 * POST /api/admin/shop/orders/export
 * 
 * Export orders to CSV
 */
router.post('/orders/export', requireAdmin, async (req, res) => {
  try {
    // Get all orders with customer information
    const allOrders = await db.select({
      ...orders,
      customerName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      customerEmail: users.email
    }).from(orders)
      .leftJoin(users, eq(orders.userId, users.id));
    
    // Create CSV header
    const header = [
      'ID', 'Customer', 'Email', 'Status', 'Total', 'Subtotal', 'Tax', 
      'Shipping', 'Discount', 'Payment Method', 'Created At'
    ];
    
    // Create CSV rows
    const rows = allOrders.map(order => [
      order.id,
      order.customerName || '',
      order.customerEmail || '',
      order.status,
      order.total,
      order.subtotal,
      order.tax || '0',
      order.shipping || '0',
      order.discount || '0',
      order.paymentMethod,
      order.createdAt ? new Date(order.createdAt).toISOString() : ''
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    
    // Return CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({ error: 'Failed to export orders' });
  }
});

export default router;