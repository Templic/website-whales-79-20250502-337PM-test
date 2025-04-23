/**
 * EnhancedAnalyticsPage.tsx
 * 
 * A modern analytics dashboard with enhanced features, using the AnalyticsDisplay component.
 */
import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, ArrowLeft, Calendar as CalendarIcon, Download } from "lucide-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DateRange, SelectRangeEventHandler } from "react-day-picker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AdminLayout from "@/components/layouts/AdminLayout";
import { AnalyticsDisplay } from '@/components/features/admin/AnalyticsDisplay';

export default function EnhancedAnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | { from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });

  // Check auth status
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Redirect to="/" />;
  }

  // Handle date range change
  const handleDateRangeChange: SelectRangeEventHandler = (range) => {
    if (range?.from && range?.to) {
      setDateRange({
        from: range.from,
        to: range.to
      });
      
      // Track date range selection in Google Analytics
      const fromStr = format(range.from, "yyyy-MM-dd");
      const toStr = format(range.to, "yyyy-MM-dd");
      trackEvent(
        'Analytics', 
        'Date Range Selection', 
        `${fromStr} to ${toStr}`
      );
      
      toast({
        title: "Date range selected",
        description: `Showing data from ${format(range.from, "LLL dd, y")} to ${format(range.to, "LLL dd, y")}`,
        duration: 2000
      });
    }
  };

  // Fetch content analytics data
  const { 
    data: contentAnalytics, 
    isLoading: isLoadingContentAnalytics,
    refetch: refetchContentAnalytics
  } = useQuery({
    queryKey: [
      '/api/content-workflow/analytics', 
      dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'undefined', 
      dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'undefined'
    ],
    queryFn: async () => {
      const fromDate = dateRange?.from 
        ? format(dateRange.from, 'yyyy-MM-dd')
        : format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd');
      const toDate = dateRange?.to 
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/content-workflow/analytics?start=${fromDate}&end=${toDate}`);
      if (!response.ok) throw new Error('Failed to fetch content analytics');
      return response.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  // Fetch admin analytics data
  const { 
    data: adminAnalytics, 
    isLoading: isLoadingAdminAnalytics,
    refetch: refetchAdminAnalytics
  } = useQuery({
    queryKey: [
      '/api/admin/analytics/detailed', 
      dateRange?.from ? dateRange.from.toISOString() : 'undefined', 
      dateRange?.to ? dateRange.to.toISOString() : 'undefined'
    ],
    queryFn: async () => {
      const fromDate = dateRange?.from 
        ? dateRange.from.toISOString() 
        : new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const toDate = dateRange?.to 
        ? dateRange.to.toISOString() 
        : new Date().toISOString();
      
      const response = await fetch(`/api/admin/analytics/detailed?from=${fromDate}&to=${toDate}`);
      if (!response.ok) throw new Error('Failed to fetch admin analytics');
      return response.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin')
  });

  // Handle refreshing all analytics data
  const handleRefreshAll = () => {
    refetchContentAnalytics();
    refetchAdminAnalytics();
    toast({
      title: "Analytics Data Refreshed",
      description: "All analytics data has been updated.",
      duration: 2000
    });
  };

  // Loading state
  if (isLoadingContentAnalytics || isLoadingAdminAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Monitor and analyze site performance and user engagement</p>
          </div>
          
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal sm:w-[240px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="user">User Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {/* New Content Analytics component */}
            <AnalyticsDisplay 
              timeRange="custom"
              customRangeStart={dateRange.from}
              customRangeEnd={dateRange.to}
              showVisitors={true}
              showConversions={true}
              showRevenue={false}
            />
          </TabsContent>
          
          <TabsContent value="user" className="space-y-4">
            <div className="rounded-md border p-6">
              <h2 className="text-2xl font-bold mb-4">User Analytics</h2>
              <p>User analytics dashboard coming soon...</p>
              <p className="text-sm text-muted-foreground mt-2">
                This section will display detailed user activity, engagement metrics, and user journey analytics.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="rounded-md border p-6">
              <h2 className="text-2xl font-bold mb-4">Performance Analytics</h2>
              <p>Performance analytics dashboard coming soon...</p>
              <p className="text-sm text-muted-foreground mt-2">
                This section will display site performance metrics, loading times, and other technical analytics.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}