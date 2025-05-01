import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { useMediaQuery } from 'react-responsive';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Search, Calendar, Tag, Clock, Edit, ArrowUpRight } from 'lucide-react';

// Define post type for the blog
interface Post {
  id: number;
  title: string;
  content: string;
  author_id: string;
  category: string;
  slug: string;
  cover_image: string;
  published: boolean;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

const BlogPage = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const postsPerPage = 6;
  const { toast } = useToast();

  // Fetch all posts
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ['/api/posts'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Categories extracted from posts
  const categories = React.useMemo(() => {
    if (!posts) return [];
    const categorySet = new Set(posts.map(post => post.category));
    return Array.from(categorySet);
  }, [posts]);

  // Filter posts based on search term, category and published status
  const filteredPosts = React.useMemo(() => {
    if (!posts) return [];
    
    return posts.filter(post => {
      // For non-admin users, only show published and approved posts
      if (!isAdmin && (!post.published || !post.approved)) {
        return false;
      }
      
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory, isAdmin]);

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // Format post date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle category selection
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page on category change
  };

  // Navigate to post
  const navigateToPost = (slug: string) => {
    setLocation(`/blog/${slug}`);
  };

  // Navigate to edit post (admin only)
  const navigateToEditPost = (id: number) => {
    setLocation(`/admin/posts/edit/${id}`);
  };

  // Admin quick actions
  const togglePostStatus = async (id: number, field: 'published' | 'approved', currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      
      if (!response.ok) throw new Error('Failed to update post status');
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      toast({
        title: 'Success',
        description: `Post ${field} status updated`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    }
  };

  // Pagination UI
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mt-8">
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                }}
              />
            </PaginationItem>
          )}
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => 
              page === 1 || 
              page === totalPages || 
              Math.abs(page - currentPage) <= (isMobile ? 1 : 2)
            )
            .map((page, index, array) => {
              // Add ellipsis
              if (index > 0 && array[index - 1] !== page - 1) {
                return (
                  <React.Fragment key={`ellipsis-${page}`}>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              }
              
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>Error loading blog posts. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-gray-500">Latest news, updates, and stories</p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setLocation('/admin/posts/new')}
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            New Post
          </Button>
        )}
      </div>
      
      {/* Search and Filter UI */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search posts..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <Tabs 
          defaultValue="all" 
          className="w-full md:flex-1"
          onValueChange={(value) => handleCategorySelect(value === 'all' ? null : value)}
        >
          <TabsList className="w-full md:w-auto overflow-x-auto flex-nowrap whitespace-nowrap">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Admin Status Filter (only for admins) */}
      {isAdmin && (
        <div className="mb-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      {/* Blog Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {currentPosts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-medium text-gray-800">No posts found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? 'Try different search terms or clear your filters' : 'Posts will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPosts.map(post => (
                <Card key={post.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                  <div 
                    className="aspect-video bg-cover bg-center relative" 
                    style={{ backgroundImage: `url(${post.cover_image})` }}
                  >
                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-primary/90 hover:bg-primary">
                      {post.category}
                    </Badge>
                    
                    {/* Admin Status Badges */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {!post.published && (
                          <Badge variant="outline" className="bg-yellow-500/90 hover:bg-yellow-500 border-0 text-white">
                            Draft
                          </Badge>
                        )}
                        {post.published && !post.approved && (
                          <Badge variant="outline" className="bg-orange-500/90 hover:bg-orange-500 border-0 text-white">
                            Pending
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle 
                      className="line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                      onClick={() => navigateToPost(post.slug)}
                    >
                      {post.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(post.created_at)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <p className="text-gray-600 line-clamp-3">
                      {post.content.replace(/<[^>]*>/g, '')}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between items-center">
                    <Button 
                      variant="default" 
                      className="flex items-center gap-1.5"
                      onClick={() => navigateToPost(post.slug)}
                    >
                      Read More
                      <ArrowUpRight size={14} />
                    </Button>
                    
                    {/* Admin Quick Actions */}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => togglePostStatus(post.id, 'published', post.published)}
                        >
                          {post.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigateToEditPost(post.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default BlogPage;