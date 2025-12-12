import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MonitorFormPage from "./pages/MonitorFormPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import MonitorDetailPage from "./pages/MonitorDetailPage.jsx";

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/monitor/new" element={<MonitorFormPage />} />
          <Route path="/monitor/:id/edit" element={<MonitorFormPage />} />
          <Route path="/monitor/:id" element={<MonitorDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </div>
  );
}

export default App;
