import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Chat message type definitions
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface ChatSettings {
  widgetVisible: boolean;
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoOpenOnNewPage: boolean;
  highContrastChat: boolean;
  chatFontSize: number;
}

interface ChatContextType {
  // Chat state
  messages: ChatMessage[];
  isTyping: boolean;
  isOpen: boolean;
  
  // Chat actions
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  
  // Widget visibility
  isWidgetVisible: boolean;
  showWidget: () => void;
  hideWidget: () => void;
  
  // Widget position
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  setWidgetPosition: (position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => void;
  
  // Auto-open settings
  autoOpenOnNewPage: boolean;
  setAutoOpenOnNewPage: (autoOpen: boolean) => void;
  
  // Accessibility settings
  highContrastChat: boolean;
  setHighContrastChat: (highContrast: boolean) => void;
  chatFontSize: number;
  setChatFontSize: (fontSize: number) => void;
}

// Default settings
const defaultSettings: ChatSettings = {
  widgetVisible: true,
  widgetPosition: 'bottom-right',
  autoOpenOnNewPage: false,
  highContrastChat: false,
  chatFontSize: 100
};

// Storage keys
const MESSAGES_STORAGE_KEY = 'chat_messages';
const SETTINGS_STORAGE_KEY = 'chat_settings';

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  messages: [],
  isTyping: false,
  isOpen: false,
  
  sendMessage: async () => {},
  clearChat: () => {},
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  
  isWidgetVisible: defaultSettings.widgetVisible,
  showWidget: () => {},
  hideWidget: () => {},
  
  widgetPosition: defaultSettings.widgetPosition,
  setWidgetPosition: () => {},
  
  autoOpenOnNewPage: defaultSettings.autoOpenOnNewPage,
  setAutoOpenOnNewPage: () => {},
  
  highContrastChat: defaultSettings.highContrastChat,
  setHighContrastChat: () => {},
  chatFontSize: defaultSettings.chatFontSize,
  setChatFontSize: () => {},
});

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedMessages = localStorage.getItem(MESSAGES_STORAGE_KEY);
      const parsedMessages = savedMessages ? JSON.parse(savedMessages) : [];
      
      // Convert string timestamps back to Date objects
      return parsedMessages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error: unknown) {
      console.error('Failed to parse chat messages from localStorage', error);
      return [];
    }
  });
  
  // Load settings from localStorage
  const [settings, setSettings] = useState<ChatSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    } catch (error: unknown) {
      console.error('Failed to parse chat settings from localStorage', error);
      return defaultSettings;
    }
  });
  
  // Chat UI state
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Destructure settings for easier access
  const { 
    widgetVisible, 
    widgetPosition, 
    autoOpenOnNewPage, 
    highContrastChat, 
    chatFontSize 
  } = settings;
  
  // Save messages to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error: unknown) {
      console.error('Failed to save chat messages to localStorage', error);
    }
  }, [messages]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error: unknown) {
      console.error('Failed to save chat settings to localStorage', error);
    }
  }, [settings]);
  
  // Auto-open the chat on page navigation if enabled
  useEffect(() => {
    if (autoOpenOnNewPage) {
      openChat();
    }
  }, [autoOpenOnNewPage]);
  
  // Helper to generate a unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };
  
  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Create a new user message
    const userMessage: ChatMessage = {
      id: generateId(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);
    
    // Update user message status to sent
    setTimeout(() => {
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
      
      // Simulate assistant typing
      setIsTyping(true);
      
      // Simulate assistant response after a delay
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          content: "This is a placeholder response. The real responses will come from the Taskade AI Agent.",
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 2000);
    }, 500);
  }, []);
  
  // Clear all chat messages
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Chat visibility controls
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);
  
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);
  
  // Widget visibility controls
  const showWidget = useCallback(() => {
    setSettings((prev) => ({ ...prev, widgetVisible: true }));
  }, []);
  
  const hideWidget = useCallback(() => {
    setSettings((prev) => ({ ...prev, widgetVisible: false }));
  }, []);
  
  // Widget position control
  const setWidgetPosition = useCallback((position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => {
    setSettings((prev) => ({ ...prev, widgetPosition: position }));
  }, []);
  
  // Auto-open setting
  const setAutoOpenOnNewPage = useCallback((autoOpen: boolean) => {
    setSettings((prev) => ({ ...prev, autoOpenOnNewPage: autoOpen }));
  }, []);
  
  // Accessibility settings
  const setHighContrastChat = useCallback((highContrast: boolean) => {
    setSettings((prev) => ({ ...prev, highContrastChat: highContrast }));
  }, []);
  
  const setChatFontSize = useCallback((fontSize: number) => {
    setSettings((prev) => ({ ...prev, chatFontSize: fontSize }));
  }, []);
  
  // Combine all values and methods
  const value = {
    messages,
    isTyping,
    isOpen,
    
    sendMessage,
    clearChat,
    openChat,
    closeChat,
    toggleChat,
    
    isWidgetVisible: widgetVisible,
    showWidget,
    hideWidget,
    
    widgetPosition,
    setWidgetPosition,
    
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize,
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook for using the chat context
export const useChat = () => useContext(ChatContext);

export default ChatContext;