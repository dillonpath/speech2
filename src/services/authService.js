import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../config/firebase";
import apiService from "./apiService";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false; // helps us wait before rendering routes
    this.initAuthListener();
  }

  /** 🔐 Listen to Firebase auth state changes */
  initAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user;
        const token = await user.getIdToken();
        apiService.setAuthToken(token);
        console.log("✅ User authenticated:", user.email);
      } else {
        this.currentUser = null;
        apiService.setAuthToken(null);
        console.log("🚪 User signed out");
      }
      this.isInitialized = true;
    });
  }

  /** 🧠 Register a new user */
  async register(email, password) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      apiService.setAuthToken(token);

      this.currentUser = user;
      return { uid: user.uid, email: user.email };
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /** 🔑 Login existing user */
  async login(email, password) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
      apiService.setAuthToken(token);

      this.currentUser = user;
      return { uid: user.uid, email: user.email };
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /** 🚪 Logout current user */
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      apiService.setAuthToken(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /** 👤 Get the current authenticated user */
  getCurrentUser() {
    return this.currentUser;
  }

  /** ♻️ Force token refresh */
  async refreshToken() {
    if (this.currentUser) {
      const token = await this.currentUser.getIdToken(true);
      apiService.setAuthToken(token);
      return token;
    }
    return null;
  }

  /** ⚠️ Friendly error messages */
  getErrorMessage(errorCode) {
    const messages = {
      "auth/email-already-in-use": "This email is already registered",
      "auth/invalid-email": "Invalid email address",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/too-many-requests": "Too many failed attempts. Try again later",
    };
    return messages[errorCode] || "Authentication error occurred";
  }
}

export default new AuthService();
