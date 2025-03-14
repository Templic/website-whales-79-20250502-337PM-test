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
    <main className="max-w-7xl mx-auto px-4 py-8" role="main">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">
          Cosmic Chronicles
        </h1>
        <p className="text-xl">
          Dive into Dale's thoughts, stories, and musical journey
        </p>
      </header>

      <section 
        className={styles.blogGrid}
        aria-label="Blog posts"
      >
        {isLoading ? (
          <div role="status" aria-live="polite" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className={styles.blogPost}>
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
            className={styles.blogPost}
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
              <h2 className="text-2xl font-bold text-[#00ebd6] mb-2">
                {post.title}
              </h2>
              <div className="flex items-center text-gray-400 mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                <time dateTime={post.createdAt} className="text-sm">
                  {formatDisplayDate(post.createdAt)}
                </time>
              </div>
              <p className="line-clamp-3 text-gray-300 mb-4">
                {post.excerpt || (post.content ? post.content.substring(0, 150) + "..." : "")}
              </p>
              <Link href={`/blog/${post.id}`}>
                <Button>
                  Read More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </article>
        ))}
      </section>

      {posts && posts.length > 0 && (
        <footer className="flex justify-center mt-12">
          <Button 
            className="bg-[#00ebd6] text-[#303436] px-8 py-6 rounded-full hover:bg-[#fe0064] hover:text-white"
            onClick={handleLoadMore}
          >
            Load More Posts
          </Button>
        </footer>
      )}
    </main>
  );
}