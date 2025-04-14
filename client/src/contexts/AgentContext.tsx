import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the agent statuses
type AgentStatus = 'available' | 'busy' | 'offline';

// Define the agent interface
export interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  category: string;
  capabilities: string[];
  instructions: string;
  status: AgentStatus;
}

// Message type definition
type MessageType = {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
};

// Define the context interface
interface AgentContextType {
  agents: Agent[];
  availableAgents: Agent[];
  activeAgent: Agent | null;
  activateAgent: (agentId: string) => void;
  deactivateAgent: () => void;
  sendMessage: (message: string) => void;
  messages: MessageType[];
}

// Create the context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Define the mock agents data
const AGENTS: Agent[] = [
  {
    id: 'cosmic-guide',
    name: 'Cosmic Guide',
    avatar: '/agents/cosmic-guide.svg',
    description: 'Your spiritual guide to cosmic consciousness and inner healing',
    category: 'Spiritual Guide',
    capabilities: [
      'Meditation techniques',
      'Spiritual growth',
      'Consciousness expansion',
      'Energy healing guidance'
    ],
    instructions: 'I am the Cosmic Guide, here to help you on your spiritual journey with compassion and wisdom.',
    status: 'available'
  },
  {
    id: 'shop-oracle',
    name: 'Shop Oracle',
    avatar: '/agents/shop-oracle.svg',
    description: 'Expert on all our products and how they can enhance your practice',
    category: 'Product Specialist',
    capabilities: [
      'Product recommendations',
      'Usage guidance',
      'Gift suggestions',
      'Compatibility advice'
    ],
    instructions: 'I am the Shop Oracle, here to help you find the perfect products for your spiritual journey.',
    status: 'available'
  },
  {
    id: 'harmonic-helper',
    name: 'Harmonic Helper',
    avatar: '/agents/harmonic-helper.svg',
    description: 'Your guide to sound healing, frequencies, and musical meditation',
    category: 'Sound Healing Expert',
    capabilities: [
      'Sound bath guidance',
      'Frequency recommendations',
      'Musical meditation',
      'Binaural beats info'
    ],
    instructions: 'I am the Harmonic Helper, here to guide you through the healing power of sound and frequency.',
    status: 'available'
  },
  {
    id: 'wisdom-keeper',
    name: 'Wisdom Keeper',
    avatar: '/agents/wisdom-keeper.svg',
    description: 'Repository of ancient teachings and modern spiritual wisdom',
    category: 'Knowledge Guide',
    capabilities: [
      'Ancient traditions',
      'Sacred texts',
      'Philosophical insights',
      'Historical context'
    ],
    instructions: 'I am the Wisdom Keeper, here to share knowledge from ancient traditions and modern spiritual practices.',
    status: 'available'
  }
];

// Create the provider component
export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  type MessageType = {
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: number;
    agentId?: string;
  };
  
  const [messages, setMessages] = useState<MessageType[]>([]);

  // Filter available agents
  const availableAgents = agents.filter(agent => agent.status === 'available');

  // Activate an agent
  const activateAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setActiveAgent(agent);
      
      // Add system message with agent's instructions
      setMessages([
        {
          role: 'system',
          content: agent.instructions,
          timestamp: Date.now(),
          agentId: agent.id
        },
        {
          role: 'agent',
          content: `Hello! I'm ${agent.name}. How can I assist you today?`,
          timestamp: Date.now(),
          agentId: agent.id
        }
      ]);
    }
  };

  // Deactivate the current agent
  const deactivateAgent = () => {
    setActiveAgent(null);
    setMessages([]);
  };

  // Send a message to the active agent
  const sendMessage = (message: string) => {
    if (!activeAgent) return;

    // Add user message
    const userMessage: MessageType = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Simulate agent response (in a real app, this would call an API)
    setTimeout(() => {
      const agentResponse: MessageType = {
        role: 'agent',
        content: simulateAgentResponse(activeAgent, message),
        timestamp: Date.now(),
        agentId: activeAgent.id
      };
      setMessages([...newMessages, agentResponse]);
    }, 1000);
  };

  // Simulate agent responses based on agent type
  const simulateAgentResponse = (agent: Agent, message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    switch (agent.id) {
      case 'cosmic-guide':
        if (lowerMessage.includes('meditation') || lowerMessage.includes('meditate')) {
          return "Meditation is a powerful practice for expanding consciousness. I recommend starting with a simple breath-focused meditation. Find a quiet space, sit comfortably, and focus on your breath for 5-10 minutes. How does that sound?";
        } else if (lowerMessage.includes('healing') || lowerMessage.includes('energy')) {
          return "Energy healing works with the subtle energies of your body. Consider visualizing a healing light flowing through you, releasing blockages and restoring balance. Would you like me to guide you through a simple energy healing visualization?";
        } else {
          return "I'm here to guide you on your spiritual journey. What specific aspect of cosmic consciousness would you like to explore today?";
        }
      
      case 'shop-oracle':
        if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion')) {
          return "Based on our conversation, I'd recommend our Cosmic Frequency Crystal Set. It includes carefully selected crystals that work harmoniously together to enhance meditation and energy work. Would you like to know more about it?";
        } else if (lowerMessage.includes('gift') || lowerMessage.includes('present')) {
          return "For meaningful gifts, our Personalized Astral Chart with accompanying crystal is very popular. It provides a beautiful personalized star map and a crystal selected for the recipient's astrological sign. Would that interest you?";
        } else {
          return "I can help you find the perfect products for your practice. What are you specifically looking for today?";
        }
        
      case 'harmonic-helper':
        if (lowerMessage.includes('frequency') || lowerMessage.includes('frequencies')) {
          return "Different frequencies affect us in unique ways. For relaxation, try sounds in the 432Hz range. For focus and concentration, 528Hz can be beneficial. Would you like specific recommendations for your current needs?";
        } else if (lowerMessage.includes('binaural')) {
          return "Binaural beats work by playing slightly different frequencies in each ear, which your brain perceives as a third, pulsating tone. This can help entrain your brainwaves to specific states like deep meditation or focused concentration. What state are you trying to achieve?";
        } else {
          return "Sound is a powerful healing tool. How would you like to incorporate sound healing into your practice?";
        }
        
      case 'wisdom-keeper':
        if (lowerMessage.includes('ancient') || lowerMessage.includes('tradition')) {
          return "Ancient wisdom traditions share remarkable similarities across cultures. Many emphasize the interconnectedness of all life and the importance of balance. Are you interested in a specific tradition or teaching?";
        } else if (lowerMessage.includes('philosophy') || lowerMessage.includes('text')) {
          return "Philosophical texts like the Tao Te Ching teach us about flowing with life rather than resisting it. The Upanishads speak of the ultimate reality being consciousness itself. Which philosophical avenue resonates with you?";
        } else {
          return "Knowledge is the gateway to wisdom when applied with heart. What wisdom are you seeking today?";
        }
        
      default:
        return "I'm here to assist you. What would you like to know?";
    }
  };

  return (
    <AgentContext.Provider
      value={{
        agents,
        availableAgents,
        activeAgent,
        activateAgent,
        deactivateAgent,
        sendMessage,
        messages
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

// Create a hook to use the agent context
export function useAgents(): AgentContextType {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}