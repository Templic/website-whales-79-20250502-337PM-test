import { useState, useEffect } from 'react';
import { SecureWebSocket, WebSocketMessage } from '../utils/secureWebSocket';

/**
 * Example React component that demonstrates using the secure WebSocket client
 */
const WebSocketExample = () => {
  const [socket, setSocket] = useState<SecureWebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize WebSocket connection on component mount
  useEffect(() => {
    // Get authentication token from your auth system
    const authToken = localStorage.getItem('auth_token') || 'demo_token';
    
    const secureSocket = new SecureWebSocket({
      url: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
      authToken,
      debug: true,
      onOpen: () => {
        setConnected(true);
        setError(null);
      },
      onClose: () => {
        setConnected(false);
      },
      onError: (e) => {
        setError(`WebSocket error: ${e.type}`);
      },
      onMessage: (message) => {
        // Add received message to the messages array
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });
    
    setSocket(secureSocket);
    
    // Clean up on unmount
    return () => {
      if (secureSocket) {
        secureSocket.close();
      }
    };
  }, []);
  
  // Send a test message
  const sendMessage = async () => {
    if (!socket || !connected) {
      setError('Socket not connected');
      return;
    }
    
    try {
      await socket.send({
        type: 'file_upload',
        payload: { 
          message: inputMessage || 'Test message',
          timestamp: Date.now()
        }
      });
      
      setInputMessage('');
      setError(null);
    } catch (err: unknown) {
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Secure WebSocket Demo</h2>
      
      {/* Connection status */}
      <div className="mb-4 flex items-center">
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
        />
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="p-2 mb-4 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
      
      {/* Message input */}
      <div className="flex mb-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Enter message"
          className="flex-1 px-3 py-2 border rounded-l"
          disabled={!connected}
        />
        <button
          onClick={sendMessage}
          disabled={!connected}
          className="px-4 py-2 bg-blue-500 text-white rounded-r disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
      
      {/* Messages display */}
      <div className="border rounded p-2 h-60 overflow-y-auto">
        <h3 className="font-semibold mb-2">Messages:</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet</p>
        ) : (
          <ul className="space-y-2">
            {messages.map((msg, index) => (
              <li key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-semibold">{msg.type}</div>
                <div className="text-xs text-gray-500">
                  {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                </div>
                <pre className="mt-1 text-xs overflow-x-auto">
                  {typeof msg.payload === 'object' 
                    ? JSON.stringify(msg.payload, null, 2) 
                    : msg.payload
                  }
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WebSocketExample;