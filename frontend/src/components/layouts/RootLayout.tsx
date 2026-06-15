import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

/**
 * Router root: provides AuthContext to every route. It lives inside the router
 * (via createBrowserRouter) so AuthProvider can use router hooks (useNavigate).
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
