import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import MonitorForm from "../components/MonitorForm.jsx";
import api from "../api.js";
import { ArrowLeft, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            {isEditing ? "Edit Monitor" : "Create New Monitor"}
          </h1>
          <p className="text-slate-400">
            {isEditing
              ? "Update your monitoring configuration"
              : "Set up a new monitor to track your service"}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-300 text-lg">Loading Monitor Data...</p>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Error Loading Monitor
                </h3>
                <p className="text-red-300 mb-4">{fetchError}</p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {isEditing && !loading && !initialData && !fetchError && (
          <div className="backdrop-blur-md bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8 mb-8">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  Monitor Not Found
                </h3>
                <p className="text-yellow-300 mb-4">
                  Unable to load monitor data. Please try again or go back.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && !fetchError && (!isEditing || initialData) && (
          <div className="animate-in fade-in duration-300">
            <MonitorForm
              monitorId={id}
              initialData={isEditing ? initialData : null}
              onSuccess={handleSuccess}
            />
          </div>
        )}
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

export default MonitorFormPage;
