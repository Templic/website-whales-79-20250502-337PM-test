import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight } from "lucide-react";
import styles from "./BlogPage.module.css";
import { useAuth } from "@/hooks/use-auth";
import { formatDisplayDate } from "@/lib/date-utils";
import { useEffect, useRef, useCallback } from "react";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function BlogPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const hasShownError = useRef(false);

  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    retry: 1,
  });

  // Handle error outside of render cycle with useRef to prevent multiple toasts
  useEffect(() => {
    if (error && !hasShownError.current) {
      hasShownError.current = true;
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Memoize the load more handler
  const handleLoadMore = useCallback(() => {
    toast({
      title: "Coming Soon",
      description: "More posts will be available soon!",
    });
  }, [toast]);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Blog</h1>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p>Error loading posts.</p>
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.content}</p>
              <p className="text-sm text-gray-500">Published: {formatDisplayDate(post.createdAt)}</p>
            </div>
          ))
        ) : (
          <p>No posts found.</p>
        )}

        {posts && posts.length > 0 && (
          <footer className="flex justify-center mt-12">
            <Button
              className="bg-primary text-primary-foreground px-8 py-6 rounded-full transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
              onClick={handleLoadMore}
            >
              Load More Posts
            </Button>
          </footer>
        )}
      </div>
    </>
  );
}