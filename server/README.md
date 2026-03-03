# PetGuard Admin Server

## Setup (local dev)

1. Install deps:
   - npm install

2. Create `server/.env` (based on `.env.example`):
   - FIREBASE_DATABASE_URL=...

3. Download a Firebase service account JSON and set:
   - GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\serviceAccount.json"

4. Run:
   - npm run dev

## Auth

All endpoints require an **ID token** from the frontend:

- Header: `Authorization: Bearer <FIREBASE_ID_TOKEN>`

Server verifies the token and then checks Realtime DB:

- `users/{uid}/role === "vet"`

Only then it allows admin actions.

## Endpoints

- `POST /api/admin/owners/check-email`
- `POST /api/admin/owners/create`
- `POST /api/admin/owners/activate`
