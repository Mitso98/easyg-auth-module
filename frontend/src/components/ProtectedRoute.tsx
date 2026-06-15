import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './ui/Spinner';

/**
 * Gates the /app branch. While auth is initializing we render a spinner (so we
 * never flash a redirect before hydration finishes); with no user we redirect to
 * /signin, remembering where the user was headed via location state.
 */
export function ProtectedRoute() {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <Spinner />;
  }
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
