import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlobalLoader from './GlobalLoader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoader message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;