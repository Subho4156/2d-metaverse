// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import SignUp from "./auth/SignUp";
import Home from "./pages/home";
import ProtectedRoute from "./components/protectedRoute";
import MetaverseWorld from "./pages/MetaverseWorld";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/space/:id" element={
          <ProtectedRoute>
            <MetaverseWorld />
          </ProtectedRoute>
        } 
          />
      </Routes>
    </Router>
  );
}

export default App;
