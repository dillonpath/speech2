import React from "react";
import { Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import "./AuthPages.css";

export default function SignupPage({ onAuth }) {
  return (
    <div className="auth-container">
      <div className="auth-card glass-effect">
        <h1 className="app-title">Create Account</h1>
        <p className="app-subtitle">Join Social X-Ray</p>
        <AuthForm mode="signup" onAuthSuccess={onAuth} />
        <p className="switch-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
