import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import apiService from './apiService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initAuthListener();
  }

  // CRITICAL: Listen to auth state changes and update token
  initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;

        // Get Firebase ID token and set it in API service
        const token = await user.getIdToken();
        apiService.setAuthToken(token);

        console.log('User authenticated:', user.uid);
      } else {
        this.currentUser = null;
        apiService.setAuthToken(null);
        console.log('User signed out');
      }
    });
  }

  // Register new user
  async register(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get token immediately after registration
      const token = await user.getIdToken();
      apiService.setAuthToken(token);

      return {
        uid: user.uid,
        email: user.email
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Login existing user
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get token immediately after login
      const token = await user.getIdToken();
      apiService.setAuthToken(token);

      return {
        uid: user.uid,
        email: user.email
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      apiService.setAuthToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Refresh token (call this periodically or before important API calls)
  async refreshToken() {
    if (this.currentUser) {
      const token = await this.currentUser.getIdToken(true); // force refresh
      apiService.setAuthToken(token);
      return token;
    }
    return null;
  }

  // Helper: Get user-friendly error messages
  getErrorMessage(errorCode) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Try again later'
    };
    return messages[errorCode] || 'Authentication error occurred';
  }
}

export default new AuthService();
