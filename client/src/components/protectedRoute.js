import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />; // redirect to login
  }

  return children; // render the protected component
};

export default ProtectedRoute;
