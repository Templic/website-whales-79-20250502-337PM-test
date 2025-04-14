import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useAgents } from '@/contexts/AgentContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AIAgentButtonProps {
  agentId: string;
  tooltip?: string;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showAvatar?: boolean;
  className?: string;
}

export default function AIAgentButton({
  agentId,
  tooltip = 'Chat with agent',
  buttonText,
  variant = 'default',
  size = 'default',
  showAvatar = true,
  className = ''
}: AIAgentButtonProps) {
  const { activateAgent, agents } = useAgents();
  
  // Find the agent by ID
  const agent = agents.find(a => a.id === agentId);
  
  // If agent doesn't exist or is offline, don't render
  if (!agent || agent.status !== 'available') {
    return null;
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => activateAgent(agentId)}
      title={tooltip}
      className={`flex items-center space-x-2 ${className}`}
    >
      {showAvatar && (
        <Avatar className="h-6 w-6">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      
      {buttonText ? (
        <span>{buttonText}</span>
      ) : (
        <>
          <MessageSquare className="h-5 w-5" />
          <span className="hidden md:inline">{agent.name}</span>
        </>
      )}
    </Button>
  );
}