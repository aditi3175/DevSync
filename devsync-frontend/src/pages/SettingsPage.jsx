import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ArrowLeft, Bell, Mail, Clock } from "lucide-react";

// Settings Page Component
const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/user/notifications");
        setSettings(response.data.settings);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Failed to load notification settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess("");

    try {
      const payload = {
        alertsEnabled: settings.alertsEnabled,
        alertOnDown: settings.alertOnDown,
        alertOnUp: settings.alertOnUp,
        cooldownMinutes: settings.cooldownMinutes,
      };

      const response = await api.put("/api/user/notifications", payload);
      setSettings(response.data.settings);
      setSuccess(response.data.message || "✅ Settings saved successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save settings.";
      setError(`❌ ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Settings...</p>
        </div>
      </div>
    );
  }

  const currentSettings = settings || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your notification preferences</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 backdrop-blur-sm animate-in fade-in duration-300">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Info Card */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Mail className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Account Email</h2>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <p className="text-slate-400 text-sm mb-2">Alert Recipient</p>
              <p className="text-xl font-semibold text-white">
                {currentSettings.email || user?.email || "No email set"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Notifications will be sent to this email address
              </p>
            </div>
          </div>

          {/* Notification Preferences Card */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">
                Notification Preferences
              </h2>
            </div>

            {/* Master Toggle */}
            <div className="mb-6 p-6 bg-slate-900/30 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Enable All Alerts
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Master switch for all notifications
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    name="alertsEnabled"
                    id="alertsEnabled"
                    checked={currentSettings.alertsEnabled}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="alertsEnabled"
                    className={`block w-14 h-8 rounded-full cursor-pointer transition-colors ${
                      currentSettings.alertsEnabled
                        ? "bg-blue-500"
                        : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`block w-7 h-7 rounded-full bg-white shadow-md transform transition-transform ${
                        currentSettings.alertsEnabled ? "translate-x-7" : ""
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Alert Type Toggles */}
            <div
              className={`space-y-4 transition-opacity ${
                currentSettings.alertsEnabled
                  ? ""
                  : "opacity-50 pointer-events-none"
              }`}
            >
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Alert Types
              </h3>

              {/* Alert on Down */}
              <div className="p-6 bg-slate-900/30 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      🚨 Alert on Monitor Down
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Notify me when a monitor fails
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="alertOnDown"
                      id="alertOnDown"
                      checked={currentSettings.alertOnDown}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="alertOnDown"
                      className={`block w-14 h-8 rounded-full cursor-pointer transition-colors ${
                        currentSettings.alertOnDown
                          ? "bg-red-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`block w-7 h-7 rounded-full bg-white shadow-md transform transition-transform ${
                          currentSettings.alertOnDown ? "translate-x-7" : ""
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Alert on Up */}
              <div className="p-6 bg-slate-900/30 rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">
                      ✅ Alert on Monitor Recovery
                    </h4>
                    <p className="text-slate-400 text-sm">
                      Notify me when a monitor comes back online
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="alertOnUp"
                      id="alertOnUp"
                      checked={currentSettings.alertOnUp}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="alertOnUp"
                      className={`block w-14 h-8 rounded-full cursor-pointer transition-colors ${
                        currentSettings.alertOnUp
                          ? "bg-green-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`block w-7 h-7 rounded-full bg-white shadow-md transform transition-transform ${
                          currentSettings.alertOnUp ? "translate-x-7" : ""
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cooldown Card */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Alert Cooldown</h2>
            </div>

            <div className="p-6 bg-slate-900/30 rounded-xl border border-slate-700/50">
              <label htmlFor="cooldownMinutes" className="block mb-3">
                <span className="text-lg font-semibold text-white mb-2 block">
                  Cooldown Period
                </span>
                <p className="text-slate-400 text-sm mb-4">
                  Minimum time to wait before sending the same alert again. This
                  prevents notification spam.
                </p>
              </label>

              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  name="cooldownMinutes"
                  id="cooldownMinutes"
                  value={currentSettings.cooldownMinutes || 10}
                  onChange={handleChange}
                  min="1"
                  max="1440"
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="min-w-fit px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <span className="text-lg font-bold text-blue-400">
                    {currentSettings.cooldownMinutes || 10}m
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4">
                Range: 1 minute to 24 hours (recommended: 10-60 minutes)
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            <Link
              to="/dashboard"
              className="flex-1 py-4 px-6 backdrop-blur-md bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 text-white font-semibold rounded-lg transition-all text-center"
            >
              Cancel
            </Link>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm">
            <p>
              <strong>ℹ️ Note:</strong> These settings control how often you
              receive email notifications. Your monitors will continue running
              regardless of these settings.
            </p>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
