import React from 'react';
import { Theme } from '../../../shared/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Paintbrush,
  Copy,
  Trash,
  Eye,
  History,
  Check,
  Globe,
  Lock,
  Edit,
  MoreVertical,
  Star,
  Clock,
  Download,
  User
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ThemeCardProps {
  theme: Theme;
  isActive?: boolean;
  onSelect?: (theme: Theme) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClone?: () => void;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onHistory?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive = false,
  onSelect,
  onEdit,
  onDelete,
  onClone,
  onPublish,
  onUnpublish,
  onHistory,
  canEdit = false,
  canDelete = false,
  canPublish = false,
}) => {
  // Format date helper
  const formatDate = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Mini theme preview to show in the card
  const ThemePreview = () => {
    return (
      <div 
        className="w-full h-24 rounded-md overflow-hidden"
        style={{ 
          backgroundColor: theme.backgroundColor,
          borderRadius: theme.borderRadius || '0.5rem',
        }}
      >
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div 
              className="h-6 w-24 rounded"
              style={{ 
                backgroundColor: theme.primaryColor,
                borderRadius: theme.borderRadius || '0.25rem',
              }}
            />
            
            <div 
              className="h-6 w-6 rounded-full"
              style={{ 
                backgroundColor: theme.accentColor,
              }}
            />
          </div>
          
          <div className="space-y-1 mb-2">
            <div 
              className="h-2 w-3/4 rounded"
              style={{ 
                backgroundColor: theme.textColor,
                opacity: 0.2
              }}
            />
            <div 
              className="h-2 w-1/2 rounded"
              style={{ 
                backgroundColor: theme.textColor,
                opacity: 0.2
              }}
            />
          </div>
          
          <div className="flex space-x-1">
            <div 
              className="h-3 px-2 rounded text-xs flex items-center"
              style={{ 
                backgroundColor: theme.primaryColor,
                color: '#fff',
                opacity: 0.9,
                fontSize: '8px',
                borderRadius: theme.borderRadius || '0.25rem',
              }}
            >
              Button
            </div>
            <div 
              className="h-3 px-2 rounded text-xs flex items-center border"
              style={{ 
                borderColor: theme.accentColor,
                color: theme.textColor,
                fontSize: '8px',
                borderRadius: theme.borderRadius || '0.25rem',
              }}
            >
              Button
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(theme);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const handleCloneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClone) {
      onClone();
    }
  };

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPublish) {
      onPublish();
    }
  };

  const handleUnpublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnpublish) {
      onUnpublish();
    }
  };

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHistory) {
      onHistory();
    }
  };

  // Main render
  return (
    <Card 
      className={`overflow-hidden transition-all ${isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
      onClick={onSelect ? () => onSelect(theme) : undefined}
    >
      <div 
        className="w-full h-1.5" 
        style={{ backgroundColor: theme.primaryColor }}
      />
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium truncate mr-2">
            {theme.name}
          </CardTitle>
          <div className="flex items-center space-x-1">
            {isActive && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="h-5 px-1">
                      <Check className="h-3 w-3 mr-1" />
                      <span className="text-xs">Active</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Currently in use</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {theme.isPublic ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Public theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Private theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1 inline" />
            {formatDate(theme.updatedAt)}
          </div>
          {theme.userId && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1 inline" />
              Custom
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ThemePreview />
        
        {theme.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {theme.description}
          </p>
        )}
        
        {theme.tags && theme.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {theme.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0 gap-2">
        {onSelect && !isActive && (
          <Button
            variant="default"
            size="sm"
            onClick={handleSelectClick}
            className="w-full"
          >
            <Paintbrush className="h-3.5 w-3.5 mr-1.5" />
            Apply
          </Button>
        )}
        
        {isActive && onSelect && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Applied
          </Button>
        )}
        
        {/* Action menu */}
        {(canEdit || canDelete || canPublish || onClone || onHistory) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              
              {onClone && (
                <DropdownMenuItem onClick={handleCloneClick}>
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </DropdownMenuItem>
              )}
              
              {canPublish && onPublish && !theme.isPublic && (
                <DropdownMenuItem onClick={handlePublishClick}>
                  <Globe className="h-4 w-4 mr-2" />
                  Publish
                </DropdownMenuItem>
              )}
              
              {canPublish && onUnpublish && theme.isPublic && (
                <DropdownMenuItem onClick={handleUnpublishClick}>
                  <Lock className="h-4 w-4 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              )}
              
              {onHistory && (
                <DropdownMenuItem onClick={handleHistoryClick}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              )}
              
              {canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleDeleteClick}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
};

export default ThemeCard;