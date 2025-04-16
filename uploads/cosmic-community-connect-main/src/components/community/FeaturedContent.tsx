
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Bookmark, Star, CalendarDays } from "lucide-react";

interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  type: "article" | "video" | "event" | "podcast";
  image: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  duration?: string;
  featured: boolean;
}

const featuredContent: FeaturedItem[] = [
  {
    id: "1",
    title: "The Healing Power of 432Hz Music",
    description: "Discover how music tuned to 432Hz can resonate with your body's natural frequency and promote healing and relaxation.",
    type: "article",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d",
    author: {
      name: "Dr. Maya Rivers",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=MayaRivers"
    },
    date: "May 15, 2023",
    featured: true
  },
  {
    id: "2",
    title: "Guided Cosmic Meditation Journey",
    description: "A 20-minute guided meditation with cosmic frequencies designed to align your chakras and elevate your consciousness.",
    type: "video",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
    author: {
      name: "Serena Starlight",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=SerenaStarlight"
    },
    date: "June 3, 2023",
    duration: "20 min",
    featured: true
  },
  {
    id: "3",
    title: "Summer Solstice Sound Bath Experience",
    description: "Join us for a community sound bath during the summer solstice to harness the powerful energies of this special day.",
    type: "event",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
    author: {
      name: "Cosmic Events Team",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=CosmicEvents"
    },
    date: "June 21, 2023",
    featured: true
  },
  {
    id: "4",
    title: "The Science of Sound Healing",
    description: "An in-depth podcast exploring the scientific research behind sound healing and its effects on the human brain.",
    type: "podcast",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618",
    author: {
      name: "Dr. James Chen",
      avatar: "https://api.dicebear.com/7.x/personas/svg?seed=JamesChen"
    },
    date: "April 28, 2023",
    duration: "45 min",
    featured: false
  }
];

const FeaturedContent = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">Featured Content</h2>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="articles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.filter(item => item.type === 'article').map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.filter(item => item.type === 'video').map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.filter(item => item.type === 'event').map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="podcasts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.filter(item => item.type === 'podcast').map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface FeaturedCardProps {
  item: FeaturedItem;
}

const FeaturedCard = ({ item }: FeaturedCardProps) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'event':
        return <CalendarDays className="h-4 w-4" />;
      case 'podcast':
        return <Play className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const getTypeColor = () => {
    switch (item.type) {
      case 'article':
        return "bg-blue-500";
      case 'video':
        return "bg-red-500";
      case 'event':
        return "bg-green-500";
      case 'podcast':
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md bg-background/60 backdrop-blur-sm border-cosmic-primary/20">
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
        
        {item.featured && (
          <Badge className="absolute top-2 right-2 bg-cosmic-primary">
            <Star className="h-3 w-3 mr-1" /> Featured
          </Badge>
        )}
        
        <Badge 
          className={`absolute top-2 left-2 flex items-center gap-1 ${getTypeColor()}`}
        >
          {getTypeIcon()}
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          {item.duration && ` • ${item.duration}`}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
        <div className="flex items-center space-x-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={item.author.avatar} alt={item.author.name} />
            <AvatarFallback>{item.author.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{item.author.name}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{item.date}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground text-sm line-clamp-3">{item.description}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="default" className="bg-cosmic-primary hover:bg-cosmic-vivid">
          Read More
        </Button>
        <Button variant="ghost" size="icon">
          <Bookmark className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeaturedContent;
