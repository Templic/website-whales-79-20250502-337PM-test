import React from 'react';
import { useAgents } from '../../contexts/AgentContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AIAgentButtonProps {
  agentId: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  buttonText?: string;
}

export default function AIAgentButton({
  agentId,
  variant = 'default',
  size = 'default',
  className = '',
  buttonText
}: AIAgentButtonProps) {
  const { agents, activateAgent } = useAgents();
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    return null;
  }
  
  const handleActivateAgent = () => {
    activateAgent(agentId);
  };
  
  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleActivateAgent}
      className={`flex items-center ${className}`}
      title={`Chat with ${agent.name}`}
      disabled={agent.status !== 'available'}
    >
      {size !== 'icon' && (
        <Avatar className="h-5 w-5 mr-2">
          <AvatarImage src={agent.avatar} alt={agent.name} />
          <AvatarFallback className="bg-purple-900 text-white text-xs">
            {agent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
      
      <span>
        {buttonText || agent.name}
      </span>
    </Button>
  );
}