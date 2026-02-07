import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
    }

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" />;
    }

    // If logged in but not admin, redirect to dashboard (or 403 page)
    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default AdminRoute;
