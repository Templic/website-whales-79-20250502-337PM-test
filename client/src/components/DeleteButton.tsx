
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface DeleteButtonProps {
  trackId: number;
  onDelete: () => void;
}

export default function DeleteButton({ trackId, onDelete }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this track?")) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      onDelete();
      toast({
        title: "Success",
        description: "Track deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
