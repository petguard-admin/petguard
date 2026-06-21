# PetGuard Backend Server - Render Deployment Guide

## Overview
This is a Node.js/Express server that provides admin management functionality with Firebase Admin SDK integration.

## Prerequisites
- Firebase project with Admin SDK enabled
- Service account key JSON file
- Render account (free tier available)

## Setup Instructions

### 1. Firebase Service Account Setup
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Keep it secure - never commit to git

### 2. Environment Variables
Create a `.env` file in the server directory:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
FIREBASE_DATABASE_URL='https://your-project-id.firebaseio.com'
PORT=3000
```

### 3. Local Development
```bash
cd server
npm install
npm run dev
```

### 4. Render Deployment

#### Step 1: Push to GitHub
- Ensure your code is pushed to a GitHub repository
- The server directory should be at the root of your repo or in a subdirectory

#### Step 2: Create Web Service on Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: petguard-backend (or your preferred name)
   - **Root Directory**: `server` (if server is in subdirectory)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (spins down after 15 min inactivity)

#### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Paste your service account JSON as a string
- `FIREBASE_DATABASE_URL`: Your Firebase database URL
- `PORT`: 3000 (Render sets this automatically)

#### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Render will provide a URL like: `https://petguard-backend.onrender.com`

### 5. Update Frontend Configuration
Add the backend URL to your frontend environment variables:

```env
REACT_APP_BACKEND_URL=https://petguard-backend.onrender.com
```

Or update in `src/services/adminService.js`:
```javascript
const BACKEND_URL = 'https://petguard-backend.onrender.com';
```

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Admin Management
- `POST /api/admin/create` - Create new admin (requires admin token)
- `GET /api/admin/list` - List all admins (requires admin token)
- `DELETE /api/admin/:uid` - Delete admin (requires admin token)

### Authentication
All admin endpoints require Firebase ID token in Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Features Implemented
- ✅ Server-side validation for admin operations
- ✅ Email verification requirement for admin accounts
- ✅ Enhanced audit logging for all admin actions
- ✅ Firebase Admin SDK integration
- ✅ Secure token verification
- ✅ Automatic email verification sending

## Testing
1. Deploy the server to Render
2. Update frontend with backend URL
3. Test admin creation from Admin Control panel
4. Verify email verification is sent
5. Check audit logs in Firebase Realtime Database

## Troubleshooting

### Server won't start
- Check environment variables are set correctly
- Verify service account key is valid JSON
- Check Render logs for errors

### API calls failing
- Verify backend URL is correct
- Check Firebase ID token is valid
- Ensure user has admin claims

### Email verification not sending
- Verify Firebase Auth email templates are configured
- Check email is not blocked by spam filters
- Verify Firebase project email settings

## Security Notes
- Never commit service account key to git
- Use environment variables for sensitive data
- Implement rate limiting in production
- Regularly rotate service account keys
- Monitor audit logs for suspicious activity
