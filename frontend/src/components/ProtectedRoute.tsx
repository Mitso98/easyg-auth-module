import { Outlet } from 'react-router-dom';

/**
 * Placeholder gate. P6 makes this read `useAuth()`: render a spinner while
 * `isInitializing`, redirect to /signin when there's no user, else <Outlet/>.
 */
export function ProtectedRoute() {
  return <Outlet />;
}
