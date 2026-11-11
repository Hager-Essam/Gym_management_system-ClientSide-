
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import Logo from '../components/layout/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import './DashboardPage.css';

export default function DashboardPage() {
  const { logout } = useAuth();
  const { member, subscription, loading, error } = useMemberProfile();

  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  if (loading) {
    return (
      <div className="dash">
        <p className="dash__lead">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="dash">
        <p className="dash__lead">
          {error || 'Unable to load your member profile.'}
        </p>
      </div>
    );
  }

  const fullName = member.fullName || member.full_name || 'Member';
  const firstName = fullName.split(' ')[0];
  const email = member.email || '';

  return (
    <div className="dash">
      <header className="dash__bar">
        <div className="container dash__bar-inner">
          <Logo />

          <div className="dash__user">
            <span className="dash__name">{fullName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container dash__main">
        <p className="mono text-accent">
          <span className="dot" /> Member portal
        </p>

        <h1>Welcome back, {firstName}.</h1>

        <p className="dash__lead">
          Signed in as {email}.
        </p>

        <div className="dash__grid">
          <section className="card dash__card">
            <p className="mono text-muted">Membership</p>

            {subscription ? (
              <>
                <h2>{subscription.plan_name || 'Your membership'}</h2>
                <p className="dash__price">
                  ${subscription.price}
                  <span> / {subscription.duration || 'month'}</span>
                </p>
                <p className="dash__muted">
                  Status: {subscription.status}
                </p>
                <p className="dash__muted">
                  Expires:{' '}
                  {subscription.end_date
                    ? new Date(subscription.end_date).toLocaleDateString()
                    : 'Not available'}
                </p>
              </>
            ) : (
              <>
                <h2>No active subscription</h2>
                <p className="dash__muted">
                  Choose a membership plan to get started.
                </p>
                <Link to="/#pricing" className="dash__link">
                  View plans <Icon name="chevron_right" size={18} />
                </Link>
              </>
            )}
          </section>

          <section className="card dash__card">
            <p className="mono text-muted">Account information</p>
            <h2>{fullName}</h2>
            <p className="dash__muted">Email: {email}</p>
            <p className="dash__muted">
              Phone: {member.phone || 'Not provided'}
            </p>
            <p className="dash__muted">
              Status: {member.status || 'Not available'}
            </p>
            <Link to="/member/profile" className="dash__link">
              View profile <Icon name="chevron_right" size={18} />
            </Link>
          </section>

          <section className="card dash__card">
            <p className="mono text-muted">Next steps</p>
            <ul className="dash__steps">
              <li>
                <Icon name="radio_button_unchecked" size={18} />
                Book your complimentary body scan
              </li>
              <li>
                <Icon name="radio_button_unchecked" size={18} />
                Meet your strength coach
              </li>
              <li>
                <Icon name="radio_button_unchecked" size={18} />
                Install the IronForge mobile app
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
