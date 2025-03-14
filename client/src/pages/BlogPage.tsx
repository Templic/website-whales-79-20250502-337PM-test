import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Calendar, ArrowRight } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import styles from "./BlogPage.module.css";

export default function BlogPage() {
  const { toast } = useToast();

  const { data: posts, isLoading, error } = useQuery<Post[]>({ 
    queryKey: ['/api/posts'],
    retry: 1
  });

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load blog posts",
      variant: "destructive"
    });
  }

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };

  const getValidISOString = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date.toISOString() : dateString;
    } catch {
      return dateString;
    }
  };

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
            itemScope 
            itemType="http://schema.org/BlogPosting"
          >
            {post.featuredImage && (
              <figure>
                <img 
                  src={post.featuredImage} 
                  alt={`Featured image for ${post.title}`}
                  loading="lazy"
                  itemProp="image"
                />
              </figure>
            )}
            <div className={styles.postContent}>
              <header className={styles.postHeader}>
                <h2 
                  className="text-2xl font-bold text-[#00ebd6] hover:text-[#fe0064] transition-colors"
                  itemProp="headline"
                >
                  {post.title}
                </h2>
                <div className={styles.dateInfo}>
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <time dateTime={getValidISOString(post.createdAt)} itemProp="datePublished">
                    {formatDisplayDate(post.createdAt)}
                  </time>
                </div>
              </header>

              <div 
                itemProp="description" 
                className="line-clamp-3 text-gray-300"
              >
                {post.excerpt || post.content?.substring(0, 150) + "..."}
              </div>

              <footer className={styles.postFooter}>
                <Link href={`/blog/${post.id}`}>
                  <Button 
                    className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white inline-flex items-center gap-2"
                    aria-label={`Read more about ${post.title}`}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.share?.({
                      title: post.title,
                      text: post.excerpt || "",
                      url: window.location.origin + `/blog/${post.id}`
                    }).catch(() => {
                      navigator.clipboard.writeText(
                        window.location.origin + `/blog/${post.id}`
                      );
                      toast({
                        title: "Link Copied!",
                        description: "Post link copied to clipboard"
                      });
                    });
                  }}
                  aria-label={`Share ${post.title}`}
                >
                  <Share2 className="w-5 h-5" aria-hidden="true" />
                </Button>
              </footer>
            </div>
          </article>
        ))}
      </section>

      {posts && posts.length > 0 && (
        <footer className="flex justify-center mt-12">
          <Button 
            className="bg-[#00ebd6] text-[#303436] px-8 py-6 rounded-full hover:bg-[#fe0064] hover:text-white"
            onClick={() => toast({
              title: "Coming Soon",
              description: "More posts will be available soon!"
            })}
          >
            Load More Posts
          </Button>
        </footer>
      )}
    </main>
  );
}