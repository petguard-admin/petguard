# PetGuard2 -- Documentation

## Overview

**PetGuard2** is a pet management web application built for **Office the Municipal Vaterinarian of Mamburao**. It allows pet owners to register their pets, track medical and vaccination records, and provides administrators with a dashboard to manage users, pets, health information, and generate reports. The app focuses on **dogs and cats**, with an emphasis on **anti-rabies vaccination tracking** for LGU (Local Government Unit) compliance.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | ^19.2.4 |
| **Routing** | React Router DOM | ^7.13.1 |
| **Build Tool** | Vite | ^7.3.1 |
| **Styling** | Tailwind CSS | ^4.2.1 |
| **Icons** | Lucide React | ^1.11.0 |
| **Charts** | Recharts | ^3.8.1 |
| **Backend** | Firebase Auth + Realtime Database | ^12.10.0 |
| **Image Hosting** | Cloudinary | -- |
| **Language** | JavaScript (ES Modules) | -- |

### Key Dependencies

- **firebase** -- Auth (email/password), Realtime Database, Analytics
- **lucide-react** -- Icon set for UI elements
- **recharts** -- Chart components for admin dashboard statistics
- **@tailwindcss/vite** + **@tailwindcss/postcss** -- Tailwind v4 build integration
- **@vitejs/plugin-react** -- React Fast Refresh for Vite

---

## Directory Structure

```
petguard2/
|-- .env                          # Environment variables (Firebase, Cloudinary)
|-- .gitignore                    # Git ignore rules (has merge conflict markers)
|-- .vscode/                      # VS Code settings (Tailwind CSS extension)
|-- adminreport_db_structure.json # Sample vaccination report structure
|-- CLOUDINARY_SETUP.md           # Cloudinary image setup guide
|-- components.json               # Empty shadcn/ui config placeholder
|-- database.rules.json           # Firebase Realtime Database security rules
|-- dist/                         # Production build output
|-- index.html                    # Vite entry HTML
|-- migrate-database.js           # DB migration script (old -> new schema)
|-- package.json
|-- postcss.config.js
|-- public/
|   |-- index.html                # Legacy CRA-style public HTML
|-- README.md                     # Default CRA readme (outdated)
|-- FIREBASE_SECURITY_ARCHITECTURE.md  # Firebase security architecture
|-- src/
|   |-- App.jsx                   # Route definitions
|   |-- auth.js                   # Firebase Auth export
|   |-- AuthContext.jsx           # Auth state context provider
|   |-- firebaseConfig.js         # Firebase init (with Analytics)
|   |-- index.css                 # Global styles (Tailwind import)
|   |-- index.jsx                 # React entry point
|   |-- components/
|   |   |-- AddMedicalRecordModal.jsx
|   |   |-- AdminAuditTrail.jsx
|   |   |-- AdminControl.jsx
|   |   |-- AdminDashboard.jsx
|   |   |-- AdminInformationCenter.jsx
|   |   |-- AdminPetManagement.jsx
|   |   |-- AdminProfile.jsx
|   |   |-- AdminReports.jsx
|   |   |-- AdminRoute.jsx
|   |   |-- AdminSettings.jsx
|   |   |-- AdminSidebarLayout.jsx
|   |   |-- AdminUserManagement.jsx
|   |   |-- Announcements.jsx
|   |   |-- CTA.jsx
|   |   |-- ErrorModal.jsx
|   |   |-- Footer.jsx
|   |   |-- HealthInfo.jsx
|   |   |-- Hero.jsx
|   |   |-- ImageUpload.jsx
|   |   |-- InformationCenter.jsx
|   |   |-- LandingPage.jsx
|   |   |-- Login.jsx
|   |   |-- MedicalRecords.jsx
|   |   |-- Modal.jsx
|   |   |-- MyPets.jsx
|   |   |-- Navbar.jsx
|   |   |-- OwnerSidebarLayout.jsx
|   |   |-- Profile.jsx
|   |   |-- ProtectedRoute.jsx
|   |   |-- Register.jsx
|   |   |-- RegisterPet.jsx
|   |   |-- RegisterPetModal.jsx
|   |   |-- ui/
|   |       |-- Button.jsx
|   |-- img/
|   |   |-- hero-pet.jpg
|   |   |-- hero-pet.png
|   |   |-- OMV_logo.png
|   |-- lib/
|   |   |-- utils.js
|   |-- services/
|   |   |-- adminService.js
|   |   |-- authService.js
|   |   |-- cloudinaryService.js
|   |   |-- firebase.js
|   |   |-- index.js
|   |   |-- medicalRecordService.js
|   |   |-- ownerService.js
|   |   |-- petService.js
|   |-- utils/
|       |-- auditLogger.js
|-- tailwind.config.js
|-- vite.config.js
```

---

## Authentication & Authorization

### Auth Flow (`src/AuthContext.jsx`)

