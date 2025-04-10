/**
 * EditButtonDemo.tsx
 * 
 * Component Type: feature/admin
 * A demonstration of how to use the EditButton component with different types of content.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditButton } from "./EditButton";
import { Modal } from "@/components/features/admin/Modal"; // Use the Modal component for editing content
import "./admin.css"; // Import the admin styles

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
  
  // Example text content for demonstrating inline editing
  const paragraphs = [
    { id: "p1", content: "Welcome to our cosmic music experience, where sound meets spirituality." },
    { id: "p2", content: "Our artists craft unique sonic journeys to elevate your consciousness." },
    { id: "p3", content: "Join our community of seekers on the path to audio enlightenment." }
  ];
  
  // Handle the edit action when an edit button is clicked
  const handleEdit = (contentId: string | number) => {
    // For paragraphs (string IDs)
    if (typeof contentId === 'string') {
      const paragraph = paragraphs.find(p => p.id === contentId);
      if (paragraph) {
        setCurrentEditItem({
          id: parseInt(contentId.replace('p', '')),
          title: `Edit Paragraph`,
          description: paragraph.content
        });
        setIsEditing(true);
      }
      return;
    }
    
    // For content items (number IDs)
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
      <h2 className="text-2xl font-bold mb-6">Edit Button Positioning Examples</h2>
      
      <Tabs defaultValue="cards" className="mb-10">
        <TabsList className="mb-6">
          <TabsTrigger value="cards">Card Layout</TabsTrigger>
          <TabsTrigger value="text">Text Content</TabsTrigger>
          <TabsTrigger value="images">Image Content</TabsTrigger>
          <TabsTrigger value="mixed">Mixed Content</TabsTrigger>
        </TabsList>
        
        {/* Card Layout Example */}
        <TabsContent value="cards">
          <h3 className="text-xl font-semibold mb-4">Card Layout with Edit Buttons</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contentItems.map(item => (
              <Card key={item.id} className="relative overflow-hidden group">
                {/* Position the edit button in the top-right corner */}
                <div className="edit-button-absolute edit-button-top-right">
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
                    
                    {/* Position the edit button over the image, visible on hover */}
                    <div className="edit-button-absolute edit-button-bottom-right edit-button-hover-reveal">
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
                  <CardTitle className="edit-button-row">
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
                  {/* Position the edit button below the description */}
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
        </TabsContent>
        
        {/* Text Content Example */}
        <TabsContent value="text">
          <h3 className="text-xl font-semibold mb-4">Text Content with Edit Buttons</h3>
          <div className="space-y-6 max-w-2xl">
            {paragraphs.map(paragraph => (
              <div key={paragraph.id} className="editable-content-block p-4 border border-[#00ebd6]/20 rounded-md bg-[#030110]/60">
                <div className="edit-button-panel">
                  <EditButton 
                    contentId={paragraph.id} 
                    onEdit={handleEdit}
                    variant="ghost"
                    size="sm"
                  />
                </div>
                
                <p className="text-with-edit mb-0">
                  {paragraph.content}
                  <span className="edit-button-inline">
                    <EditButton 
                      contentId={paragraph.id} 
                      onEdit={handleEdit}
                      variant="ghost"
                      size="sm"
                    />
                  </span>
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Image Content Example */}
        <TabsContent value="images">
          <h3 className="text-xl font-semibold mb-4">Image Content with Edit Buttons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentItems.filter(item => item.image).map(item => (
              <div key={item.id} className="image-with-edit">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <EditButton 
                  contentId={item.id} 
                  onEdit={handleEdit}
                  variant="cosmic"
                  text="Edit"
                  iconOnly={false}
                />
              </div>
            ))}
          </div>
        </TabsContent>
        
        {/* Mixed Content Example */}
        <TabsContent value="mixed">
          <h3 className="text-xl font-semibold mb-4">Mixed Content with Edit Buttons</h3>
          <div className="space-y-8">
            {/* Section header with edit button */}
            <div className="edit-button-row border-b border-[#00ebd6]/20 pb-2">
              <h4 className="text-lg font-medium">Featured Content</h4>
              <EditButton 
                contentId="section-header" 
                onEdit={handleEdit}
                variant="ghost"
                size="sm"
              />
            </div>
            
            {/* Content block with multiple edit options */}
            <div className="edit-button-container bg-[#030110]/60 p-4 rounded-lg border border-[#00ebd6]/20">
              <div className="edit-button-panel">
                <EditButton 
                  contentId="section-1" 
                  onEdit={handleEdit}
                  variant="ghost"
                  size="sm"
                  text="Edit Section"
                  iconOnly={false}
                />
              </div>
              
              <h5 className="text-lg font-medium mb-2 flex items-center">
                Cosmic Experience
                <span className="ml-2">
                  <EditButton 
                    contentId="section-1-title" 
                    onEdit={handleEdit}
                    variant="ghost"
                    size="sm"
                  />
                </span>
              </h5>
              
              <p className="mb-4">
                Experience the cosmic journey through sound and vibration.
                <span className="edit-button-inline">
                  <EditButton 
                    contentId="section-1-text" 
                    onEdit={handleEdit}
                    variant="ghost"
                    size="sm"
                  />
                </span>
              </p>
              
              <div className="image-with-edit mb-4">
                <img 
                  src="/images/albums/cosmic-journey.jpg" 
                  alt="Cosmic Journey"
                  className="w-full h-40 object-cover rounded-md"
                />
                <EditButton 
                  contentId="section-1-image" 
                  onEdit={handleEdit}
                  variant="cosmic"
                  size="sm"
                />
              </div>
              
              <div className="flex justify-end">
                <EditButton 
                  contentId="section-1-full" 
                  onEdit={handleEdit}
                  variant="nebula"
                  text="Edit Entire Section"
                  iconOnly={false}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal for editing content */}
      {isEditing && currentEditItem && (
        <Modal
          title={`Edit ${currentEditItem.title}`}
          onClose={handleCloseModal}
        >
          <div className="p-4">
            <p>Here you would place your edit form for item: {currentEditItem.id}</p>
            <p className="mt-2 text-sm text-gray-400">Content to edit: {currentEditItem.description}</p>
            <p className="mt-4">This is just a demonstration of how to position and use the EditButton component.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EditButtonDemo;