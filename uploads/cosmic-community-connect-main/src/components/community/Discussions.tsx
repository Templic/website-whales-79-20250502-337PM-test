
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Heart, MessageCircle, Share2, Plus } from "lucide-react";

interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  timestamp: string;
  tags: string[];
}

const discussionData: DiscussionPost[] = [
  {
    id: "1",
    title: "How cosmic frequencies changed my meditation practice",
    content: "I've been using the cosmic frequency tracks during my morning meditation for the past month, and I've noticed a significant shift in my energy levels throughout the day. Has anyone else experienced this?",
    author: {
      name: "CosmicMeditator",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=CosmicMeditator"
    },
    likes: 42,
    comments: 18,
    timestamp: "3 hours ago",
    tags: ["meditation", "frequencies", "wellness"]
  },
  {
    id: "2",
    title: "Group sound healing sessions - interest check",
    content: "I'm thinking about organizing weekly virtual sound healing sessions using some of the tracks available here. Would anyone be interested in joining? We could start with a 30-minute session and see how it goes.",
    author: {
      name: "HarmonySeeker",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=HarmonySeeker"
    },
    likes: 29,
    comments: 24,
    timestamp: "1 day ago",
    tags: ["sound healing", "group session", "community"]
  },
  {
    id: "3",
    title: "The science behind cosmic frequencies",
    content: "I've been researching the scientific backing of these frequency-based healing methods, and I've found some interesting studies about how certain frequencies affect brainwave patterns. Would love to discuss this with anyone who's interested in the neurological aspects.",
    author: {
      name: "NeuroExplorer",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=NeuroExplorer"
    },
    likes: 56,
    comments: 31,
    timestamp: "2 days ago",
    tags: ["science", "research", "brainwaves"]
  }
];

const Discussions = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">Community Discussions</h2>
        <Button className="bg-cosmic-primary hover:bg-cosmic-vivid">
          <Plus className="mr-2 h-4 w-4" /> Start Discussion
        </Button>
      </div>
      
      {/* Filter tags */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button variant="outline" size="sm" className="rounded-full border-cosmic-primary/30 hover:bg-cosmic-primary/10">
          All Topics
        </Button>
        <Button variant="outline" size="sm" className="rounded-full border-cosmic-primary/30 hover:bg-cosmic-primary/10">
          Meditation
        </Button>
        <Button variant="outline" size="sm" className="rounded-full border-cosmic-primary/30 hover:bg-cosmic-primary/10">
          Sound Healing
        </Button>
        <Button variant="outline" size="sm" className="rounded-full border-cosmic-primary/30 hover:bg-cosmic-primary/10">
          Research
        </Button>
        <Button variant="outline" size="sm" className="rounded-full border-cosmic-primary/30 hover:bg-cosmic-primary/10">
          Events
        </Button>
      </div>
      
      <div className="space-y-4">
        {discussionData.map((post) => (
          <Card key={post.id} className="bg-background/60 backdrop-blur-sm border-cosmic-primary/20 overflow-hidden transition-all hover:border-cosmic-primary/50">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.author.name}</p>
                    <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                  </div>
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{post.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground">{post.content}</p>
              
              <div className="flex space-x-2 mt-4">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-cosmic-primary/10 text-cosmic-primary px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-border pt-4">
              <div className="flex justify-between w-full">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  <Heart className="h-4 w-4 mr-1" /> {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  <MessageCircle className="h-4 w-4 mr-1" /> {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Discussions;
