import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api.js"; 
import { useNavigate } from "react-router-dom";

// 1. Context Object Create Karein
const AuthContext = createContext(null);

// 2. Custom Hook for easy access
export const useAuth = () => useContext(AuthContext);

// 3. Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const navigate = useNavigate();

  // Utility function to get token from localStorage
  const getToken = () => localStorage.getItem("token");

  // --- AUTH ACTIONS ---

  // Login Function
  const login = useCallback(
    (token, userData) => {
      localStorage.setItem("token", token);
      setUser(userData);
      // Optional: Redirect to dashboard after login
      navigate("/dashboard", { replace: true });
    },
    [navigate]
  );

  // Logout Function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    // Redirect to login page
    navigate("/login", { replace: true });
  }, [navigate]);

  // Check Login Status on Mount/Refresh (GET /auth/me)
  const checkAuthStatus = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Token Axios Interceptor mein automatically attach ho jaayega
      const response = await api.get("/auth/me");
      setUser(response.data.user); // Assuming backend sends { user: { email, name, ... } }
    } catch (error) {
      // Agar token invalid ya expired hai (401), toh logout karein
      if (error.response?.status === 401) {
        console.log("Token expired during checkAuth, clearing session.");
        localStorage.removeItem("token");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check when app starts
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Context value
  const contextValue = {
    user,
    isLoading,
    isAuthenticated: !!user, // true if user is not null
    login,
    logout,
    token: getToken(),
  };

  // Loading screen dikhao jab tak auth check ho raha hai
  if (isLoading) {
    return <div>Loading App...</div>; // A placeholder loading screen
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
