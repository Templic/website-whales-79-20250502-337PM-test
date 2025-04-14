import React, { useState } from 'react';
import { useAgents, Agent } from '@/contexts/AgentContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bot, MessageCircle, User, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useToast } from '@/hooks/use-toast';

export function AIAgentButton() {
  const { agents, activeAgent, availableAgents, activateAgent } = useAgents();
  const { reducedMotion } = useAccessibility();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // Toggle the agent dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Select an agent
  const handleSelectAgent = (agent: Agent) => {
    activateAgent(agent.id);
    setIsOpen(false);
    toast({
      title: `${agent.name} activated`,
      description: `You are now chatting with ${agent.name}`,
    });
  };
  
  return (
    <div className="relative z-30">
      {/* Main Button */}
      <Button
        onClick={toggleDropdown}
        variant="outline"
        className="flex items-center gap-2 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30 hover:border-purple-500/60 rounded-full px-4"
      >
        {activeAgent ? (
          <>
            <Avatar className="h-6 w-6">
              <AvatarImage src={activeAgent.avatar} alt={activeAgent.name} />
              <AvatarFallback className="bg-purple-900 text-white text-xs">
                {activeAgent.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{activeAgent.name}</span>
          </>
        ) : (
          <>
            <Bot className="h-5 w-5" />
            <span className="text-sm">AI Assist</span>
          </>
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 opacity-70" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-70" />
        )}
      </Button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing when clicking outside */}
            <motion.div
              className="fixed inset-0 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <motion.div
              className="absolute right-0 top-full mt-1 z-40 w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur rounded-lg border border-white/10 shadow-xl overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: reducedMotion ? 0 : 0.15 }}
            >
              <div className="p-3 border-b border-white/10">
                <h3 className="font-medium text-sm">Choose your AI Assistant</h3>
                <p className="text-xs text-white/60 mt-1">
                  Select the guide that best fits your needs
                </p>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                      activeAgent?.id === agent.id
                        ? 'bg-purple-600/30 border border-purple-500/50'
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => handleSelectAgent(agent)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="bg-purple-900 text-white">
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-white/60 truncate">
                        {agent.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-2 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-white/70" />
                  <span className="text-xs text-white/70">24/7 AI Support</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AIAgentButton;