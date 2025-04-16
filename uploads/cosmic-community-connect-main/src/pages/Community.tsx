import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Heart, Share2, Star, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";

interface CommunityPost {
  id: number;
  author: {
    name: string;
    avatar: string;
    role?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  image?: string;
}

const initialPosts: CommunityPost[] = [
  {
    id: 1,
    author: {
      name: "Luna Starlight",
      avatar: "https://i.pravatar.cc/150?img=32",
      role: "Featured Artist"
    },
    content: "Just released a new cosmic meditation track inspired by the alignment of Jupiter and Saturn. This celestial event has brought such powerful healing energy. Let me know your thoughts when you listen! 🌌✨",
    timestamp: "2 hours ago",
    likes: 42,
    comments: 8,
    shares: 5,
    isLiked: false,
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1422&auto=format&fit=crop"
  },
  {
    id: 2,
    author: {
      name: "Orion Walker",
      avatar: "https://i.pravatar.cc/150?img=59"
    },
    content: "The cosmic healing session last night was transformative. I felt waves of energy releasing blocks I didn't even know I had. Has anyone else experienced deep emotional releases during these sessions?",
    timestamp: "5 hours ago",
    likes: 28,
    comments: 12,
    shares: 3,
    isLiked: true
  },
  {
    id: 3,
    author: {
      name: "Astra Nova",
      avatar: "https://i.pravatar.cc/150?img=47"
    },
    content: "Creating a playlist for my morning meditation. What are your favorite cosmic healing tracks right now? Looking for recommendations that focus on heart chakra balancing. 💚",
    timestamp: "1 day ago",
    likes: 35,
    comments: 24,
    shares: 7,
    isLiked: false
  }
];

interface FeaturedMember {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  contribution: string;
  rating: number;
}

const featuredMembers: FeaturedMember[] = [
  {
    id: 1,
    name: "Zephyr Moon",
    avatar: "https://i.pravatar.cc/150?img=11",
    bio: "Sound healer and cosmic frequency artist",
    contribution: "Created healing frequency playlists that have helped hundreds of community members",
    rating: 5
  },
  {
    id: 2,
    name: "Nova Starlight",
    avatar: "https://i.pravatar.cc/150?img=13",
    bio: "Astral projection guide and cosmic energy channeler",
    contribution: "Hosts weekly astral journey sessions for the community",
    rating: 5
  },
  {
    id: 3,
    name: "Orion Sky",
    avatar: "https://i.pravatar.cc/150?img=15",
    bio: "Crystal bowl musician and spiritual mentor",
    contribution: "Shares original music and guidance for spiritual awakening",
    rating: 4
  }
];

const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  
  const handleLikePost = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };
  
  const handleSharePost = (postId: number) => {
    toast.success("Post shared to your profile!");
    
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1
        };
      }
      return post;
    }));
  };
  
  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostContent.trim()) {
      toast.error("Please write something to post");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate post submission delay
    setTimeout(() => {
      const newPost: CommunityPost = {
        id: Date.now(),
        author: {
          name: "You",
          avatar: "https://i.pravatar.cc/150?img=8"
        },
        content: newPostContent,
        timestamp: "Just now",
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false
      };
      
      setPosts([newPost, ...posts]);
      setNewPostContent("");
      setIsSubmitting(false);
      toast.success("Your post has been shared with the community!");
    }, 1000);
  };
  
  return (
    <div className="min-h-screen relative">
      <Stars />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-cosmic-gradient opacity-70 z-0"></div>
        <div className="absolute inset-0 bg-cosmic-glow z-0"></div>
        
        <div className="cosmic-container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">
                Join Our Cosmic Community
              </span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8">
              Connect with fellow cosmic travelers, share your healing journey, and grow together in our vibrant community space.
            </p>
            <Button className="cosmic-button text-lg px-8 py-6">
              Become a Member
            </Button>
          </div>
        </div>
      </section>
      
      {/* Community Content */}
      <section className="py-12">
        <div className="cosmic-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar - Left */}
            <div className="order-2 lg:order-1">
              <div className="space-y-8 sticky top-20">
                {/* Featured Member of the Week */}
                <Card className="cosmic-card">
                  <CardHeader>
                    <h3 className="text-xl font-semibold">
                      <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                        Featured Members
                      </span>
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {featuredMembers.map((member) => (
                      <div key={member.id} className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12 border-2 border-cosmic-primary/30">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-xs text-muted-foreground">{member.bio}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={i < member.rating ? "text-cosmic-vivid fill-cosmic-vivid" : "text-muted"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full border-cosmic-primary/20 hover:bg-cosmic-primary/10">
                      View All Members
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Upcoming Events */}
                <Card className="cosmic-card">
                  <CardHeader>
                    <h3 className="text-xl font-semibold">
                      <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                        Upcoming Events
                      </span>
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Cosmic Healing Sound Bath</h4>
                      <p className="text-sm text-muted-foreground">July 15, 2024 • Virtual</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-cosmic-primary/20 text-cosmic-light px-2 py-1 rounded-full">
                          32 attending
                        </span>
                        <Button variant="ghost" size="sm" className="text-cosmic-primary hover:text-cosmic-vivid hover:bg-cosmic-primary/10">
                          Join
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">New Moon Meditation Circle</h4>
                      <p className="text-sm text-muted-foreground">July 28, 2024 • Virtual</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-cosmic-primary/20 text-cosmic-light px-2 py-1 rounded-full">
                          47 attending
                        </span>
                        <Button variant="ghost" size="sm" className="text-cosmic-primary hover:text-cosmic-vivid hover:bg-cosmic-primary/10">
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to="/events" className="w-full">
                      <Button variant="outline" className="w-full border-cosmic-primary/20 hover:bg-cosmic-primary/10">
                        View All Events
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
            
            {/* Main Content - Center */}
            <div className="col-span-2 order-1 lg:order-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feed">Community Feed</TabsTrigger>
                  <TabsTrigger value="discussions">Discussions</TabsTrigger>
                  <TabsTrigger value="featured">Featured Content</TabsTrigger>
                </TabsList>
                <TabsContent value="feed">
                  {/* Create Post */}
                  <Card className="cosmic-card mb-8">
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmitPost}>
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src="https://i.pravatar.cc/150?img=8" alt="Your Profile" />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <Textarea 
                              placeholder="Share your cosmic thoughts or experiences..."
                              className="cosmic-input resize-none h-24"
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-2">
                                <Button type="button" variant="outline" size="sm" className="text-xs border-cosmic-primary/20 hover:bg-cosmic-primary/10">
                                  Add Photo
                                </Button>
                                <Button type="button" variant="outline" size="sm" className="text-xs border-cosmic-primary/20 hover:bg-cosmic-primary/10">
                                  Add Music
                                </Button>
                              </div>
                              <Button 
                                type="submit" 
                                className="cosmic-button" 
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Posting..." : "Post"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                  
                  {/* Posts Feed */}
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <Card key={post.id} className="cosmic-card">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                                <AvatarFallback>
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{post.author.name}</h4>
                                  {post.author.role && (
                                    <span className="text-xs bg-cosmic-primary/20 text-cosmic-light px-2 py-0.5 rounded-full">
                                      {post.author.role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 pb-4">
                          <p className="text-sm mb-4">{post.content}</p>
                          {post.image && (
                            <div className="mt-3 rounded-lg overflow-hidden">
                              <img 
                                src={post.image} 
                                alt="Post content" 
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="border-t border-cosmic-primary/10 pt-4">
                          <div className="flex justify-between w-full">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`text-xs flex items-center ${post.isLiked ? 'text-cosmic-primary' : ''}`}
                              onClick={() => handleLikePost(post.id)}
                            >
                              <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-cosmic-primary' : ''}`} />
                              {post.likes} Likes
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs flex items-center"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {post.comments} Comments
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs flex items-center"
                              onClick={() => handleSharePost(post.id)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              {post.shares} Shares
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="discussions">
                  <div className="text-center py-16">
                    <h3 className="text-xl font-medium mb-2">Discussion Threads</h3>
                    <p className="text-muted-foreground">Join conversations about cosmic healing and consciousness.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="featured">
                  <div className="text-center py-16">
                    <h3 className="text-xl font-medium mb-2">Featured Community Content</h3>
                    <p className="text-muted-foreground">Highlighted posts and stories from our vibrant community.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Community;
