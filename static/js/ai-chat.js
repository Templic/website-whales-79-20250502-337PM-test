/**
 * AI Chat Features JavaScript
 * 
 * This script handles all the AI chat functionality including:
 * - Loading available agents from API
 * - Displaying agent cards
 * - Chat interface for communicating with selected agents
 * - Floating chat popup for site-wide access
 */

// Store active agents and chat state
let agents = [];
let activeAgent = null;
let chatMessages = [];
let isThinking = false;

// DOM Elements
let agentCards;
let chatInterface;
let chatMessages_el;
let chatInput;
let sendMessageBtn;
let thinkingIndicator;
let chatToggle;
let chatPopup;

/**
 * Initialize AI chat functionality
 */
function initializeAIChat() {
  // Fetch agents from the API
  fetchAgents().then(() => {
    // Initialize UI elements
    initializeChatInterface();
  });
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
    agents = await response.json();
    console.log('AI Agents loaded:', agents);
    
    // Render agent cards if container exists
    if (document.getElementById('agent-cards')) {
      renderAgentCards();
    }
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
}

/**
 * Initialize the chat interface elements
 */
function initializeChatInterface() {
  // Check if we're on the AI chat page
  if (document.getElementById('ai-chat')) {
    agentCards = document.getElementById('agent-cards');
    // Initialize dedicated page elements
    initializeAgentCards();
  }
}

/**
 * Initialize floating AI chat panel
 */
function initAIChatPanel() {
  // Create chat toggle and popup if they don't exist
  if (!document.querySelector('.ai-chat-toggle')) {
    createChatControls();
  }
  
  // Fetch agents if not already loaded
  if (agents.length === 0) {
    fetchAgents();
  }
}

/**
 * Toggle chat popup visibility
 */
function toggleChatPopup() {
  chatPopup.classList.toggle('open');
  
  // Update button icon based on state
  if (chatPopup.classList.contains('open')) {
    chatToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    chatToggle.setAttribute('aria-label', 'Close chat');
  } else {
    chatToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    chatToggle.setAttribute('aria-label', 'Open chat');
  }
}

/**
 * Initialize agent selection cards
 */
function initializeAgentCards() {
  // If agent cards don't exist in the floating panel, create them
  if (chatPopup && !chatPopup.querySelector('.agent-cards')) {
    const agentCardsContainer = document.createElement('div');
    agentCardsContainer.className = 'agent-cards';
    agentCardsContainer.style.padding = '1rem';
    agentCardsContainer.style.overflowY = 'auto';
    
    chatPopup.appendChild(agentCardsContainer);
    agentCards = agentCardsContainer;
  }
  
  // Render agent cards
  renderAgentCards();
}

/**
 * Render agent cards in the container
 */
