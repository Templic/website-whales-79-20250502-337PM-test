
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ChatMessage from "./ChatMessage";
import RoomParticipants from "./RoomParticipants";
import { RoomMessage, RoomParticipant } from "./types";
import { SacredGeometry } from "@/components/ui/sacred-geometry";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatRoomProps {
  username: string;
  roomId: string;
  messages: RoomMessage[];
  participants: RoomParticipant[];
  onSendMessage: (message: string) => void;
  onProductView?: (productId: string) => void;
}

const ChatRoom = ({ 
  username, 
  roomId, 
  messages, 
  participants, 
  onSendMessage,
  onProductView 
}: ChatRoomProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    onSendMessage(inputMessage);
    setInputMessage("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    toast({
      title: "Room ID copied",
      description: "Share this with friends to shop together!",
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <SacredGeometry variant="torus" intensity="subtle" className="flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Room: #{roomId}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={copyRoomId}
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        
        <RoomParticipants participants={participants} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            currentUsername={username}
            onProductView={onProductView}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-2">
        <form 
          onSubmit={handleSendMessage}
          className="flex items-center gap-2"
        >
          <Input 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isMobile ? "Type message..." : "Type a message or 'check out product 1'..."}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="bg-cosmic-primary hover:bg-cosmic-vivid">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </SacredGeometry>
  );
};

export default ChatRoom;
