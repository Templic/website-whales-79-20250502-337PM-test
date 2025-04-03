import { CosmicBackground } from "@/components/cosmic/CosmicBackground";
import { CommunityFeedbackLoop } from "@/components/community/CommunityFeedbackLoop";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Heart, Users, Star, MessageSquare } from "lucide-react";
import { CosmicIcon } from "@/components/cosmic/ui/cosmic-icons";

// Define the feedback item type to match the component's expectations
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

// Sample data for feedback items
const sampleFeedbackItems: FeedbackItem[] = [
  {
    id: "feedback-1",
    user: {
      name: "Astral Explorer",
      avatar: "/placeholder.svg?height=100&width=100",
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
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "I've noticed that the 528 Hz tracks sometimes have a slight background noise that can be distracting during deep meditation sessions. Could this be cleaned up in future releases?",
    date: "1 week ago",
    category: "bug",
    status: "implemented",
    votes: 38,
    userVoted: false,
    comments: 7,
  },
  {
    id: "feedback-3",
    user: {
      name: "Cosmic Voyager",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "It would be amazing to have a feature that allows us to create custom playlists that follow the chakra system from root to crown. This would help create a complete journey through all energy centers.",
    date: "2 weeks ago",
    category: "feature",
    status: "pending",
    votes: 27,
    userVoted: false,
    comments: 3,
  },
  {
    id: "feedback-4",
    user: {
      name: "Frequency Adept",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    content:
      "The binaural beat generator is incredible, but it would be even better if we could save our custom frequency combinations and share them with the community!",
    date: "3 weeks ago",
    category: "feature",
    status: "implemented",
    votes: 56,
    userVoted: true,
    comments: 12,
  },
];

export default function CommunityPage() {
  const { toast } = useToast();
  const [feedbackItems, setFeedbackItems] = useState(sampleFeedbackItems);

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

  const handleSubmitFeedback = (feedback: { content: string; category: string }) => {
    // In a real app, you would send this to your API
    toast({
      title: "Feedback submitted",
      description: "Thank you for your valuable input! We'll review it soon.",
    });

    // Add to local state (simulating real behavior)
    const newFeedback: FeedbackItem = {
      id: `feedback-${Math.random().toString(36).substr(2, 9)}`,
      user: {
        name: "Cosmic Contributor",
        avatar: "/placeholder.svg?height=100&width=100",
      },
      content: feedback.content,
      date: "Just now",
      category: feedback.category,
      status: "pending", // explicitly typed as one of the allowed values
      votes: 1,
      userVoted: true,
      comments: 0,
    };

    setFeedbackItems((prev) => [newFeedback, ...prev]);
  };

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
          <div className="text-center mb-12">
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

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Star className="mr-2 h-5 w-5 text-amber-400" />
              Community Impact
            </h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">48</p>
                <p className="text-sm text-muted-foreground">Implemented</p>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">23</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">154</p>
                <p className="text-sm text-muted-foreground">Feedback Items</p>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">92%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Your ideas shape our evolution. We've implemented <span className="font-medium text-emerald-500">48</span> community suggestions in the last year!
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
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

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
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
                      <span className="flex items-center">Learn more <ChevronRight className="h-3 w-3 ml-1" /></span>
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
                      <span className="flex items-center">Learn more <ChevronRight className="h-3 w-3 ml-1" /></span>
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
                      <span className="flex items-center">Learn more <ChevronRight className="h-3 w-3 ml-1" /></span>
                    </Button>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                Community Guidelines
              </h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our community thrives on positive, supportive interactions that uplift everyone's cosmic journey. Please follow these guidelines:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Be respectful and supportive of all community members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Share your experiences in a constructive manner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Provide specific feedback to help improvement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="rounded-full bg-blue-500/10 text-blue-500 p-1 mt-0.5">
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <span>Respect the privacy and personal journey of others</span>
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="mt-2">
                  View Complete Guidelines
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}