- **`onAuthStateChanged`** listener tracks Firebase Auth state
- On login, the user's Firebase ID token is inspected for a custom claim `admin: true`
- The context exposes: `user`, `loading`, `isAdmin`, `role`, `roleLoading`, `logout()`

### Route Guards

| Component | File | Behavior |
|---|---|---|
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | Redirects unauthenticated users to `/login` |
| `AdminRoute` | `src/components/AdminRoute.jsx` | Redirects non-admin users to `/login` or `/` |
| `AdminRoute` | `src/components/AdminRoute.jsx` | Checks `isAdmin` from `AuthContext` |

### Role Model

- **Owner** -- Default role on registration. Can manage own pets, view medical records, edit profile.
- **Admin** -- Set via Firebase custom claim (`admin: true`). Full access to all admin features.
- **Super Admin** -- Described in security architecture; the first admin bootstraps the system.

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/` | `LandingPage` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/profile` | `Profile` | Authenticated |
| `/my-pets` | `MyPets` | Authenticated |
| `/register-pet` | `RegisterPet` | Authenticated |
| `/medical-records` | `MedicalRecords` | Authenticated |
| `/admin` | `AdminDashboard` | Admin |
| `/admin/profile` | `AdminProfile` | Admin |
| `/admin/users` | `AdminUserManagement` | Admin |
| `/admin/control` | `AdminControl` | Admin |
| `/admin/pets` | `AdminPetManagement` | Admin |
| `/admin/info` | `AdminInformationCenter` | Admin |
| `/admin/reports` | `AdminReports` | Admin |
| `/admin/audit-trail` | `AdminAuditTrail` | Admin |
| `/admin/settings` | `AdminSettings` | Admin |

---

## Features

### Public Pages

| Page | Description |
|---|---|
| **Landing Page** | Hero section with app branding, announcements carousel/grid, pet health information articles, call-to-action |
| **Login** | Email/password sign-in with forgot password link |
| **Register** | User registration with personal details (name, email, phone, barangay, gender, birthday) |

### Owner Features

| Feature | Component | Description |
|---|---|---|
| **My Pets** | `MyPets.jsx` (801 lines) | CRUD for own pets with detailed fields: species, breed, sex, weight, DOB, spay/neuter, origin, ownership type, habitat, tag type/number, contact with other animals, female-specific fields |
| **Register Pet** | `RegisterPetModal.jsx` (502 lines) | Multi-field pet registration form with image upload |
| **Medical Records** | `MedicalRecords.jsx` (896 lines) | Tabbed view (Medical / Vaccination) with search, filter, sort, pagination; add/edit/delete records |
| **Profile** | `Profile.jsx` | View/edit personal info, reset password, delete account |
| **Information Center** | `InformationCenter.jsx` | View published announcements and health articles |

### Admin Features

| Feature | Component | Description |
|---|---|---|
| **Dashboard** | `AdminDashboard.jsx` | Statistics cards + charts (Users Per Month, Dogs vs Cats, Vaccinated vs Unvaccinated, Pets by Barangay) |
| **User Management** | `AdminUserManagement.jsx` | CRUD for owner accounts with search, barangay filter, sort, pagination; create accounts with password setup emails |
| **Pet Management** | `AdminPetManagement.jsx` (2606 lines) | Full CRUD for all pets and their medical/vaccination records across all owners |
| **Information Center** | `AdminInformationCenter.jsx` | Create, edit, delete, publish/unpublish announcements and health articles with image uploads |
| **Reports** | `AdminReports.jsx` | Vaccination reports filtered by year; CSV export for LGU reporting |
| **Audit Trail** | `AdminAuditTrail.jsx` | System action log with search, action filter, role filter, pagination |
| **Admin Control** | `AdminControl.jsx` | View admins, promote owners to admin, demote admins |
| **Admin Profile** | `AdminProfile.jsx` | Edit admin personal information |
| **Settings** | `AdminSettings.jsx` | Placeholder ("Coming soon") |

### Cross-cutting Features

- **Role-based access control** with route guards (`ProtectedRoute`, `AdminRoute`)
- **Audit logging** -- All create/update/delete actions logged to Firebase `auditTrail` collection
- **Image uploads** -- Via Cloudinary with file validation (JPG, PNG, GIF, WEBP; max 5 MB), preview, optimization
- **Responsive design** -- Mobile-first with sidebar/drawer navigation
- **Password reset** -- Via Firebase email

---

## Firebase Realtime Database Schema

The app uses the **current (old) schema**:

