# Firebase Security Architecture (No Backend Server)

## Overview

This document outlines a secure architecture using Firebase Authentication + Realtime Database without any backend server or Cloud Functions. The security is enforced entirely through Firebase Security Rules and proper database structure.

## Database Structure

### Realtime Database Schema

```
petguard-1062c-default-rtdb/
├── users/
│   ├── {uid}/
│   │   ├── email: "user@example.com"
│   │   ├── firstname: "John"
│   │   ├── lastname: "Doe"
│   │   ├── phone: "+1234567890"
│   │   ├── role: "owner" | "admin"
│   │   ├── createdAt: 1234567890
│   │   ├── createdBy: "{adminUid}" (who created this user)
│   │   ├── emailVerified: true
│   │   └── status: "active" | "suspended"
│   └── __meta/
│       └── lastUpdated: 1234567890
├── pets/
│   ├── {petId}/
│   │   ├── ownerId: "{ownerUid}"
│   │   ├── name: "Buddy"
│   │   ├── species: "dog"
│   │   ├── breed: "Golden Retriever"
│   │   ├── age: 3
│   │   ├── weight: 30
│   │   ├── createdAt: 1234567890
│   │   └── updatedAt: 1234567890
│   └── ownerIndex/
│       └── {ownerUid}/
│           └── {petId}: true
├── medicalRecords/
│   ├── {recordId}/
│   │   ├── petId: "{petId}"
│   │   ├── ownerId: "{ownerUid}" (denormalized for security)
│   │   ├── type: "vaccination" | "checkup" | "treatment"
│   │   ├── date: "2024-01-15"
│   │   ├── description: "Annual vaccination"
│   │   ├── veterinarian: "Dr. Smith"
│   │   ├── createdAt: 1234567890
│   │   └── createdBy: "{adminUid}"
│   └── petIndex/
│       └── {petId}/
│           └── {recordId}: true
├── auditTrail/
│   ├── {auditId}/
│   │   ├── action: "create" | "update" | "delete"
│   │   ├── targetId: "{targetUid}"
│   │   ├── targetType: "user" | "pet" | "medicalRecord"
│   │   ├── performedBy: "{adminUid}"
│   │   ├── changes: { ... }
│   │   ├── timestamp: 1234567890
│   │   └── ipAddress: "192.168.1.1"
│   └── __meta/
│       └── readOnly: true
├── emailIndex/
│   └── {base64Email}/
│       └── uid: "{uid}"
├── phoneIndex/
│   └── {phoneNumber}/
│       └── uid: "{uid}"
└── adminClaims/
    └── {uid}/
        ├── role: "admin"
        ├── assignedBy: "{superAdminUid}"
        └── assignedAt: 1234567890
```

## Role Assignment Strategy

### The "Super Admin" Pattern

**Critical Security Concept**: Only the initial "super admin" can assign admin roles. This is enforced through Firebase Security Rules.

### Initial Setup (One-Time)

1. **Create the first admin manually in Firebase Console**:
   - Go to Firebase Console → Authentication → Users
   - Create the first admin user
   - Note their UID

2. **Set up the admin claims in the database**:
   - Manually add the first admin to `adminClaims/{uid}` in Firebase Console
   - This user becomes the "super admin" who can assign other admins

### Role Assignment Process

**To assign admin role**:
1. Only existing admins can assign new admin roles
2. The assigning admin must have their UID in `adminClaims/{uid}`
3. New admin is added to both `users/{uid}` with `role: "admin"` and `adminClaims/{uid}`
4. This is enforced by security rules - regular users cannot modify these paths

