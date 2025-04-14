import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the Agent interface
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  instructions: string;
  description: string;
  category: string;
  isEnabled: boolean;
  availableOn: string[]; // Array of page paths where this agent is available
}

// Define the context type for agents
interface AgentContextType {
  agents: Agent[];
  activeAgent: Agent | null;
  isAgentMenuOpen: boolean;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  activateAgent: (agentId: string) => void;
  deactivateAgent: () => void;
  openAgentMenu: () => void;
  closeAgentMenu: () => void;
  toggleAgentMenu: () => void;
  getAgentsForPage: (pagePath: string) => Agent[];
}

// Create the context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Sample agents data
const defaultAgents: Agent[] = [
  {
    id: 'shopping-assistant',
    name: 'Cosmic Shopping Assistant',
    avatar: '/assets/agents/shopping-assistant.svg',
    personality: 'Helpful, knowledgeable about products',
    instructions: 'Help users find products and answer questions about the merchandise.',
    description: 'I can help you find the perfect cosmic items for your journey.',
    category: 'shopping',
    isEnabled: true,
    availableOn: ['/shop', '/shop/product', '/cart', '/checkout']
  },
  {
    id: 'music-guide',
    name: 'Cosmic Music Guide',
    avatar: '/assets/agents/music-guide.svg',
    personality: 'Passionate about music, enthusiastic',
    instructions: 'Guide users through the music catalog and provide music recommendations.',
    description: 'Let me help you discover cosmic sounds that resonate with your energy.',
    category: 'music',
    isEnabled: true,
    availableOn: ['/music-release', '/archived-music', '/music-archive', '/music/search']
  },
  {
    id: 'cosmic-teacher',
    name: 'Cosmic Teacher',
    avatar: '/assets/agents/cosmic-teacher.svg',
    personality: 'Wise, patient, informative',
    instructions: 'Explain cosmic concepts and provide educational guidance.',
    description: 'I can guide you through cosmic knowledge and spiritual teachings.',
    category: 'education',
    isEnabled: true,
    availableOn: ['/resources', '/resources/frequency-guide', '/resources/sacred-geometry', 
                 '/resources/sound-healing', '/resources/meditation']
  },
  {
    id: 'general-assistant',
    name: 'Cosmic Guide',
    avatar: '/assets/agents/general-assistant.svg',
    personality: 'Friendly, helpful, all-knowing',
    instructions: 'Assist users with general questions about the site and content.',
    description: 'I\'m here to guide you through your cosmic journey on our site.',
    category: 'general',
    isEnabled: true,
    availableOn: ['*'] // Available on all pages
  }
];

// Provider component
export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState<boolean>(false);

  const addAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  };

  const removeAgent = (agentId: string) => {
    setAgents(prev => prev.filter(agent => agent.id !== agentId));
  };

  const activateAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setActiveAgent(agent);
      setIsAgentMenuOpen(false); // Close menu when agent is activated
    }
  };

  const deactivateAgent = () => {
    setActiveAgent(null);
  };

  const openAgentMenu = () => setIsAgentMenuOpen(true);
  const closeAgentMenu = () => setIsAgentMenuOpen(false);
  const toggleAgentMenu = () => setIsAgentMenuOpen(prev => !prev);

  // Function to get agents available on the current page
  const getAgentsForPage = (pagePath: string): Agent[] => {
    return agents.filter(agent => 
      agent.isEnabled && (
        agent.availableOn.includes('*') || 
        agent.availableOn.some(path => pagePath.startsWith(path))
      )
    );
  };

  return (
    <AgentContext.Provider 
      value={{ 
        agents, 
        activeAgent, 
        isAgentMenuOpen,
        addAgent, 
        removeAgent, 
        activateAgent, 
        deactivateAgent,
        openAgentMenu,
        closeAgentMenu,
        toggleAgentMenu,
        getAgentsForPage
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

// Custom hook to use the AgentContext
export const useAgents = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
};