import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronUp, 
  MessageCircle, 
  ThumbsUp, 
  AlertCircle, 
  Lightbulb, 
  Bug, 
  HeartHandshake,
  Send,
  User,
  Shield,
  ChevronDown,
  Clock,
  Reply
} from 'lucide-react';

// Define the interface for comments
interface FeedbackComment {
  id: string;
  feedbackId: string;
  user: {
    name: string;
    avatar: string;
    isAdmin?: boolean;
  };
  content: string;
  date: string;
  likes: number;
  userLiked?: boolean;
}

// Define the interface for feedback items
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
  commentsList?: FeedbackComment[];
}

interface CommunityFeedbackLoopProps {
  feedbackItems: FeedbackItem[];
  onVote: (id: string) => void;
  onSubmit: (feedback: { content: string; category: string }) => void;
  onComment: (id: string, comment: string) => void;
  onLikeComment?: (feedbackId: string, commentId: string) => void;
  currentUser?: {
    name: string;
    avatar: string;
    isAdmin?: boolean;
  };
}

export const CommunityFeedbackLoop: React.FC<CommunityFeedbackLoopProps> = ({
  feedbackItems,
  onVote,
  onSubmit,
  onComment,
  onLikeComment,
  currentUser = {
    name: "Cosmic User",
    avatar: "/assets/default-avatar.png",
    isAdmin: false
  }
}) => {
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('suggestion');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');

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

  // Handle comment submission
  const handleCommentSubmit = (feedbackId: string) => {
    if (commentText.trim().length === 0) return;
    
    onComment(feedbackId, commentText);
    setCommentText('');
  };

  // Toggle expanded feedback item
  const toggleFeedbackExpansion = (id: string) => {
    setExpandedFeedbackId(expandedFeedbackId === id ? null : id);
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
            <Button className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white">
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
              <Button 
                type="submit" 
                onClick={handleSubmit}
                className="bg-[#00ebd6] text-[#303436] hover:bg-[#fe0064] hover:text-white"
              >
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
        <div className="space-y-6">
          {filteredFeedback.map((item) => (
            <Card key={item.id} className="cosmic-glass-card overflow-hidden">
              <CardHeader className="pb-3">
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
                    <div className="flex flex-wrap items-center gap-2 mb-2">
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
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={item.user.avatar} alt={item.user.name} />
                          <AvatarFallback>{item.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">
                            {item.user.name}
                          </span>
                          {item.user.isAdmin && (
                            <Badge variant="outline" className="text-[#fe0064] bg-[#fe0064]/10 border-[#fe0064]/20 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              <span>Admin</span>
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1 opacity-70" />
                          {item.date}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-muted-foreground"
                        onClick={() => toggleFeedbackExpansion(item.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{item.comments}</span>
                        {expandedFeedbackId === item.id ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedFeedbackId === item.id && (
                <>
                  <Separator />
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* Comments list */}
                      {item.commentsList && item.commentsList.length > 0 ? (
                        <div className="space-y-4">
                          {item.commentsList.map(comment => (
                            <div key={comment.id} className="pl-2 border-l-2 border-[#00ebd6]/20 py-1">
                              <div className="flex items-start gap-2 mb-1">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                                  <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {comment.user.name}
                                    </span>
                                    {comment.user.isAdmin && (
                                      <Badge variant="outline" className="text-[#fe0064] bg-[#fe0064]/10 border-[#fe0064]/20 text-xs">
                                        <Shield className="h-3 w-3 mr-1" />
                                        <span>Admin</span>
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {comment.date}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{comment.content}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center mt-2 justify-end ml-8">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs flex items-center gap-1"
                                  onClick={() => onLikeComment && onLikeComment(item.id, comment.id)}
                                >
                                  <ThumbsUp className={`h-3 w-3 ${comment.userLiked ? 'text-[#00ebd6]' : ''}`} />
                                  <span>{comment.likes}</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs flex items-center gap-1"
                                >
                                  <Reply className="h-3 w-3" />
                                  <span>Reply</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                      
                      {/* Comment input */}
                      <div className="flex gap-2 items-start mt-4">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Textarea 
                            placeholder="Add a comment..." 
                            className="min-h-[80px] pr-10" 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                          />
                          <Button 
                            size="sm"
                            className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-[#00ebd6]/80 hover:bg-[#00ebd6]"
                            onClick={() => handleCommentSubmit(item.id)}
                            disabled={commentText.trim().length === 0}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredFeedback.length > 0 && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            className="border-[#00ebd6] text-[#00ebd6] hover:bg-[#00ebd6]/10"
          >
            View More Feedback
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityFeedbackLoop;