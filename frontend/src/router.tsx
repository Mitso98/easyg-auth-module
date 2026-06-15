import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './components/layouts/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppPage } from './pages/AppPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

/**
 * Central route config. RootLayout provides AuthContext to every route; the
 * /app branch sits behind ProtectedRoute; unknown paths fall back to /signin.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/signin" replace /> },
      { path: '/signin', element: <SignInPage /> },
      { path: '/signup', element: <SignUpPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/app', element: <AppPage /> }],
      },
      { path: '*', element: <Navigate to="/signin" replace /> },
    ],
  },
]);