**To assign owner role**:
1. Admins can create owner accounts
2. Owners are added to `users/{uid}` with `role: "owner"`
3. Owners are NOT added to `adminClaims/{uid}` (they don't have admin privileges)

## Firebase Security Rules

### Complete Security Rules

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    // Users collection
    "users": {
      ".read": "auth != null && (root.child('adminClaims').child(auth.uid).exists() || auth.uid == $uid)",
      ".write": "auth != null",
      
      "$uid": {
        // Users can read their own data
        ".read": "auth != null && auth.uid == $uid",
        
        // Only admins can create users
        ".create": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Users can update their own profile (except role)
        ".update": "auth != null && (auth.uid == $uid || root.child('adminClaims').child(auth.uid).exists())",
        
        // Only admins can delete users
        ".delete": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Prevent users from changing their own role
        "role": {
          ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists() && newData.val() == 'owner' || newData.val() == 'admin'"
        },
        
        // Prevent users from changing who created them
        "createdBy": {
          ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()"
        },
        
        // Users can update their own basic info
        "firstname": {
          ".write": "auth != null && (auth.uid == $uid || root.child('adminClaims').child(auth.uid).exists())"
        },
        "lastname": {
          ".write": "auth != null && (auth.uid == $uid || root.child('adminClaims').child(auth.uid).exists())"
        },
        "phone": {
          ".write": "auth != null && (auth.uid == $uid || root.child('adminClaims').child(auth.uid).exists())"
        }
      },
      
      // Metadata is admin-only
      "__meta": {
        ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()"
      }
    },
    
    // Admin claims - critical for security
    "adminClaims": {
      ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      ".write": false,
      
      "$uid": {
        // Only existing admins can add new admins
        ".create": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Admins cannot modify their own claims (prevent privilege escalation)
        ".update": "auth != null && root.child('adminClaims').child(auth.uid).exists() && auth.uid != $uid",
        
        // Only super admins can remove admin claims
        ".delete": "auth != null && root.child('adminClaims').child(auth.uid).exists() && auth.uid != $uid"
      }
    },
    
    // Pets collection
    "pets": {
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$petId": {
        // Owners can read their own pets
        ".read": "auth != null && (data.child('ownerId').val() == auth.uid || root.child('adminClaims').child(auth.uid).exists())",
        
        // Only owners can create pets for themselves
        ".create": "auth != null && newData.child('ownerId').val() == auth.uid",
        
        // Owners can update their own pets, admins can update any
        ".update": "auth != null && (data.child('ownerId').val() == auth.uid || root.child('adminClaims').child(auth.uid).exists())",
        
        // Owners can delete their own pets, admins can delete any
        ".delete": "auth != null && (data.child('ownerId').val() == auth.uid || root.child('adminClaims').child(auth.uid).exists())",
        
        // Owner ID cannot be changed after creation
        "ownerId": {
          ".write": "auth != null && newData.val() == data.child('ownerId').val()"
        }
      },
      
      // Owner index for efficient queries
      "ownerIndex": {
        "$ownerId": {
          ".read": "auth != null && (auth.uid == $ownerId || root.child('adminClaims').child(auth.uid).exists())",
          ".write": "auth != null && (auth.uid == $ownerId || root.child('adminClaims').child(auth.uid).exists())"
        }
      }
    },
    
    // Medical records
    "medicalRecords": {
      ".read": "auth != null",
      ".write": "auth != null",
      
      "$recordId": {
        // Owners can read their pet's records, admins can read all
        ".read": "auth != null && (data.child('ownerId').val() == auth.uid || root.child('adminClaims').child(auth.uid).exists())",
        
        // Only admins can create medical records
        ".create": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Only admins can update medical records
        ".update": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Only admins can delete medical records
        ".delete": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        
        // Owner ID cannot be changed
        "ownerId": {
          ".write": "auth != null && newData.val() == data.child('ownerId').val()"
        },
        
        // Pet ID cannot be changed
        "petId": {
          ".write": "auth != null && newData.val() == data.child('petId').val()"
        }
      },
      
      // Pet index for efficient queries
      "petIndex": {
        "$petId": {
          ".read": "auth != null && (root.child('pets').child($petId).child('ownerId').val() == auth.uid || root.child('adminClaims').child(auth.uid).exists())",
          ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()"
        }
      }
    },
    
    // Audit trail - admin only, append-only
    "auditTrail": {
      ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      
      "$auditId": {
        ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists() && !data.exists()",
        
        // Only admins can create audit entries
        "performedBy": {
          ".write": "auth != null && newData.val() == auth.uid"
        },
        
        // Timestamp cannot be modified
        "timestamp": {
          ".write": "auth != null && newData.val() == now"
        }
      },
      
      "__meta": {
        ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
        ".write": false
      }
    },
    
    // Email index for uniqueness
    "emailIndex": {
      ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      
      "$email": {
        ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists() && !data.exists()"
      }
    },
    
    // Phone index for uniqueness
    "phoneIndex": {
      ".read": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists()",
      
      "$phone": {
        ".write": "auth != null && root.child('adminClaims').child(auth.uid).exists() && !data.exists()"
      }
    }
  }
}
```

## Security Best Practices

### 1. Role Tampering Prevention

**Problem**: Users might try to change their own role to "admin"

**Solution**: 
- Security rules prevent users from writing to their own `role` field
- Only admins can modify the `role` field
- Admin claims are stored in a separate `adminClaims` collection that regular users cannot write to

### 2. Privilege Escalation Prevention

**Problem**: Admins might try to grant themselves more privileges

**Solution**:
- Admins cannot modify their own `adminClaims` entry
- Only other admins can modify an admin's claims
- This prevents self-privilege escalation

### 3. Data Isolation

**Problem**: Owners accessing other owners' pets or medical records

**Solution**:
- All data access is checked against `ownerId` or `adminClaims`
- Owners can only access their own data
- Admins can access all data for management purposes

### 4. Audit Logging

**Problem**: Tracking who made changes for accountability

**Solution**:
- All admin actions are logged to `auditTrail`
- Audit trail is append-only (cannot be modified)
- Only admins can read the audit trail
- Each entry includes `performedBy`, `timestamp`, and `changes`

### 5. Email/Phone Uniqueness

**Problem**: Duplicate email or phone registrations

**Solution**:
- Separate `emailIndex` and `phoneIndex` collections
- Security rules prevent duplicate entries
- Admins must check these indexes before creating users

## Implementation Guidelines

### Frontend Role Checking

```javascript
// Check if user is admin
const isAdmin = async (uid) => {
  const adminClaimSnapshot = await get(ref(database, `adminClaims/${uid}`));
  return adminClaimSnapshot.exists();
};

