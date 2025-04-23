/**
 * ShopManagementPage.tsx
 * 
 * Advanced shop management page for admin users
 */import React from "react";

import { Suspense } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import ShopManagement from "@/components/features/admin/ShopManagement";
import EnhancedShopManagement from "@/components/features/admin/EnhancedShopManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingBag, Package, Tag, Truck, CreditCard, 
  BarChart2, Users, Settings, DollarSign 
} from "lucide-react";

export default function ShopManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Shop Management</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cosmic Shop Management</CardTitle>
            <CardDescription>
              Manage your cosmic merchandise, products, orders, and inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Use this dashboard to create and manage products, categories, orders, inventory levels, and promotional items.
            </p>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid grid-cols-5 h-auto">
            <TabsTrigger value="products" className="flex items-center py-3">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center py-3">
              <Package className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center py-3">
              <BarChart2 className="mr-2 h-4 w-4" />
              Sales Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center py-3">
              <Users className="mr-2 h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center py-3">
              <Settings className="mr-2 h-4 w-4" />
              Shop Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-4">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <EnhancedShopManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Orders Management
                </CardTitle>
                <CardDescription>
                  View and manage customer orders, process refunds, and handle order fulfillment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">New Orders</p>
                        <h3 className="text-2xl font-bold">24</h3>
                      </div>
                      <Package className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Processing</p>
                        <h3 className="text-2xl font-bold">16</h3>
                      </div>
                      <Truck className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <h3 className="text-2xl font-bold">93</h3>
                      </div>
                      <DollarSign className="h-8 w-8 text-primary/50" />
                    </div>
                  </Card>
                </div>
                <p className="text-center text-muted-foreground">
                  The Orders Management system is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Sales Analytics
                </CardTitle>
                <CardDescription>
                  View detailed sales reports, revenue analytics, and product performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Sales Analytics dashboard is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  View customer information, purchase history, and manage customer accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Customer Management dashboard is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Shop Settings
                </CardTitle>
                <CardDescription>
                  Configure shop settings, payment methods, shipping options, and more
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex flex-col items-center justify-center">
                <p className="text-center text-muted-foreground">
                  The Shop Settings dashboard is currently in development. Please check back soon for updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}