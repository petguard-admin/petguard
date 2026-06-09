import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cloudinaryService } from '../services/cloudinaryService';
import { Button } from './ui/Button';

/**
 * Image Upload Component
 * Handles file selection, preview, and upload to Cloudinary
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL
 * @param {function} props.onChange - Callback when image is uploaded/removed (receives { url, publicId, thumbnailUrl })
 * @param {string} props.folder - Cloudinary folder name (default: 'petguard')
 * @param {string} props.label - Label text (default: 'Image')
 * @param {string} props.placeholder - Placeholder text for URL input
 * @param {boolean} props.allowUrl - Allow manual URL input (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const ImageUpload = ({
  value,
  onChange,
  folder = 'petguard',
  label = 'Image',
  placeholder = 'Enter image URL or upload',
  allowUrl = true,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value || '');
  const [useUrlInput, setUseUrlInput] = useState(!value || value.startsWith('http'));
  const fileInputRef = useRef(null);

  // Update preview when value prop changes
  React.useEffect(() => {
    setPreview(value || '');
    setUseUrlInput(!value || value.startsWith('http'));
  }, [value]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(file, folder);
      
      // Clean up local preview
      URL.revokeObjectURL(localPreview);
      
      // Update with Cloudinary URL
      setPreview(result.url);
      onChange?.(result);
    } catch (err) {
      setError(err?.message || 'Failed to upload image');
      setPreview(value || ''); // Revert to original
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange?.({ url, publicId: null, thumbnailUrl: url });
  };

  const handleRemove = () => {
    setPreview('');
    setError('');
    onChange?.({ url: '', publicId: null, thumbnailUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-heading">
        {label}
      </label>

      {/* Error Message */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border border-border"
            onError={(e) => {
              e.target.src = '/placeholder.jpg';
              e.target.className = 'w-32 h-32 object-contain rounded-lg border border-border bg-muted p-2';
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex flex-col gap-2">
        {/* File Upload Button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={uploading}
            className="inline-flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image
              </>
            )}
          </Button>
          
          {allowUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setUseUrlInput(!useUrlInput)}
            >
              {useUrlInput ? 'Use Upload' : 'Use URL'}
            </Button>
          )}
        </div>

        {/* URL Input */}
        {allowUrl && useUrlInput && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={preview}
                onChange={handleUrlChange}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {/* File Info */}
        <p className="text-xs text-muted-foreground">
          Accepted: JPG, PNG, GIF, WEBP. Max size: 5MB.
        </p>
      </div>
    </div>
  );
};

export default ImageUpload;
