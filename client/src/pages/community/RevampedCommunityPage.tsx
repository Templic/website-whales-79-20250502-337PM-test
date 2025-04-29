/**
 * RevampedCommunityPage.tsx
 * 
 * An enhanced, modern community hub with improved engagement features,
 * real-time interactions, and a more immersive user experience.
 */
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Heart, 
  Users, 
  Star, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Zap, 
  Compass, 
  Award, 
  Globe,
  TrendingUp,
  ThumbsUp,
  Share2,
  Bookmark
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Custom Components
import { CosmicBackground } from "@/components/features/cosmic/CosmicBackground";
import { CommunityFeedbackLoop } from "@/components/community/CommunityFeedbackLoop";
import { CosmicIcon } from "@/components/cosmic/ui/cosmic-icons";

// Community post interface
interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    role?: string;
    reputation?: number;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved?: boolean;
  image?: string;
  tags?: string[];
  type?: 'discussion' | 'question' | 'experience' | 'creation';
  engagement?: number;
}

// Featured community member interface
interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  reputation: number;
  role?: string;
  expertise?: string[];
  joinDate: string;
  contributions: {
    posts: number;
    comments: number;
    likes: number;
  };
  badgeCount: {
    gold: number;
    silver: number;
    bronze: number;
  };
  featured?: boolean;
}

// Community event interface
interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: string;
  host: {
    name: string;
    avatar?: string;
  };
  attendees: number;
  isRegistered?: boolean;
  isPremium?: boolean;
  image?: string;
  location?: string; // Virtual or physical location
}

// Feedback item interface
interface FeedbackItem {
  id: string;
  user: {
    name: string;
    avatar: string;
    isAdmin?: boolean;
  };
  content: string;
  date: string;
  category: string;
  status: "pending" | "implemented" | "considering" | "declined";
  votes: number;
  userVoted?: boolean;
  comments: number;
  commentsList?: any[];
}

// Sample community posts
const initialPosts: CommunityPost[] = [
  {
    id: "post-1",
    user: {
      name: "Luna Starlight",
      avatar: "/placeholder.svg?height=50&width=50&text=LS",
      role: "Featured Artist",
      reputation: 1250
    },
    content: "Just released a new cosmic meditation track inspired by the alignment of Jupiter and Saturn. This celestial event has brought such powerful healing energy. Let me know your thoughts when you listen! 🌌✨",
    timestamp: "2 hours ago",
    likes: 42,
    comments: 8,
    shares: 5,
    isLiked: false,
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80",
    tags: ["meditation", "cosmic-healing", "new-release"],
    type: "creation",
    engagement: 86
  },
  {
    id: "post-2",
    user: {
      name: "Orion Walker",
      avatar: "/placeholder.svg?height=50&width=50&text=OW",
      reputation: 876
    },
    content: "The cosmic healing session last night was transformative. I felt waves of energy releasing blocks I didn't even know I had. Has anyone else experienced deep emotional releases during these sessions?",
    timestamp: "5 hours ago",
    likes: 28,
    comments: 12,
    shares: 3,
    isLiked: true,
    tags: ["experience", "healing", "energy-work"],
    type: "experience",
    engagement: 58
  },
  {
    id: "post-3",
    user: {
      name: "Nova Phoenix",
      avatar: "/placeholder.svg?height=50&width=50&text=NP",
      role: "Sound Healer",
      reputation: 932
    },
    content: "I'm looking for recommendations on the best binaural beat frequencies for deep dream work. I've been working with theta waves (4-7 Hz) but I'm curious if anyone has had success with other frequencies for lucid dreaming enhancement?",
    timestamp: "8 hours ago",
    likes: 15,
    comments: 21,
    shares: 2,
    isLiked: false,
    isSaved: true,
    tags: ["binaural", "lucid-dreams", "frequencies"],
    type: "question",
    engagement: 62
  }
];

