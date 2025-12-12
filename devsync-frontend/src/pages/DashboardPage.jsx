import React, { useState, useEffect, useCallback } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom"; // useNavigate added for robustness
import {
  Activity,
  Trash2,
  Eye,
  Edit3,
  Plus,
  LogOut,
  Settings,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";

// Utility function to format date/time 
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
};


const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [monitors, setMonitors] = useState([]);
  const [filteredMonitors, setFilteredMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      // Ctrl/Cmd + N for new monitor
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        navigate("/monitor/new"); // Use navigate instead of window.location
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]); // navigate dependency added

  const fetchMonitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/monitors");
      setMonitors(response.data.monitors || []);
    } catch (err) {
      console.error("Failed to fetch monitors:", err);
      setError("Failed to load monitors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // Filter and search
  useEffect(() => {
    let filtered = monitors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.lastStatus === statusFilter);
    }

    // Enabled filter
    if (enabledFilter !== "all") {
      filtered = filtered.filter(
        (m) => m.enabled === (enabledFilter === "enabled")
      );
    }

    setFilteredMonitors(filtered);
    setCurrentPage(1);
  }, [monitors, searchQuery, statusFilter, enabledFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMonitors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMonitors = filteredMonitors.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleDelete = async (monitorId) => {
    const confirmDelete = window.confirm(
      "⚠️  Are you sure you want to delete this monitor? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    setDeleteLoading(monitorId);

    try {
      await api.delete(`/api/monitors/${monitorId}`);
      setMonitors((prev) => prev.filter((m) => m._id !== monitorId));
      setSuccessMessage("✅ Monitor deleted successfully!");
    } catch (err) {
      console.error("Failed to delete monitor:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to delete monitor. Try again.";
      alert(`❌ ${errorMsg}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "up":
        return "bg-green-50 dark:bg-green-500/10";
      case "down":
        return "bg-red-50 dark:bg-red-500/10";
      default:
        return "bg-gray-50 dark:bg-gray-500/10";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "up":
        return "text-green-700 dark:text-green-400";
      case "down":
        return "text-red-700 dark:text-red-400";
      default:
        return "text-gray-700 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Loading Dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800/50 backdrop-blur-md bg-white/30 dark:bg-slate-950/30">
          <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 dark:from-blue-400 to-purple-600 dark:to-purple-400 bg-clip-text text-transparent">
                DevSync
              </h1>
            </div>

            <div className="flex items-center space-x-4">

              <Link
                to="/settings"
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800/50 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                onClick={logout}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-12">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-lg animate-in fade-in duration-300">
              {successMessage}
            </div>
          )}

          {/* Page Title & Action */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Your Monitors
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {filteredMonitors.length} of {monitors.length} monitor
                {monitors.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              to="/monitor/new"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              title="Cmd/Ctrl + N"
            >
              <Plus className="w-5 h-5" />
              <span>Add Monitor</span>
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                id="search-input"
                type="text"
                placeholder="Search monitors by name or URL... (Cmd/Ctrl + K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="up">🟢 Up</option>
                  <option value="down">🔴 Down</option>
                  <option value="unknown">⚪ Unknown</option>
                </select>
              </div>

              <select
                value={enabledFilter}
                onChange={(e) => setEnabledFilter(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Monitors</option>
                <option value="enabled">✅ Enabled</option>
                <option value="disabled">❌ Disabled</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Empty State */}
          {filteredMonitors.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
                No monitors found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchQuery ||
                statusFilter !== "all" ||
                enabledFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first monitor to get started"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                enabledFilter === "all" && (
                  <Link
                    to="/monitor/new"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create First Monitor</span>
                  </Link>
                )}
            </div>
          ) : (
            <>
              {/* Monitors Grid */}
              <div className="grid gap-4 mb-8">
                {paginatedMonitors.map((monitor) => (
                  <div
                    key={monitor._id}
                    className={`group backdrop-blur-md bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-600/50 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Side */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            monitor.lastStatus === "up"
                              ? "bg-green-500 animate-pulse"
                              : monitor.lastStatus === "down"
                              ? "bg-red-500 animate-pulse"
                              : "bg-gray-500"
                          }`}
                        ></div>

                        <div className="flex-1">
                          <Link
                            to={`/monitor/${monitor._id}`}
                            className="text-lg font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {monitor.name || monitor.url}
                          </Link>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                            {monitor.url}
                          </p>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            monitor.lastStatus
                          )} ${getStatusTextColor(monitor.lastStatus)}`}
                        >
                          {monitor.lastStatus.toUpperCase()}
                        </div>

                        <div className="hidden md:flex items-center space-x-6 pl-4 border-l border-slate-300 dark:border-slate-700">
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Frequency
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {monitor.frequencyMinutes}m
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Response
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {monitor.lastResponseTime
                                ? `${monitor.lastResponseTime}ms`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Last Check
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {monitor.lastCheckedAt
                                ? formatDate(
                                    monitor.lastCheckedAt
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          to={`/monitor/${monitor._id}`}
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/monitor/${monitor._id}/edit`}
                          className="p-2 hover:bg-purple-100 dark:hover:bg-purple-500/10 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                          title="Edit"
                        >
                          <Edit3 className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(monitor._id)}
                          disabled={deleteLoading === monitor._id}
                          className={`p-2 rounded-lg transition-colors text-slate-600 dark:text-slate-400 ${
                            deleteLoading === monitor._id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                          }`}
                          title="Delete"
                        >
                          {deleteLoading === monitor._id ? (
                            <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredMonitors.length
                    )}{" "}
                    of {filteredMonitors.length} monitors
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-500 text-white"
                                : "hover:bg-slate-200 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
