import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardContent, Card } from "@/components/ui/card";
import { ThumbsUp, MessageSquare, Filter, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CosmicIcon } from "@/components/cosmic/ui/cosmic-icons";

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
  onVote?: (id: string) => void;
  onSubmit?: (feedback: { content: string; category: string }) => void;
  onComment?: (id: string, comment: string) => void;
  className?: string;
}

export function CommunityFeedbackLoop({
  feedbackItems,
  onVote,
  onSubmit,
  onComment,
  className,
}: CommunityFeedbackLoopProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "submit">("browse");
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "implemented">("popular");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("feature");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFeedbackItems = feedbackItems.filter((item) => {
    if (filter === "all") return true;
    return item.category === filter;
  });

  const sortedFeedbackItems = [...filteredFeedbackItems].sort((a, b) => {
    if (sortBy === "popular") return b.votes - a.votes;
    if (sortBy === "implemented") return a.status === "implemented" ? -1 : 1;
    // For "recent", we would normally sort by date, but since we only have a string
    // that's not an actual date, we'll just return them as is
    return 0;
  });

  const handleSubmit = () => {
    if (!feedbackContent.trim()) return;
    
    setIsSubmitting(true);
    
    // Call the onSubmit prop if provided
    onSubmit?.({
      content: feedbackContent,
      category: feedbackCategory,
    });
    
    // Reset form and show success
    setTimeout(() => {
      setFeedbackContent("");
      setIsSubmitting(false);
      setActiveTab("browse");
    }, 1000);
  };

  const handleVote = (id: string) => {
    onVote?.(id);
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Tabs
        defaultValue="browse"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "browse" | "submit")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="browse" className="text-lg py-3">
            <CosmicIcon name="star" size={18} className="mr-2" />
            Browse Feedback
          </TabsTrigger>
          <TabsTrigger value="submit" className="text-lg py-3">
            <CosmicIcon name="rocket" size={18} className="mr-2" />
            Submit Idea
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex-1">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "popular" | "recent" | "implemented")}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {sortedFeedbackItems.length > 0 ? (
              sortedFeedbackItems.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    "border-l-4 transition-all duration-300",
                    item.status === "implemented" && "border-l-emerald-500/70",
                    item.status === "considering" && "border-l-amber-500/70",
                    item.status === "pending" && "border-l-blue-500/70",
                    item.status === "declined" && "border-l-rose-500/70"
                  )}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex gap-4">
                      <div className="hidden md:block">
                        <img
                          src={item.user.avatar}
                          alt={item.user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.user.name}</span>
                              <span className="text-sm text-muted-foreground">{item.date}</span>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-1",
                                item.category === "feature" && "bg-blue-500/10 text-blue-500 border-blue-500/30",
                                item.category === "bug" && "bg-rose-500/10 text-rose-500 border-rose-500/30",
                                item.category === "suggestion" && "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              )}
                            >
                              {item.category}
                            </Badge>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize",
                              item.status === "implemented" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
                              item.status === "considering" && "bg-amber-500/10 text-amber-500 border-amber-500/30",
                              item.status === "pending" && "bg-blue-500/10 text-blue-500 border-blue-500/30",
                              item.status === "declined" && "bg-rose-500/10 text-rose-500 border-rose-500/30"
                            )}
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-foreground leading-relaxed">{item.content}</p>
                        <div className="mt-4 flex gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(item.id)}
                            className={cn(
                              "flex items-center gap-1",
                              item.userVoted && "text-primary"
                            )}
                          >
                            <ThumbsUp
                              className={cn("h-4 w-4", item.userVoted && "fill-current")}
                            />
                            <span>{item.votes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{item.comments}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <CosmicIcon name="star" size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium mb-2">No feedback found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There are no feedback items matching your current filters. Try changing the filter or be the first to submit feedback!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Share your ideas</h3>
                <p className="text-muted-foreground">
                  Your feedback directly shapes our cosmic music experiences. Let us know what you'd like to see next!
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="feedback-type" className="block text-sm font-medium">
                    Feedback Category
                  </label>
                  <Select
                    value={feedbackCategory}
                    onValueChange={setFeedbackCategory}
                  >
                    <SelectTrigger id="feedback-type">
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="feedback-content" className="block text-sm font-medium">
                    Your Feedback
                  </label>
                  <Textarea
                    id="feedback-content"
                    placeholder="Share your thoughts, ideas, or experiences..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!feedbackContent.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function FeedbackStatistics({
  stats = {
    implemented: 48,
    inProgress: 24,
    considering: 36,
    total: 150,
  },
  className,
}: {
  stats?: {
    implemented: number;
    inProgress: number;
    considering: number;
    total: number;
  };
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-emerald-500">{stats.implemented}</div>
          <div className="text-sm text-muted-foreground">Implemented</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">{stats.inProgress}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-amber-500">{stats.considering}</div>
          <div className="text-sm text-muted-foreground">Considering</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Ideas</div>
        </CardContent>
      </Card>
    </div>
  );
}