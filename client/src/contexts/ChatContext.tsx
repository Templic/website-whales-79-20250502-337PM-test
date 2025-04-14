import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for chat messages
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

// Define the shape of the chat context
interface ChatContextType {
  // Chat state
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  
  // UI state
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  
  // Chat widget position
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  setWidgetPosition: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
  
  // Widget visible state
  isWidgetVisible: boolean;
  showWidget: () => void;
  hideWidget: () => void;
  toggleWidget: () => void;
  
  // Other settings
  autoOpenOnNewPage: boolean;
  setAutoOpenOnNewPage: (autoOpen: boolean) => void;
  
  // Accessibility integration
  highContrastChat: boolean;
  setHighContrastChat: (highContrast: boolean) => void;
  chatFontSize: number;
  setChatFontSize: (size: number) => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Generate a unique ID for chat messages
const generateId = () => Math.random().toString(36).substring(2, 9);

// ChatProvider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chat-messages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  
  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Widget position
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(() => {
    const savedPosition = localStorage.getItem('chat-widget-position');
    return (savedPosition as any) || 'bottom-right';
  });
  
  // Widget visibility
  const [isWidgetVisible, setIsWidgetVisible] = useState(() => {
    const savedVisibility = localStorage.getItem('chat-widget-visible');
    return savedVisibility ? savedVisibility === 'true' : true;
  });
  
  // Auto-open settings
  const [autoOpenOnNewPage, setAutoOpenOnNewPage] = useState(() => {
    const savedAutoOpen = localStorage.getItem('chat-auto-open');
    return savedAutoOpen ? savedAutoOpen === 'true' : false;
  });
  
  // Accessibility settings
  const [highContrastChat, setHighContrastChat] = useState(() => {
    const savedHighContrast = localStorage.getItem('chat-high-contrast');
    return savedHighContrast ? savedHighContrast === 'true' : false;
  });
  
  const [chatFontSize, setChatFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('chat-font-size');
    return savedFontSize ? parseInt(savedFontSize, 10) : 100;
  });
  
  // Add a new message to the chat
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };
  
  // Clear all chat messages
  const clearChat = () => {
    setMessages([]);
  };
  
  // UI control functions
  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => setIsChatOpen(prev => !prev);
  
  // Widget visibility functions
  const showWidget = () => setIsWidgetVisible(true);
  const hideWidget = () => setIsWidgetVisible(false);
  const toggleWidget = () => setIsWidgetVisible(prev => !prev);
  
  // Save messages to local storage when they change
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);
  
  // Save widget position
  useEffect(() => {
    localStorage.setItem('chat-widget-position', widgetPosition);
  }, [widgetPosition]);
  
  // Save widget visibility
  useEffect(() => {
    localStorage.setItem('chat-widget-visible', isWidgetVisible.toString());
  }, [isWidgetVisible]);
  
  // Save auto-open setting
  useEffect(() => {
    localStorage.setItem('chat-auto-open', autoOpenOnNewPage.toString());
  }, [autoOpenOnNewPage]);
  
  // Save accessibility settings
  useEffect(() => {
    localStorage.setItem('chat-high-contrast', highContrastChat.toString());
  }, [highContrastChat]);
  
  useEffect(() => {
    localStorage.setItem('chat-font-size', chatFontSize.toString());
  }, [chatFontSize]);
  
  // Auto-open chat on page load if setting is enabled
  useEffect(() => {
    if (autoOpenOnNewPage) {
      setIsChatOpen(true);
    }
  }, [autoOpenOnNewPage]);
  
  // Create context value
  const value: ChatContextType = {
    messages,
    addMessage,
    clearChat,
    
    isChatOpen,
    openChat,
    closeChat,
    toggleChat,
    
    widgetPosition,
    setWidgetPosition,
    
    isWidgetVisible,
    showWidget,
    hideWidget,
    toggleWidget,
    
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}