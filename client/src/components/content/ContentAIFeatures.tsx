/**
 * ContentAIFeatures Component
 * 
 * This component provides links to AI-powered content features in the CMS
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Lightbulb, MessageSquare, PenTool, Zap, Tag } from 'lucide-react';
import { Link } from 'wouter';

export function ContentAIFeatures() {
  const features = [
    {
      title: 'AI Content Generation',
      description: 'Generate blog posts, product descriptions, and marketing copy with AI',
      icon: <PenTool className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    },
    {
      title: 'Content Enhancement',
      description: 'Improve clarity, engagement, and readability of your existing content',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    },
    {
      title: 'Sentiment Analysis',
      description: 'Understand the emotional tone and sentiment of your content',
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    },
    {
      title: 'Smart Tagging',
      description: 'Automatically generate relevant tags and categories for your content',
      icon: <Tag className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    },
    {
      title: 'Content Summarization',
      description: 'Create concise summaries of long-form content',
      icon: <Zap className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    },
    {
      title: 'Content Ideas',
      description: 'Get AI-powered suggestions for new content topics',
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      link: '/content-ai-demo'
    }
  ];

  return (
    <div className="container py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI-Powered Content Features
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enhanced content creation and management with artificial intelligence
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border border-border hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                {feature.icon}
              </div>
              <CardTitle className="mt-4">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={feature.link}>
                <Button variant="ghost" className="gap-2">
                  Try it now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}