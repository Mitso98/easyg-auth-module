import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppPage } from './pages/AppPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

/**
 * Central route config (not ad-hoc <Route> sprawl). Public auth routes plus an
 * /app branch behind ProtectedRoute; unknown paths fall back to /signin.
 */
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/signin" replace /> },
  { path: '/signin', element: <SignInPage /> },
  { path: '/signup', element: <SignUpPage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/app', element: <AppPage /> }],
  },
  { path: '*', element: <Navigate to="/signin" replace /> },
]);
