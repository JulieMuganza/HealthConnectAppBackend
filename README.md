# Doctor-Patient Backend

Fully implemented backend for the Doctor-Patient Messaging App.

## 1. Setup

Install dependencies:
```bash
npm install
```

## 2. Environment

Ensure your `.env` file is set up:
```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/healthconnect?schema=public"
PORT=3000
JWT_SECRET="your_super_secret_key_123"
```

## 3. Database Migration

Initialize the database schema:
```bash
npx prisma migrate dev --name init
```

## 4. Run

Start the server:
```bash
node src/server.js
```
The server runs on `http://localhost:3000`.

## 5. Folder Structure
- `src/controllers`: Logic for Auth, Dashboard, Messaging, Profiles.
- `src/routes`: API definitions.
- `src/middleware`: Auth and Error handling.
- `src/prisma`: Database client.
- `src/app.js`: Express app setup.
- `src/server.js`: Server entry point.
