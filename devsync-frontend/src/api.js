import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to add auth token
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Token expired or unauthorized. Logging out...");
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;