// Sample community members data
const communityMembers: CommunityMember[] = [
  {
    id: "member-1",
    name: "Zephyr Moon",
    avatar: "/placeholder.svg?height=50&width=50&text=ZM",
    bio: "Sound healer and cosmic frequency artist",
    reputation: 1432,
    role: "Frequency Master",
    expertise: ["Sound Healing", "Meditation", "Frequency Work"],
    joinDate: "Jan 15, 2024",
    contributions: {
      posts: 48,
      comments: 126,
      likes: 312
    },
    badgeCount: {
      gold: 3,
      silver: 7,
      bronze: 12
    },
    featured: true
  },
  {
    id: "member-2",
    name: "Nova Starlight",
    avatar: "/placeholder.svg?height=50&width=50&text=NS",
    bio: "Astral projection guide and cosmic energy channeler",
    reputation: 1287,
    role: "Astral Guide",
    expertise: ["Astral Projection", "Energy Work", "Channeling"],
    joinDate: "Feb 22, 2024",
    contributions: {
      posts: 36,
      comments: 94,
      likes: 278
    },
    badgeCount: {
      gold: 2,
      silver: 5,
      bronze: 9
    },
    featured: true
  },
  {
    id: "member-3",
    name: "Orion Sky",
    avatar: "/placeholder.svg?height=50&width=50&text=OS",
    bio: "Crystal bowl musician and spiritual mentor",
    reputation: 965,
    role: "Crystal Healer",
    expertise: ["Crystal Bowls", "Mentorship", "Sound Baths"],
    joinDate: "Mar 10, 2024",
    contributions: {
      posts: 27,
      comments: 82,
      likes: 203
    },
    badgeCount: {
      gold: 1,
      silver: 4,
      bronze: 8
    },
    featured: true
  },
  {
    id: "member-4",
    name: "Aurora Celestial",
    avatar: "/placeholder.svg?height=50&width=50&text=AC",
    bio: "Quantum meditation expert and consciousness explorer",
    reputation: 843,
    role: "Consciousness Guide",
    expertise: ["Quantum Meditation", "Consciousness", "Mind Expansion"],
    joinDate: "Apr 5, 2024",
    contributions: {
      posts: 19,
      comments: 64,
      likes: 187
    },
    badgeCount: {
      gold: 1,
      silver: 3,
      bronze: 6
    },
    featured: false
  }
];

// Sample community events
const communityEvents: CommunityEvent[] = [
  {
    id: "event-1",
    title: "Full Moon Healing Meditation",
    description: "Join our global synchronized meditation during the next full moon. Experience collective healing and cosmic connection.",
    date: "May 15, 2025",
    time: "8:00 PM GMT",
    type: "meditation",
    host: {
      name: "Luna Starlight",
      avatar: "/placeholder.svg?height=50&width=50&text=LS"
    },
    attendees: 248,
    isRegistered: false,
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
    location: "Virtual - Zoom"
  },
  {
    id: "event-2",
    title: "Sound Healing Workshop",
    description: "Learn the ancient art of sound healing using singing bowls, tuning forks, and your own voice to bring harmony to your energy field.",
    date: "May 22, 2025",
    time: "2:00 PM GMT",
    type: "workshop",
    host: {
      name: "Orion Sky",
      avatar: "/placeholder.svg?height=50&width=50&text=OS"
    },
    attendees: 116,
    isPremium: true,
    image: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=600&q=80",
    location: "Virtual - Zoom"
  },
  {
    id: "event-3",
    title: "Cosmic Creator Showcase",
    description: "Monthly virtual gathering featuring community artists. Share your cosmic-inspired creations and gain feedback from peers.",
    date: "May 30, 2025",
    time: "7:00 PM GMT",
    type: "showcase",
    host: {
      name: "Nova Phoenix",
      avatar: "/placeholder.svg?height=50&width=50&text=NP"
    },
    attendees: 87,
    isRegistered: true,
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
    location: "Virtual - Discord"
  }
];

