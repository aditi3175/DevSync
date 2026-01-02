import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MonitorForm from "../components/MonitorForm.jsx";
import api from "../api.js";
import {
  ArrowLeft,
  AlertCircle,
  Settings,
  Terminal,
  Loader,
} from "lucide-react";

const MonitorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      const fetchMonitorData = async () => {
        try {
          const response = await api.get(`/api/monitors/${id}`);
          setInitialData(response.data.monitor);
          setFetchError(null);
        } catch (err) {
          console.error("Failed to fetch monitor for editing:", err);
          setFetchError(
            err.response?.data?.message || "Could not load monitor data."
          );
          setInitialData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchMonitorData();
    }
  }, [isEditing, id]);

  const handleSuccess = (monitor) => {
    // Navigation happens in MonitorForm component.
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-sans text-slate-300 relative selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        {/* Subtle glow for focus */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-900/10 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Navigation / Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors group uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Return_To_Base</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-slate-600 border border-slate-800 rounded px-2 py-1 bg-[#0a0a0c]">
            <span>SESSION_ID:</span>
            <span className="text-slate-400">
              {isEditing ? id : "NEW_INSTANCE"}
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Settings className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isEditing ? "Modify Protocol" : "Initialize New Monitor"}
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-mono pl-[3.25rem]">
            {isEditing
              ? ">> Updating configuration parameters for existing node."
              : ">> Establish connection parameters for a new tracking endpoint."}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-800 rounded-xl bg-[#0a0a0c]/50">
            <Loader className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
            <p className="text-cyan-500/80 text-sm font-mono animate-pulse">
              RETRIEVING_CONFIG_DATA...
            </p>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 mb-8 flex items-start gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-400 font-mono mb-1 uppercase tracking-wider">
                Data Retrieval Failure
              </h3>
              <p className="text-red-300/80 text-sm mb-4 font-mono">
                {fetchError}
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors text-xs font-mono uppercase"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Abort Sequence</span>
              </Link>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {isEditing && !loading && !initialData && !fetchError && (
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-xl p-6 mb-8 flex items-start gap-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-yellow-400 font-mono mb-1 uppercase tracking-wider">
                Target Not Found
              </h3>
              <p className="text-yellow-300/80 text-sm mb-4 font-mono">
                The requested monitor ID does not exist in the registry.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 rounded-lg transition-colors text-xs font-mono uppercase"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* Form Container */}
        {!loading && !fetchError && (!isEditing || initialData) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* This container gives a 'panel' look to the form inside */}
            <div className="bg-[#131316] border border-white/5 rounded-xl shadow-2xl shadow-black/50 overflow-hidden relative">
              {/* Decorative Top Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600"></div>

              <div className="p-1">
                <MonitorForm
                  monitorId={id}
                  initialData={isEditing ? initialData : null}
                  onSuccess={handleSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitorFormPage;
