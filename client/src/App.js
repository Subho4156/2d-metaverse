// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import SignUp from "./auth/SignUp";
import Home from "./pages/home";
import ProtectedRoute from "./components/protectedRoute";
import MetaverseRouter from "./pages/MetaverseRouter";
import OTPVerification from "./auth/OTPVerification";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/otp" element={<OTPVerification />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/:id"
          element={
            <ProtectedRoute>
              <MetaverseRouter />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
