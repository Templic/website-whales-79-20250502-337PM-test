import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquareMore, Bot } from 'lucide-react';
import { useAgents } from '@/contexts/AgentContext';

export function AIAgentButton() {
  const { openAgentMenu, activeAgent } = useAgents();

  return (
    <Button
      onClick={openAgentMenu}
      className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      aria-label="AI Assistants"
    >
      {activeAgent ? (
        <MessageSquareMore className="h-6 w-6" />
      ) : (
        <Bot className="h-6 w-6" />
      )}
    </Button>
  );
}