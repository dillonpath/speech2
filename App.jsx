import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./src/pages/LoginPage.jsx";
import SignupPage from "./src/pages/SignupPage.jsx";
import HomePage from "./src/pages/HomePage.jsx";
import authService from "./src/services/authService";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = setInterval(() => {
      if (authService.isInitialized) {
        setIsAuthenticated(!!authService.getCurrentUser());
        setLoading(false);
        clearInterval(checkUser);
      }
    }, 200);
    return () => clearInterval(checkUser);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          background: "#0f2027",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage onAuth={() => setIsAuthenticated(true)} />} />
            <Route path="/signup" element={<SignupPage onAuth={() => setIsAuthenticated(true)} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<HomePage onLogout={() => setIsAuthenticated(false)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
