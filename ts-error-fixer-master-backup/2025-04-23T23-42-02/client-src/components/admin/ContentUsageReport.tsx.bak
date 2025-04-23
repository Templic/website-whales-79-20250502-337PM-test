import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { 
  BarChart, 
  EyeIcon, 
  FileIcon, 
  FilterIcon, 
  MapPinIcon, 
  RefreshCwIcon 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type ContentUsageReport = {
  id: number;
  key: string;
  title: string;
  page: string;
  section: string;
  type: string;
  totalViews: number;
  lastViewed: string | null;
  usageCount: number;
  locations: string[];
  paths: string[];
};

interface ContentUsageReportProps {
  onClose?: () => void;
}

const ContentUsageReport: React.FC<ContentUsageReportProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('key');
  
  // Fetch content usage report
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/content/report/usage'],
    queryFn: async () => {
      const response = await fetch('/api/content/report/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch content usage report');
      }
      return response.json() as Promise<ContentUsageReport[]>;
    }
  });

  // Filter the report data
  const filteredReport = React.useMemo(() => {
    if (!report) return [];
    
    if (!filter) return report;
    
    return report.filter(item => {
      switch (filterType) {
        case 'key':
          return item.key.toLowerCase().includes(filter.toLowerCase());
        case 'page':
          return item.page.toLowerCase().includes(filter.toLowerCase());
        case 'section':
          return item.section.toLowerCase().includes(filter.toLowerCase());
        case 'type':
          return item.type.toLowerCase().includes(filter.toLowerCase());
        default:
          return true;
      }
    });
  }, [report, filter, filterType]);

  // Sort usage data by views
  const sortedByViews = React.useMemo(() => {
    if (!filteredReport) return [];
    return [...filteredReport].sort((a, b) => b.totalViews - a.totalViews);
  }, [filteredReport]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Content Usage Report</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Analytics showing how content is being used across the site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="filter">Filter</Label>
            <Input
              id="filter"
              placeholder="Filter content..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Label htmlFor="filterType">Filter by</Label>
            <Select 
              value={filterType} 
              onValueChange={setFilterType}
            >
              <SelectTrigger id="filterType">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="key">Key</SelectItem>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading report...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Error loading report</p>
          </div>
        ) : sortedByViews && sortedByViews.length > 0 ? (
          <Table>
            <TableCaption>Content usage across the site</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Content Key</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Last Viewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByViews.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <FileIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">{item.key}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.title}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.page}</Badge>
                  </TableCell>
                  <TableCell>{item.section}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      {item.totalViews}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {item.usageCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.lastViewed 
                      ? format(new Date(item.lastViewed), 'MMM d, yyyy h:mm a')
                      : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">No usage data available</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {onClose && (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContentUsageReport;