import React from 'react';
import { useAgents } from '@/contexts/AgentContext';
import AIChatInterface from './AIChatInterface';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function AIAgentProvider() {
  const { activeAgent } = useAgents();
  const { reducedMotion } = useAccessibility();
  
  return (
    <AnimatePresence>
      {activeAgent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="fixed bottom-4 right-4 z-40 w-[400px] max-w-[calc(100vw-32px)]"
        >
          <AIChatInterface />
        </motion.div>
      )}
    </AnimatePresence>
  );
}