import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ArrowLeft,
  Bell,
  Mail,
  Clock,
  Save,
  X,
  Shield,
  Terminal,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

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
      setSuccess(response.data.message || "✅ CONFIGURATION_UPDATED");
    } catch (err) {
      const msg = err.response?.data?.message || "Update sequence failed.";
      setError(`❌ ERROR: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-500/80 animate-pulse text-sm">
            LOADING_CONFIG...
          </p>
        </div>
      </div>
    );
  }

  const currentSettings = settings || {};

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-sans text-slate-300 relative">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>Return_To_Base</span>
          </Link>
          <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-1 bg-[#0a0a0c]">
            <span>SYS_CONFIG</span>
            <span className="text-slate-400">V1.0.4</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <Shield className="w-6 h-6 text-slate-200" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              System Preferences
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-mono pl-[3.25rem]">
             Configure notification protocols and alert thresholds.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 rounded font-mono text-xs text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded font-mono text-xs text-emerald-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Module */}
          <div className="bg-[#131316] border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-500" />
                Identity_Protocol
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                READ_ONLY
              </span>
            </div>

            <div className="p-6">
              <label className="text-xs font-mono text-slate-500 uppercase mb-2 block">
                Alert Recipient
              </label>
              <div className="flex items-center gap-3 bg-[#0a0a0c] border border-white/10 p-3 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                <span className="text-slate-200 font-mono text-sm">
                  {currentSettings.email || user?.email || "NO_EMAIL_BOUND"}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-2 font-mono">
                * Critical system alerts will be dispatched to this endpoint.
              </p>
            </div>
          </div>

          {/* Alert Configuration Module */}
          <div className="bg-[#131316] border border-white/5 rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-600 to-transparent"></div>

            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-500" />
                Notification_Logic
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 bg-[#0a0a0c] border border-white/10 rounded-lg group hover:border-cyan-500/30 transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    Global Alert System
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Master override for all outbound notifications.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="alertsEnabled"
                    checked={currentSettings.alertsEnabled}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                </label>
              </div>

              {/* Sub Options */}
              <div
                className={`space-y-4 pl-4 border-l border-white/10 ml-2 transition-opacity duration-300 ${
                  currentSettings.alertsEnabled
                    ? "opacity-100"
                    : "opacity-40 pointer-events-none filter blur-[1px]"
                }`}
              >
                {/* Alert Down */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-red-500/10 rounded border border-red-500/20 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm text-slate-200">
                        Failure Detection
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Trigger alert on connection loss (DOWN).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="alertOnDown"
                      checked={currentSettings.alertOnDown}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-gray-300 after:border after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* Alert Up */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm text-slate-200">
                        Recovery Detection
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Trigger alert on connection restored (UP).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="alertOnUp"
                      checked={currentSettings.alertOnUp}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-gray-300 after:border after:rounded-sm after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cooldown Module */}
          <div className="bg-[#131316] border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Rate_Limiting
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <label
                  htmlFor="cooldownMinutes"
                  className="text-sm text-slate-300 font-semibold"
                >
                  Cooldown Period
                </label>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-500/20">
                  {currentSettings.cooldownMinutes || 10} MIN
                </span>
              </div>

              <input
                type="range"
                name="cooldownMinutes"
                id="cooldownMinutes"
                value={currentSettings.cooldownMinutes || 10}
                onChange={handleChange}
                min="1"
                max="120"
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-2">
                <span>1 MIN</span>
                <span>120 MIN</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 font-mono">
                * Minimum interval between identical alerts to prevent flooding.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-4 pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving || loading}
              className="flex-1 group relative overflow-hidden py-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="flex items-center justify-center space-x-2 relative z-10">
                {saving ? (
                  <span className="font-mono text-sm">SAVING...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="font-mono text-sm">
                      SAVE_CONFIGURATION
                    </span>
                  </>
                )}
              </div>
            </button>

            <Link
              to="/dashboard"
              className="px-6 py-3 border border-white/10 hover:border-white/20 bg-[#131316] text-slate-400 hover:text-white rounded-lg transition-colors flex items-center justify-center font-mono text-sm"
            >
              CANCEL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
