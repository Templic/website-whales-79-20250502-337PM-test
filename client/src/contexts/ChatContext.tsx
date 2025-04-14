import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Type for widget position
type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

// Define the shape of our context
interface ChatContextType {
  // Widget visibility
  isWidgetVisible: boolean;
  showWidget: () => void;
  hideWidget: () => void;
  
  // Widget open state
  isWidgetOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  
  // Widget position
  widgetPosition: WidgetPosition;
  setWidgetPosition: (position: WidgetPosition) => void;
  
  // Auto open settings
  autoOpenOnNewPage: boolean;
  setAutoOpenOnNewPage: (autoOpen: boolean) => void;
  
  // Chat history
  chatHistory: Array<{ role: 'user' | 'assistant', content: string }>;
  addMessage: (message: { role: 'user' | 'assistant', content: string }) => void;
  clearChat: () => void;
  
  // Accessibility settings for chat
  highContrastChat: boolean;
  setHighContrastChat: (highContrast: boolean) => void;
  chatFontSize: number;
  setChatFontSize: (fontSize: number) => void;
}

// Create context with default values
const ChatContext = createContext<ChatContextType>({
  isWidgetVisible: true,
  showWidget: () => {},
  hideWidget: () => {},
  
  isWidgetOpen: false,
  openWidget: () => {},
  closeWidget: () => {},
  
  widgetPosition: 'bottom-right',
  setWidgetPosition: () => {},
  
  autoOpenOnNewPage: false,
  setAutoOpenOnNewPage: () => {},
  
  chatHistory: [],
  addMessage: () => {},
  clearChat: () => {},
  
  highContrastChat: false,
  setHighContrastChat: () => {},
  chatFontSize: 100,
  setChatFontSize: () => {},
});

// Storage keys
const STORAGE_KEY_PREFIX = 'cosmicChat_';
const WIDGET_VISIBLE_KEY = `${STORAGE_KEY_PREFIX}widgetVisible`;
const WIDGET_POSITION_KEY = `${STORAGE_KEY_PREFIX}widgetPosition`;
const AUTO_OPEN_KEY = `${STORAGE_KEY_PREFIX}autoOpen`;
const CHAT_HISTORY_KEY = `${STORAGE_KEY_PREFIX}chatHistory`;
const HIGH_CONTRAST_KEY = `${STORAGE_KEY_PREFIX}highContrast`;
const FONT_SIZE_KEY = `${STORAGE_KEY_PREFIX}fontSize`;

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Widget visibility state
  const [isWidgetVisible, setIsWidgetVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem(WIDGET_VISIBLE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Widget open state
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  
  // Widget position
  const [widgetPosition, setWidgetPositionState] = useState<WidgetPosition>(() => {
    const saved = localStorage.getItem(WIDGET_POSITION_KEY);
    return saved !== null ? JSON.parse(saved) : 'bottom-right';
  });
  
  // Auto open on page load
  const [autoOpenOnNewPage, setAutoOpenOnNewPageState] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTO_OPEN_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Chat history
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    return saved !== null ? JSON.parse(saved) : [];
  });
  
  // Accessibility settings
  const [highContrastChat, setHighContrastChatState] = useState<boolean>(() => {
    const saved = localStorage.getItem(HIGH_CONTRAST_KEY);
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  const [chatFontSize, setChatFontSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved !== null ? JSON.parse(saved) : 100;
  });
  
  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem(WIDGET_VISIBLE_KEY, JSON.stringify(isWidgetVisible));
  }, [isWidgetVisible]);
  
  useEffect(() => {
    localStorage.setItem(WIDGET_POSITION_KEY, JSON.stringify(widgetPosition));
  }, [widgetPosition]);
  
  useEffect(() => {
    localStorage.setItem(AUTO_OPEN_KEY, JSON.stringify(autoOpenOnNewPage));
  }, [autoOpenOnNewPage]);
  
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);
  
  useEffect(() => {
    localStorage.setItem(HIGH_CONTRAST_KEY, JSON.stringify(highContrastChat));
  }, [highContrastChat]);
  
  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, JSON.stringify(chatFontSize));
  }, [chatFontSize]);
  
  // Widget visibility methods
  const showWidget = useCallback(() => setIsWidgetVisible(true), []);
  const hideWidget = useCallback(() => {
    setIsWidgetVisible(false);
    setIsWidgetOpen(false);
  }, []);
  
  // Widget open/close methods
  const openWidget = useCallback(() => setIsWidgetOpen(true), []);
  const closeWidget = useCallback(() => setIsWidgetOpen(false), []);
  
  // Widget position setter
  const setWidgetPosition = useCallback((position: WidgetPosition) => {
    setWidgetPositionState(position);
  }, []);
  
  // Auto open setter
  const setAutoOpenOnNewPage = useCallback((autoOpen: boolean) => {
    setAutoOpenOnNewPageState(autoOpen);
  }, []);
  
  // Chat history methods
  const addMessage = useCallback((message: { role: 'user' | 'assistant', content: string }) => {
    setChatHistory(prev => [...prev, message]);
  }, []);
  
  const clearChat = useCallback(() => {
    setChatHistory([]);
  }, []);
  
  // Accessibility setters
  const setHighContrastChat = useCallback((highContrast: boolean) => {
    setHighContrastChatState(highContrast);
  }, []);
  
  const setChatFontSize = useCallback((fontSize: number) => {
    setChatFontSizeState(fontSize);
  }, []);
  
  // Combine all values and methods
  const value = {
    isWidgetVisible,
    showWidget,
    hideWidget,
    
    isWidgetOpen,
    openWidget,
    closeWidget,
    
    widgetPosition,
    setWidgetPosition,
    
    autoOpenOnNewPage,
    setAutoOpenOnNewPage,
    
    chatHistory,
    addMessage,
    clearChat,
    
    highContrastChat,
    setHighContrastChat,
    chatFontSize,
    setChatFontSize,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook for using the chat context
export const useChat = () => useContext(ChatContext);

export default ChatContext;