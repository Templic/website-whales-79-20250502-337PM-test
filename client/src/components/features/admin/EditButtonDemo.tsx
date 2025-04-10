/**
 * EditButtonDemo.tsx
 * 
 * Component Type: feature/admin
 * A demonstration of how to use the EditButton component with different types of content.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditButton } from "./EditButton";
import { Modal } from "./Modal";

interface ContentItem {
  id: number;
  title: string;
  description: string;
  image?: string;
}

export const EditButtonDemo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<ContentItem | null>(null);
  
  // Example content items
  const contentItems: ContentItem[] = [
    {
      id: 1,
      title: "Cosmic Journey Album",
      description: "Our flagship album featuring transcendent sounds and vibrations.",
      image: "/images/albums/cosmic-journey.jpg"
    },
    {
      id: 2,
      title: "Meditation Series",
      description: "A collection of guided meditations with binaural beats.",
      image: "/images/collections/meditation-series.jpg"
    },
    {
      id: 3,
      title: "Live Events",
      description: "Upcoming concerts and spiritual gatherings around the world.",
    }
  ];
  
  // Handle the edit action when an edit button is clicked
  const handleEdit = (contentId: string | number) => {
    const itemToEdit = contentItems.find(item => item.id === contentId);
    if (itemToEdit) {
      setCurrentEditItem(itemToEdit);
      setIsEditing(true);
    }
  };
  
  // Close the modal
  const handleCloseModal = () => {
    setIsEditing(false);
    setCurrentEditItem(null);
  };
  
  return (
    <div className="edit-button-demo p-6">
      <h2 className="text-2xl font-bold mb-6">Content Management Examples</h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contentItems.map(item => (
          <Card key={item.id} className="relative overflow-hidden group">
            {/* Position the edit button in the top-right corner */}
            <div className="absolute top-2 right-2 z-10">
              <EditButton 
                contentId={item.id} 
                onEdit={handleEdit}
                variant="stardust"
              />
            </div>
            
            {item.image && (
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="object-cover w-full h-full"
                />
                
                {/* An alternative: position the edit button over the image */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <EditButton 
                    contentId={item.id} 
                    onEdit={handleEdit}
                    variant="cosmic"
                    text="Edit Image"
                    iconOnly={false}
                  />
                </div>
              </div>
            )}
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center justify-between">
                {item.title}
                {/* Position the edit button next to the title */}
                <EditButton 
                  contentId={item.id} 
                  onEdit={handleEdit}
                  variant="ghost"
                  className="ml-2"
                />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative">
              <p>{item.description}</p>
              {/* Position the edit button next to the description */}
              <div className="flex justify-end mt-2">
                <EditButton 
                  contentId={item.id} 
                  onEdit={handleEdit}
                  variant="nebula"
                  text="Edit Content"
                  iconOnly={false}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Modal for editing content (implementation depends on your modal component) */}
      {isEditing && currentEditItem && (
        <Modal
          title={`Edit ${currentEditItem.title}`}
          onClose={handleCloseModal}
        >
          <div className="p-4">
            <p>Here you would place your edit form for item ID: {currentEditItem.id}</p>
            <p>This is just a demonstration of how to position and use the EditButton.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EditButtonDemo;