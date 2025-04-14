import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import AIAgentButton from '../components/ai/AIAgentButton';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Cosmic Consciousness</h1>
          <p className="text-xl text-white/70 mb-8">
            Explore our immersive digital experience, designed with accessibility and helpful AI guidance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-chat">
              <Button size="lg" className="w-full sm:w-auto">
                Explore AI Assistants
              </Button>
            </Link>
            <Link href="/accessibility">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Accessibility Settings
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-black/20 rounded-lg border border-white/10 p-6">
            <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
            <p className="text-white/70 mb-4">
              We've designed our site to be accessible to everyone. Customize your experience with:
            </p>
            <ul className="space-y-2 text-white/70 mb-6">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Text size adjustments</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Dark mode and high contrast</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Reduced motion settings</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Sound and voice controls</span>
              </li>
            </ul>
            <Link href="/accessibility">
              <Button variant="outline" className="w-full">Open Accessibility Settings</Button>
            </Link>
          </div>
          
          <div className="bg-black/20 rounded-lg border border-white/10 p-6">
            <h2 className="text-2xl font-semibold mb-4">AI Assistance</h2>
            <p className="text-white/70 mb-4">
              Our AI guides are here to enhance your journey:
            </p>
            <ul className="space-y-2 text-white/70 mb-6">
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Spiritual guidance and meditation support</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Product recommendations for your practice</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Sound healing and frequency expertise</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>Ancient wisdom and philosophical insights</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <AIAgentButton agentId="cosmic-guide" variant="outline" />
              <AIAgentButton agentId="harmonic-helper" variant="outline" />
            </div>
          </div>
        </div>
        
        <div className="text-center bg-black/20 rounded-lg border border-white/10 p-8">
          <h2 className="text-2xl font-semibold mb-4">Experience Both Features in Action</h2>
          <p className="text-white/70 mb-6">
            Our site combines accessibility controls with AI assistance to create a
            personalized experience adapted to your preferences and needs.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <AIAgentButton 
              agentId="wisdom-keeper" 
              variant="default"
              buttonText="Ask About Accessibility"
              className="w-full"
            />
            <AIAgentButton 
              agentId="shop-oracle" 
              variant="outline"
              buttonText="Get Product Suggestions"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}