import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || (roles.length && !roles.includes(user.role))) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;