import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { RouteLoader } from './RouteState.jsx';

function buildPath(location) {
  if (!location?.pathname) return null;

  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

/**
 * The opposite guard: /login and /register make no sense for someone already
 * signed in, so send them back to the page they originally wanted.
 */
export default function GuestRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (initializing) {
    return <RouteLoader />;
  }

  if (user) {
    const intended = buildPath(location.state?.from);
    const planId = searchParams.get('plan');

    // A guest chose a plan, then signed in/registered. Continue to checkout.
    if (planId && user.role === 'member') {
      return <Navigate to={`/subscribe/${planId}`} replace />;
    }

    if (intended && !intended.startsWith('/login') && !intended.startsWith('/register')) {
      return <Navigate to={intended} replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
