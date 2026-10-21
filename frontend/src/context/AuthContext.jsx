import { API_BASE_URL } from "../services/api.js";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AuthContext = createContext(null);
const API = API_BASE_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken"),
  );
  const tokenRef = useRef(accessToken);
  const requestRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!accessToken);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    setAccessToken(null);
    setUser(null);
    setError(null);
    setLoading(false);
    for (const key of ["accessToken", "username", "userProfilePic"])
      localStorage.removeItem(key);
  }, []);

  const refreshProfile = useCallback(() => {
    const token = tokenRef.current;
    if (!token) return Promise.resolve();
    if (requestRef.current?.token === token) return requestRef.current.promise;
    setLoading(true);
    setError(null);
    const promise = (async () => {
      try {
        const response = await fetch(`${API}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (tokenRef.current !== token) return;
        if (response.status === 401) {
          clearAuth();
          return;
        }
        if (!response.ok)
          throw new Error("Your profile could not be loaded. Please retry.");
        const data = await response.json();
        if (tokenRef.current === token) setUser(data);
      } catch (err) {
        if (tokenRef.current === token)
          setError(err.message || "Check your connection and retry.");
      } finally {
        if (tokenRef.current === token) setLoading(false);
        if (requestRef.current?.token === token) requestRef.current = null;
      }
    })();
    requestRef.current = { token, promise };
    return promise;
  }, [clearAuth]);

  useEffect(() => {
    if (accessToken) refreshProfile();
  }, [accessToken, refreshProfile]);

  const login = useCallback(
    (token) => {
      tokenRef.current = token;
      setUser(null);
      setError(null);
      setLoading(true);
      localStorage.setItem("accessToken", token);
      setAccessToken(token);
      refreshProfile(); // Also refresh if a repeated login returns the same token.
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    },
    [navigate, refreshProfile],
  );

  const logout = useCallback(() => {
    clearAuth();
    toast.info("You have been logged out.");
    navigate("/login");
  }, [navigate, clearAuth]);

  const updateProfile = useCallback(
    async (changes) => {
      const token = tokenRef.current;
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch(`${API}/api/v1/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });
      if (tokenRef.current !== token)
        throw new Error("Your account changed. Please retry.");
      if (response.status === 401) {
        clearAuth();
        throw new Error("Please sign in again.");
      }
      const data = await response.json().catch(() => ({}));
      if (tokenRef.current !== token)
        throw new Error("Your account changed. Please retry.");
      if (!response.ok)
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to save your profile. Check the fields and retry.",
        );
      // Commit only the server-confirmed value. A failed request never changes the avatar.
      setUser(data);
      return data;
    },
    [clearAuth],
  );
  const updateProfilePic = useCallback(
    (profile_pic) => updateProfile({ profile_pic }),
    [updateProfile],
  );

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      error,
      refreshProfile,
      login,
      logout,
      isAuthenticated: !!accessToken,
      profilePic: user?.profile_pic || null,
      updateProfile,
      updateProfilePic,
    }),
    [
      accessToken,
      user,
      loading,
      error,
      refreshProfile,
      login,
      logout,
      updateProfile,
      updateProfilePic,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
