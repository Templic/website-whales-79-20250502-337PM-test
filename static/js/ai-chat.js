/**
 * AI Chat Interface Script
 * Handles all AI chat functionality
 */

// State management for AI chat
const chatState = {
  activeAgent: null,
  messages: [],
  agents: [],
  isThinking: false,
  chatVisible: false
};

// DOM Elements
let chatToggle, chatPopup, chatMessages, chatInput, sendButton;

// Initialize once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAIChat();
});

/**
 * Initialize AI chat functionality
 */
function initializeAIChat() {
  // Load agents from API
  fetchAgents();
  
  // Initialize chat interface elements
  initializeChatInterface();
  
  // Initialize agent selection cards on dedicated page
  initializeAgentCards();
}

/**
 * Fetch available AI agents from API
 */
async function fetchAgents() {
  try {
    const response = await fetch('/api/ai-agents');
    if (!response.ok) {
      throw new Error('Failed to fetch agents');
    }
    
    chatState.agents = await response.json();
    
    // Initialize agent cards once we have the data
    renderAgentCards();
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
}

/**
 * Initialize the chat interface elements
 */
function initializeChatInterface() {
  // Initialize chat toggle if it exists
  chatToggle = document.getElementById('chat-toggle');
  chatPopup = document.getElementById('chat-popup');
  
  if (chatToggle && chatPopup) {
    chatToggle.addEventListener('click', toggleChatPopup);
    
    // Close chat when clicking outside
    document.addEventListener('click', (event) => {
      if (chatPopup && 
          chatPopup.classList.contains('visible') && 
          !chatPopup.contains(event.target) && 
          event.target !== chatToggle) {
        chatPopup.classList.remove('visible');
        chatState.chatVisible = false;
      }
    });
    
    // Initialize chat elements
    chatMessages = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input');
    sendButton = document.getElementById('send-message');
    
    if (chatInput && sendButton) {
      // Send message on button click
      sendButton.addEventListener('click', sendMessage);
      
      // Send message on Enter key
      chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendMessage();
        }
      });
      
      // Enable/disable send button based on input
      chatInput.addEventListener('input', () => {
        sendButton.disabled = !chatInput.value.trim() || chatState.isThinking;
      });
    }
    
    // Initialize chat close button
    const closeButton = document.getElementById('close-chat');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        chatPopup.classList.remove('visible');
        chatState.chatVisible = false;
      });
    }
  }
}

/**
 * Toggle chat popup visibility
 */
function toggleChatPopup() {
  if (chatPopup) {
    chatPopup.classList.toggle('visible');
    chatState.chatVisible = chatPopup.classList.contains('visible');
    
    // Focus input when visible
    if (chatState.chatVisible && chatInput) {
      setTimeout(() => chatInput.focus(), 300);
    }
  }
}

/**
 * Initialize agent selection cards
 */
function initializeAgentCards() {
  const agentCardsContainer = document.getElementById('agent-cards');
  if (agentCardsContainer) {
    renderAgentCards();
  }
}

/**
 * Render agent cards in the container
 */
