import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Activity,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader,
  CheckCircle,
  Terminal,
  ShieldCheck,
} from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated.
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/register", formData);
      setSuccess("User registration sequence complete. Redirecting...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
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
        <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 w-full max-w-[450px]">
        {/* Decorative Top Label */}
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System Registration
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            ID: NULL-PTR
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-[#131316]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)] overflow-hidden">
          {/* Top Gradient Line */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>

          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 shadow-lg mb-4 group relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <Activity className="w-7 h-7 text-emerald-400 relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
                <span className="text-emerald-500">INIT</span>_ACCOUNT
              </h2>
              <p className="text-slate-400 text-xs font-mono mt-2">
                Create new administrator access point
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 rounded flex items-center gap-3 text-red-400 text-xs font-mono animate-in fade-in">
                <Terminal className="w-4 h-4 flex-shrink-0" />
                <span>Error: {error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded flex items-center gap-3 text-emerald-400 text-xs font-mono animate-in fade-in">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider ml-1"
                >
                  Full Identity
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-10" />
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="JOHN DOE"
                    className="relative z-10 w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider ml-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-10" />
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@devsync.io"
                    className="relative z-10 w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-mono text-emerald-500/80 uppercase tracking-wider ml-1"
                >
                  Set Password (Min 8)
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-10" />
                  <input
                    type="password"
                    name="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="relative z-10 w-full pl-10 pr-4 py-3 bg-[#0a0a0c] border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="flex items-center justify-center space-x-2 relative z-10">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="font-mono text-sm">PROCESSING...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-sm">
                        EXECUTE REGISTRATION
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-[#16161a] text-[10px] text-slate-500 font-mono uppercase">
                  Existing User
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="w-full group py-3 px-4 border border-slate-700/50 hover:border-emerald-500/50 bg-slate-900/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 text-xs font-mono"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>RETURN_TO_LOGIN</span>
            </Link>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-600 font-mono">
                By executing, you agree to Protocol Terms & Privacy Policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
