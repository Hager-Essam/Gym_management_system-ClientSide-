import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import './RouteState.css';

/** Full-page loading screen while we validate a restored session. */
export function RouteLoader({ message = 'Checking your session…' }) {
  return (
    <div className="route-state" role="status" aria-live="polite">
      <span className="route-state__spinner" aria-hidden="true" />
      <p className="route-state__text">{message}</p>
    </div>
  );
}

/** Shown when the cached account exists but is not allowed to use the app. */
export function AccountSuspendedNotice({ status = 'suspended' }) {
  const { logout } = useAuth();

  return (
    <div className="route-state">
      <div className="card route-state__card">
        <span className="route-state__icon" aria-hidden="true">
          <Icon name="block" size={34} />
        </span>

        <h1>Account restricted</h1>

        <p>
          Your account is currently <strong>{status}</strong>. You cannot use
          gym services or open the member portal while this restriction is in
          place.
        </p>

        <p className="route-state__hint">
          Please contact the front desk or a gym administrator to reactivate
          your account.
        </p>

        <Button type="button" variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
