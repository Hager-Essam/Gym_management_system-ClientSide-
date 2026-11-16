import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { AccountSuspendedNotice, RouteLoader } from './RouteState.jsx';

/**
 * Guards private pages.
 *  1. Wait until a restored session has been validated.
 *  2. Not signed in -> /login, remembering the full intended URL.
 *  3. Suspended/deactivated account -> restriction screen.
 *  4. `roles` (optional) -> send other roles to their own dashboard.
 */
export default function ProtectedRoute({ roles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <RouteLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.status && user.status !== 'active') {
    return <AccountSuspendedNotice status={user.status} />;
  }

  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
