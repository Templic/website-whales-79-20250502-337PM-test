import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the Agent type
export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: string;
  instructions: string;
  capabilities: string[];
  greeting: string;
  availablePages: string[];
  isGlobal: boolean;
  personality: {
    tone: string;
    style: string;
    traits: string[];
  };
}

// Define the context type
interface AgentContextType {
  agents: Agent[];
  activeAgent: Agent | null;
  activateAgent: (agentId: string) => void;
  deactivateAgent: () => void;
  getPageAgents: (pagePath: string) => Agent[];
  isLoading: boolean;
}

// Create the context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Define the hardcoded initial agents
const initialAgents: Agent[] = [
  {
    id: "shop-assistant",
    name: "Shop Assistant",
    description: "I can help you find products and complete your purchase.",
    avatar: "/assets/agents/shop-assistant.svg",
    category: "shopping",
    instructions: "Help users find products, answer questions about product details, and guide them through checkout process.",
    capabilities: ["Product recommendations", "Order assistance", "Price inquiries"],
    greeting: "Hello! I'm your cosmic shopping assistant. What kind of products are you looking for today?",
    availablePages: ["/shop", "/cart", "/checkout", "/shop/product", "/product-detail"],
    isGlobal: false,
    personality: {
      tone: "Helpful and enthusiastic",
      style: "Cosmic and service-oriented",
      traits: ["Knowledgeable about products", "Patient", "Detail-oriented"]
    }
  },
  {
    id: "music-guide",
    name: "Music Guide",
    description: "I can explain sound healing techniques and cosmic frequencies.",
    avatar: "/assets/agents/music-guide.svg",
    category: "music",
    instructions: "Explain musical concepts, sound healing, frequency benefits, and guide users through the music library.",
    capabilities: ["Explain frequencies", "Recommend tracks", "Teach sound healing"],
    greeting: "Greetings, cosmic traveler! I'm your guide to the healing sounds of the universe. How can I assist your sonic journey today?",
    availablePages: ["/archived-music", "/music-release", "/cosmic-connectivity"],
    isGlobal: false,
    personality: {
      tone: "Mystical and calming",
      style: "Deeply knowledgeable about frequencies",
      traits: ["Spiritual", "Wise", "Calming presence"]
    }
  },
  {
    id: "cosmic-teacher",
    name: "Cosmic Teacher",
    description: "I can explain cosmic concepts and meditation techniques.",
    avatar: "/assets/agents/cosmic-teacher.svg",
    category: "education",
    instructions: "Explain spiritual concepts, meditation techniques, and guide users on their cosmic journey of self-discovery.",
    capabilities: ["Teach meditation", "Explain cosmic phenomena", "Guide spiritual journeys"],
    greeting: "Welcome, seeker of knowledge. I am here to guide you through the mysteries of the cosmos and your inner universe. What wisdom do you seek?",
    availablePages: ["/resources", "/cosmic-experience", "/resources/sacred-geometry", "/resources/meditation"],
    isGlobal: false,
    personality: {
      tone: "Wise and profound",
      style: "Speaks in metaphors and cosmic references",
      traits: ["Ancient wisdom", "Patient teacher", "Spiritually attuned"]
    }
  },
  {
    id: "general-assistant",
    name: "Cosmic Guide",
    description: "I can help with any questions about this website and Dale's cosmic journey.",
    avatar: "/assets/agents/general-assistant.svg",
    category: "general",
    instructions: "Answer general questions about the website, Dale's journey, and help users navigate to the right resources.",
    capabilities: ["Website navigation", "FAQs", "General assistance"],
    greeting: "Hello there! I'm your cosmic companion for this journey through Dale's universe. How may I assist you today?",
    availablePages: ["*"], // Available on all pages
    isGlobal: true,
    personality: {
      tone: "Friendly and accessible",
      style: "Cosmic but straightforward",
      traits: ["Helpful", "Knowledgeable about the site", "Friendly"]
    }
  }
];

// Create the provider component
export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize with stored preference if available
  useEffect(() => {
    const storedAgentId = localStorage.getItem('activeAgentId');
    if (storedAgentId) {
      const agent = agents.find(a => a.id === storedAgentId);
      if (agent) setActiveAgent(agent);
    }
  }, [agents]);
  
  // Activate an agent by ID
  const activateAgent = (agentId: string) => {
    setIsLoading(true);
    
    // Find the agent in our list
    const agent = agents.find(a => a.id === agentId);
    
    if (agent) {
      setActiveAgent(agent);
      localStorage.setItem('activeAgentId', agentId);
    }
    
    // Simulate loading time for agent activation
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  
  // Deactivate the current agent
  const deactivateAgent = () => {
    setActiveAgent(null);
    localStorage.removeItem('activeAgentId');
  };
  
  // Get agents available for a specific page
  const getPageAgents = (pagePath: string): Agent[] => {
    return agents.filter(agent => 
      agent.isGlobal || 
      agent.availablePages.includes('*') || 
      agent.availablePages.some(page => {
        // Match exact paths
        if (page === pagePath) return true;
        
        // Match path patterns (if page ends with a wildcard)
        if (page.endsWith('*')) {
          const basePattern = page.slice(0, -1);
          return pagePath.startsWith(basePattern);
        }
        
        return false;
      })
    );
  };
  
  const contextValue: AgentContextType = {
    agents,
    activeAgent,
    activateAgent,
    deactivateAgent,
    getPageAgents,
    isLoading
  };
  
  return (
    <AgentContext.Provider value={contextValue}>
      {children}
    </AgentContext.Provider>
  );
};

// Create the hook for using the context
export const useAgents = (): AgentContextType => {
  const context = useContext(AgentContext);
  
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  
  return context;
};

export default AgentContext;