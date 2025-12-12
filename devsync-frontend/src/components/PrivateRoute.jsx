import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  // Loading State Handle.
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Main Logic
  if (isAuthenticated) {
    return <Outlet />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;
