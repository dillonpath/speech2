import React from "react";
import { Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import "./AuthPages.css";

export default function LoginPage({ onAuth }) {
  return (
    <div className="auth-container">
      <div className="auth-card glass-effect">
        <h1 className="app-title">Social X-Ray</h1>
        <p className="app-subtitle">Real-time conversation coaching</p>
        <AuthForm mode="login" onAuthSuccess={onAuth} />
        <p className="switch-text">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
