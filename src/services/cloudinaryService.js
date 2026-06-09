// Cloudinary Image Upload Service
// Uses Cloudinary's unsigned upload preset for client-side uploads

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const cloudinaryService = {
  /**
   * Upload an image file to Cloudinary
   * @param {File} file - The image file to upload
   * @param {string} folder - Optional folder name (e.g., 'pets', 'announcements')
   * @returns {Promise<{url: string, publicId: string}>}
   */
  async uploadImage(file, folder = 'petguard') {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.');
    }

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnailUrl: this.getThumbnailUrl(data.secure_url),
    };
  },

  /**
   * Get optimized thumbnail URL from Cloudinary URL
   * @param {string} url - The full Cloudinary URL
   * @param {number} width - Desired width (default 300)
   * @returns {string}
   */
  getThumbnailUrl(url, width = 300) {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // Insert transformation parameters into Cloudinary URL
    // Example: https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
    // Becomes: https://res.cloudinary.com/cloud/image/upload/w_300,c_fit,q_auto/v123/folder/file.jpg
    return url.replace(
      '/upload/',
      `/upload/w_${width},c_fit,q_auto,f_auto,dpr_auto/`
    );
  },

  /**
   * Get optimized image URL with custom transformations
   * @param {string} url - The full Cloudinary URL  
   * @param {Object} options - Transformation options
   * @returns {string}
   */
  getOptimizedUrl(url, options = {}) {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    const { width, height, crop = 'fit', quality = 'auto' } = options;
    
    let transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (quality) transformations.push(`q_${quality}`);
    transformations.push('f_auto', 'dpr_auto');
    
    const transformString = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  },

  /**
   * Delete an image from Cloudinary (requires server-side signature or admin API)
   * Note: Client-side deletion requires a backend endpoint or serverless function
   * @param {string} publicId - The public ID of the image to delete
   */
  async deleteImage(publicId) {
    // Client-side deletion requires signature generation
    // For now, we'll just return a note that this needs backend support
    console.warn('Image deletion requires backend signature generation. Public ID:', publicId);
    // In a full implementation, this would call a backend endpoint
    throw new Error('Image deletion requires backend support. Please implement a delete endpoint.');
  }
};

export default cloudinaryService;