```
owners/
  {ownerId}/
    ownerId, uid, firstname, lastname, email, phone, phoneNumber,
    barangay, gender, birthday, hasLoginAccess, createdAt, createdBy

ownerUidMap/
  {firebaseUid} -> ownerId

petsByOwner/
  {ownerId}/
    {petId}/
      id, ownerId, petName, species, breed, sex, weightKgs,
      animalColor, dateOfBirth, spayedNeutered, petOrigin,
      ownership, habitat, tagType, tagNumber,
      contactWithOtherAnimals, pregnant, lactating, puppyCount,
      image, createdAt, updatedAt

selectedPetByOwner/
  {ownerId} -> petId

medicalRecordsByPet/
  {petId}/
    {recordId}/
      id, petId, ownerId, recordType (vaccination|medical),
      date, [vaccination: vaccineType, vaccineSource, vaccineStock,
             vaccinatedBy, reason, hasDisease, disease],
      [medical: results, veterinarian],
      notes, createdAt, updatedAt

users/
  {uid}/
    email, role (admin|owner), createdAt, firstname, lastname, phone,
    promotedBy, promotedAt, demotedBy, demotedAt

emailIndex/
  {base64EncodedEmail} -> uid or ownerId

phoneIndex/
  {phoneNumber} -> uid or ownerId

announcements/
  {id}/
    title, content, type (announcement|health),
    imageUrl, isPublished, createdAt

auditTrail/
  {recordId}/
    action, targetId, targetType, performedBy, role,
    beforeValues, afterValues, timestamp
```

A **new schema** is documented in `FIREBASE_SECURITY_ARCHITECTURE.md` and `migrate-database.js` with flat `pets/` and `medicalRecords/` collections, but the application code has not yet been migrated.

---

## Services Layer (`src/services/`)

| Service | File | Key Methods |
|---|---|---|
| **authService** | `authService.js` | `register()`, `login()`, `logout()`, `getProfile()`, `updateProfileData()`, `bootstrapProfile()`, `deleteAccount()`, `getUserRole()`, `sendPasswordReset()` |
| **petService** | `petService.js` | `getPets()`, `getPetById()`, `createPet()`, `updatePet()`, `deletePet()`, `setSelectedPet()`, `getAllPets()`, admin variants |
| **ownerService** | `ownerService.js` | `getOwnerProfile()`, `updateOwnerProfile()`, `preRegisterOwner()`, `getAllOwners()`, `getOwnerById()`, `updateOwner()`, `deleteOwner()` |
| **medicalRecordService** | `medicalRecordService.js` | `getMedicalRecords()`, `createMedicalRecord()`, `updateMedicalRecord()`, `deleteMedicalRecord()`, admin variants |
| **adminService** | `adminService.js` | `verifyAdmin()`, `getStats()`, `getAdmins()`, `searchUsers()`, `promoteToAdmin()`, `deleteAdmin()`, `sendPasswordResetToUser()`, `activateOwner()`, `resetOwnerPassword()` |
| **cloudinaryService** | `cloudinaryService.js` | `uploadImage()`, `getThumbnailUrl()`, `getOptimizedUrl()`, `deleteImage()` |

---

## Environment Variables (`.env`)

```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID

# Firebase project: petguard-1062c (asia-southeast1)

VITE_CLOUDINARY_CLOUD_NAME="dai9b9w17"
VITE_CLOUDINARY_UPLOAD_PRESET="petguard"

REACT_APP_BACKEND_URL="https://petguard-t0mp.onrender.com"  # Unused in source
BOOTSTRAP_KEY=457317402417  # Unused in source
```

---

## Available Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build locally
```

---

## Existing Documentation Files

| File | Description |
|---|---|
| `CLOUDINARY_SETUP.md` | Cloudinary account setup, upload preset config, image optimization, security notes |
| `FIREBASE_SECURITY_ARCHITECTURE.md` | Complete Firebase security architecture (465 lines): schema design, security rules, best practices, checklist |
| `database.rules.json` | Firebase Realtime Database security rules (80 lines) |
| `adminreport_db_structure.json` | Sample LGU vaccination report structure |

---

## Notable Notes

1. **No TypeScript** -- Entire codebase is plain JavaScript (`.js` / `.jsx`)
2. **No tests** -- Testing library dependencies are present but no test files exist
3. **Dual Firebase initialization** -- `src/firebaseConfig.js` (with Analytics) and `src/services/firebase.js` (without Analytics); imports are inconsistent
4. **Schema mismatch** -- `migrate-database.js` targets a new schema, but the app still uses the old one
5. **Merge conflict in .gitignore** -- Unresolved `<<<<<<< HEAD` / `=======` markers
6. **Tailwind v4 + Flowbite** -- `tailwind.config.js` references `flowbite/plugin` but Flowbite is not in dependencies; the config may be unused since Tailwind v4 uses the Vite plugin directly
7. **Philippine localization** -- Barangay selection (15 barangays in Pilar, Bataan), government vaccine sources (BAI, DARFO, PLGU, MLGU, DOH), LGU-focused reports
8. **Largest component** -- `AdminPetManagement.jsx` at 2,606 lines
9. **Backend URL unused** -- `.env` contains `REACT_APP_BACKEND_URL` but it is not referenced in any source file
