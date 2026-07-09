// frontend/src/components/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PrivateRoute Component
 * Uses a simple, synchronous check of the accessToken.
 * After a successful login, the presence of the token is enough to allow routing.
 */
const PrivateRoute = ({ children }) => {
  const { accessToken } = useAuth(); 

  // If accessToken is missing, redirect to the login page.
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // If the accessToken is present, render the protected content immediately.
  return children;
};

export default PrivateRoute;