import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminEditor from '@/components/admin/AdminEditor';
import ContentHistoryView from '@/components/admin/ContentHistoryView';
import ContentUsageReport from '@/components/admin/ContentUsageReport';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Code,
  History,
  BarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Define types
interface ContentItem {
  id: number;
  type: 'text' | 'image' | 'html';
  key: string;
  title: string;
  content: string;
  page: string;
  section: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  version: number;
}

const ContentManagementPage: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [pageFilter, setPageFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isUsageReportOpen, setIsUsageReportOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch content data
  const { 
    data: contentItems = [], 
    isLoading, 
    error 
  } = useQuery<ContentItem[]>({ 
    queryKey: ['/api/content'],
    queryFn: async () => {
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      return response.json();
    },
    refetchOnWindowFocus: false
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: 'Success',
        description: 'Content deleted successfully',
        variant: 'default',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error deleting content',
        variant: 'destructive',
      });
    }
  });

  // Get unique pages for filtering
  const pages = Array.from(new Set(contentItems.map(item => item.page))).sort();
  
  // Filter content items
  const filteredContentItems = contentItems.filter(item => {
    const matchesSearch = searchTerm 
      ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.section.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesPage = pageFilter 
      ? item.page === pageFilter 
      : true;

    const matchesType = typeFilter 
      ? item.type === typeFilter 
      : true;
    
    return matchesSearch && matchesPage && matchesType;
  });

  // Handle creating new content
  const handleCreateNew = () => {
    setSelectedContent(null);
    setIsEditing(false);
    setIsEditorOpen(true);
  };

  // Handle editing content
  const handleEdit = (content: ContentItem) => {
    setSelectedContent(content);
    setIsEditing(true);
    setIsEditorOpen(true);
  };

  // Handle saving content
  const handleSaveContent = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/content'] });
    setIsEditorOpen(false);
  };

  // Handle deleting content
  const handleDeleteContent = (content: ContentItem) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete content
  const confirmDelete = () => {
    if (selectedContent) {
      deleteContentMutation.mutate(selectedContent.id);
    }
  };

  // Get the appropriate icon for content type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'html':
        return <Code className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  // Format the date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Truncate long content
  const truncateContent = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
            <p className="text-muted-foreground">
              Manage website content across different pages and sections
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsUsageReportOpen(true)}>
              <BarChart className="mr-2 h-4 w-4" />
              Usage Report
            </Button>
            <Button onClick={handleCreateNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Items</CardTitle>
            <CardDescription>Manage and organize your website content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, key, or section..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Select
                  value={pageFilter || 'all'}
                  onValueChange={(value) => setPageFilter(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    {pages.map((page) => (
                      <SelectItem key={page} value={page}>{page}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={typeFilter || 'all'}
                  onValueChange={(value) => setTypeFilter(value === 'all' ? null : value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error loading content. Please try again.
              </div>
            ) : filteredContentItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No content items found. Create your first content item!
              </div>
            ) : (
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContentItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell className="font-mono text-sm">{item.key}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getTypeIcon(item.type)}
                            <span className="capitalize">{item.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{item.page}</TableCell>
                        <TableCell>{item.section}</TableCell>
                        <TableCell>{formatDate(item.updatedAt || item.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedContent(item);
                                setIsHistoryDialogOpen(true);
                              }}
                              title="Version History"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContent(item)}
                              title="Delete"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredContentItems.length} item{filteredContentItems.length !== 1 ? 's' : ''} found
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Content' : 'Create New Content'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update content item details and save changes' 
                : 'Fill in the details to create a new content item'}
            </DialogDescription>
          </DialogHeader>
          <AdminEditor
            initialContent={selectedContent || undefined}
            onSave={handleSaveContent}
            onCancel={() => setIsEditorOpen(false)}
            pages={pages.length > 0 ? pages : ['home', 'about', 'blog', 'contact']}
            isEditing={isEditing}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the content item "{selectedContent?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Content Version History</DialogTitle>
            <DialogDescription>
              View and manage previous versions of "{selectedContent?.title}"
            </DialogDescription>
          </DialogHeader>
          {selectedContent && (
            <ContentHistoryView 
              contentId={selectedContent.id} 
              onClose={() => setIsHistoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Content Usage Report Dialog */}
      <Dialog open={isUsageReportOpen} onOpenChange={setIsUsageReportOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Content Usage Report</DialogTitle>
            <DialogDescription>
              Analytics showing how content is being used across the site
            </DialogDescription>
          </DialogHeader>
          <ContentUsageReport 
            onClose={() => setIsUsageReportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ContentManagementPage;