import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronUp, 
  MessageCircle, 
  ThumbsUp, 
  AlertCircle, 
  Lightbulb, 
  Bug, 
  HeartHandshake
} from 'lucide-react';

// Define the interface for feedback items
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

interface CommunityFeedbackLoopProps {
  feedbackItems: FeedbackItem[];
  onVote: (id: string) => void;
  onSubmit: (feedback: { content: string; category: string }) => void;
  onComment: (id: string) => void;
}

export const CommunityFeedbackLoop: React.FC<CommunityFeedbackLoopProps> = ({
  feedbackItems,
  onVote,
  onSubmit,
  onComment,
}) => {
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Helper to get the right icon for each category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />;
      case 'appreciation':
        return <HeartHandshake className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get status badge color
  const getStatusColor = (status: FeedbackItem['status']) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-500';
      case 'considering':
        return 'bg-blue-500';
      case 'declined':
        return 'bg-red-500';
      default:
        return 'bg-amber-500';
    }
  };

  // Filter feedback items based on active filter
  const filteredFeedback = feedbackItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'trending') return item.votes > 30;
    return item.status === activeFilter;
  });

  // Handle form submission
  const handleSubmit = () => {
    if (feedbackContent.trim().length === 0) return;
    
    onSubmit({
      content: feedbackContent,
      category: feedbackCategory,
    });
    
    setFeedbackContent('');
    setFeedbackCategory('suggestion');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Tabs 
          defaultValue="all" 
          onValueChange={setActiveFilter}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="implemented">Implemented</TabsTrigger>
            <TabsTrigger value="considering">Considering</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              Share Your Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Share Your Feedback</DialogTitle>
              <DialogDescription>
                Your insights help us improve the cosmic experience for everyone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Select 
                  value={feedbackCategory} 
                  onValueChange={setFeedbackCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">
                      <div className="flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-amber-400" />
                        <span>Suggestion</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bug">
                      <div className="flex items-center">
                        <Bug className="h-4 w-4 mr-2 text-red-400" />
                        <span>Issue Report</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="appreciation">
                      <div className="flex items-center">
                        <HeartHandshake className="h-4 w-4 mr-2 text-pink-400" />
                        <span>Appreciation</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Textarea
                  placeholder="Share your thoughts, experiences, or ideas..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSubmit}>
                Submit Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredFeedback.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No feedback items match your filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <Card key={item.id} className="p-5 cosmic-glass-card">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => onVote(item.id)}
                  >
                    <ChevronUp
                      className={`h-5 w-5 ${
                        item.userVoted ? "text-purple-500" : ""
                      }`}
                    />
                  </Button>
                  <span
                    className={`text-sm font-medium ${
                      item.userVoted ? "text-purple-500" : ""
                    }`}
                  >
                    {item.votes}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getCategoryIcon(item.category)}
                      <span className="capitalize">{item.category}</span>
                    </Badge>
                    <Badge
                      className={`${getStatusColor(
                        item.status
                      )} text-white capitalize`}
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <p className="mb-3">{item.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.date}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-muted-foreground"
                      onClick={() => onComment(item.id)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{item.comments}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredFeedback.length > 0 && (
        <div className="text-center mt-6">
          <Button variant="outline">View More Feedback</Button>
        </div>
      )}
    </div>
  );
};

export default CommunityFeedbackLoop;