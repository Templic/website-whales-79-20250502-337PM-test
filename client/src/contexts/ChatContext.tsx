import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for chat messages
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

// Define the context type
interface ChatContextType {
  // Chat State
  messages: ChatMessage[];
  addMessage: (content: string, sender: 'user' | 'ai') => void;
  clearChat: () => void;
  
  // Chat Widget State
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  
  // Widget Configuration
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  setWidgetPosition: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
  isWidgetVisible: boolean;
  showWidget: () => void;
  hideWidget: () => void;
  
  // Auto-open settings
  autoOpenOnNewPage: boolean;
  setAutoOpenOnNewPage: (autoOpen: boolean) => void;
  
  // Accessibility Settings
  highContrastChat: boolean;
  setHighContrastChat: (highContrast: boolean) => void;
  chatFontSize: number;
  setChatFontSize: (size: number) => void;
}

// Create context with a default undefined value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider props
interface ChatProviderProps {
  children: ReactNode;
}

// Provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Message state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Try to load messages from local storage
    const storedMessages = localStorage.getItem('chatMessages');
    return storedMessages ? JSON.parse(storedMessages) : [];
  });
  
  // Chat widget state
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Configuration settings
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(() => {
    const storedPosition = localStorage.getItem('chatWidgetPosition');
    return (storedPosition as any) || 'bottom-right';
  });
  
  const [isWidgetVisible, setIsWidgetVisible] = useState(() => {
    const storedVisibility = localStorage.getItem('chatWidgetVisible');
    return storedVisibility ? storedVisibility === 'true' : true;
  });
  
  const [autoOpenOnNewPage, setAutoOpenOnNewPage] = useState(() => {
    const storedAutoOpen = localStorage.getItem('chatAutoOpenOnNewPage');
    return storedAutoOpen ? storedAutoOpen === 'true' : false;
  });
  
  // Accessibility settings
  const [highContrastChat, setHighContrastChat] = useState(() => {
    const storedHighContrast = localStorage.getItem('chatHighContrast');
    return storedHighContrast ? storedHighContrast === 'true' : false;
  });
  
  const [chatFontSize, setChatFontSize] = useState(() => {
    const storedFontSize = localStorage.getItem('chatFontSize');
    return storedFontSize ? parseInt(storedFontSize, 10) : 100;
  });
  
  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  
  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('chatWidgetPosition', widgetPosition);
    localStorage.setItem('chatWidgetVisible', String(isWidgetVisible));
    localStorage.setItem('chatAutoOpenOnNewPage', String(autoOpenOnNewPage));
    localStorage.setItem('chatHighContrast', String(highContrastChat));
    localStorage.setItem('chatFontSize', String(chatFontSize));
  }, [widgetPosition, isWidgetVisible, autoOpenOnNewPage, highContrastChat, chatFontSize]);
  
  // Handle auto-open on page navigation
  useEffect(() => {
    if (autoOpenOnNewPage) {
      // We use a slight delay to ensure the page has fully loaded
      const timeoutId = setTimeout(() => {
        setIsChatOpen(true);
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoOpenOnNewPage]);
  
  // Function to add a new message
  const addMessage = (content: string, sender: 'user' | 'ai') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // If this is a user message, simulate an AI response
    if (sender === 'user') {
      // This is just a placeholder - in a real implementation,
      // you'd send the message to your AI service and get a real response
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: "This is a simulated AI response. In a real implementation, this would come from the Taskade AI Agent.",
          sender: 'ai',
          timestamp: Date.now() + 1
        };
        
        setMessages(prevMessages => [...prevMessages, aiResponse]);
      }, 1000);
    }
  };
  
  // Function to clear all messages
  const clearChat = () => {
    setMessages([]);
  };
  
  // Chat widget control functions
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  
  // Widget visibility functions
  const showWidget = () => setIsWidgetVisible(true);
  const hideWidget = () => setIsWidgetVisible(false);
  
  // Provide all values
  const contextValue: ChatContextType = {
    messages,
    addMessage,
    clearChat,
    isChatOpen,
    openChat,
    closeChat,
    widgetPosition,
    setWidgetPosition,
    isWidgetVisible,
    showWidget,
    hideWidget,
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};