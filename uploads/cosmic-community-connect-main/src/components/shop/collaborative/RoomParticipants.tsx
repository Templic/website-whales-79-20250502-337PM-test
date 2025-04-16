
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoomParticipant } from "./types";

interface RoomParticipantsProps {
  participants: RoomParticipant[];
}

const RoomParticipants = ({ participants }: RoomParticipantsProps) => {
  return (
    <div className="flex -space-x-2">
      {participants.map((participant) => (
        <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
          <AvatarImage src={participant.avatar} alt={participant.username} />
          <AvatarFallback>{participant.username.substring(0, 2)}</AvatarFallback>
        </Avatar>
      ))}
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
        {participants.length}
      </div>
    </div>
  );
};

export default RoomParticipants;
