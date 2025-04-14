import React from 'react';
import { useAgents } from '@/contexts/AgentContext';
import AIChatInterface from './AIChatInterface';
import AIAgentButton from './AIAgentButton';
import { motion, AnimatePresence } from 'framer-motion';

export function AIAgentProvider() {
  const { activeAgent, deactivateAgent } = useAgents();
  
  return (
    <>
      {/* Floating chat button */}
      {!activeAgent && <AIAgentButton />}
      
      {/* Chat popup when agent is active */}
      <AnimatePresence>
        {activeAgent && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-[450px] h-[600px] max-w-[95vw] max-h-[80vh]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AIChatInterface />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay backdrop when chat is open */}
      <AnimatePresence>
        {activeAgent && (
          <motion.div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={deactivateAgent}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default AIAgentProvider;