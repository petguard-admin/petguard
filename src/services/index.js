// Firebase Services Index
// Centralized export of all Firebase-based services for the monolithic architecture

export { auth, database, storage, default as app } from './firebase';
export { authService } from './authService';
export { ownerService } from './ownerService';
export { petService } from './petService';
export { medicalRecordService } from './medicalRecordService';
export { adminService } from './adminService';
export { cloudinaryService } from './cloudinaryService';

// Default exports for convenience
export { default as firebase } from './firebase';
export { default as authServiceDefault } from './authService';
export { default as ownerServiceDefault } from './ownerService';
export { default as petServiceDefault } from './petService';
export { default as medicalRecordServiceDefault } from './medicalRecordService';
export { default as adminServiceDefault } from './adminService';
export { default as cloudinaryServiceDefault } from './cloudinaryService';