function renderAgentCards() {
  const agentCardsContainer = document.getElementById('agent-cards');
  if (!agentCardsContainer || chatState.agents.length === 0) return;
  
  // Clear existing cards
  agentCardsContainer.innerHTML = '';
  
  // Add each agent card
  chatState.agents.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
      <div class="agent-card-header">
        <div class="agent-avatar">
          <img src="${agent.avatar}" alt="${agent.name}">
        </div>
        <div class="agent-info">
          <h3>${agent.name}</h3>
          <span class="agent-status ${agent.status}">${agent.status === 'available' ? 'Available' : 'Unavailable'}</span>
        </div>
      </div>
      <div class="agent-card-body">
        <p>${agent.description}</p>
        <div class="agent-tags">
          ${agent.tags.map(tag => `<span class="agent-tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="agent-card-footer">
        <button class="chat-with-btn" data-agent-id="${agent.id}" ${agent.status !== 'available' ? 'disabled' : ''}>
          Chat with ${agent.name}
        </button>
      </div>
    `;
    
    agentCardsContainer.appendChild(card);
    
    // Add event listener to button
    const chatButton = card.querySelector('.chat-with-btn');
    if (chatButton) {
      chatButton.addEventListener('click', () => {
        activateAgent(agent.id);
        
        // If on a dedicated page, scroll to chat interface
        const chatInterface = document.getElementById('chat-interface');
        if (chatInterface) {
          chatInterface.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });
}

/**
 * Activate an agent for chatting
 */
function activateAgent(agentId) {
  const agent = chatState.agents.find(a => a.id === agentId);
  if (!agent) return;
  
  chatState.activeAgent = agent;
  chatState.messages = [];
  
  // Update chat interface
  updateChatHeader();
  clearChatMessages();
  
  // Add welcome message
  const welcomeMessage = getWelcomeMessage(agent);
  addAgentMessage(welcomeMessage);
  
  // Show chat popup if it exists
  if (chatPopup) {
    chatPopup.classList.add('visible');
    chatState.chatVisible = true;
    
    // Focus input
    if (chatInput) {
      setTimeout(() => chatInput.focus(), 300);
    }
  }
  
  // Update chat interface on dedicated page if it exists
  updateDedicatedChatInterface();
}

/**
 * Update the chat header with active agent info
 */
function updateChatHeader() {
  const headerInfo = document.getElementById('chat-header-info');
  const headerAvatar = document.getElementById('chat-header-avatar');
  
  if (headerInfo && chatState.activeAgent) {
    headerInfo.innerHTML = `
      <h3>${chatState.activeAgent.name}</h3>
      <p>${chatState.activeAgent.status === 'available' ? 'Available' : 'Unavailable'}</p>
    `;
  }
  
  if (headerAvatar && chatState.activeAgent) {
    headerAvatar.innerHTML = `
      <img src="${chatState.activeAgent.avatar}" alt="${chatState.activeAgent.name}">
    `;
  }
}

/**
 * Clear the chat messages container
 */
function clearChatMessages() {
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
}

/**
 * Get agent welcome message
 */
function getWelcomeMessage(agent) {
  switch (agent.id) {
    case 'cosmic-guide':
      return "Greetings, cosmic traveler. I am your Cosmic Guide, ready to assist you on your spiritual journey. How may I guide you today?";
    case 'harmonic-helper':
      return "Welcome to the world of sound healing. I'm your Harmonic Helper, and I'm here to help you discover the perfect frequencies for your journey. What can I assist you with?";
    case 'wisdom-keeper':
      return "I am the Wisdom Keeper, guardian of ancient knowledge and philosophical insights. Ask me about life's deepest questions, and I shall share what the ancients knew.";
    case 'shop-oracle':
      return "Welcome to the cosmic marketplace! I'm your Shop Oracle, here to guide you to the perfect products for your spiritual practice. What are you looking for today?";
    default:
      return `Hello, I'm ${agent.name}. How can I assist you today?`;
  }
}

/**
 * Add a message from the agent to the chat
 */
function addAgentMessage(message) {
  if (!chatMessages) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'message agent';
  messageEl.innerText = message;
  
  // Add timestamp
  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.innerText = getFormattedTime();
  messageEl.appendChild(timeEl);
  
  chatMessages.appendChild(messageEl);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store message
  chatState.messages.push({
    role: 'agent',
    content: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Add a message from the user to the chat
 */
function addUserMessage(message) {
  if (!chatMessages) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'message user';
  messageEl.innerText = message;
  
  // Add timestamp
  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.innerText = getFormattedTime();
  messageEl.appendChild(timeEl);
  
  chatMessages.appendChild(messageEl);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Store message
  chatState.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Show thinking indicator
 */
function showThinking() {
  if (!chatMessages) return;
  
  const thinkingEl = document.createElement('div');
  thinkingEl.className = 'message agent thinking';
  thinkingEl.id = 'thinking-indicator';
  thinkingEl.innerHTML = `
    <div class="thinking-dots">
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    </div>
  `;
  
  chatMessages.appendChild(thinkingEl);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Update state
  chatState.isThinking = true;
  
  // Disable input while thinking
  if (sendButton) {
    sendButton.disabled = true;
  }
}

/**
 * Hide thinking indicator
 */
function hideThinking() {
  const thinkingEl = document.getElementById('thinking-indicator');
  if (thinkingEl) {
    thinkingEl.remove();
  }
  
  // Update state
  chatState.isThinking = false;
  
  // Re-enable send button if there's text
  if (sendButton && chatInput) {
    sendButton.disabled = !chatInput.value.trim();
  }
}

/**
 * Get formatted time for messages
 */
function getFormattedTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Send a message to the active agent
 */
async function sendMessage() {
  if (!chatInput || !chatState.activeAgent || chatState.isThinking) return;
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Clear input
  chatInput.value = '';
  
  // Add user message to chat
  addUserMessage(message);
  
  // Show thinking indicator
  showThinking();
  
  try {
    // Send message to server
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: chatState.activeAgent.id,
        message: message,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    const data = await response.json();
    
    // Short delay for more natural conversation
    setTimeout(() => {
      // Hide thinking indicator
      hideThinking();
      
      // Add agent response to chat
      addAgentMessage(data.message);
    }, 1500);
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Hide thinking indicator
    hideThinking();
    
    // Add error message
    addAgentMessage("I'm sorry, I'm having trouble connecting. Please try again later.");
  }
}

/**
 * Update dedicated chat interface if exists
 */
function updateDedicatedChatInterface() {
  const chatInterfaceContainer = document.getElementById('chat-interface-container');
  if (!chatInterfaceContainer) return;
  
  // If no active agent, show agent selection
  if (!chatState.activeAgent) {
    chatInterfaceContainer.innerHTML = `
      <div class="no-agent-selected">
        <h2>Choose an AI Agent to Chat With</h2>
        <p>Select one of the AI agents above to start a conversation.</p>
      </div>
    `;
    return;
  }
  
  // If active agent, show chat interface
  chatInterfaceContainer.innerHTML = `
    <div class="chat-interface" id="chat-interface">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-header-avatar" id="chat-header-avatar">
            <img src="${chatState.activeAgent.avatar}" alt="${chatState.activeAgent.name}">
          </div>
          <div class="chat-header-info" id="chat-header-info">
            <h3>${chatState.activeAgent.name}</h3>
            <p>${chatState.activeAgent.status === 'available' ? 'Available' : 'Unavailable'}</p>
          </div>
        </div>
        <button class="chat-close-btn" id="close-chat-interface">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-input" 
          placeholder="Type your message..." 
          aria-label="Type your message">
        <button class="send-btn" id="send-message" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Reinitialize chat elements
  chatMessages = document.getElementById('chat-messages');
  chatInput = document.getElementById('chat-input');
  sendButton = document.getElementById('send-message');
  
  // Add event listeners
  sendButton.addEventListener('click', sendMessage);
  
  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
  
  chatInput.addEventListener('input', () => {
    sendButton.disabled = !chatInput.value.trim() || chatState.isThinking;
  });
  
  const closeButton = document.getElementById('close-chat-interface');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      chatState.activeAgent = null;
      updateDedicatedChatInterface();
    });
  }
  
  // Add welcome message
  const welcomeMessage = getWelcomeMessage(chatState.activeAgent);
  addAgentMessage(welcomeMessage);
  
  // Focus input
  if (chatInput) {
    setTimeout(() => chatInput.focus(), 300);
  }
}

/**
 * Create chat toggle and popup if they don't exist
 */
function createChatControls() {
  if (!document.getElementById('chat-toggle')) {
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.id = 'chat-toggle';
    toggle.className = 'chat-toggle';
    toggle.setAttribute('aria-label', 'Open AI chat');
    toggle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"></path>
        <path d="M7 9h10M7 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      </svg>
    `;
    document.body.appendChild(toggle);
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'chat-popup';
    popup.className = 'chat-popup';
    popup.innerHTML = `
      <div class="chat-interface">
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="chat-header-avatar" id="chat-header-avatar">
              <img src="/static/images/agents/cosmic-guide.svg" alt="AI Assistant">
            </div>
            <div class="chat-header-info" id="chat-header-info">
              <h3>AI Assistant</h3>
              <p>Available</p>
            </div>
          </div>
          <button class="chat-close-btn" id="close-chat">&times;</button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input" 
            placeholder="Type your message..." 
            aria-label="Type your message">
          <button class="send-btn" id="send-message" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    
    // Initialize the chat
    initializeAIChat();
    
    // Activate default agent
    setTimeout(() => {
      if (chatState.agents.length > 0) {
        activateAgent('cosmic-guide');
      }
    }, 1000);
  }
}

// Add function to initialize the floating chat panel
window.initAIChatPanel = createChatControls;