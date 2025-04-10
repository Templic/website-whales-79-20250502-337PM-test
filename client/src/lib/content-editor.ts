/**
 * content-editor.ts
 * 
 * Service for handling content editing operations (text and images)
 */

import { apiRequest } from "./queryClient";

/**
 * Type definitions
 */
export interface ContentUpdateRequest {
  contentId: string | number;
  contentType: string;
  text?: string;
  image?: File;
}

export interface ContentUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    id: string | number;
    contentType: string;
    text?: string;
    imageUrl?: string;
    updatedAt: string;
  };
}

/**
 * Updates text content on the server
 */
export async function updateTextContent(
  contentId: string | number,
  newText: string
): Promise<ContentUpdateResponse> {
  try {
    const response = await apiRequest("POST", "/api/content/text", {
      contentId,
      text: newText,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to update text",
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating text content:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating text",
    };
  }
}

/**
 * Uploads and updates image content on the server
 */
export async function updateImageContent(
  contentId: string | number,
  imageFile: File
): Promise<ContentUpdateResponse> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("contentId", contentId.toString());
    formData.append("image", imageFile);
    
    // Use fetch directly because apiRequest doesn't handle FormData well
    const response = await fetch("/api/content/image", {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, the browser will set it with the boundary
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to update image",
      };
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating image content:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating image",
    };
  }
}

/**
 * Combined function to update content (text, image, or both)
 */
export async function updateContent({
  contentId,
  contentType,
  text,
  image,
}: ContentUpdateRequest): Promise<ContentUpdateResponse> {
  try {
    // Update text if provided
    if (text !== undefined) {
      const textResult = await updateTextContent(contentId, text);
      if (!textResult.success) {
        return textResult;
      }
    }
    
    // Update image if provided
    if (image) {
      const imageResult = await updateImageContent(contentId, image);
      if (!imageResult.success) {
        return imageResult;
      }
      
      // If we've updated both text and image, return the image result
      // as it will have the latest information
      return imageResult;
    }
    
    // If we only updated text, we already returned that result
    // If we didn't update anything, return a default success
    return {
      success: true,
      message: "Content updated successfully",
      data: {
        id: contentId,
        contentType,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error updating content:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}