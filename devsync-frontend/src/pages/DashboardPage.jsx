import React, { useState, useEffect, useCallback } from "react";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
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
  Server,
  Clock,
  Zap,
  Signal,
} from "lucide-react";

// Utility function to format date/time
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    fontFamily: "monospace", // Enforce mono for dates in the UI
  });
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
        navigate("/monitor/new");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

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
      "⚠️ SYSTEM WARNING: Confirm deletion of this monitor protocol? This action is irreversible."
    );

    if (!confirmDelete) {
      return;
    }

    setDeleteLoading(monitorId);

    try {
      await api.delete(`/api/monitors/${monitorId}`);
      setMonitors((prev) => prev.filter((m) => m._id !== monitorId));
      setSuccessMessage("✅ Monitor protocol terminated successfully.");
    } catch (err) {
      console.error("Failed to delete monitor:", err);
      const errorMsg =
        err.response?.data?.message || "Deletion failed. Retry sequence.";
      alert(`❌ ${errorMsg}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "up":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "down":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-500/80 text-sm tracking-widest animate-pulse">
            INITIALIZING DASHBOARD...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-sans text-slate-300 relative selection:bg-cyan-500/30 selection:text-cyan-100">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            {/* Logo Area */}
            <div className="flex items-center space-x-3 group cursor-default">
              <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                <Activity className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  DevSync{" "}
                  <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">
                    PRO
                  </span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    System Active
                  </span>
                </div>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center space-x-2">
              <Link
                to="/settings"
                className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                onClick={logout}
                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {/* Success Notification */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-400 text-sm font-mono flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
              {successMessage}
            </div>
          )}

          {/* Title & Add Button */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Active Monitors
              </h2>
              <p className="text-slate-500 text-sm font-mono">
                <span className="text-cyan-400">{filteredMonitors.length}</span>{" "}
                endpoints tracking /{" "}
                <span className="text-slate-600">
                  {monitors.length} total configured
                </span>
              </p>
            </div>

            <Link
              to="/monitor/new"
              className="group relative overflow-hidden px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/20"
              title="Cmd/Ctrl + N"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="flex items-center space-x-2 relative z-10">
                <Plus className="w-4 h-4" />
                <span className="font-mono text-sm">INITIALIZE MONITOR</span>
              </div>
            </Link>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="mb-8 p-1 bg-[#131316] border border-white/5 rounded-xl flex flex-col md:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="search-input"
                type="text"
                placeholder="Search protocols... (Cmd+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0c] border border-transparent focus:border-cyan-500/30 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 font-mono text-sm transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-[#0a0a0c] border border-transparent hover:border-white/5 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/20 appearance-none font-mono cursor-pointer min-w-[140px]"
                >
                  <option value="all">Status: ALL</option>
                  <option value="up">Status: UP</option>
                  <option value="down">Status: DOWN</option>
                  <option value="unknown">Status: NULL</option>
                </select>
              </div>

              <select
                value={enabledFilter}
                onChange={(e) => setEnabledFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0a0a0c] border border-transparent hover:border-white/5 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/20 appearance-none font-mono cursor-pointer"
              >
                <option value="all">Type: ALL</option>
                <option value="enabled">Active Only</option>
                <option value="disabled">Paused Only</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg font-mono text-sm mb-6">
              SYSTEM ERROR: {error}
            </div>
          )}

          {/* Empty State */}
          {filteredMonitors.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl bg-white/0">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">
                NO_DATA_STREAM
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery ||
                statusFilter !== "all" ||
                enabledFilter !== "all"
                  ? "Search parameters yielded no results. Adjust filters."
                  : "Monitor queue is empty. Initialize a new check to begin data collection."}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                enabledFilter === "all" && (
                  <Link
                    to="/monitor/new"
                    className="inline-flex items-center space-x-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-all font-mono text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>CREATE_FIRST_NODE</span>
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
                    className="group relative bg-[#131316]/60 backdrop-blur-sm border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden"
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left Side: Info */}
                      <div className="flex items-start md:items-center space-x-4 flex-1 min-w-0">
                        {/* Status Orb */}
                        <div className="mt-1 md:mt-0 relative">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              monitor.lastStatus === "up"
                                ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                : monitor.lastStatus === "down"
                                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                : "bg-slate-500"
                            }`}
                          ></div>
                          {monitor.lastStatus === "up" && (
                            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <Link
                              to={`/monitor/${monitor._id}`}
                              className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors truncate"
                            >
                              {monitor.name || "Untitled Node"}
                            </Link>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${getStatusColor(
                                monitor.lastStatus
                              )}`}
                            >
                              {monitor.lastStatus}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 font-mono truncate flex items-center gap-2">
                            <Server className="w-3 h-3" />
                            {monitor.url}
                          </p>
                        </div>
                      </div>

                      {/* Right Side: Metrics & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pl-7 md:pl-0">
                        {/* Metrics Grid */}
                        <div className="flex gap-6 border-l border-white/5 pl-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Freq
                            </span>
                            <span className="text-sm font-mono text-slate-300">
                              {monitor.frequencyMinutes}m
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Ping
                            </span>
                            <span
                              className={`text-sm font-mono ${
                                monitor.lastResponseTime > 1000
                                  ? "text-yellow-500"
                                  : "text-slate-300"
                              }`}
                            >
                              {monitor.lastResponseTime
                                ? `${monitor.lastResponseTime}ms`
                                : "--"}
                            </span>
                          </div>
                          <div className="hidden lg:flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-0.5 flex items-center gap-1">
                              <Signal className="w-3 h-3" /> Last Check
                            </span>
                            <span className="text-sm font-mono text-slate-300">
                              {monitor.lastCheckedAt
                                ? formatDate(monitor.lastCheckedAt).split(
                                    ","
                                  )[1]
                                : "--"}
                            </span>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center space-x-1 bg-black/20 rounded-lg p-1 border border-white/5">
                          <Link
                            to={`/monitor/${monitor._id}`}
                            className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-500 rounded transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/monitor/${monitor._id}/edit`}
                            className="p-2 hover:bg-indigo-500/10 hover:text-indigo-400 text-slate-500 rounded transition-colors"
                            title="Modify Config"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(monitor._id)}
                            disabled={deleteLoading === monitor._id}
                            className={`p-2 rounded transition-colors ${
                              deleteLoading === monitor._id
                                ? "opacity-50 cursor-not-allowed text-red-500"
                                : "hover:bg-red-500/10 hover:text-red-400 text-slate-500"
                            }`}
                            title="Terminate"
                          >
                            {deleteLoading === monitor._id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="text-xs font-mono text-slate-500">
                    DISPLAYING {startIndex + 1}-
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredMonitors.length
                    )}{" "}
                    OF {filteredMonitors.length} NODES
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 bg-[#131316] border border-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-400 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 bg-[#131316] p-1 rounded border border-white/5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                              currentPage === page
                                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/50"
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
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
                      className="p-2 bg-[#131316] border border-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded text-slate-400 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
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
