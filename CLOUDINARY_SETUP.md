# Cloudinary Image Upload Setup

This project uses Cloudinary for image uploads and hosting.

## Quick Setup

1. **Sign up for Cloudinary**
   - Go to https://cloudinary.com and create a free account
   - Note your **Cloud Name** from the dashboard

2. **Create an Upload Preset**
   - Go to Settings > Upload > Upload Presets
   - Click "Add upload preset"
   - Set **Signing Mode** to **Unsigned** (allows client-side uploads)
   - Set **Folder** to `petguard` (optional, for organization)
   - Save the preset name

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (if not already done)
   - Add your Cloudinary credentials:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
   ```

4. **Restart your dev server**
   ```bash
   npm run dev
   ```

## Features

### Image Upload Component
The `ImageUpload` component is used throughout the app for:
- Pet photos (in RegisterPet, MyPets, AdminPetManagement)
- Announcement images (in AdminInformationCenter)

### Features:
- **File selection** with preview
- **URL input** as fallback
- **Image validation** (JPG, PNG, GIF, WEBP only, max 5MB)
- **Automatic optimization** with Cloudinary transformations
- **Thumbnail generation** for faster loading

### Usage in Components:

```jsx
import ImageUpload from './components/ImageUpload';

// In your form:
<ImageUpload
  value={form.image}
  onChange={({ url }) => setForm((prev) => ({ ...prev, image: url }))}
  folder="pets"        // Organizes images in Cloudinary
  label="Pet Photo"    // Custom label
/>
```

## Image Optimization

Images are automatically optimized using Cloudinary's transformation features:
- Auto format selection (f_auto)
- Auto quality (q_auto)
- Responsive DPR (dpr_auto)
- Thumbnail generation for previews

## Security Notes

- Only unsigned upload presets are used (safe for client-side)
- File type validation prevents non-image uploads
- 5MB size limit prevents abuse
- Images are organized by folder (pets, announcements)

## Troubleshooting

**"Cloudinary configuration missing" error:**
- Check that your `.env` file has the correct variables
- Make sure the env vars start with `VITE_` for Vite
- Restart your dev server after changing .env

**Upload fails:**
- Verify your upload preset is set to "Unsigned"
- Check browser console for specific error messages
- Ensure file is under 5MB and is a valid image type

**Images not showing:**
- Check that the returned URL is saved correctly to Firebase
- Verify the imageUrl field is being used in your component
