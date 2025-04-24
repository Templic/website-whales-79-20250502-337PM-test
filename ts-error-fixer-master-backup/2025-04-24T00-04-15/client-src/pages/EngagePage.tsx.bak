/**
 * EngagePage.tsx
 * 
 * Migrated as part of the repository reorganization.
 * Updated to include new components: SocialMediaLinks and FanReactions.
 * FeaturedMerchandise component moved to the bottom of the page.
 * Revamped with cosmic-ocean aesthetic and sacred geometry elements.
 */import React from "react";
import React from "react";


import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SpotlightEffect } from "@/components/SpotlightEffect";
import SocialMediaLinks from "@/components/common/SocialMediaLinks";
import FanReactions from "@/components/common/FanReactions";
import FeaturedMerchandise from "@/components/common/FeaturedMerchandise";

import SacredGeometry from "@/components/ui/sacred-geometry";
import { FaYoutube, FaInstagram, FaSpotify, FaPodcast, FaMusic, FaEnvelope, FaPhone, FaCalendarAlt, FaUsers } from 'react-icons/fa';

// Define TypeScript types for feedback and comments
type FeedbackComment = {
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
};

type FeedbackItem = {
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
};

type FeedbackType = {
  content: string;
  category: string;
};

export default function EngagePage() {
  useEffect(() => {
    document.title = "Engage - Dale Loves Whales";
  }, []);

  // Sample feedback data with admin and user comments
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([
    {
      id: "feedback-1",
      user: {
        name: "Crystal Dreamer",
        avatar: "/assets/avatars/avatar-1.jpg",
        isAdmin: false
      },
      content: "I would love to see more cosmic meditation music with whale sounds incorporated! The frequencies really resonate with my higher consciousness.",
      date: "April 8, 2025",
      category: "suggestion",
      status: "considering",
      votes: 48,
      userVoted: true,
      comments: 3,
      commentsList: [
        {
          id: "comment-1-1",
          feedbackId: "feedback-1",
          user: {
            name: "Dale The Whale",
            avatar: "/assets/avatars/dale-avatar.jpg",
            isAdmin: true
          },
          content: "Thank you for this beautiful suggestion! I'm actually working on a new cosmic meditation album featuring the songs of humpback whales blended with 432Hz frequencies. Stay tuned!",
          date: "April 10, 2025",
          likes: 12,
          userLiked: true
        },
        {
          id: "comment-1-2",
          feedbackId: "feedback-1",
          user: {
            name: "OceanHarmony",
            avatar: "/assets/avatars/avatar-4.jpg",
            isAdmin: false
          },
          content: "I second this! The whale sounds really help me connect to the oceanic consciousness during my meditations.",
          date: "April 11, 2025",
          likes: 5,
          userLiked: false
        },
        {
          id: "comment-1-3",
          feedbackId: "feedback-1",
          user: {
            name: "CosmicDreamer",
            avatar: "/assets/avatars/avatar-2.jpg",
            isAdmin: false
          },
          content: "Have you tried the 'Whale Songs' track from the latest album? It's already got some amazing whale vocalizations!",
          date: "April 12, 2025",
          likes: 3,
          userLiked: false
        }
      ]
    },
    {
      id: "feedback-2",
      user: {
        name: "StarSurfer",
        avatar: "/assets/avatars/avatar-3.jpg",
        isAdmin: false
      },
      content: "The frequency attunement chamber could use a better visual guide for beginners. It took me a while to understand how to properly use it for cosmic alignment.",
      date: "April 5, 2025",
      category: "bug",
      status: "implemented",
      votes: 32,
      userVoted: false,
      comments: 2,
      commentsList: [
        {
          id: "comment-2-1",
          feedbackId: "feedback-2",
          user: {
            name: "CosmicDeveloper",
            avatar: "/assets/avatars/avatar-5.jpg",
            isAdmin: true
          },
          content: "Thanks for bringing this up! We've just released an update with a new interactive guide and visual tooltips to make the experience more intuitive for first-time cosmic travelers.",
          date: "April 6, 2025",
          likes: 8,
          userLiked: true
        },
        {
          id: "comment-2-2",
          feedbackId: "feedback-2",
          user: {
            name: "StarSurfer",
            avatar: "/assets/avatars/avatar-3.jpg",
            isAdmin: false
          },
          content: "Just checked the update - love the new visual guide! Makes the whole experience much clearer. Thank you!",
          date: "April 7, 2025",
          likes: 4,
          userLiked: false
        }
      ]
    },
    {
      id: "feedback-3",
      user: {
        name: "OceanWhisperer",
        avatar: "/assets/avatars/avatar-6.jpg",
        isAdmin: false
      },
      content: "I absolutely love the cosmic whale animations on the home page! The way they swim through the starry background is mesmerizing and puts me in the perfect state of mind for the music.",
      date: "April 2, 2025",
      category: "appreciation",
      status: "pending",
      votes: 75,
      userVoted: false,
      comments: 1,
      commentsList: [
        {
          id: "comment-3-1",
          feedbackId: "feedback-3",
          user: {
            name: "Dale The Whale",
            avatar: "/assets/avatars/dale-avatar.jpg",
            isAdmin: true
          },
          content: "So glad you're enjoying the cosmic whale animations! Our digital artists put their hearts into creating those sacred beings. We'll be adding more interactive elements to them in our next update!",
          date: "April 3, 2025",
          likes: 15,
          userLiked: false
        }
      ]
    }
  ]);

  // Current user data
  const currentUser = {
    name: "Cosmic Explorer",
    avatar: "/assets/avatars/user-avatar.jpg",
    isAdmin: false
  };



  // Handle interactions
  const handleVote = (id: string): void => {
    setFeedbackItems(feedbackItems.map(item => 
      item.id === id 
        ? { ...item, votes: item.userVoted ? item.votes - 1 : item.votes + 1, userVoted: !item.userVoted } 
        : item
    ));
  };

  const handleSubmitFeedback = (feedback: FeedbackType): void => {
    const newFeedback = {
      id: `feedback-${feedbackItems.length + 1}`,
      user: currentUser,
      content: feedback.content,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      category: feedback.category,
      status: "pending" as const,
      votes: 1,
      userVoted: true,
      comments: 0,
      commentsList: []
    };
    
    setFeedbackItems([newFeedback, ...feedbackItems]);
  };

  const handleComment = (id: string, comment: string): void => {
    setFeedbackItems(feedbackItems.map(item => {
      if (item.id === id) {
        const newComment = {
          id: `comment-${item.id}-${(item.commentsList || []).length + 1}`,
          feedbackId: item.id,
          user: currentUser,
          content: comment,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          likes: 0,
          userLiked: false
        };
        
        return {
          ...item,
          comments: item.comments + 1,
          commentsList: [...(item.commentsList || []), newComment]
        };
      }
      return item;
    }));
  };

  const handleLikeComment = (feedbackId: string, commentId: string): void => {
    setFeedbackItems(feedbackItems.map(item => {
      if (item.id === feedbackId) {
        return {
          ...item,
          commentsList: item.commentsList?.map(comment => 
            comment.id === commentId 
              ? { 
                  ...comment, 
                  likes: comment.userLiked ? comment.likes - 1 : comment.likes + 1,
                  userLiked: !comment.userLiked 
                }
              : comment
          )
        };
      }
      return item;
    }));
  };

  return (
    <>
      <SpotlightEffect />
      
      {/* Sacred geometry elements in page margins - reduced and optimized */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry variant="merkaba" size={120} animated={true} />
        </div>
        <div className="absolute bottom-40 left-5 opacity-10 hidden md:block">
          <SacredGeometry variant="dodecahedron" size={120} animated={true} />
        </div>
        
        {/* Right margin sacred geometry - one at top, one at bottom */}
        <div className="absolute top-40 right-5 opacity-10 hidden md:block">
          <SacredGeometry variant="icosahedron" size={120} animated={true} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="text-5xl font-bold text-[#00ebd6] mb-6 cosmic-float font-nebula tracking-wider">Engage</h1>
        <div className="space-y-8">
          {/* Main Banner Section */}
          <section className="banner cosmic-glow-box p-8 rounded-xl cosmic-pulse relative overflow-hidden">
            <img 
              src="/assets/golden whales deep blue DREAMS 😍❤️😍 Boundless Potential By DÄLË THĒ 💙 WHALE 🐳 etsy .jpg" 
              alt="Dale Loves Whales Banner"
              className="w-full rounded-lg mb-6 object-cover h-80" 
            />
            <div className="cta-buttons flex flex-wrap gap-4 justify-center">
              <Link to="/newsletter">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] whitespace-nowrap cosmic-hover-glow">
                  Join The Whale Pod
                </button>
              </Link>
              <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer">
                <button className="bg-[#00ebd6] text-[#303436] px-6 py-3 rounded-full hover:bg-[#fe0064] hover:text-white transition-all shadow-lg hover:shadow-[0_0_15px_rgba(254,0,100,0.7)] whitespace-nowrap cosmic-hover-glow">
                  Share Your Experience
                </button>
              </a>
            </div>
            
            {/* Sacred geometry element on bottom right */}
            <div className="absolute -bottom-6 -right-6 opacity-30">
              <SacredGeometry variant="hexagon" size={120} animated={true} intensity="subtle" />
            </div>
          </section>

          {/* New Social Media Links Component */}
          <SocialMediaLinks />

          {/* New Fan Reactions Component */}
          <FanReactions />

          {/* Sacred geometry divider - increased spacing and optimized for performance */}
          <div className="relative py-12 sm:py-16 flex justify-center">
            <div className="sacred-geometry-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20 z-0">
              <div className="hidden sm:block">
                <SacredGeometry variant="merkaba" size={160} animated={false} intensity="subtle" />
              </div>
              <div className="block sm:hidden">
                <SacredGeometry variant="merkaba" size={120} animated={false} intensity="subtle" />
              </div>
            </div>
          </div>

          {/* Featured Art Image */}
          <section className="art-feature relative max-w-4xl mx-auto px-4">
            <div className="relative">
              {/* Reduced the number of sacred geometry elements and fixed LSP errors */}
              <div className="absolute -top-8 left-4 opacity-10 z-0 hidden md:block">
                <SacredGeometry variant="pentagon" size={60} animated={false} intensity="subtle" />
              </div>
              
              <img 
                src="/assets/Orca Sunrise Cove by Dale The Whale on etsy.jpg" 
                alt="Orca Sunrise Cove" 
                className="w-full h-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] object-contain rounded-lg shadow-xl z-10 relative" 
              />
              
              <div className="absolute -bottom-8 right-4 opacity-10 z-0 hidden md:block">
                <SacredGeometry variant="octagon" size={60} animated={false} intensity="subtle" />
              </div>
            </div>
          </section>

          {/* Connect With Us Section - Restored gradient background */}
          <section className="social-media p-4 md:p-8 shadow-lg backdrop-blur-sm relative overflow-hidden">
            {/* Background with sacred geometry */}
            <div className="absolute inset-0 bg-[rgba(10,50,92,0.6)]">
              <div className="absolute top-0 left-0 opacity-10">
                <SacredGeometry variant="octagon" size={160} animated={false} />
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <SacredGeometry variant="octagon" size={160} animated={false} />
              </div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#00ebd6] mb-4 text-center">Dive Into Our Cosmic Ocean</h2>
              <div className="text-center mb-8">
                <a 
                  href="/community" 
                  className="inline-block px-4 py-2 bg-[#00ebd6]/20 text-white hover:text-[#00ebd6] border border-[#00ebd6] rounded-lg shadow-lg transition-all hover:shadow-[0_0_15px_rgba(0,235,214,0.5)] mx-auto cosmic-hover-glow"
                >
                  <span className="flex items-center">
                    <FaUsers className="mr-2" />
                    Visit Our Community
                  </span>
                </a>
              </div>

              {/* Dale The Whale Section */}
              <div className="mb-12">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🐳 Dale The Whale Music & Content 🐳</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="relative group min-h-[270px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Cosmic Social Channels</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://www.youtube.com/@DiamondOrca777/featured" target="_blank" rel="noopener noreferrer" 
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaYoutube className="text-red-500 text-sm" />
                            <span className="text-sm">Dale's YouTube:</span>
                          </div>
                          <div className="text-center text-sm">@DiamondOrca777</div>
                        </a>
                        <a href="https://www.instagram.com/dale_loves_whales" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">dale_loves_whales</span>
                          </div>
                        </a>
                        <a href="https://www.instagram.com/dalethewhalemusic" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">dalethewhalemusic</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="relative group min-h-[270px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Ethereal Sounds & Words</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://youtu.be/jzpvkq3Krjg" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaMusic className="text-purple-400 text-sm" />
                            <span className="text-sm">"Feels So Good" Music Video</span>
                          </div>
                        </a>
                        <a href="https://open.spotify.com/album/3NDnzf57NDrUwkv7QJ22Th" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaSpotify className="text-green-500 text-sm" />
                            <span className="text-sm">Dale's Music On Spotify</span>
                          </div>
                        </a>
                        <a href="https://creators.spotify.com/pod/show/dale-ham" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaPodcast className="text-purple-400 text-sm" />
                            <span className="text-sm">THE IRIDESCENT DOVE Podcast</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AC3-2085 Section */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[#fe0064] text-center border-b border-[#fe0064] pb-2">🎵 AC3-2085 Music & Business 🎵</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="relative group min-h-[230px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Celestial Productions</h4>
                      <div className="space-y-3 w-full">
                        <a href="https://www.youtube.com/channel/UCewdO8AO3aBVzgWzeMG5paQ" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaYoutube className="text-red-500 text-sm" />
                            <span className="text-sm">AC3-2085 YouTube Channel</span>
                          </div>
                        </a>
                        <a href="https://www.instagram.com/ac3productionsllc" target="_blank" rel="noopener noreferrer"
                          className="block text-white hover:text-[#00ebd6] transition-colors p-2">
                          <div className="flex items-center gap-2 justify-center">
                            <FaInstagram className="text-pink-500 text-sm" />
                            <span className="text-sm">ac3productionsllc</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="relative group min-h-[230px] flex">
                    {/* Octagon shape container with clip-path */}
                    <div className="absolute inset-0 bg-[#00ebd6]/10 backdrop-blur-sm transform transition-all 
                         clip-path-octagon border-2 border-[#00ebd6]/30 z-0"></div>
                    
                    <div className="relative z-10 p-4 sm:p-6 py-8 flex flex-col items-center w-full">
                      {/* Sacred geometry hidden on mobile for performance */}
                      <div className="absolute -bottom-6 -right-6 opacity-10 hidden md:block">
                        <SacredGeometry variant="octagon" size={60} animated={false} />
                      </div>
                      
                      <h4 className="text-lg font-bold mb-4 text-[#00ebd6] text-center">Universal Connections</h4>
                      <div className="space-y-3 w-full">
                        <div className="block text-white space-y-2 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <FaEnvelope className="text-blue-400 text-sm" />
                            <a href="mailto:ac3productionsllc@gmail.com" className="text-sm hover:text-[#00ebd6] transition-colors">ac3productionsllc@gmail.com</a>
                          </div>
                          <div className="flex items-center gap-2 justify-center">
                            <FaPhone className="text-green-400 text-sm" />
                            <a href="tel:8044375418" className="text-sm hover:text-[#00ebd6] transition-colors">804-437-5418</a>
                          </div>
                          <div className="flex flex-col items-center gap-2 justify-center">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-purple-400 text-sm mr-2" />
                              <span className="text-sm">Book online:</span>
                            </div>
                            <a href="https://calendly.com/ac3productionsllc/30min" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="text-xs hover:text-[#00ebd6] transition-colors">
                               calendly.com/ac3productionsllc
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Community Feedback Loop section was removed */}

          {/* Featured Merchandise - Images made clickable to Etsy */}
          <div className="featured-merchandise-banners grid md:grid-cols-2 gap-6 mb-12">
            <a
              href="https://www.etsy.com/listing/1814098203/dale-loves-whale-digital-art?ls=r&content_source=6ac43cb79853f47bac6e7ec5dc1b9ff1195be02a%253A1814098203"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl"
            >
              <img 
                src="https://i.etsystatic.com/54804470/r/il/807304/6419058755/il_1588xN.6419058755_xyt9.jpg" 
                alt="Orca Sunrise Cove by Dale The Whale on Etsy" 
                className="w-full h-48 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <span className="text-white p-4 font-bold">Shop on Etsy →</span>
              </div>
            </a>
            <a
              href="https://www.etsy.com/listing/1823352422/dale-loves-whales-divine-digital-cosmic"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl"
            >
              <img 
                src="https://i.etsystatic.com/54804470/r/il/15c48e/6530624025/il_1588xN.6530624025_7yel.jpg" 
                alt="Dale Loves Whales Divine Digital Cosmic Art" 
                className="w-full h-48 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <span className="text-white p-4 font-bold">Shop on Etsy →</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
