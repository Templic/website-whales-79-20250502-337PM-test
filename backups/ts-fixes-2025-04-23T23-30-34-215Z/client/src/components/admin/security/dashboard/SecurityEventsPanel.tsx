/**
 * Security Events Panel Component
 * 
 * Displays a list of security events with filtering and sorting options
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Search, 
  Shield, 
  BarChart, 
  Filter,
  Download
} from 'lucide-react';

// Interface for security event data
interface SecurityEvent {
  id: string;
  timestamp: number;
  category: string;
  severity: string;
  message: string;
  sourceIp?: string;
  metadata?: Record<string, any>;
}

// Props for SecurityEventsPanel
interface SecurityEventsPanelProps {
  eventsData?: SecurityEvent[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}

/**
 * Security Events Panel Component
 */
export function SecurityEventsPanel({
  eventsData = [],
  isLoading,
  isError,
  onRefresh
}: SecurityEventsPanelProps) {
  // State for search, filter, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Function to get severity badge
  const getSeverityBadge = (severity: string) => {
    switch(severity.toUpperCase()) {
      case 'CRITICAL':
        return <Badge className="bg-red-600">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-red-500">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500">Low</Badge>;
      case 'INFO':
        return <Badge className="bg-green-500">Info</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-600">Warning</Badge>;
      default:
        return <Badge className="bg-gray-500">{severity}</Badge>;
    }
  };
  
  // Function to get severity icon
  const getSeverityIcon = (severity: string) => {
    switch(severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'LOW':
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Function to format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (!eventsData) return [];
    
    return eventsData.filter(event => {
      // Apply search term filter
      const searchFields = [
        event.message,
        event.category,
        event.severity,
        event.sourceIp || '',
        JSON.stringify(event.metadata || {})
      ].join(' ').toLowerCase();
      
      if (searchTerm && !searchFields.includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply category filter
      if (categoryFilter !== 'all' && event.category !== categoryFilter) {
        return false;
      }
      
      // Apply severity filter
      if (severityFilter !== 'all' && event.severity !== severityFilter) {
        return false;
      }
      
      // Apply time filter
      if (timeFilter !== 'all') {
        const now = Date.now();
        const eventTime = event.timestamp;
        
        switch(timeFilter) {
          case '1h':
            return now - eventTime <= 60 * 60 * 1000;
          case '24h':
            return now - eventTime <= 24 * 60 * 60 * 1000;
          case '7d':
            return now - eventTime <= 7 * 24 * 60 * 60 * 1000;
          case '30d':
            return now - eventTime <= 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [eventsData, searchTerm, categoryFilter, severityFilter, timeFilter]);
  
  // Paginate events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEvents, currentPage]);
  
  // Total pages
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  
  // Get unique categories and severities for filters
  const categories = useMemo(() => {
    if (!eventsData) return [];
    return Array.from(new Set(eventsData.map(event => event.category)));
  }, [eventsData]);
  
  const severities = useMemo(() => {
    if (!eventsData) return [];
    return Array.from(new Set(eventsData.map(event => event.severity)));
  }, [eventsData]);
  
  // Severity breakdown
  const severityBreakdown = useMemo(() => {
    if (!eventsData) return {};
    return eventsData.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [eventsData]);
  
  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!eventsData) return {};
    return eventsData.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [eventsData]);
  
  // Critical events
  const criticalEvents = useMemo(() => {
    if (!eventsData) return [];
    return eventsData.filter(event => 
      event.severity === 'CRITICAL' || event.severity === 'HIGH'
    );
  }, [eventsData]);
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If error, show error card
  if (isError) {
    return (
      <div className="space-y-4">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Security Events</CardTitle>
            <CardDescription>
              Failed to load security events data. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={onRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        {/* All Events Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>
                Complete list of security events captured by the system
              </CardDescription>
              
              {/* Filters */}
              <div className="mt-4 flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    {severities.map(severity => (
                      <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={timeFilter}
                  onValueChange={setTimeFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only md:ml-2">Refresh</span>
                </Button>
                
                <Button variant="outline">
                  <Download className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only md:ml-2">Export</span>
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableCaption>
                  Showing {paginatedEvents.length} of {filteredEvents.length} events
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead className="hidden md:table-cell">Source IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No security events match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(event.severity)}
                            <span className="hidden md:inline">
                              {getSeverityBadge(event.severity)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{event.message}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {formatDate(event.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell>{event.category}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(event.timestamp)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {event.sourceIp || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            
            {totalPages > 1 && (
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Critical Events Tab */}
        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle>Critical Security Events</CardTitle>
              <CardDescription>
                High-priority security events that require immediate attention
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {criticalEvents.length === 0 ? (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-center">
                  <ShieldCheck className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-green-700 dark:text-green-300">
                    No Critical Events
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your system has not detected any critical security events.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Severity</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criticalEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>
                          {getSeverityBadge(event.severity)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{event.message}</div>
                        </TableCell>
                        <TableCell>{event.category}</TableCell>
                        <TableCell>
                          {formatDate(event.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Statistics</CardTitle>
              <CardDescription>
                Analysis and breakdown of security events
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Severity Breakdown */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Severity Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(severityBreakdown).map(([severity, count]) => (
                      <div key={severity} className="flex items-center">
                        <div className="mr-2">
                          {getSeverityBadge(severity)}
                        </div>
                        <div className="flex-1 mx-2">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full ${
                                severity === 'CRITICAL' || severity === 'HIGH' 
                                  ? 'bg-red-500' 
                                  : severity === 'MEDIUM' || severity === 'WARNING' 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${(count / eventsData.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Category Breakdown */}
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Category Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(categoryBreakdown).map(([category, count]) => (
                      <div key={category} className="flex items-center">
                        <div className="w-32 truncate text-sm">{category}</div>
                        <div className="flex-1 mx-2">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ 
                                width: `${(count / eventsData.length) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-sm font-medium">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Time Distribution */}
                <div className="rounded-lg border p-4 md:col-span-2">
                  <h3 className="text-lg font-medium mb-2">Time Distribution</h3>
                  <div className="text-center text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Time-based charts would appear here in a production implementation.</p>
                    <p className="text-sm">The chart would show event frequency over time.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}