const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let db, auth;
try {
  console.log('Loading Firebase service account key...');
  console.log('Environment variable exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  console.log('Environment variable length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length);
  
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  console.log('Service account loaded successfully');
  console.log('Project ID:', serviceAccount.project_id);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  db = admin.database();
  auth = admin.auth();
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper functions
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const normalizePhone = (phone) => String(phone || '').replace(/\s+/g, '').trim();
const emailKey = (email) => {
  try {
    return Buffer.from(normalizeEmail(email)).toString('base64');
  } catch {
    return '';
  }
};

// Verify admin token middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Audit logging function
const logAudit = async (action, targetId, targetType, adminUid, changes) => {
  try {
    const auditRef = db.ref('auditTrail');
    const newAuditRef = auditRef.push();
    await newAuditRef.set({
      action,
      targetId,
      targetType,
      performedBy: adminUid,
      changes,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Audit logging error:', error.message);
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Create admin endpoint
app.post('/api/admin/create', verifyAdmin, async (req, res) => {
  try {
    const { firstname, lastname, email, phone } = req.body;
    const adminUid = req.user.uid;

    // Validation
    if (!firstname?.trim()) return res.status(400).json({ error: 'Firstname is required' });
    if (!lastname?.trim()) return res.status(400).json({ error: 'Lastname is required' });
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
    if (!phone?.trim()) return res.status(400).json({ error: 'Phone is required' });

    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);
    const eKey = emailKey(normEmail);

    // Check if email exists
    const emailSnap = await db.ref(`emailIndex/${eKey}`).once('value');
    if (emailSnap.exists()) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create admin user in Firebase Auth
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const userRecord = await auth.createUser({
      email: normEmail,
      emailVerified: false,
      password: tempPassword,
      displayName: `${firstname} ${lastname}`,
      disabled: false
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });

    // Create database record
    const adminData = {
      uid: userRecord.uid,
      role: 'admin',
      firstname,
      lastname,
      email: normEmail,
      phone: normPhone,
      emailVerified: false,
      createdAt: Date.now(),
      createdBy: adminUid,
      emailKey: eKey,
      status: 'active'
    };

    await db.ref(`users/${userRecord.uid}`).set(adminData);
    await db.ref(`emailIndex/${eKey}`).set(userRecord.uid);

    // Send password reset email (this also serves as email verification)
    const passwordResetLink = await auth.generatePasswordResetLink(normEmail);
    
    // Send email using nodemailer
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'PetGuard Admin <noreply@petguard.com>',
        to: normEmail,
        subject: 'Welcome to PetGuard - Set Your Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #166534;">Welcome to PetGuard Admin</h2>
            <p>Hello ${firstname},</p>
            <p>You have been invited to join PetGuard as an administrator.</p>
            <p>To get started, please set your password by clicking the link below:</p>
            <p>
              <a href="${passwordResetLink}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Set Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this invitation, please ignore this email.</p>
            <p>Best regards,<br>PetGuard Team</p>
          </div>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', normEmail);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
      // Continue even if email fails - admin is still created
    }

    // Log audit
    await logAudit('create', userRecord.uid, 'admin', adminUid, adminData);

    res.json({ 
      success: true, 
      uid: userRecord.uid,
      email: normEmail,
      message: 'Admin created successfully. Email verification sent.'
    });
  } catch (error) {
    console.error('Admin creation error:', error.message);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Get admins endpoint
app.get('/api/admin/list', verifyAdmin, async (req, res) => {
  try {
    const usersSnap = await db.ref('users').once('value');
    const val = usersSnap.exists() ? usersSnap.val() : {};

    const admins = Object.keys(val || {})
      .filter((uid) => uid !== '__meta')
      .map((uid) => ({ uid, ...val[uid] }))
      .filter((u) => u?.role === 'admin')
      .map((u) => ({
        uid: u.uid,
        firstname: u.firstname || '',
        lastname: u.lastname || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || '',
        emailVerified: u.emailVerified || false,
        createdAt: u.createdAt || 0
      }));

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error.message);
    res.status(500).json({ error: 'Failed to get admins' });
  }
});

// Delete admin endpoint
app.delete('/api/admin/:uid', verifyAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const adminUid = req.user.uid;

    // Prevent self-deletion
    if (uid === adminUid) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const userSnap = await db.ref(`users/${uid}`).once('value');
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const user = userSnap.val();
    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from database
    await db.ref(`users/${uid}`).remove();
    if (user.email) {
      await db.ref(`emailIndex/${emailKey(user.email)}`).remove();
    }

    // Log audit
    await logAudit('delete', uid, 'admin', adminUid, { deletedUser: user });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error.message);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
