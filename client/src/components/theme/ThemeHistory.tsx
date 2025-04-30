import React, { useState } from 'react';
import { Theme } from '../../../shared/schema';
import { useThemeAPI } from '@/hooks/useThemeAPI';

import {
  History,
  ArrowLeft,
  ArrowRight,
  RefreshCcw,
  Calendar,
  User,
  PenTool,
  Eye,
  Clock,
  AlertTriangle,
  Check,
  FileText,
  ChevronRight,
  ChevronDown,
  Info,
  Loader2
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger, 
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

interface ThemeHistoryProps {
  themeId: number;
  onRestoreVersion?: (historyId: number) => void;
}

interface ThemeChange {
  field: string;
  oldValue: any;
  newValue: any;
}

interface ThemeHistoryItem {
  id: number;
  themeId: number;
  action: string;
  version: string | null;
  userId: string | null;
  timestamp: Date;
  changes: ThemeChange[];
  user?: {
    username: string;
    profileImageUrl?: string;
  };
}

const ThemeHistory: React.FC<ThemeHistoryProps> = ({
  themeId,
  onRestoreVersion,
}) => {
  const { useGetThemeHistory } = useThemeAPI();
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  
  const {
    data: history = [],
    isLoading,
    isError,
    error,
  } = useGetThemeHistory(themeId);
  
  // Format date helper
  const formatDate = (date: Date) => {
    if (!date) return '';
    
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Helper to toggle row expansion
  const toggleExpandRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };
  
  const isRowExpanded = (id: number) => expandedRows.includes(id);
  
  // Render a single history item/row
  const renderHistoryRow = (item: ThemeHistoryItem) => {
    const isExpanded = isRowExpanded(item.id);
    const isSelected = selectedHistory === item.id;
    
    return (
      <React.Fragment key={item.id}>
        <TableRow
          className={`
            cursor-pointer transition-colors hover:bg-muted/50 
            ${isSelected ? 'bg-primary/10' : ''}
          `}
          onClick={() => setSelectedHistory(item.id)}
        >
          <TableCell className="font-medium">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpandRow(item.id);
                }}
              >
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
              
              <div className="flex items-center">
                <Badge variant={getActionVariant(item.action)} className="font-normal mr-2">
                  {formatAction(item.action)}
                </Badge>
                
                {item.version && (
                  <span className="text-xs text-muted-foreground">
                    v{item.version}
                  </span>
                )}
              </div>
            </div>
          </TableCell>
          
          <TableCell>
            <div className="flex items-center text-sm">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
              {formatDate(item.timestamp)}
            </div>
          </TableCell>
          
          <TableCell>
            <div className="flex items-center text-sm">
              <User className="h-3 w-3 mr-1 text-muted-foreground" />
              {item.user?.username || 'System'}
            </div>
          </TableCell>
          
          <TableCell className="text-right">
            {onRestoreVersion && item.action !== 'restore' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestoreVersion(item.id);
                }}
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                Restore
              </Button>
            )}
          </TableCell>
        </TableRow>
        
        {isExpanded && (
          <TableRow className={isSelected ? 'bg-primary/5' : 'bg-muted/30'}>
            <TableCell colSpan={4} className="p-0">
              <div className="px-12 py-3">
                <div className="text-sm mb-2">
                  <span className="font-medium">Changes:</span>
                </div>
                {item.changes && item.changes.length > 0 ? (
                  <div className="space-y-2">
                    {item.changes.map((change, index) => (
                      <div key={index} className="flex text-sm">
                        <div className="font-medium w-1/4">{formatField(change.field)}:</div>
                        <div className="w-3/4 flex items-center">
                          <div className="text-muted-foreground line-clamp-1 mr-2">
                            {formatValue(change.oldValue)}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />
                          <div className="text-foreground line-clamp-1">
                            {formatValue(change.newValue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No detailed changes available for this action.
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };
  
  // Format action type for display
  const formatAction = (action: string): string => {
    switch (action) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      case 'restore':
        return 'Restored';
      case 'publish':
        return 'Published';
      case 'unpublish':
        return 'Unpublished';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };
  
  // Get badge variant for different actions
  const getActionVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'restore':
        return 'outline';
      case 'publish':
        return 'default';
      case 'unpublish':
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Format field names for display
  const formatField = (field: string): string => {
    switch (field) {
      case 'primaryColor':
        return 'Primary Color';
      case 'accentColor':
        return 'Accent Color';
      case 'backgroundColor':
        return 'Background Color';
      case 'textColor':
        return 'Text Color';
      case 'borderRadius':
        return 'Border Radius';
      case 'fontFamily':
        return 'Font Family';
      case 'isPublic':
        return 'Public Status';
      case 'tokens':
        return 'Tokens';
      case 'tags':
        return 'Tags';
      default:
        return field
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
    }
  };
  
  // Format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'None';
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.length === 0 ? 'None' : value.join(', ');
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Complex Object]';
      }
    }
    
    return String(value);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Theme History
          </CardTitle>
          <CardDescription>
            There was a problem loading the theme history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive/90">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No History Available</CardTitle>
            <CardDescription>
              This theme doesn't have any recorded history yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              History will be recorded when changes are made to the theme.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableCaption>Theme history and revisions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Restore</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(renderHistoryRow)}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ThemeHistory;