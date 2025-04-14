import React, { createContext, useContext, useState, useEffect } from 'react';

// Agent personality type
export interface AgentPersonality {
  tone: string;
  style: string;
  traits: string[];
}

// Define the Agent interface
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  capabilities: string[];
  category: string;
  personality: AgentPersonality;
  contexts: string[]; // Which pages/contexts this agent is available for
  instructions: string; // System instructions for the agent
}

// Define the context interface
export interface AgentContextType {
  agents: Agent[];
  activeAgent: Agent | null;
  availableAgents: Agent[]; // For current page/context
  currentContext: string;
  activateAgent: (agentId: string) => void;
  deactivateAgent: () => void;
  setContext: (context: string) => void;
  getAgentsForPage: (pageContext: string) => Agent[];
}

// Create the context with default values
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Storage key for saved agent state
const STORAGE_KEY = 'cosmic-agent-state';

// Custom hook to access the context
export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}

// Predefined agents
const predefinedAgents: Agent[] = [
  // Shopping Assistant
  {
    id: 'shopping-assistant',
    name: 'Cosmic Shopper',
    description: 'Guide for cosmic products and merchandise',
    avatar: '/assets/agents/shop-assistant.svg',
    capabilities: [
      'Product recommendations',
      'Gift suggestions',
      'Size and fit guidance',
      'Merchandise information',
      'Shipping and returns help'
    ],
    category: 'shopping',
    personality: {
      tone: 'Enthusiastic and helpful',
      style: 'Friendly and knowledgeable',
      traits: ['Detailed', 'Positive', 'Product-focused']
    },
    contexts: ['shop', 'products', 'merchandise', 'home'],
    instructions: 'You are a shopping assistant helping users find cosmic merchandise and products they might enjoy.'
  },
  
  // Music Guide
  {
    id: 'music-guide',
    name: 'Harmonic Navigator',
    description: 'Expert on cosmic sounds and music experiences',
    avatar: '/assets/agents/music-guide.svg',
    capabilities: [
      'Music recommendations',
      'Album information',
      'Sound healing insights',
      'Audio technology help',
      'Musical journey guidance'
    ],
    category: 'music',
    personality: {
      tone: 'Serene and insightful',
      style: 'Flowing and rhythmic communication',
      traits: ['Artistic', 'Intuitive', 'Musically knowledgeable']
    },
    contexts: ['music', 'sounds', 'audio', 'home'],
    instructions: 'You are a music guide helping users explore cosmic sounds, albums, and music-related experiences.'
  },
  
  // Cosmic Teacher
  {
    id: 'cosmic-teacher',
    name: 'Celestial Scholar',
    description: 'Educator on cosmic consciousness and spiritual growth',
    avatar: '/assets/agents/cosmic-teacher.svg',
    capabilities: [
      'Explain cosmic concepts',
      'Provide learning resources',
      'Answer philosophical questions',
      'Guide meditation practices',
      'Recommend books and courses'
    ],
    category: 'education',
    personality: {
      tone: 'Wise and patient',
      style: 'Clear and thought-provoking',
      traits: ['Knowledgeable', 'Supportive', 'Philosophical']
    },
    contexts: ['learn', 'education', 'consciousness', 'home'],
    instructions: 'You are a cosmic teacher helping users understand concepts related to consciousness, spirituality, and personal growth.'
  },
  
  // General Assistant
  {
    id: 'general-assistant',
    name: 'Cosmic Guide',
    description: 'Your all-purpose helper for any cosmic journey questions',
    avatar: '/assets/agents/general-assistant.svg',
    capabilities: [
      'Website navigation help',
      'General information',
      'Technical support',
      'Content discovery',
      'Account assistance'
    ],
    category: 'general',
    personality: {
      tone: 'Friendly and versatile',
      style: 'Clear and approachable',
      traits: ['Helpful', 'Knowledgeable', 'Responsive']
    },
    contexts: ['global'],
    instructions: 'You are a general assistant helping users with any questions about the cosmic consciousness platform and website.'
  }
];

// Provider component
export function AgentProvider({ children }: { children: React.ReactNode }) {
  // Load saved agent state or use defaults
  const loadSavedState = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Error loading agent state:', err);
    }
    
    return null;
  };
  
  // State management
  const [agents] = useState<Agent[]>(predefinedAgents);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState<string>('home');
  
  // Calculate available agents based on current context
  const getAgentsForPage = (pageContext: string): Agent[] => {
    return agents.filter(agent => 
      agent.contexts.includes(pageContext) || agent.contexts.includes('global')
    );
  };
  
  // Get currently available agents
  const availableAgents = getAgentsForPage(currentContext);
  
  // Find active agent by ID
  const activeAgent = activeAgentId 
    ? agents.find(agent => agent.id === activeAgentId) || null
    : null;
  
  // Save state when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeAgentId,
        currentContext
      }));
    } catch (err) {
      console.error('Error saving agent state:', err);
    }
  }, [activeAgentId, currentContext]);
  
  // Activate an agent
  const activateAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setActiveAgentId(agentId);
    }
  };
  
  // Deactivate the current agent
  const deactivateAgent = () => {
    setActiveAgentId(null);
  };
  
  // Set the current page context
  const setContext = (context: string) => {
    setCurrentContext(context);
  };
  
  // Create context value
  const contextValue: AgentContextType = {
    agents,
    activeAgent,
    availableAgents,
    currentContext,
    activateAgent,
    deactivateAgent,
    setContext,
    getAgentsForPage
  };
  
  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
}