import React from 'react';
import { useAgents } from '../../contexts/AgentContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatInterface from './AIChatInterface';

export default function AIAgentProvider() {
  const { activeAgent } = useAgents();
  const { reducedMotion } = useAccessibility();
  
  return (
    <AnimatePresence>
      {activeAgent && (
        <motion.div
          className="fixed bottom-4 right-4 z-40 w-full max-w-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <AIChatInterface />
        </motion.div>
      )}
    </AnimatePresence>
  );
}