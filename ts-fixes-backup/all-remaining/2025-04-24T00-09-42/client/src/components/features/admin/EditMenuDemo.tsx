/**
 * EditMenuDemo.tsx
 * 
 * Component for demonstrating the EditMenu functionality
 */
import React, { useState } from 'react';
import { Edit, MoreHorizontal, Copy, Trash, Share } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface EditMenuProps {
  id: string | number;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
  disabled?: boolean;
  align?: 'start' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

// Edit Menu Component
const EditMenu: React.FC<EditMenuProps> = ({
  id,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  disabled = false,
  align = 'end',
  side = 'bottom'
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side}>
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}
        {onShare && (
          <DropdownMenuItem onClick={onShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Demo component for EditMenu
const EditMenuDemo: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([
    { id: 1, title: 'Meditation Guide', description: 'Beginner\'s guide to meditation practices' },
    { id: 2, title: 'Sound Healing Techniques', description: 'Explore the healing power of sound frequencies' },
    { id: 3, title: 'Cosmic Connection Ritual', description: 'A ritual to connect with cosmic energies' },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEdit = (id: number) => {
    setEditingId(id);
    toast({
      title: 'Edit Initiated',
      description: `Editing item #${id}`,
    });
  };

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: 'Item Deleted',
      description: `Item #${id} has been removed`,
      variant: 'destructive',
    });
  };

  const handleDuplicate = (id: number) => {
    const itemToDuplicate = items.find(item => item.id === id);
    if (itemToDuplicate) {
      const newId = Math.max(...items.map(item => item.id)) + 1;
      const newItem = {
        ...itemToDuplicate,
        id: newId,
        title: `${itemToDuplicate.title} (Copy)`,
      };
      setItems([...items, newItem]);
      toast({
        title: 'Item Duplicated',
        description: `Created a copy of item #${id}`,
      });
    }
  };

  const handleShare = (id: number) => {
    toast({
      title: 'Share Options',
      description: `Share dialog for item #${id} would appear here`,
    });
  };

  const finishEditing = () => {
    setEditingId(null);
    toast({
      title: 'Changes Saved',
      description: 'Your edits have been saved',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Menu Demo</CardTitle>
          <CardDescription>
            A demonstration of the EditMenu component which provides a consistent interface for item actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map(item => (
              <Card key={item.id}>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <EditMenu
                      id={item.id}
                      onEdit={() => handleEdit(item.id)}
                      onDelete={() => handleDelete(item.id)}
                      onDuplicate={() => handleDuplicate(item.id)}
                      onShare={() => handleShare(item.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {editingId === item.id ? (
                    <div className="space-y-4">
                      <textarea
                        className="w-full p-2 border rounded-md"
                        defaultValue={item.description}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button onClick={finishEditing}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p>{item.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t p-4 text-sm text-muted-foreground">
          <p>
            The EditMenu component provides a consistent user interface for common actions like 
            editing, deleting, duplicating, and sharing. It uses the Dropdown component from shadcn/ui.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EditMenuDemo;