import { useState, useEffect } from "react";
import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { CommunityFeedbackLoop } from "@/components/community/CommunityFeedbackLoop";
import EnhancedFeaturedContent from "@/components/community/EnhancedFeaturedContent";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Users, Star, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CosmicIcon } from "@/components/cosmic/ui/cosmic-icons";

// Community post interface
interface CommunityPost {
  id: string;
  user: {
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

// Sample community posts
const initialPosts: CommunityPost[] = [
  {
    id: "post-1",
    user: {
      name: "Luna Starlight",
      avatar: "/placeholder.svg?height=50&width=50&text=LS",
      role: "Featured Artist"
    },
    content: "Just released a new cosmic meditation track inspired by the alignment of Jupiter and Saturn. This celestial event has brought such powerful healing energy. Let me know your thoughts when you listen! 🌌✨",
    timestamp: "2 hours ago",
    likes: 42,
    comments: 8,
    shares: 5,
    isLiked: false,
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "post-2",
    user: {
      name: "Orion Walker",
      avatar: "/placeholder.svg?height=50&width=50&text=OW"
    },
    content: "The cosmic healing session last night was transformative. I felt waves of energy releasing blocks I didn't even know I had. Has anyone else experienced deep emotional releases during these sessions?",
    timestamp: "5 hours ago",
    likes: 28,
    comments: 12,
    shares: 3,
    isLiked: true
  }
];

// Featured community member interface
interface FeaturedMember {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  contribution: string;
  rating: number;
}

// Sample featured members
const featuredMembers: FeaturedMember[] = [
  {
    id: "member-1",
    name: "Zephyr Moon",
    avatar: "/placeholder.svg?height=50&width=50&text=ZM",
    bio: "Sound healer and cosmic frequency artist",
    contribution: "Created healing frequency playlists that have helped hundreds of community members",
    rating: 5
  },
  {
    id: "member-2",
    name: "Nova Starlight",
    avatar: "/placeholder.svg?height=50&width=50&text=NS",
    bio: "Astral projection guide and cosmic energy channeler",
    contribution: "Hosts weekly astral journey sessions for the community",
    rating: 5
  },
  {
    id: "member-3",
    name: "Orion Sky",
    avatar: "/placeholder.svg?height=50&width=50&text=OS",
    bio: "Crystal bowl musician and spiritual mentor",
    contribution: "Shares original music and guidance for spiritual awakening",
    rating: 4
  }
];

// Feedback item interface
interface FeedbackItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  date: string;
  category: string;
  status: "pending" | "implemented" | "considering" | "declined";
  votes: number;
  userVoted?: boolean;
  comments: number;
}

// Sample feedback items
const sampleFeedbackItems: FeedbackItem[] = [
  {
    id: "feedback-1",
    user: {
      name: "Astral Explorer",
      avatar: "/placeholder.svg?height=50&width=50&text=AE",
    },
    content:
      "The Astral Projection album completely transformed my meditation practice. I've been able to achieve states of consciousness I never thought possible. Would love to see more guided journeys specifically for lucid dreaming!",
    date: "2 days ago",
    category: "suggestion",
    status: "considering",
    votes: 42,
    userVoted: true,
    comments: 5,
  },
  {
    id: "feedback-2",
    user: {
      name: "Quantum Healer",
      avatar: "/placeholder.svg?height=50&width=50&text=QH",
    },
    content:
      "I've noticed that the 528 Hz tracks sometimes have a slight background noise that can be distracting during deep meditation sessions. Could this be cleaned up in future releases?",
    date: "1 week ago",
    category: "bug",
    status: "implemented",
    votes: 38,
    userVoted: false,
    comments: 7,
  }
];

export default function EnhancedCommunityPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [feedbackItems, setFeedbackItems] = useState(sampleFeedbackItems);
  const [activeTab, setActiveTab] = useState("feed");
  
