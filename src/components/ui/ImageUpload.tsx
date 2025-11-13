'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from './Button';
import imageCompression from 'browser-image-compression';

interface ImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  disabled?: boolean;
  showCompressionStats?: boolean;
}

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savings: number;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dyuox9egr';
const CLOUDINARY_UPLOAD_PRESET = 'hotel_uploads'; // We'll create this

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 10,
  folder = 'hotels',
  disabled = false,
  showCompressionStats = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate all files first
    for (const file of filesToUpload) {
      try {
        await validateImage(file);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Invalid image file');
        return;
      }
    }

    setUploading(true);
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        totalOriginalSize += file.size;
        const compressedFile = await compressImage(file);
        totalCompressedSize += compressedFile.size;
        return uploadImage(compressedFile, file.name);
      });
      
      const urls = await Promise.all(uploadPromises);
      onChange([...value, ...urls.filter(Boolean) as string[]]);

      // Show compression stats
      if (showCompressionStats) {
        const savings = ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100;
        setCompressionStats({
          originalSize: totalOriginalSize,
          compressedSize: totalCompressedSize,
          savings: Math.round(savings),
        });
        setTimeout(() => setCompressionStats(null), 5000);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Validate image before upload
  const validateImage = async (file: File): Promise<void> => {
    // 1. Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // 2. Check file size (max 10MB before compression)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 10MB');
    }

    // 3. Check allowed formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Only JPEG, PNG, WebP, and HEIC formats are allowed');
    }

    // 4. Check dimensions (minimum)
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        if (img.width < 400 || img.height < 300) {
          reject(new Error('Image must be at least 400x300 pixels'));
        } else {
          resolve();
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  };

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 1, // Max 1MB after compression
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/webp', // Convert to WebP for better compression
        initialQuality: 0.85, // Quality 85%
      };

      const compressedFile = await imageCompression(file, options);
      
      // If compression failed or file is larger, return original
      if (compressedFile.size > file.size) {
        return file;
      }
      
      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      // If compression fails, return original file
      return file;
    }
  };

  const uploadImage = (file: File, originalName?: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const displayName = originalName || file.name;
      
      // Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Using default unsigned preset
      formData.append('folder', folder);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      // Use XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress((prev) => ({ ...prev, [displayName]: progress }));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Send request
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  const handleRemove = async (url: string, index: number) => {
    // Note: Deleting from Cloudinary requires backend API call with API secret
    // For now, we'll just remove from UI
    // TODO: Implement backend API for deletion
    
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={disabled || uploading || value.length >= maxImages}
          className="hidden"
        />
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploading || value.length >= maxImages}
          variant="outline"
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </Button>
        <p className="mt-2 text-sm text-gray-500">
          {value.length} / {maxImages} images uploaded • Converted to WebP • Max 1MB per image
        </p>
      </div>

      {/* Compression Stats */}
      {compressionStats && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-green-900">
                Images Compressed Successfully! 🎉
              </p>
              <p className="text-green-700">
                Saved {compressionStats.savings}% •{' '}
                {(compressionStats.originalSize / 1024 / 1024).toFixed(2)} MB → {(compressionStats.compressedSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{fileName}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {value.map((url, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-40">
                <button
                  type="button"
                  onClick={() => handleRemove(url, index)}
                  disabled={disabled}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
