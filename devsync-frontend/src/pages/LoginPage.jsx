import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import {
  Activity,
  Mail,
  Lock,
  ArrowRight,
  Loader,
  Terminal,
  Cpu,
} from "lucide-react";

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated.
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const { accessToken, user } = response.data;
      login(accessToken, user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* --- Techie Grid Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Subtle Ambient Glow */}
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Decorative Top Label */}
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
            System Secure
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            v2.4.0-stable
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#131316]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] overflow-hidden">
          {/* Top Gradient Line */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 shadow-lg mb-4 group relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <Activity className="w-7 h-7 text-cyan-400 relative z-10" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  DevSync
                </span>
                <span className="text-cyan-500">.io</span>
              </h1>
              <p className="text-slate-400 text-sm font-mono">
                Initialize Session
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 rounded flex items-center gap-3 text-red-400 text-xs font-mono">
                <Terminal className="w-4 h-4" />
                <span>Error: {error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-cyan-500/80 uppercase tracking-wider ml-1">
                  User ID / Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@devsync.io"
                    className="relative z-10 w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-mono text-cyan-500/80 uppercase tracking-wider">
                    Access Key
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors z-10" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="relative z-10 w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="flex items-center justify-center space-x-2 relative z-10">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="font-mono text-sm">CONNECTING...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-sm">AUTHENTICATE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer / Register */}
            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-slate-500 text-xs mb-3">
                New device detected?
              </p>
              <Link
                to="/register"
                className="inline-flex items-center text-xs font-mono text-cyan-500 hover:text-cyan-400 transition-colors border border-cyan-900/50 bg-cyan-950/20 px-3 py-1.5 rounded hover:border-cyan-500/50"
              >
                <Cpu className="w-3 h-3 mr-2" />
                INIT_REGISTRATION_PROTOCOL
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
