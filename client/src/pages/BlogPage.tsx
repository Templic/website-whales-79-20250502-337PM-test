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
          Feature coming soon
        </h1>
        <p className="text-xl text-muted-foreground">
          Cosmic Chronicles: Dive into Dale's thoughts, stories, and musical journey
        </p>
      </header>

      <section className="relative h-[500px] w-full overflow-hidden rounded-lg"> {/*Replaced blog post section*/}
        <img
          src="uploads/Dale Loves Whales with AC32085 festival.jpg"
          alt="Dale Loves Whales with AC32085"
          className="w-full h-full object-cover"
        />
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