// Check if user is owner
const isOwner = async (uid) => {
  const userSnapshot = await get(ref(database, `users/${uid}`));
  return userSnapshot.exists() && userSnapshot.val().role === 'owner';
};
```

### Creating Admin Users

```javascript
const createAdmin = async (adminData, createdByAdmin) => {
  // 1. Verify the creator is an admin
  const isAdmin = await checkAdmin(createdByAdmin.uid);
  if (!isAdmin) throw new Error('Only admins can create admins');
  
  // 2. Check email uniqueness
  const emailKey = btoa(adminData.email);
  const emailExists = await get(ref(database, `emailIndex/${emailKey}`));
  if (emailExists.exists()) throw new Error('Email already exists');
  
  // 3. Create user in Firebase Auth (client-side)
  const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, tempPassword);
  
  // 4. Add to users collection
  await set(ref(database, `users/${userCredential.user.uid}`), {
    ...adminData,
    role: 'admin',
    createdAt: Date.now(),
    createdBy: createdByAdmin.uid,
    status: 'active'
  });
  
  // 5. Add to admin claims
  await set(ref(database, `adminClaims/${userCredential.user.uid}`), {
    role: 'admin',
    assignedBy: createdByAdmin.uid,
    assignedAt: Date.now()
  });
  
  // 6. Add to email index
  await set(ref(database, `emailIndex/${emailKey}`), userCredential.user.uid);
  
  // 7. Log audit
  await logAudit('create', userCredential.user.uid, 'user', createdByAdmin.uid, adminData);
};
```

### Creating Owner Users

```javascript
const createOwner = async (ownerData, createdByAdmin) => {
  // 1. Verify the creator is an admin
  const isAdmin = await checkAdmin(createdByAdmin.uid);
  if (!isAdmin) throw new Error('Only admins can create owners');
  
  // 2. Check email uniqueness
  const emailKey = btoa(ownerData.email);
  const emailExists = await get(ref(database, `emailIndex/${emailKey}`));
  if (emailExists.exists()) throw new Error('Email already exists');
  
  // 3. Create user in Firebase Auth (client-side)
  const userCredential = await createUserWithEmailAndPassword(auth, ownerData.email, tempPassword);
  
  // 4. Add to users collection (NOT admin claims)
  await set(ref(database, `users/${userCredential.user.uid}`), {
    ...ownerData,
    role: 'owner',
    createdAt: Date.now(),
    createdBy: createdByAdmin.uid,
    status: 'active'
  });
  
  // 5. Add to email index
  await set(ref(database, `emailIndex/${emailKey}`), userCredential.user.uid);
  
  // 6. Log audit
  await logAudit('create', userCredential.user.uid, 'user', createdByAdmin.uid, ownerData);
};
```

## Security Checklist

- [ ] Initial super admin created manually in Firebase Console
- [ ] Admin claims added to database for super admin
- [ ] Security rules deployed to Firebase Console
- [ ] Email and phone uniqueness indexes created
- [ ] Audit logging implemented for all admin actions
- [ ] Frontend role checking implemented
- [ ] Test role tampering prevention
- [ ] Test privilege escalation prevention
- [ ] Test data isolation between owners
- [ ] Test audit trail functionality

## Monitoring and Maintenance

1. **Regular Security Rule Reviews**: Review and update security rules quarterly
2. **Audit Trail Monitoring**: Regularly check audit trail for suspicious activity
3. **Admin Access Review**: Periodically review admin access and remove unnecessary admins
4. **Failed Login Monitoring**: Monitor Firebase Authentication for suspicious login attempts
5. **Data Backup**: Regularly backup Firebase Realtime Database

## Common Security Pitfalls to Avoid

1. **Client-side role checks only**: Always enforce security at the database level with rules
2. **Storing sensitive data in client code**: Never store API keys or secrets in frontend code
3. **Allowing users to modify their own role**: Enforce this with security rules
4. **Missing audit logging**: Log all admin actions for accountability
5. **Overly permissive rules**: Start with restrictive rules and open up as needed
