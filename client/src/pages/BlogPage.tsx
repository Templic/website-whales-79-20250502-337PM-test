
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/lib/date-utils";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function BlogPage() {
  const { toast } = useToast();
  const { data: posts, isLoading, error } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      return res.json();
    },
    retry: 1,
  });

  const handleLoadMore = () => {
    toast({
      title: "Coming Soon",
      description: "More posts will be available soon!",
    });
  };

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Blog</h1>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm transform transition-all 
                clip-path-octagon border-2 border-red-500/30 z-0"></div>
            <div className="relative z-10 p-8 text-center">
              <p className="text-red-400 mb-4">Failed to load blog posts. Please try again later.</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#00ebd6] text-black hover:bg-[#fe0064] hover:text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="relative">
                <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] backdrop-blur-sm transform transition-all clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                <div className="relative z-10 p-6 flex flex-col h-full">
                {post.featuredImage && (
                  <div className="clip-path-octagon overflow-hidden mx-auto mb-4 w-10/12 aspect-video">
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col items-center max-w-[90%] mx-auto">
                  <h2 className="text-xl font-bold text-[#00ebd6] mb-2 line-clamp-1 text-center">{post.title.replace(/<[^>]*>/g, '')}</h2>
                  <div className="mb-4 flex-grow overflow-hidden">
                    <p className="text-gray-300 line-clamp-3 text-sm text-center">
                      {post.content
                        .replace(/<p>/g, '')
                        .replace(/<\/p>/g, ' ')
                        .replace(/<br\s*\/?>/g, ' ')
                        .replace(/<div>/g, '')
                        .replace(/<\/div>/g, ' ')
                        .replace(/&nbsp;/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                      }
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-auto w-full">
                    <p className="text-xs text-[#fe0064]">
                      {formatDisplayDate(post.createdAt)}
                    </p>
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="border-[#00ebd6] text-[#00ebd6] hover:bg-[#00ebd6] hover:text-black"
                      onClick={() => window.location.href = `/blog/${post.id}`}
                    >
                      Read More
                    </Button>
                  </div>
                </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No posts found.</p>
        )}

        {posts && posts.length > 0 && (
          <footer className="flex justify-center mt-12">
            <Button
              className="bg-[#00ebd6] text-black px-8 py-6 rounded-full transition-all duration-300 hover:bg-[#fe0064] hover:text-white hover:translate-y-[-2px] hover:shadow-lg cosmic-hover-glow"
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