function renderAgentCards() {
  // Skip if agents haven't been loaded yet or no container exists
  if (!agents.length || !agentCards) return;
  
  // Clear existing cards
  agentCards.innerHTML = '';
  
  // Add agent cards
  agents.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.innerHTML = `
      <div class="agent-card-header">
        <div class="agent-avatar">
          <img src="${agent.avatar}" alt="${agent.name}">
        </div>
        <div class="agent-info">
          <h3>${agent.name}</h3>
          <span class="agent-status ${agent.status}">${agent.status}</span>
        </div>
      </div>
      <div class="agent-card-body">
        <p>${agent.description}</p>
        <div class="agent-tags">
          ${agent.tags.map(tag => `<span class="agent-tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="agent-card-footer">
        <button class="chat-with-btn" data-agent-id="${agent.id}">
          Chat with ${agent.name}
        </button>
      </div>
    `;
    
    agentCards.appendChild(card);
    
    // Add click handler to the button
    const chatButton = card.querySelector('.chat-with-btn');
    chatButton.addEventListener('click', () => activateAgent(agent.id));
  });
}

/**
 * Activate an agent for chatting
 */
function activateAgent(agentId) {
  // Find the selected agent
  activeAgent = agents.find(agent => agent.id === agentId);
  
  if (!activeAgent) {
    console.error('Agent not found:', agentId);
    return;
  }
  
  console.log('Activating agent:', activeAgent);
  
  // Reset chat messages
  chatMessages = [];
  
  // Get or create the chat interface container
  let chatInterfaceContainer;
  
  if (document.getElementById('chat-interface-container')) {
    // We're on the dedicated chat page
    chatInterfaceContainer = document.getElementById('chat-interface-container');
    chatInterfaceContainer.innerHTML = '';
  } else if (chatPopup) {
    // We're using the floating chat
    chatPopup.innerHTML = '';
    chatInterfaceContainer = chatPopup;
  } else {
    console.error('No chat interface container found');
    return;
  }
  
  // Create chat interface
  chatInterface = document.createElement('div');
  chatInterface.className = 'chat-interface';
  
  // Create header
  const chatHeader = document.createElement('div');
  chatHeader.className = 'chat-header';
  chatHeader.innerHTML = `
    <div class="agent-avatar">
      <img src="${activeAgent.avatar}" alt="${activeAgent.name}">
    </div>
    <div class="agent-info">
      <h3>${activeAgent.name}</h3>
      <span class="agent-status ${activeAgent.status}">${activeAgent.status}</span>
    </div>
    <button class="close-chat" aria-label="Close chat">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;
  
  // Create messages container
  chatMessages_el = document.createElement('div');
  chatMessages_el.className = 'chat-messages';
  
  // Create thinking indicator
  thinkingIndicator = document.createElement('div');
  thinkingIndicator.className = 'thinking-indicator';
  thinkingIndicator.style.display = 'none';
  thinkingIndicator.innerHTML = `
    <div class="thinking-dot"></div>
    <div class="thinking-dot"></div>
    <div class="thinking-dot"></div>
  `;
  chatMessages_el.appendChild(thinkingIndicator);
  
  // Create input container
  const chatInputContainer = document.createElement('div');
  chatInputContainer.className = 'chat-input-container';
  
  chatInput = document.createElement('input');
  chatInput.type = 'text';
  chatInput.className = 'chat-input';
  chatInput.placeholder = 'Type your message...';
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isThinking) {
      sendMessage();
    }
  });
  
  sendMessageBtn = document.createElement('button');
  sendMessageBtn.className = 'send-message-btn';
  sendMessageBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  `;
  sendMessageBtn.addEventListener('click', sendMessage);
  
  chatInputContainer.appendChild(chatInput);
  chatInputContainer.appendChild(sendMessageBtn);
  
  // Assemble the chat interface
  chatInterface.appendChild(chatHeader);
  chatInterface.appendChild(chatMessages_el);
  chatInterface.appendChild(chatInputContainer);
  
  // Add the chat interface to the container
  chatInterfaceContainer.appendChild(chatInterface);
  
  // Add event listener to close button
  chatInterface.querySelector('.close-chat').addEventListener('click', () => {
    if (chatPopup) {
      // If it's the floating chat, go back to agent selection
      chatPopup.innerHTML = '';
      initializeAgentCards();
    } else {
      // If it's the dedicated page, show "no agent selected" message
      chatInterfaceContainer.innerHTML = `
        <div class="no-agent-selected">
          <h2>Choose an AI Agent to Chat With</h2>
          <p>Select one of the AI agents to start a conversation.</p>
        </div>
      `;
    }
    
    // Reset active agent
    activeAgent = null;
  });
  
  // Add welcome message
  addAgentMessage(getWelcomeMessage(activeAgent));
  
  // Focus the input
  chatInput.focus();
}

/**
 * Update the chat header with active agent info
 */
function updateChatHeader() {
  if (!activeAgent || !chatInterface) return;
  
  const header = chatInterface.querySelector('.chat-header');
  if (header) {
    header.querySelector('.agent-info h3').textContent = activeAgent.name;
    header.querySelector('.agent-status').textContent = activeAgent.status;
    header.querySelector('.agent-status').className = `agent-status ${activeAgent.status}`;
    header.querySelector('.agent-avatar img').src = activeAgent.avatar;
  }
}

/**
 * Clear the chat messages container
 */
function clearChatMessages() {
  if (chatMessages_el) {
    chatMessages_el.innerHTML = '';
    
    // Re-add thinking indicator
    chatMessages_el.appendChild(thinkingIndicator);
  }
}

/**
 * Get agent welcome message
 */
function getWelcomeMessage(agent) {
  const welcomeMessages = {
    'cosmic-guide': "Greetings, cosmic traveler. I am your Cosmic Guide, here to illuminate your path through the universe of Dale's music and spiritual teachings. How may I assist your journey today?",
    'harmonic-helper': "Welcome to a space of healing frequencies. I'm your Harmonic Helper, ready to assist with sound healing, frequency attunement, and musical therapy questions. How can I harmonize your experience today?",
    'wisdom-keeper': "I am the Wisdom Keeper, guardian of ancient knowledge and cosmic insights. The universal consciousness flows through our conversation. What wisdom do you seek today?",
    'shop-oracle': "Welcome! I'm the Shop Oracle, your personal guide to discovering the perfect items for your spiritual journey. Whether you seek instruments, sound tools, or cosmic artifacts, I can help you find what resonates. What are you looking for?"
  };
  
  return welcomeMessages[agent.id] || `Hello, I'm ${agent.name}. How can I help you today?`;
}

