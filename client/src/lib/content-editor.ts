/**
 * content-editor.ts
 * 
 * Service for managing content updates (text and images).
 * This service provides functionality for updating text and image content
 * through the content API endpoints.
 */

import axios from 'axios';

type ContentUpdateParams = {
  contentId: string | number;
  text?: string;
  image?: File;
  imageUrl?: string;
};

/**
 * Update content (text or image or both)
 */
export async function updateContent(params: ContentUpdateParams): Promise<boolean> {
  try {
    const { contentId, text, image, imageUrl } = params;
    
    // If we have text to update, make a request to update text
    if (text !== undefined) {
      await updateTextContent(contentId, text);
    }
    
    // If we have an image to upload, make a request to update the image
    if (image) {
      await updateImageContent(contentId, image);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

/**
 * Update text content
 */
async function updateTextContent(contentId: string | number, text: string): Promise<any> {
  try {
    const response = await axios.post('/api/content/text', {
      contentId,
      text,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update text content');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error updating text content:', error);
    throw error;
  }
}

/**
 * Update image content
 */
async function updateImageContent(contentId: string | number, image: File): Promise<any> {
  try {
    // Create a FormData instance to send the file
    const formData = new FormData();
    formData.append('contentId', contentId.toString());
    formData.append('image', image);
    
    const response = await axios.post('/api/content/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update image content');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error updating image content:', error);
    throw error;
  }
}

/**
 * Get preview URL for an image file
 */
export function getImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up image preview URL
 */
export function revokeImagePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}