import PrivateRoute from "./PrivateRoute.jsx";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const AdminContent = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default function AdminRoute({ children }) {
  return (
    <PrivateRoute>
      <AdminContent>{children}</AdminContent>
    </PrivateRoute>
  );
}
