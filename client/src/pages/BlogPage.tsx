import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2, Calendar, ArrowRight } from "lucide-react";

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

  return (
    <main className="max-w-7xl mx-auto px-4 py-8" role="main">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-4">Cosmic Chronicles</h1>
        <p className="text-xl">Dive into Dale's thoughts, stories, and musical journey</p>
      </header>

      <section 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        aria-label="Blog posts"
      >
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg backdrop-blur-sm">
              <Skeleton className="w-full h-48 rounded-lg mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-32" />
            </div>
          ))
        ) : posts?.map((post) => (
          <article 
            key={post.id} 
            className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg backdrop-blur-sm hover:transform hover:scale-[1.02] transition-transform"
            itemScope 
            itemType="http://schema.org/BlogPosting"
          >
            {post.featuredImage && (
              <figure className="mb-4">
                <img 
                  src={post.featuredImage} 
                  alt={`Featured image for ${post.title}`}
                  className="w-full h-48 object-cover rounded-lg"
                  loading="lazy"
                  itemProp="image"
                />
              </figure>
            )}
            <div className="space-y-4">
              <header>
                <h2 
                  className="text-2xl font-bold text-[#00ebd6] hover:text-[#fe0064] transition-colors"
                  itemProp="headline"
                >
                  {post.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.createdAt} itemProp="datePublished">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </header>

              <div itemProp="description" className="line-clamp-3 text-gray-300">
                {post.excerpt || post.content.substring(0, 150) + "..."}
              </div>

              <footer className="pt-4 flex justify-between items-center">
                <Link href={`/blog/${post.id}`}>
                  <Button 
                    className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white inline-flex items-center gap-2"
                    aria-label={`Read more about ${post.title}`}
                  >
                    Read More
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.share?.({
                      title: post.title,
                      text: post.excerpt,
                      url: window.location.origin + `/blog/${post.id}`
                    }).catch(() => {
                      // Fallback if Web Share API is not supported
                      navigator.clipboard.writeText(window.location.origin + `/blog/${post.id}`);
                      toast({
                        title: "Link Copied!",
                        description: "Post link copied to clipboard"
                      });
                    });
                  }}
                  aria-label="Share post"
                >
                  <Share2 className="w-5 h-5" />
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