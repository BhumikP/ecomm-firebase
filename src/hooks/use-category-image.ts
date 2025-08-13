// src/hooks/use-category-image.ts
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface UploadResult {
  success: boolean;
  url?: string;
  message: string;
}

interface ImageUploadState {
  isUploading: boolean;
  isDeleting: boolean;
  uploadProgress: number;
  fileName: string;
}

export function useCategoryImage() {
  const [state, setState] = useState<ImageUploadState>({
    isUploading: false,
    isDeleting: false,
    uploadProgress: 0,
    fileName: '',
  });
  const { toast } = useToast();

  // Upload or update category image
  const uploadImage = async (file: File, categoryId?: string): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      fileName: file.name,
      uploadProgress: 0 
    }));

    try {
      // Client-side validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        const message = 'Invalid file type. Please select a valid image file (JPEG, PNG, GIF, or WebP).';
        toast({ 
          variant: "destructive", 
          title: "Invalid File Type", 
          description: message 
        });
        return { success: false, message };
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const message = 'File too large. Please select an image smaller than 10MB.';
        toast({ 
          variant: "destructive", 
          title: "File Too Large", 
          description: message 
        });
        return { success: false, message };
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      if (categoryId) {
        formData.append('categoryId', categoryId);
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({ 
          ...prev, 
          uploadProgress: Math.min(prev.uploadProgress + 10, 90) 
        }));
      }, 200);

      // Upload to API
      const response = await fetch('/api/categories/image', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setState(prev => ({ ...prev, uploadProgress: 100 }));

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ 
          variant: "default", 
          title: "Upload Successful", 
          description: categoryId ? "Category image updated successfully." : "Image uploaded successfully." 
        });
        return { success: true, url: result.url, message: result.message };
      } else {
        const message = result.message || 'Upload failed';
        toast({ 
          variant: "destructive", 
          title: "Upload Failed", 
          description: message 
        });
        return { success: false, message };
      }
    } catch (error) {
      const message = (error as Error).message || 'An error occurred during upload';
      toast({ 
        variant: "destructive", 
        title: "Upload Error", 
        description: message 
      });
      return { success: false, message };
    } finally {
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        fileName: '',
        uploadProgress: 0 
      }));
    }
  };

  // Update existing category image
  const updateImage = async (file: File, categoryId: string): Promise<UploadResult> => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      fileName: file.name 
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/categories/image?categoryId=${categoryId}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ 
          variant: "default", 
          title: "Update Successful", 
          description: "Category image updated successfully." 
        });
        return { success: true, url: result.url, message: result.message };
      } else {
        const message = result.message || 'Update failed';
        toast({ 
          variant: "destructive", 
          title: "Update Failed", 
          description: message 
        });
        return { success: false, message };
      }
    } catch (error) {
      const message = (error as Error).message || 'An error occurred during update';
      toast({ 
        variant: "destructive", 
        title: "Update Error", 
        description: message 
      });
      return { success: false, message };
    } finally {
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        fileName: '' 
      }));
    }
  };

  // Delete category image
  const deleteImage = async (categoryId: string, imageUrl?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isDeleting: true }));

    try {
      const params = new URLSearchParams({ categoryId });
      if (imageUrl) {
        params.append('imageUrl', imageUrl);
      }

      const response = await fetch(`/api/categories/image?${params.toString()}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({ 
          variant: "default", 
          title: "Image Deleted", 
          description: "Category image removed successfully." 
        });
        return true;
      } else {
        const message = result.message || 'Delete failed';
        toast({ 
          variant: "destructive", 
          title: "Delete Failed", 
          description: message 
        });
        return false;
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Delete Error", 
        description: (error as Error).message || 'An error occurred during deletion' 
      });
      return false;
    } finally {
      setState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Validate file before upload
  const validateFile = (file: File): { valid: boolean; message?: string } => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: 'Invalid file type. Please select a valid image file (JPEG, PNG, GIF, or WebP).' 
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: 'File too large. Please select an image smaller than 10MB.' 
      };
    }

    return { valid: true };
  };

  return {
    ...state,
    uploadImage,
    updateImage,
    deleteImage,
    validateFile,
  };
}
