import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  Play,
  Edit3,
  Trash2,
  Activity,
  CheckCircle,
  Zap,
  Download,
  FileText,
  File,
  Code,
} from "lucide-react";

// Export utility functions.
const exportAsCSV = (history, monitorName) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  const headers = ["Time", "Status", "Response Time (ms)", "Status Code", "Error"];
  const rows = history.map((check) => [
    new Date(check.checkedAt).toLocaleString(),
    check.ok ? "UP" : "DOWN",
    check.responseTimeMs || "N/A",
    check.statusCode || "N/A",
    check.error || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-history-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportAsJSON = (history, monitorName) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  const data = {
    monitor: monitorName,
    exportDate: new Date().toISOString(),
    totalChecks: history.length,
    successCount: history.filter((h) => h.ok).length,
    failureCount: history.filter((h) => !h.ok).length,
    data: history,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-history-${new Date().toISOString().split("T")[0]}.json`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportAsHTML = (history, monitorName, monitorUrl) => {
  if (!history || history.length === 0) {
    alert("No data to export!");
    return;
  }

  const uptime = history.filter((h) => h.ok).length;
  const downtime = history.filter((h) => !h.ok).length;
  const upPercent = ((uptime / history.length) * 100).toFixed(2);

  const tableRows = history
    .map(
      (check) => `
    <tr>
      <td>${new Date(check.checkedAt).toLocaleString()}</td>
      <td><span style="color: ${check.ok ? "green" : "red"}">${
        check.ok ? "UP" : "DOWN"
      }</span></td>
      <td>${check.responseTimeMs ? `${check.responseTimeMs}ms` : "N/A"}</td>
      <td>${check.statusCode || "N/A"}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${monitorName} - Monitor Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1a202c;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
        }
        .info {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
          border-left: 4px solid #3b82f6;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
        }
        .stat-label {
          color: #6b7280;
          font-size: 14px;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background: #3b82f6;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        tr:hover {
          background: #f9fafb;
        }
        .footer {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          margin-top: 30px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Monitor Report: ${monitorName}</h1>
        
        <div class="info">
          <strong>URL:</strong> ${monitorUrl}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Period:</strong> Last 24 Hours
        </div>

        <h2>📈 Statistics</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value" style="color: #10b981">${uptime}</div>
            <div class="stat-label">Successful Checks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #ef4444">${downtime}</div>
            <div class="stat-label">Failed Checks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #3b82f6">${upPercent}%</div>
            <div class="stat-label">Uptime</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${history.length}</div>
            <div class="stat-label">Total Checks</div>
          </div>
        </div>

        <h2>📋 Check History</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Status</th>
              <th>Response Time</th>
              <th>Status Code</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by DevSync - Uptime Monitoring System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${monitorName}-report-${new Date().toISOString().split("T")[0]}.html`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportAsPDF = async (history, monitorName, monitorUrl) => {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Monitor: ${monitorName}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`URL: ${monitorUrl}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

    const tableData = history.map((check) => [
      new Date(check.checkedAt).toLocaleString(),
      check.ok ? "UP" : "DOWN",
      check.responseTimeMs ? `${check.responseTimeMs}ms` : "N/A",
      check.statusCode || "N/A",
    ]);

    doc.autoTable({
      startY: 50,
      head: [["Time", "Status", "Response Time", "Status Code"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 244, 249],
      },
    });

    doc.save(
      `${monitorName}-history-${new Date().toISOString().split("T")[0]}.pdf`
    );
  } catch (err) {
    console.error("PDF export failed:", err);
    alert(
      "PDF export requires jsPDF library. Install with: npm install jspdf"
    );
  }
};

// Export Buttons Component
const ExportButtons = ({ history, monitorName, monitorUrl }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      switch (format) {
        case "csv":
          exportAsCSV(history, monitorName);
          break;
        case "json":
          exportAsJSON(history, monitorName);
          break;
        case "pdf":
          await exportAsPDF(history, monitorName, monitorUrl);
          break;
        case "html":
          exportAsHTML(history, monitorName, monitorUrl);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => handleExport("csv")}
        disabled={exporting || history.length === 0}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as CSV"
      >
        <FileText className="w-4 h-4" />
        <span>CSV</span>
      </button>

      <button
        onClick={() => handleExport("json")}
        disabled={exporting || history.length === 0}
        className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as JSON"
      >
        <Code className="w-4 h-4" />
        <span>JSON</span>
      </button>

      <button
        onClick={() => handleExport("html")}
        disabled={exporting || history.length === 0}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as HTML Report"
      >
        <File className="w-4 h-4" />
        <span>HTML Report</span>
      </button>

      <button
        onClick={() => handleExport("pdf")}
        disabled={exporting || history.length === 0}
        className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export as PDF (requires jsPDF)"
      >
        <Download className="w-4 h-4" />
        <span>{exporting ? "Exporting..." : "PDF"}</span>
      </button>
    </div>
  );
};

