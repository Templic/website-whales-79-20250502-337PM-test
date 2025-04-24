import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CosmicIcon } from '@/components/cosmic/ui/cosmic-icons';

interface FeaturedContent {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: string;
  date: string;
  featured: boolean;
}

const featuredContent: FeaturedContent[] = [
  {
    id: 'content-1',
    title: 'The Science of Cosmic Frequencies',
    description: 'Discover how specific sound frequencies can induce altered states of consciousness and promote healing.',
    image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=800&q=80',
    category: 'Research',
    author: 'Dr. Stella Moon',
    date: 'June 15, 2025',
    featured: true
  },
  {
    id: 'content-2',
    title: 'Integrating Cosmic Sounds into Daily Practice',
    description: 'A practical guide to incorporating cosmic frequencies into your meditation, yoga, and healing routines.',
    image: 'https://images.unsplash.com/photo-1536623975707-c4b3b2af565d?auto=format&fit=crop&w=800&q=80',
    category: 'Practice',
    author: 'Luna Starlight',
    date: 'May 28, 2025',
    featured: true
  },
  {
    id: 'content-3',
    title: 'Interview: The Journey of a Sound Healer',
    description: 'An in-depth conversation with renowned sound healer Orion Walker about his 20-year journey through cosmic sound.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    category: 'Interview',
    author: 'Zephyr Moon',
    date: 'June 2, 2025',
    featured: false
  }
];

const EnhancedFeaturedContent: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-center flex justify-center items-center">
        <CosmicIcon name="star" size={20} className="mr-2 text-cyan-400" />
        Featured Content
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredContent.map((content) => (
          <Card 
            key={content.id} 
            className="cosmic-glass-card overflow-hidden cosmic-hover-scale"
          >
            <div className="relative">
              <img 
                src={content.image} 
                alt={content.title}
                className="w-full h-48 object-cover"
              />
              
              {content.featured && (
                <Badge className="absolute top-3 left-3 bg-cyan-600">
                  Featured
                </Badge>
              )}
              
              <Badge variant="outline" className="absolute top-3 right-3 bg-background/80">
                {content.category}
              </Badge>
            </div>
            
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-2 hover:text-cyan-400 transition-colors">
                {content.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                {content.description}
              </p>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{content.author}</span>
                <span>{content.date}</span>
              </div>
              
              <Button variant="outline" className="w-full mt-4 cosmic-hover-glow">
                Read More
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Button variant="outline">View All Content</Button>
      </div>
    </div>
  );
};

export default EnhancedFeaturedContent;