  // Animation effect for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.cosmic-slide-up, .cosmic-scale, .cosmic-fade-in');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('in');
      }, index * 100);
    });
  }, []);

  // Handle liking a post
  const handleLikePost = (postId: string) => {
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
  
  // Handle voting on feedback
  const handleVote = (id: string) => {
    setFeedbackItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const userVoted = !item.userVoted;
          return {
            ...item,
            votes: userVoted ? item.votes + 1 : item.votes - 1,
            userVoted,
          };
        }
        return item;
      })
    );
  };

  // Handle submitting feedback
  const handleSubmitFeedback = (feedback: { content: string; category: string }) => {
    toast({
      title: "Feedback submitted",
      description: "Thank you for your valuable input! We'll review it soon.",
    });

    const newFeedback: FeedbackItem = {
      id: `feedback-${Math.random().toString(36).substr(2, 9)}`,
      user: {
        name: "You",
        avatar: "/placeholder.svg?height=50&width=50&text=You",
      },
      content: feedback.content,
      date: "Just now",
      category: feedback.category,
      status: "pending",
      votes: 1,
      userVoted: true,
      comments: 0,
    };

    setFeedbackItems((prev) => [newFeedback, ...prev]);
  };

  // Handle commenting on feedback
  const handleComment = (id: string) => {
    setFeedbackItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            comments: item.comments + 1,
          };
        }
        return item;
      })
    );

    toast({
      title: "Comment added",
      description: "Your comment has been added to the discussion.",
    });
  };

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.4} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 cosmic-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-4">
              Cosmic Community Hub
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground mb-6">
              Connect with fellow cosmic travelers, share your experiences, and help us shape the future of cosmic music and consciousness exploration.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link href="/collaboration">
                <Button size="lg">
                  <span>Collaborate With Us</span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  <span>Contact Us</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Featured Content Section - From Lovable.dev */}
          <div className="mb-12 cosmic-scale">
            <EnhancedFeaturedContent />
          </div>
          
          {/* Community Feedback Loop */}
          <div className="mb-12 cosmic-fade-in">
            <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center">
              <CosmicIcon name="sparkles" size={20} className="mr-2 text-cyan-400" />
              Community Feedback Loop
            </h2>
            <CommunityFeedbackLoop
              feedbackItems={feedbackItems}
              onVote={handleVote}
              onSubmit={handleSubmitFeedback}
              onComment={handleComment}
            />
          </div>

          {/* Community Info Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 cosmic-scale">
            {/* Featured Members */}
            <Card className="cosmic-glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                Featured Members
              </h3>
              <div className="space-y-6">
                {featuredMembers.map((member) => (
                  <div key={member.id} className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {member.name.substring(0, 2)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.bio}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < member.rating ? "text-amber-400 fill-amber-400" : "text-muted"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Members
                </Button>
              </div>
            </Card>
            
            {/* Community Events */}
            <Card className="cosmic-glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-rose-400" />
                Community Events
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-cyan-500/10 text-cyan-500 rounded-full p-2 mt-1">
                    <CosmicIcon name="moon" size={16} />
                  </div>
                  <div>
                    <span className="block font-medium">Full Moon Meditation</span>
                    <span className="text-muted-foreground text-sm">Join our global synchronized meditation during the next full moon.</span>
                    <Button variant="link" size="sm" className="p-0 h-auto text-cyan-500">
                      Learn more
                    </Button>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-purple-500/10 text-purple-500 rounded-full p-2 mt-1">
                    <CosmicIcon name="headphones" size={16} />
                  </div>
                  <div>
                    <span className="block font-medium">Sound Healing Workshop</span>
                    <span className="text-muted-foreground text-sm">Online workshop exploring the power of frequency for healing.</span>
                    <Button variant="link" size="sm" className="p-0 h-auto text-purple-500">
                      Learn more
                    </Button>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-500/10 text-amber-500 rounded-full p-2 mt-1">
                    <CosmicIcon name="star" size={16} />
                  </div>
                  <div>
                    <span className="block font-medium">Cosmic Creator Showcase</span>
                    <span className="text-muted-foreground text-sm">Monthly virtual gathering featuring community artists.</span>
                    <Button variant="link" size="sm" className="p-0 h-auto text-amber-500">
                      Learn more
                    </Button>
                  </div>
                </li>
              </ul>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Events
                </Button>
              </div>
            </Card>
          </div>
          
          {/* Community Posts */}
          <div className="mb-12 cosmic-fade-in">
            <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 mr-2 text-purple-400" />
              Community Discussions
            </h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="cosmic-glass-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {post.user.name.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h4 className="font-medium">{post.user.name}</h4>
                        {post.user.role && (
                          <span className="ml-2 bg-purple-500 px-2 py-1 rounded-full text-xs text-white">
                            {post.user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{post.timestamp}</p>
                      <p className="mb-4">{post.content}</p>
                      
                      {post.image && (
                        <div className="mb-4">
                          <img 
                            src={post.image} 
                            alt="Post attachment" 
                            className="rounded-lg w-full max-h-64 object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`flex items-center gap-1 ${post.isLiked ? 'text-purple-500' : ''}`}
                          onClick={() => handleLikePost(post.id)}
                        >
                          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button>
                View More Discussions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}