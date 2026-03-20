
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Messages (Local Version)

This is a modified version of the Gemini Messages clone with Firebase removed. It now uses browser **localStorage** to persist your conversations and settings locally.

## Features
- **Firebase-free**: No external database connection required.
- **Local Storage**: All data is stored in your browser's local storage.
- **Full Functionality**: All features (chatting, archiving, settings, etc.) remain intact.
- **Mock Auth**: A simulated login experience that works entirely offline.

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set the Gemini API key:**
   Create a `.env` file (if it doesn't exist) and set your `GEMINI_API_KEY`.

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Changes Made
- Replaced Firebase SDK with a custom mock implementation in `firebase.ts`.
- Removed Firebase-related configuration files and guides.
- Updated components to use the local mock implementation.
- Cleaned up dependencies in `package.json`.
