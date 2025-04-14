import React, { createContext, useContext, useState } from 'react';

// Agent information interface
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  instructions: string;
  category: string;
  capabilities: string[];
  status: 'available' | 'offline' | 'busy';
}

// Context type definition
interface AgentContextType {
  agents: Agent[];
  availableAgents: Agent[];
  activeAgent: Agent | null;
  activateAgent: (agentId: string) => void;
  deactivateAgent: () => void;
}

// Create the context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Define the available agents
const agentList: Agent[] = [
  {
    id: 'cosmic-guide',
    name: 'Cosmic Guide',
    description: 'Your spiritual companion in the cosmic journey',
    avatar: '/agents/cosmic-guide.svg',
    instructions: 'Provide guidance on spiritual well-being and cosmic awareness',
    category: 'spiritual',
    capabilities: ['meditation guidance', 'spiritual advice', 'mindfulness practices'],
    status: 'available'
  },
  {
    id: 'shop-oracle',
    name: 'Shop Oracle',
    description: 'Your personal shopping assistant for cosmic merchandise',
    avatar: '/agents/shop-oracle.svg',
    instructions: 'Help customers find products and make purchase recommendations',
    category: 'shopping',
    capabilities: ['product recommendations', 'gift ideas', 'order assistance'],
    status: 'available'
  },
  {
    id: 'harmonic-helper',
    name: 'Harmonic Helper',
    description: 'Your guide to harmonic sound frequencies and music',
    avatar: '/agents/harmonic-helper.svg',
    instructions: 'Assist with music selection and frequency recommendations',
    category: 'music',
    capabilities: ['music recommendations', 'frequency guidance', 'sound healing advice'],
    status: 'available'
  },
  {
    id: 'wisdom-keeper',
    name: 'Wisdom Keeper',
    description: 'Shares cosmic knowledge and educational insights',
    avatar: '/agents/wisdom-keeper.svg',
    instructions: 'Provide educational content and knowledge sharing',
    category: 'education',
    capabilities: ['knowledge sharing', 'educational content', 'research assistance'],
    status: 'available'
  }
];

// Hook for using the agent context
export function useAgents() {
  const context = useContext(AgentContext);
  
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  
  return context;
}

// Provider component
export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  
  // All agents
  const agents = agentList;
  
  // Available agents (not offline)
  const availableAgents = agents.filter(agent => agent.status === 'available');
  
  // Currently active agent
  const activeAgent = activeAgentId 
    ? agents.find(agent => agent.id === activeAgentId) || null 
    : null;
  
  // Activate an agent by ID
  const activateAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent && agent.status === 'available') {
      setActiveAgentId(agentId);
    }
  };
  
  // Deactivate the current agent
  const deactivateAgent = () => {
    setActiveAgentId(null);
  };
  
  const value = {
    agents,
    availableAgents,
    activeAgent,
    activateAgent,
    deactivateAgent
  };
  
  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}