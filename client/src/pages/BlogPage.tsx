import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDisplayDate } from "@/lib/date-utils";
import { SpotlightEffect } from "@/components/SpotlightEffect";

export default function BlogPage() {
  const { toast } = useToast();

  // Mock blog posts data since the API endpoint is not available
  const mockPosts: Post[] = [
    {
      id: 1,
      title: "Exploring Cosmic Frequencies and Their Healing Potential",
      content: "In this exploration, we dive deep into how specific sound frequencies can resonate with the body's natural energy centers, promoting healing and balance. We examine the science behind frequency healing and share practical ways to incorporate these sounds into your daily meditation practice.",
      createdAt: new Date("2025-03-15").toISOString(),
      updatedAt: new Date("2025-03-15").toISOString(),
      author: "Dr. Luna Stellaris",
      featuredImage: "/assets/blog/cosmic-frequencies.jpg"
    },
    {
      id: 2,
      title: "The Quantum Connection Between Music and Consciousness",
      content: "Recent studies in quantum physics suggest fascinating connections between vibrational frequencies and states of consciousness. This article explores how certain musical compositions can facilitate shifts in awareness and potentially activate higher states of consciousness.",
      createdAt: new Date("2025-03-01").toISOString(),
      updatedAt: new Date("2025-03-10").toISOString(),
      author: "Prof. Orion Wave",
      featuredImage: "/assets/blog/quantum-music.jpg"
    },
    {
      id: 3,
      title: "Cosmic Soundscapes: The Art of Deep Listening",
      content: "Deep listening is an art form and meditative practice that expands our perception of sound. In this article, we explore techniques for developing deeper listening skills and how this practice can open doorways to enhanced creativity and spiritual awareness.",
      createdAt: new Date("2025-02-20").toISOString(),
      updatedAt: new Date("2025-02-25").toISOString(),
      author: "Echo Nebula",
      featuredImage: "/assets/blog/deep-listening.jpg"
    },
    {
      id: 4,
      title: "Whale Song Frequencies: Nature's Most Powerful Healing Sounds",
      content: "The songs of whales contain some of the most complex and mysterious sound patterns in nature. This article examines the unique frequency patterns in whale songs and their documented effects on human brainwave patterns and emotional states.",
      createdAt: new Date("2025-02-10").toISOString(),
      updatedAt: new Date("2025-02-15").toISOString(),
      author: "Marina Oceanic",
      featuredImage: "/assets/blog/whale-song.jpg"
    }
  ];

  // Setup a simulated data fetch with the mock data
  const { data: posts, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          // If API fails, return mock data for development
          return mockPosts;
        }
        return res.json();
      } catch (err) {
        console.error("Blog posts fetch error:", err);
        // Return mock data as fallback
        return mockPosts;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    initialData: mockPosts // Set initial data to mock posts
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
                onClick={refetch}
                className="bg-[#00ebd6] text-black hover:bg-[#fe0064] hover:text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="relative h-[450px]">
                <div className="absolute inset-0 bg-[rgba(10,50,92,0.3)] backdrop-blur-sm transform transition-all clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div className="flex flex-col items-center justify-between h-full w-full mx-auto overflow-hidden"> {/* Changed to w-full for centering */}
                    {post.featuredImage && (
                      <div className="clip-path-octagon overflow-hidden mx-auto mb-3 w-9/12 aspect-video cosmic-glow-effect">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col overflow-hidden w-full max-h-[200px]">
                      <h2 className="text-xl font-bold text-[#00ebd6] mb-2 line-clamp-1 text-center">{post.title.replace(/<[^>]*>/g, '')}</h2>
                      <div className="mb-4 overflow-hidden w-full max-w-[95%] mx-auto max-h-[100px]">
                        <p className="text-gray-300 line-clamp-4 text-sm text-center">
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
                    </div>
                    <div className="flex flex-col items-center w-full mt-auto"> {/* Changed to flex-col for vertical alignment */}
                      <p className="text-xs text-[#fe0064] text-center"> {/* Added text-center */}
                        {formatDisplayDate(post.createdAt)}
                      </p>
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="border-[#00ebd6] text-[#00ebd6] hover:bg-[#00ebd6] hover:text-black mt-2 w-full mx-auto" {/* Added mt-2 and w-full for better spacing and centering */}
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