/**
 * Add a message from the agent to the chat
 */
function addAgentMessage(message) {
  if (!chatMessages_el) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'message agent';
  messageEl.innerHTML = `
    ${message}
    <div class="message-time">${getFormattedTime()}</div>
  `;
  
  // Add to DOM
  chatMessages_el.insertBefore(messageEl, thinkingIndicator);
  
  // Add to messages array
  chatMessages.push({
    sender: 'agent',
    message: message,
    timestamp: new Date()
  });
  
  // Scroll to bottom
  chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
}

/**
 * Add a message from the user to the chat
 */
function addUserMessage(message) {
  if (!chatMessages_el) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = 'message user';
  messageEl.innerHTML = `
    ${message}
    <div class="message-time">${getFormattedTime()}</div>
  `;
  
  // Add to DOM
  chatMessages_el.insertBefore(messageEl, thinkingIndicator);
  
  // Add to messages array
  chatMessages.push({
    sender: 'user',
    message: message,
    timestamp: new Date()
  });
  
  // Scroll to bottom
  chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
}

/**
 * Show thinking indicator
 */
function showThinking() {
  if (!thinkingIndicator) return;
  
  isThinking = true;
  thinkingIndicator.style.display = 'flex';
  if (sendMessageBtn) sendMessageBtn.disabled = true;
  if (chatInput) chatInput.disabled = true;
  
  // Scroll to bottom
  chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
}

/**
 * Hide thinking indicator
 */
function hideThinking() {
  if (!thinkingIndicator) return;
  
  isThinking = false;
  thinkingIndicator.style.display = 'none';
  if (sendMessageBtn) sendMessageBtn.disabled = false;
  if (chatInput) chatInput.disabled = false;
}

/**
 * Get formatted time for messages
 */
function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Send a message to the active agent
 */
async function sendMessage() {
  if (!activeAgent || !chatInput || isThinking) return;
  
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Clear input
  chatInput.value = '';
  
  // Add user message to chat
  addUserMessage(message);
  
  // Show thinking indicator
  showThinking();
  
  try {
    // Send message to API
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentId: activeAgent.id,
        message: message,
        timestamp: getFormattedTime()
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    const data = await response.json();
    
    // Add agent response to chat
    setTimeout(() => {
      hideThinking();
      addAgentMessage(data.message);
    }, 1000); // Simulated delay for natural feeling
  } catch (error) {
    console.error('Error sending message:', error);
    hideThinking();
    addAgentMessage("I'm sorry, there was an error processing your request. Please try again.");
  }
}

/**
 * Update dedicated chat interface if exists
 */
function updateDedicatedChatInterface() {
  // For future implementation if needed
}

/**
 * Create chat toggle and popup if they don't exist
 */
function createChatControls() {
  // Create toggle button
  chatToggle = document.createElement('button');
  chatToggle.className = 'ai-chat-toggle';
  chatToggle.setAttribute('aria-label', 'Open chat');
  chatToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  
  // Create popup container
  chatPopup = document.createElement('div');
  chatPopup.className = 'ai-chat-popup ai-chat-container';
  
  // Add to body
  document.body.appendChild(chatToggle);
  document.body.appendChild(chatPopup);
  
  // Add event listener
  chatToggle.addEventListener('click', toggleChatPopup);
  
  // Initialize agent cards for selection
  initializeAgentCards();
}

// Initialize chat on page load if on the chat page
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('ai-chat')) {
    initializeAIChat();
  }
});

// Export init function for the floating panel
window.initAIChatPanel = initAIChatPanel;