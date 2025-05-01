import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Check, Save, Trash2, ArrowLeft, Clock, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Editor component
import { EnhancedAdminEditor } from "@/components/features/admin/EnhancedAdminEditor";

// Hooks and utilities
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

// Post schema
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
  publish_date?: string;
  expiry_date?: string;
  meta_description?: string;
  tags?: string[];
}

// Form validation schema
const postFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100, "Slug must be at most 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  cover_image: z.string().url("Cover image must be a valid URL").or(z.string().length(0)),
  published: z.boolean().default(false),
  approved: z.boolean().default(false),
  meta_description: z.string().max(160, "Meta description must be at most 160 characters").optional(),
  tags: z.array(z.string()).optional(),
  publish_date: z.date().optional().nullable(),
  expiry_date: z.date().optional().nullable(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

const PostEditPage: React.FC = () => {
  const [, params] = useRoute('/admin/posts/edit/:id');
  const postId = params?.id;
  const isNewPost = !postId;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [editorContent, setEditorContent] = useState('');
  const [selectedTab, setSelectedTab] = useState('content');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Categories - would normally be fetched from API
  const availableCategories = [
    'Music', 'Technology', 'Collaboration', 'Nature', 'Community', 'Art', 'Event', 'News'
  ];

  // Initial form setup
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      category: '',
      cover_image: '',
      published: false,
      approved: false,
      meta_description: '',
      tags: [],
      publish_date: null,
      expiry_date: null,
    },
  });

  // Fetch post data if editing an existing post
  const { data: post, isLoading } = useQuery<Post>({
    queryKey: ['/api/posts', postId],
    enabled: !isNewPost,
  });

  // Fill form with post data once loaded
  useEffect(() => {
    if (post && !isLoading) {
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        category: post.category,
        cover_image: post.cover_image,
        published: post.published,
        approved: post.approved,
        meta_description: post.meta_description || '',
        tags: post.tags || [],
        publish_date: post.publish_date ? new Date(post.publish_date) : null,
        expiry_date: post.expiry_date ? new Date(post.expiry_date) : null,
      });
      setEditorContent(post.content);
      setCoverImagePreview(post.cover_image);
    }
  }, [post, isLoading, form]);

  // Update slug from title (only for new posts or if slug is empty)
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-');     // Replace multiple hyphens with single hyphen
  };

  // Handle title change to auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue('title', title);
    
    // Only auto-generate slug for new posts or if the slug field is empty
    if (isNewPost || !form.getValues('slug')) {
      const slug = generateSlug(title);
      form.setValue('slug', slug);
    }
  };

  // Handle cover image change
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue('cover_image', url);
    setCoverImagePreview(url);
  };

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    form.setValue('content', content, { 
      shouldValidate: true 
    });
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create post');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Post created successfully',
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Redirect to edit page for the new post
      setLocation(`/admin/posts/edit/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (data: PostFormValues) => {
      setIsSubmitting(true);
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Post updated successfully',
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
        variant: 'default',
      });
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      
      // Redirect to posts list
      setLocation('/admin/posts');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: PostFormValues) => {
    const formData = {
      ...values,
      content: editorContent, // Ensure we're using the content from the editor
    };
    
    if (isNewPost) {
      createPostMutation.mutate(formData);
    } else {
      updatePostMutation.mutate(formData);
    }
  };

  // Loading state
  if (!isNewPost && isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/admin/posts')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24 mr-2" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/admin/posts')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">
            {isNewPost ? 'Create New Post' : 'Edit Post'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNewPost && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this post
                    and remove its data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePostMutation.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <Button 
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Post Details</CardTitle>
              <CardDescription>
                Update the content and settings for this blog post
              </CardDescription>
            </CardHeader>
            
            <Tabs 
              value={selectedTab} 
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <CardContent>
                <TabsList className="mb-4 w-full sm:w-auto">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                  <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter post title" 
                            {...field} 
                            onChange={handleTitleChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="enter-post-slug" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The URL-friendly version of the title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Cover Image */}
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-2">
                            <Input 
                              placeholder="https://example.com/image.jpg" 
                              {...field}
                              onChange={handleCoverImageChange}
                            />
                            {coverImagePreview && (
                              <div className="mt-2 relative">
                                <img 
                                  src={coverImagePreview} 
                                  alt="Cover preview" 
                                  className="w-full h-40 object-cover rounded-md"
                                  onError={() => setCoverImagePreview('')}
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Provide a URL for the post cover image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Editor */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <div className="min-h-[400px] border rounded-md">
                            <EnhancedAdminEditor
                              initialContent={editorContent}
                              onChange={handleEditorChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                  {/* Publication Status */}
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Publication Status</FormLabel>
                            <FormDescription>
                              {field.value 
                                ? 'This post is currently published and visible to visitors'
                                : 'This post is currently a draft and hidden from visitors'
                              }
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {/* Approval Status */}
                    <FormField
                      control={form.control}
                      name="approved"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                          <div className="space-y-0.5">
                            <FormLabel>Approval Status</FormLabel>
                            <FormDescription>
                              {field.value 
                                ? 'This post is approved and can be visible when published'
                                : 'This post requires approval before being visible'
                              }
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="tag1, tag2, tag3" 
                            value={field.value?.join(', ') || ''}
                            onChange={(e) => {
                              const tagString = e.target.value;
                              const tags = tagString
                                .split(',')
                                .map(tag => tag.trim())
                                .filter(tag => tag);
                              field.onChange(tags);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Separate tags with commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Created and Updated Info */}
                  {!isNewPost && post && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="text-sm text-gray-500 space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Created:</span>
                          <span>{format(new Date(post.created_at), 'PPP p')}</span>
                        </div>
                        {post.updated_at && (
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Last Updated:</span>
                            <span>{format(new Date(post.updated_at), 'PPP p')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="seo" className="space-y-4">
                  {/* Meta Description */}
                  <FormField
                    control={form.control}
                    name="meta_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description for search engines" 
                            {...field} 
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Recommended: 120-160 characters for optimal SEO.
                          <span className="ml-2 text-gray-500">
                            {field.value?.length || 0}/160
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* SEO Preview */}
                  <div className="border rounded-md p-4 space-y-2">
                    <h4 className="font-medium text-sm">Search Engine Preview</h4>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-blue-600 text-base font-medium truncate">
                        {form.watch('title') || 'Post Title'}
                      </div>
                      <div className="text-green-700 text-xs">
                        example.com/blog/{form.watch('slug') || 'post-slug'}
                      </div>
                      <div className="text-gray-600 text-sm line-clamp-2 mt-1">
                        {form.watch('meta_description') || 'Meta description will appear here. This helps search engines understand what your content is about.'}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="scheduling" className="space-y-4">
                  {/* Publish Date */}
                  <FormField
                    control={form.control}
                    name="publish_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Publish Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Schedule when this post should be published. Leave empty for immediate publishing.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Expiry Date */}
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Set a date when this post should automatically unpublish. Leave empty for no expiry.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Scheduled Publishing Info */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-700">Scheduled Publishing</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          If you set a publish date in the future, the post will automatically switch to "Published" status on that date, but only if the "Published" toggle is also enabled.
                        </p>
                        <p className="text-sm text-blue-600 mt-2">
                          Similarly, an expiry date will automatically unpublish the post on the specified date.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={() => setLocation('/admin/posts')}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save Post'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default PostEditPage;