# Firebase Authentication Setup Guide

## The Problem with Your Teammate's Code

They're creating users but **NOT getting/setting the Firebase ID token**, which is why Cloudflare Worker rejects the requests. Firebase auth requires:

1. ✅ Create/login user
2. ❌ **MISSING: Get ID token**
3. ❌ **MISSING: Set token in API service**

## Proper Firebase Auth Flow

### 1. **authService.js** - The Core Auth Logic

**Key Points:**
- `onAuthStateChanged()` listener - Automatically gets token when auth state changes
- `getIdToken()` - Gets Firebase ID token
- `apiService.setAuthToken(token)` - Sets token for ALL API calls

```javascript
// CRITICAL: This runs automatically when user signs in/out
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(); // ← GET TOKEN
    apiService.setAuthToken(token);         // ← SET TOKEN
  }
});
```

### 2. **AuthForm.jsx** - Login/Signup UI

Simple form that calls `authService.login()` or `authService.register()`. The authService handles tokens automatically.

### 3. **App.jsx** - Main App with Auth Gate

- Shows login form if not authenticated
- Shows main app if authenticated
- Has logout button

### 4. **Firebase Config** - Environment Variables

Add to your `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## What Changed vs Your Teammate's Code

### ❌ Their Version (BROKEN):
```javascript
// Just creates user, never gets token
await createUserWithEmailAndPassword(auth, email, password);
// No token = Cloudflare Worker rejects requests
```

### ✅ Correct Version:
```javascript
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// GET THE TOKEN!
const token = await user.getIdToken();

// SET THE TOKEN!
apiService.setAuthToken(token);

// Now all API calls work!
```

## How It Works End-to-End

1. **User registers/logs in** → Firebase Auth creates session
2. **authService gets ID token** → `user.getIdToken()`
3. **authService sets token** → `apiService.setAuthToken(token)`
4. **Every API call includes token** → `Authorization: Bearer <token>`
5. **Cloudflare Worker verifies token** → Extracts user ID
6. **Data saved to D1** → With correct `user_id`

## Files Created

- ✅ [src/services/authService.js](src/services/authService.js) - Complete auth logic with token handling
- ✅ [src/config/firebase.js](src/config/firebase.js) - Firebase initialization
- ✅ [src/components/AuthForm.jsx](src/components/AuthForm.jsx) - Login/signup UI
- ✅ [App.jsx](App.jsx) - Updated with auth gate

## Installation

```bash
npm install firebase
```

## Tell Your Teammate

"The key issue is that you need to call `user.getIdToken()` after authentication and pass it to `apiService.setAuthToken(token)`. I've created the proper authService.js that does this automatically. Use that instead."