// Sample feedback items
const initialFeedbackItems: FeedbackItem[] = [
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

export default function RevampedCommunityPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [feedbackItems, setFeedbackItems] = useState(initialFeedbackItems);
  const [activeTab, setActiveTab] = useState("feed");
  const [events, setEvents] = useState(communityEvents);
  const [members, setMembers] = useState(communityMembers);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPostType, setSelectedPostType] = useState<string>("discussion");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState("all");
  
  // Animation effect for elements
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.cosmic-slide-up, .cosmic-scale, .cosmic-fade-in, .cosmic-slide-in');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('in');
      }, index * 100);
    });
  }, [activeTab]);

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

    toast({
      title: "Engagement recorded",
      description: "Your interaction has been saved.",
      duration: 1500,
    });
  };
  
  // Handle saving a post
  const handleSavePost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isSaved: !post.isSaved
        };
      }
      return post;
    }));

    toast({
      title: "Post saved",
      description: "You can find it in your bookmarks.",
      duration: 1500,
    });
  };

  // Handle sharing a post
  const handleSharePost = (postId: string) => {
    // In a real implementation, this would open a share dialog
    const post = posts.find(p => p.id === postId);
    if (post) {
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            shares: p.shares + 1
          };
        }
        return p;
      }));

      toast({
        title: "Post shared",
        description: "Thank you for sharing with your network!",
        duration: 1500,
      });
    }
  };
  
  // Handle commenting on a post
  const handleCommentPost = (postId: string) => {
    // In a real implementation, this would open a comment form
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments + 1
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

  // Handle event registration
  const handleEventRegistration = (eventId: string) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const updatedEvent = {
          ...event,
          isRegistered: !event.isRegistered,
          attendees: event.isRegistered ? event.attendees - 1 : event.attendees + 1
        };
        
        toast({
          title: updatedEvent.isRegistered ? "Registration successful" : "Registration canceled",
          description: updatedEvent.isRegistered 
            ? `You're now registered for ${event.title}` 
            : `You've canceled your registration for ${event.title}`,
          duration: 3000,
        });
        
        return updatedEvent;
      }
      return event;
    }));
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

  // Handle new post submission
  const handleNewPost = () => {
    if (newPostContent.trim() === "") return;
    
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      user: {
        name: "You",
        avatar: "/placeholder.svg?height=50&width=50&text=You",
        reputation: 100
      },
      content: newPostContent,
      timestamp: "Just now",
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      type: selectedPostType as any,
      image: postImage || undefined,
      tags: newPostContent.match(/#(\w+)/g)?.map(tag => tag.substring(1)) || [],
      engagement: 0
    };
    
    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setPostImage(null);
    setSelectedPostType("discussion");
    
    toast({
      title: "Post created",
      description: "Your post has been published to the community.",
      duration: 3000,
    });
  };
  
  // Filter posts based on search query and feed filter
  const filteredPosts = posts.filter(post => {
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Filter by feed type
    const matchesFeedFilter = 
      feedFilter === "all" || 
      (feedFilter === "trending" && post.engagement > 50) ||
      (feedFilter === "discussions" && post.type === "discussion") ||
      (feedFilter === "questions" && post.type === "question") ||
      (feedFilter === "experiences" && post.type === "experience") ||
      (feedFilter === "creations" && post.type === "creation");
    
    return matchesSearch && matchesFeedFilter;
  });

  return (
    <div className="min-h-screen relative">
      <CosmicBackground opacity={0.35} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  <span>Collaborate With Us</span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10">
                  <span>Contact Us</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Community Stats */}
          <div className="mb-12 cosmic-scale">
            <h2 className="text-2xl font-semibold mb-6 flex items-center justify-center">
              <Award className="mr-2 h-5 w-5 text-amber-400" />
              Community Impact
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card className="cosmic-glass-card p-4 text-center border-t-4 border-amber-400">
                <div className="text-3xl font-bold text-amber-400">48</div>
                <div className="text-sm text-muted-foreground">Implemented Ideas</div>
              </Card>
              <Card className="cosmic-glass-card p-4 text-center border-t-4 border-blue-400">
                <div className="text-3xl font-bold text-blue-400">23</div>
                <div className="text-sm text-muted-foreground">Under Review</div>
              </Card>
              <Card className="cosmic-glass-card p-4 text-center border-t-4 border-purple-400">
                <div className="text-3xl font-bold text-purple-400">154</div>
                <div className="text-sm text-muted-foreground">Total Feedback</div>
              </Card>
              <Card className="cosmic-glass-card p-4 text-center border-t-4 border-emerald-400">
                <div className="text-3xl font-bold text-emerald-400">92%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </Card>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Your ideas shape our evolution. We've implemented <span className="font-medium text-emerald-500">48</span> community suggestions in the last year!
            </p>
          </div>
          
          {/* Main Community Tabs */}
          <Tabs 
            defaultValue="feed" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-12 cosmic-fade-in"
          >
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-4 sm:w-auto w-full">
                <TabsTrigger value="feed" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Community Feed</span>
                  <span className="sm:hidden">Feed</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Upcoming Events</span>
                  <span className="sm:hidden">Events</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Active Members</span>
                  <span className="sm:hidden">Members</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Feedback Loop</span>
                  <span className="sm:hidden">Feedback</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Community Feed Tab */}
            <TabsContent value="feed" className="space-y-6">
              {/* Post Creation Card */}
              <Card className="cosmic-glass-card p-6 mb-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder.svg?height=50&width=50&text=You" alt="Your Avatar" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea 
                      placeholder="Share your cosmic journey or ask a question..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="mb-3 bg-black/30 focus:ring-cyan-500/50"
                      rows={3}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Select value={selectedPostType} onValueChange={setSelectedPostType}>
                        <SelectTrigger className="w-[140px] bg-black/30">
                          <SelectValue placeholder="Post Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discussion">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-cyan-400" />
                              <span>Discussion</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="question">
                            <div className="flex items-center gap-2">
                              <Compass className="h-4 w-4 text-purple-400" />
                              <span>Question</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="experience">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-rose-400" />
                              <span>Experience</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="creation">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-amber-400" />
                              <span>Creation</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                          onClick={() => setPostImage("https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?auto=format&fit=crop&w=600&q=80")}
                        >
                          Add Image
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
                        >
                          Add Tags
                        </Button>
                      </div>
                      
                      <Button 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        onClick={handleNewPost}
                        disabled={newPostContent.trim() === ""}
                      >
                        Share Post
                      </Button>
                    </div>
                    
                    {postImage && (
                      <div className="mt-3 relative">
                        <img 
                          src={postImage} 
                          alt="Post attachment preview" 
                          className="rounded-lg w-full h-32 object-cover"
                        />
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={() => setPostImage(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Feed Filters */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Select defaultValue="all" value={feedFilter} onValueChange={setFeedFilter}>
                    <SelectTrigger className="w-[130px] bg-black/30">
                      <SelectValue placeholder="Filter Feed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      <SelectItem value="trending">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-rose-400" />
                          <span>Trending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="discussions">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-cyan-400" />
                          <span>Discussions</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="questions">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-purple-400" />
                          <span>Questions</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="experiences">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-rose-400" />
                          <span>Experiences</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="creations">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-400" />
                          <span>Creations</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    type="search" 
                    placeholder="Search posts..." 
                    className="w-full max-w-[300px] bg-black/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Community Posts */}
              <div className="space-y-6">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <Card key={post.id} className="cosmic-glass-card p-5 hover:border-cyan-500/50 transition-colors">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={post.user.avatar} alt={post.user.name} />
                            <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium">{post.user.name}</span>
                            
                            {post.user.role && (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                {post.user.role}
                              </Badge>
                            )}
                            
                            {post.user.reputation && (
                              <span className="text-xs text-cyan-400 flex items-center">
                                <Star className="h-3 w-3 mr-1 fill-cyan-400" />
                                {post.user.reputation}
                              </span>
                            )}
                            
                            <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                            
                            {post.type && (
                              <Badge className={`
                                ${post.type === 'discussion' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 
                                  post.type === 'question' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                  post.type === 'experience' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                  'bg-amber-500/20 text-amber-400 border-amber-500/30'}
                              `}>
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="mb-3">{post.content}</p>
                          
                          {post.image && (
                            <div className="mb-4">
                              <img 
                                src={post.image} 
                                alt="Post attachment" 
                                className="rounded-lg w-full max-h-80 object-cover"
                              />
                            </div>
                          )}
                          
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="bg-black/30 text-cyan-400 border-cyan-500/20">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`flex items-center gap-1 ${post.isLiked ? 'text-cyan-500' : ''}`}
                              onClick={() => handleLikePost(post.id)}
                            >
                              <ThumbsUp className={`h-4 w-4 ${post.isLiked ? 'fill-cyan-500' : ''}`} />
                              <span>{post.likes}</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleCommentPost(post.id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="flex items-center gap-1"
                              onClick={() => handleSharePost(post.id)}
                            >
                              <Share2 className="h-4 w-4" />
                              <span>{post.shares}</span>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`flex items-center gap-1 ${post.isSaved ? 'text-amber-500' : ''}`}
                              onClick={() => handleSavePost(post.id)}
                            >
                              <Bookmark className={`h-4 w-4 ${post.isSaved ? 'fill-amber-500' : ''}`} />
                              <span>Save</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-black/20 rounded-lg">
                    <p className="text-muted-foreground mb-4">No posts match your criteria.</p>
                    <Button onClick={() => {setSearchQuery(""); setFeedFilter("all");}}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              
              {filteredPosts.length > 0 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10">
                    Load More Posts
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card 
                    key={event.id} 
                    className="cosmic-glass-card overflow-hidden hover:border-blue-500/50 transition-all duration-300"
                  >
                    <div className="relative h-48">
                      <img 
                        src={event.image || "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=80"} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <Badge className={`
                          ${event.type === 'meditation' ? 'bg-blue-600' : 
                            event.type === 'workshop' ? 'bg-purple-600' :
                            'bg-amber-600'}
                        `}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                        
                        <h3 className="text-white font-semibold text-lg mt-1 line-clamp-1">{event.title}</h3>
                        
                        <div className="flex items-center text-white/80 text-sm mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{event.date}</span>
                          {event.time && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{event.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {event.isPremium && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-600">
                            Premium
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={event.host.avatar} alt={event.host.name} />
                            <AvatarFallback>{event.host.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">Hosted by {event.host.name}</span>
                        </div>
                        
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.attendees}</span>
                        </Badge>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center mt-3 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3 mr-1" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      <Button 
                        className={`w-full mt-4 ${
                          event.isRegistered 
                            ? 'bg-rose-500 hover:bg-rose-600' 
                            : (event.isPremium 
                              ? 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700' 
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700')
                        }`}
                        onClick={() => handleEventRegistration(event.id)}
                      >
                        {event.isRegistered ? 'Cancel Registration' : (event.isPremium ? 'Register (Premium)' : 'Register Now')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                >
                  View All Events
                </Button>
              </div>
            </TabsContent>
            
            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Card 
                    key={member.id} 
                    className={`cosmic-glass-card p-5 ${
                      member.featured 
                        ? 'border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                        : 'hover:border-cyan-500/50'
                    } transition-all duration-300`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16 ring-2 ring-offset-2 ring-cyan-500/30 ring-offset-background">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                          {member.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          {member.featured && (
                            <Badge className="bg-gradient-to-r from-amber-400 to-amber-600">
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        {member.role && (
                          <Badge variant="outline" className="mt-1">
                            {member.role}
                          </Badge>
                        )}
                        
                        <div className="flex items-center mt-1 text-cyan-400">
                          <Star className="h-4 w-4 mr-1 fill-cyan-400" />
                          <span>{member.reputation}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                    
                    {member.expertise && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {member.expertise.map(skill => (
                          <Badge key={skill} variant="outline" className="bg-background/50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-black/20 rounded-md p-2">
                        <div className="text-lg font-semibold">{member.contributions.posts}</div>
                        <div className="text-xs text-muted-foreground">Posts</div>
                      </div>
                      <div className="bg-black/20 rounded-md p-2">
                        <div className="text-lg font-semibold">{member.contributions.comments}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <div className="bg-black/20 rounded-md p-2">
                        <div className="text-lg font-semibold">{member.contributions.likes}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {member.badgeCount.gold > 0 && (
                          <div className="flex items-center bg-amber-500/20 text-amber-500 rounded px-2 py-0.5 text-xs">
                            <Award className="h-3 w-3 mr-1 fill-amber-500" />
                            <span>{member.badgeCount.gold}</span>
                          </div>
                        )}
                        {member.badgeCount.silver > 0 && (
                          <div className="flex items-center bg-slate-300/20 text-slate-300 rounded px-2 py-0.5 text-xs">
                            <Award className="h-3 w-3 mr-1 fill-slate-300" />
                            <span>{member.badgeCount.silver}</span>
                          </div>
                        )}
                        {member.badgeCount.bronze > 0 && (
                          <div className="flex items-center bg-amber-700/20 text-amber-700 rounded px-2 py-0.5 text-xs">
                            <Award className="h-3 w-3 mr-1 fill-amber-700" />
                            <span>{member.badgeCount.bronze}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Member since {member.joinDate}
                      </span>
                    </div>
                    
                    <Button className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                >
                  View All Members
                </Button>
              </div>
            </TabsContent>
            
            {/* Feedback Loop Tab */}
            <TabsContent value="feedback" className="space-y-6">
              <CommunityFeedbackLoop
                feedbackItems={feedbackItems}
                onVote={handleVote}
                onSubmit={handleSubmitFeedback}
                onComment={handleComment}
              />
            </TabsContent>
          </Tabs>
          
          {/* Community Guidelines */}
          <div className="mt-12 mb-12 cosmic-slide-up">
            <Card className="cosmic-glass-card p-6 border-t-4 border-blue-500">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                Community Guidelines
              </h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our community thrives on positive, supportive interactions that uplift everyone's cosmic journey. Please follow these guidelines:
                </p>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Be respectful and supportive of all community members</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Share your experiences in a constructive manner</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Provide specific feedback to help improvement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Respect the privacy and personal journey of others</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Focus on solutions rather than problems</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Keep discussions relevant to cosmic healing and growth</span>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" className="border-blue-400 text-blue-400 hover:bg-blue-400/10">
                    View Complete Guidelines
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx global>{`
        .cosmic-slide-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .cosmic-slide-up.in {
          opacity: 1;
          transform: translateY(0);
        }
        
        .cosmic-scale {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .cosmic-scale.in {
          opacity: 1;
          transform: scale(1);
        }
        
        .cosmic-fade-in {
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        
        .cosmic-fade-in.in {
          opacity: 1;
        }
        
        .cosmic-slide-in {
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .cosmic-slide-in.in {
          opacity: 1;
          transform: translateX(0);
        }
        
        .cosmic-hover-scale {
          transition: transform 0.3s ease;
        }
        
        .cosmic-hover-scale:hover {
          transform: scale(1.02);
        }
        
        .cosmic-hover-glow {
          transition: box-shadow 0.3s ease;
        }
        
        .cosmic-hover-glow:hover {
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
        }
        
        .cosmic-glass-card {
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .cosmic-glass-card:hover {
          border-color: rgba(56, 189, 248, 0.2);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.1);
        }
      `}</style>
    </div>
  );
}