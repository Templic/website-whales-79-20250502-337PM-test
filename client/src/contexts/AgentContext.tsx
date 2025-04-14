import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the Agent interface
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: 'general' | 'shopping' | 'music' | 'education';
  instructions: string;
  contextSpecific: boolean;
}

// Define the context value interface
interface AgentContextValue {
  agents: Agent[];
  activeAgent: Agent | null;
  availableAgents: Agent[];
  activateAgent: (id: string) => void;
  deactivateAgent: () => void;
  setContext: (context: string) => void;
}

// Create the context
const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// Define props for the provider component
interface AgentProviderProps {
  children: ReactNode;
}

// Define available agents
const AGENTS: Agent[] = [
  {
    id: 'general-assistant',
    name: 'Cosmic Guide',
    description: 'Your general assistant for all cosmic awareness needs',
    avatar: '/agents/cosmic-guide.svg',
    category: 'general',
    instructions: 'You are a helpful and friendly guide for the Cosmic Consciousness platform. Assist users with general questions about the platform, navigation, and accessing features.',
    contextSpecific: false
  },
  {
    id: 'shopping-assistant',
    name: 'Shop Oracle',
    description: 'Expert in cosmic products, merchandise, and shopping assistance',
    avatar: '/agents/shop-oracle.svg',
    category: 'shopping',
    instructions: 'You are a shopping assistant specializing in cosmic products. Help users find items, explain product benefits, and provide pricing information.',
    contextSpecific: true
  },
  {
    id: 'music-guide',
    name: 'Harmonic Helper',
    description: 'Music curator specializing in binaural beats and cosmic frequencies',
    avatar: '/agents/harmonic-helper.svg',
    category: 'music',
    instructions: 'You are a music specialist who understands binaural beats, frequency healing, and cosmic harmonies. Help users discover music that aligns with their energy and intentions.',
    contextSpecific: true
  },
  {
    id: 'education-mentor',
    name: 'Wisdom Keeper',
    description: 'Educational guide for cosmic consciousness and spiritual growth',
    avatar: '/agents/wisdom-keeper.svg',
    category: 'education',
    instructions: 'You are an educational mentor specializing in cosmic consciousness, spiritual growth, and metaphysical concepts. Provide thoughtful responses that expand understanding without imposing specific beliefs.',
    contextSpecific: true
  }
];

// Context mapping between routes and available agents
const CONTEXT_AGENT_MAPPING: Record<string, string[]> = {
  home: ['general-assistant'],
  music: ['general-assistant', 'music-guide'],
  shop: ['general-assistant', 'shopping-assistant'],
  learn: ['general-assistant', 'education-mentor'],
  community: ['general-assistant'],
  about: ['general-assistant'],
  blog: ['general-assistant'],
  'ai-chat': ['general-assistant', 'shopping-assistant', 'music-guide', 'education-mentor']
};

// Provider component
export function AgentProvider({ children }: AgentProviderProps) {
  const [agents] = useState<Agent[]>(AGENTS);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [currentContext, setCurrentContext] = useState<string>('home');
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  
  // Update available agents based on context
  useEffect(() => {
    const contextAgentIds = CONTEXT_AGENT_MAPPING[currentContext] || ['general-assistant'];
    const filteredAgents = agents.filter(agent => 
      !agent.contextSpecific || contextAgentIds.includes(agent.id)
    );
    setAvailableAgents(filteredAgents);
  }, [currentContext, agents]);
  
  // Activate an agent by ID
  const activateAgent = useCallback((id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setActiveAgent(agent);
    }
  }, [agents]);
  
  // Deactivate the current agent
  const deactivateAgent = useCallback(() => {
    setActiveAgent(null);
  }, []);
  
  // Set the current context (usually based on route/page)
  const setContext = useCallback((context: string) => {
    setCurrentContext(context);
  }, []);
  
  // Context value
  const value: AgentContextValue = {
    agents,
    activeAgent,
    availableAgents,
    activateAgent,
    deactivateAgent,
    setContext
  };
  
  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

// Custom hook for using the context
export function useAgents(): AgentContextValue {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}