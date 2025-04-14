import React, { useState, useEffect } from 'react';
import { AIAgentButton } from './AIAgentButton';
import { AIAgentMenu } from './AIAgentMenu';
import { AIChatInterface } from './AIChatInterface';
import { useAgents } from '@/contexts/AgentContext';
import { useLocation } from 'wouter';

export function AIAgentProvider() {
  const { isAgentMenuOpen, closeAgentMenu, activeAgent, getAgentsForPage } = useAgents();
  const [location] = useLocation();
  const [hasAgentsForPage, setHasAgentsForPage] = useState(false);

  useEffect(() => {
    // Check if there are any agents available for the current page
    const availableAgents = getAgentsForPage(location);
    setHasAgentsForPage(availableAgents.length > 0);
  }, [location, getAgentsForPage]);

  // Don't render anything if there are no agents for the current page
  if (!hasAgentsForPage) return null;

  return (
    <>
      <AIAgentButton />
      <AIAgentMenu isOpen={isAgentMenuOpen} onClose={closeAgentMenu} />
      {activeAgent && <AIChatInterface isPopup />}
    </>
  );
}