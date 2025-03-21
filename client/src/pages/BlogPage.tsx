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

export default function BlogPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const hasShownError = useRef(false);

  const { data: posts, isLoading, error } = useQuery<Post[]>({ 
    queryKey: ['/api/posts'],
    retry: 1
  });

  // Handle error outside of render cycle with useRef to prevent multiple toasts
  useEffect(() => {
    if (error && !hasShownError.current) {
      hasShownError.current = true;
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Memoize the load more handler
  const handleLoadMore = useCallback(() => {
    toast({
      title: "Coming Soon",
      description: "More posts will be available soon!"
    });
  }, [toast]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in" role="main">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4 animate-slide-in">
          Cosmic Chronicles
        </h1>
        <p className="text-xl text-muted-foreground">
          Dive into Dale's thoughts, stories, and musical journey
        </p>
      </header>

      <section 
        className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Blog posts"
      >
        {isLoading ? (
          <div role="status" aria-live="polite" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card transition-all duration-300 hover:shadow-lg">
                <Skeleton className="w-full h-48 rounded-lg mb-4" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-32" />
              </div>
            ))}
            <span className="sr-only">Loading blog posts...</span>
          </div>
        ) : posts?.map((post) => (
          <article 
            key={post.id}
            className="p-6 rounded-lg border bg-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          >
            {post.featuredImage && (
              <img 
                src={post.featuredImage} 
                alt={`Featured image for ${post.title}`}
                loading="lazy"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2 line-clamp-2">
                {post.title}
              </h2>
              <div className="flex items-center text-muted-foreground mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                <time dateTime={post.createdAt} className="text-sm">
                  {formatDisplayDate(post.createdAt)}
                </time>
              </div>
              <p className="line-clamp-3 text-card-foreground mb-4">
                {post.excerpt || (post.content ? post.content.substring(0, 150) + "..." : "")}
              </p>
              <Link href={`/blog/${post.id}`}>
                <Button className="group transition-all duration-300 hover:translate-y-[-2px]">
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </article>
        ))}
      </section>

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
    </main>
  );
}
const { data: posts, isLoading, error } = useQuery<Post[]>({ 
    queryKey: ['/api/posts'],
    retry: 1 // Adjust retry settings as necessary for your API's reliability
  });

  useEffect(() => {
    if (error) {
      console.error("Error loading posts:", error); // Log error for debugging
      toast({
        title: "Error",
        description: error.message || "Failed to load blog posts",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  ...
}