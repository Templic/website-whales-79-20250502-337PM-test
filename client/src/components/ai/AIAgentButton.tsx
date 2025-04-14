import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useAgents } from '@/contexts/AgentContext';
import { motion } from 'framer-motion';

export function AIAgentButton() {
  const { activeAgent, activateAgent } = useAgents();
  
  // Activate the general assistant by default when button is clicked
  const handleClick = () => {
    // If there's no active agent, activate the general assistant
    if (!activeAgent) {
      activateAgent('general-assistant');
    }
  };
  
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        onClick={handleClick}
        className={`
          rounded-full h-14 w-14 p-0 bg-gradient-to-r
          from-purple-600 to-indigo-600
          hover:from-purple-700 hover:to-indigo-700
          shadow-lg shadow-purple-500/20
          flex items-center justify-center
        `}
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6 text-white" />
          {/* Cosmic pulsing effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-md animate-ping" />
        </div>
      </Button>
    </motion.div>
  );
}

export default AIAgentButton;