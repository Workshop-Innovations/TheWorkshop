import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function PrivateRoute({ children }) {
  const { accessToken, user, loading, error, refreshProfile, logout } =
    useAuth();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (loading && !user)
    return (
      <div
        role="status"
        className="min-h-screen grid place-items-center text-primary"
      >
        Loading your workspace…
      </div>
    );
  if (!user)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Unable to load your account</h1>
        <p role="alert">{error || "Please check your connection."}</p>
        <button
          onClick={refreshProfile}
          className="bg-primary text-white px-6 py-3 rounded-md"
        >
          Retry
        </button>
        <button onClick={logout} className="underline">
          Sign out
        </button>
      </main>
    );
  return children;
}
