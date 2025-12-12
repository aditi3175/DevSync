import React, { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, CheckCircle, AlertCircle, Loader } from "lucide-react";

const defaultMonitor = {
  name: "",
  url: "",
  method: "GET",
  frequencyMinutes: 5,
  timeoutMs: 5000,
  assertions: ["status==200"],
  enabled: true,
  headers: {},
  body: "",
};

const MonitorForm = ({ monitorId, initialData, onSuccess }) => {
  const isEditing = !!monitorId;
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultMonitor);
  const [headerInputs, setHeaderInputs] = useState([]);
  const [assertionInputs, setAssertionInputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({
        name: initialData.name || "",
        url: initialData.url || "",
        method: initialData.method || "GET",
        frequencyMinutes: initialData.frequencyMinutes || 5,
        timeoutMs: initialData.timeoutMs || 5000,
        assertions: initialData.assertions || ["status==200"],
        enabled: initialData.enabled !== false,
        headers: initialData.headers || {},
        body: initialData.body || "",
      });

      const headersArray = Object.entries(initialData.headers || {}).map(
        ([key, value]) => ({ key, value })
      );
      setHeaderInputs(headersArray);

      const assertionsArray = (initialData.assertions || []).map((a) => ({
        value: a,
      }));
      setAssertionInputs(assertionsArray);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "frequencyMinutes" || name === "timeoutMs"
          ? Number(value)
          : value,
    }));
  };

  const handleHeaderChange = (index, field, value) => {
    const updated = [...headerInputs];
    updated[index] = { ...updated[index], [field]: value };
    setHeaderInputs(updated);
  };

  const addHeaderField = () => {
    const newKey = `Header-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      headers: { ...prev.headers, [newKey]: "" },
    }));
  };

  const removeHeaderField = (key) => {
    setFormData((prev) => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const handleAssertionChange = (index, value) => {
    const updated = [...assertionInputs];
    updated[index] = { value };
    setAssertionInputs(updated);
  };

  const addAssertionField = () => {
    setAssertionInputs([...assertionInputs, { value: "" }]);
  };

  const removeAssertionField = (index) => {
    setAssertionInputs(assertionInputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess("");

    const cleanedHeaders = Object.entries(
      headerInputs.reduce((acc, { key, value }) => {
        if (key.trim() && value.trim()) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {})
    ).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    const cleanedAssertions = assertionInputs
      .map((a) => a.value)
      .filter((v) => v.trim());

    if (!formData.name.trim()) {
      setError("Monitor name is required");
      setLoading(false);
      return;
    }

    if (!formData.url.trim()) {
      setError("URL is required");
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      method: formData.method,
      frequencyMinutes: formData.frequencyMinutes,
      timeoutMs: formData.timeoutMs,
      assertions:
        cleanedAssertions.length > 0 ? cleanedAssertions : ["status==200"],
      enabled: formData.enabled,
      headers: cleanedHeaders,
      body: formData.body ? formData.body.trim() : null,
    };

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/api/monitors/${monitorId}`, payload);
        setSuccess("✅ Monitor updated successfully!");
      } else {
        response = await api.post("/api/monitors", payload);
        setSuccess("✅ Monitor created successfully!");
      }

      setTimeout(() => {
        if (onSuccess) onSuccess(response.data.monitor);
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      const validationErrors = err.response?.data?.errors;
      let message =
        err.response?.data?.message ||
        "Operation failed. Please check your inputs.";

      if (validationErrors && Array.isArray(validationErrors)) {
        if (validationErrors.length > 0 && validationErrors[0].path) {
          message = validationErrors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; ");
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start space-x-3 animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 flex items-start space-x-3 animate-in fade-in duration-300">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Basic Configuration */}
      <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-600 rounded"></div>
          <span>Basic Configuration</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Monitor Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="e.g., User Service API"
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              URL to Check *
            </label>
            <input
              type="url"
              name="url"
              value={formData.url || ""}
              onChange={handleChange}
              placeholder="https://api.example.com/health"
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Method
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                {["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Frequency (Minutes)
              </label>
              <input
                type="number"
                name="frequencyMinutes"
                value={formData.frequencyMinutes}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Timeout (ms)
              </label>
              <input
                type="number"
                name="timeoutMs"
                value={formData.timeoutMs}
                onChange={handleChange}
                required
                min="1000"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <input
              type="checkbox"
              name="enabled"
              id="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              className="w-5 h-5 rounded cursor-pointer accent-blue-500"
            />
            <label
              htmlFor="enabled"
              className="text-sm font-semibold text-slate-300 cursor-pointer"
            >
              Enable monitoring (Start scheduled checks)
            </label>
          </div>
        </div>
      </div>

      {/* Assertions */}
      <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-600 rounded"></div>
          <span>Assertions (Success Conditions)</span>
        </h2>

        <p className="text-sm text-slate-400">
          Examples:{" "}
          <code className="bg-slate-900/50 px-2 py-1 rounded text-blue-400">
            status==200
          </code>
          ,{" "}
          <code className="bg-slate-900/50 px-2 py-1 rounded text-blue-400">
            body_contains:success
          </code>
        </p>

        <div className="space-y-3">
          {(assertionInputs || []).map((assertion, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={assertion.value || ""}
                onChange={(e) => handleAssertionChange(index, e.target.value)}
                placeholder="e.g., status==200"
                className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => removeAssertionField(index)}
                className="p-3 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addAssertionField}
          className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Add Assertion</span>
        </button>
      </div>

      {/* Headers & Body */}
      <div className="backdrop-blur-md bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-1 h-6 bg-linear-to-b from-purple-400 to-pink-600 rounded"></div>
          <span>Advanced Options</span>
        </h2>

        {/* Headers */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">
            Request Headers
          </h3>
          {Object.keys(formData.headers || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(formData.headers || {}).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newHeaders = { ...formData.headers };
                      if (e.target.value && e.target.value !== key) {
                        newHeaders[e.target.value] = newHeaders[key];
                        delete newHeaders[key];
                      }
                      setFormData((prev) => ({ ...prev, headers: newHeaders }));
                    }}
                    placeholder="Header name (e.g., Authorization)"
                    className="w-1/3 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => {
                      const newHeaders = { ...formData.headers };
                      newHeaders[key] = e.target.value;
                      setFormData((prev) => ({ ...prev, headers: newHeaders }));
                    }}
                    placeholder="Header value"
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderField(key)}
                    className="p-3 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={addHeaderField}
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add Header</span>
          </button>
        </div>

        {/* Body */}
        {["POST", "PUT", "PATCH"].includes(formData.method) && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300">
              Request Body (JSON)
            </h3>
            <textarea
              name="body"
              value={formData.body || ""}
              onChange={handleChange}
              placeholder='{"key": "value"}'
              rows="5"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <span>{isEditing ? "Update Monitor" : "Create Monitor"}</span>
        )}
      </button>
    </form>
  );
};

export default MonitorForm;