// Main Component
const MonitorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMonitor = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/monitors/${id}`);
      setMonitor(response.data.monitor);
      setError(null);
    } catch (err) {
      setError("Monitor not found or you do not have access.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id) return;

    setHistoryLoading(true);
    try {
      const response = await api.get(`/api/monitors/${id}/history`);
      const historyData = Array.isArray(response.data.history)
        ? [...response.data.history].reverse()
        : [];
      setHistory(historyData);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMonitor();
    fetchHistory();
  }, [fetchMonitor, fetchHistory]);

  const handleRunNow = async () => {
    setActionStatus("Running check...");
    try {
      await api.post(`/api/monitors/${id}/run`);
      setActionStatus("✅ Check job successfully enqueued!");
      setTimeout(fetchMonitor, 3000);
    } catch (err) {
      setActionStatus("❌ Failed to enqueue job.");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "⚠️  Are you sure you want to delete this monitor? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);
    setActionStatus("Deleting monitor...");

    try {
      await api.delete(`/api/monitors/${id}`);
      setActionStatus("✅ Monitor deleted successfully.");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to delete monitor.";
      setActionStatus(`❌ ${errorMsg}`);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading Monitor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!monitor) return null;

  const uptime = history.filter((h) => h.ok).length;
  const downtime = history.filter((h) => !h.ok).length;
  const totalChecks = history.length;
  const upPercent = totalChecks > 0 ? ((uptime / totalChecks) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            {monitor.name || monitor.url}
          </h1>
          <p className="text-slate-400">{monitor.url}</p>
        </div>

        {/* Status Card */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Current Status */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-semibold">
                Current Status
              </span>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-lg font-bold text-lg text-white mb-4 ${
                monitor.lastStatus === "up"
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : monitor.lastStatus === "down"
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : "bg-gradient-to-r from-gray-400 to-gray-600"
              }`}
            >
              {monitor.lastStatus.toUpperCase()}
            </span>
            <p className="text-slate-400 text-sm">
              Last checked:{" "}
              {monitor.lastCheckedAt
                ? new Date(monitor.lastCheckedAt).toLocaleString()
                : "N/A"}
            </p>
          </div>

          {/* Uptime */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-semibold">
                Uptime
              </span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-4xl font-bold text-green-400 mb-2">
              {upPercent}%
            </p>
            <p className="text-slate-400 text-sm">{uptime} successful checks</p>
          </div>

          {/* Latest Response Time */}
          <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-semibold">
                Response Time
              </span>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-4xl font-bold text-blue-400 mb-2">
              {monitor.lastResponseTime
                ? `${monitor.lastResponseTime}ms`
                : "N/A"}
            </p>
            <p className="text-slate-400 text-sm">Latest response</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleRunNow}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/50"
            disabled={isDeleting}
          >
            <Play className="w-5 h-5" />
            <span>Run Check Now</span>
          </button>

          <Link
            to={`/monitor/${id}/edit`}
            className="flex items-center space-x-2 px-6 py-3 backdrop-blur-md bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 text-white rounded-lg font-semibold transition-all"
          >
            <Edit3 className="w-5 h-5" />
            <span>Edit</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isDeleting
                ? "bg-slate-700/30 opacity-50 cursor-not-allowed"
                : "bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </button>
        </div>

        {/* Status Message */}
        {actionStatus && (
          <div
            className={`mb-8 p-4 rounded-lg backdrop-blur-sm border ${
              actionStatus.includes("✅")
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : actionStatus.includes("❌")
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
            }`}
          >
            {actionStatus}
          </div>
        )}

        {/* Configuration */}
        <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Configuration</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">URL</p>
              <p className="text-white font-semibold break-all">
                {monitor.url}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Method</p>
              <div className="inline-block px-3 py-1 bg-slate-700/50 rounded text-white text-sm font-mono font-semibold">
                {monitor.method}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Frequency</p>
              <p className="text-white font-semibold">
                Every {monitor.frequencyMinutes} minute
                {monitor.frequencyMinutes !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Timeout</p>
              <p className="text-white font-semibold">{monitor.timeoutMs}ms</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Status</p>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  monitor.enabled
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {monitor.enabled ? "Enabled" : "Disabled"}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Alert Threshold</p>
              <p className="text-white font-semibold">
                {monitor.alertThreshold} fail
                {monitor.alertThreshold !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {monitor.assertions && monitor.assertions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-3">Assertions</p>
              <div className="flex flex-wrap gap-2">
                {monitor.assertions.map((assertion, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-mono"
                  >
                    {assertion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-white">
              Check History (Last 24 Hours)
            </h2>

            {history.length > 0 && (
              <ExportButtons
                history={history}
                monitorName={monitor.name || monitor.url}
                monitorUrl={monitor.url}
              />
            )}
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No check history available yet
            </p>
          ) : (
            <div className="space-y-8">
              {/* Chart */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Response Time Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(100, 116, 139, 0.3)"
                    />
                    <XAxis
                      dataKey="checkedAt"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleTimeString()
                      }
                          stroke="rgba(148, 163, 184, 0.5)" />
                    <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(100, 116, 139, 0.5)",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`${value}ms`, "Response Time"]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTimeMs"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm mb-2">✅ Successful</p>
                  <p className="text-3xl font-bold text-green-400">{uptime}</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm mb-2">❌ Failed</p>
                  <p className="text-3xl font-bold text-red-400">{downtime}</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm mb-2">📊 Total</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {totalChecks}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr className="text-slate-400">
                      <th className="text-left py-3 px-4">Time</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Response</th>
                      <th className="text-left py-3 px-4">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {history.slice(0, 10).map((check) => (
                      <tr
                        key={check._id}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-white">
                          {new Date(check.checkedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              check.ok
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {check.ok ? "✅ UP" : "❌ DOWN"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {check.responseTimeMs
                            ? `${check.responseTimeMs}ms`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {check.statusCode || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
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

export default MonitorDetailPage;