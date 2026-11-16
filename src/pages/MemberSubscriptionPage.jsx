import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import DashboardNav from '../components/layout/DashboardNav.jsx';
import SubscriptionSummary from '../components/member/SubscriptionSummary.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import { getMemberSubscriptions } from '../services/memberService.js';
import { cancelSubscription } from '../services/subscriptionService.js';
import {
  deriveSubscriptionState,
  formatSubscriptionDate,
  formatSubscriptionMoney,
  pickCurrentSubscription,
} from '../utils/subscriptionFormat.js';

import './MemberSubscriptionPage.css';

// Member-only page: /member/subscription
// Summary comes from /api/members/me + /api/members/:id/subscription.
export default function MemberSubscriptionPage() {
  const { user } = useAuth();
  const {
    subscription: profileSubscription,
    loading: profileLoading,
    error: profileError,
    refreshProfile,
  } = useMemberProfile();

  const userId = user?.id || null;

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [cancellingId, setCancellingId] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;

    async function loadSubscriptions() {
      setLoading(true);
      setHistoryError('');

      try {
        const data = await getMemberSubscriptions(userId);

        if (active) setSubscriptions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) {
          setSubscriptions([]);
          setHistoryError(
            err.message || 'Unable to load your membership history.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSubscriptions();

    return () => {
      active = false;
    };
  }, [userId, reloadToken]);

  const current =
    pickCurrentSubscription(subscriptions) || profileSubscription || null;
  const state = deriveSubscriptionState(current);

  // Keep the skeleton up until both the profile and history had a chance.
  const showLoading = loading || (profileLoading && !current);
  const fatalError =
    !current && !showLoading ? historyError || profileError || '' : '';
  const historyWarning = current && historyError ? historyError : '';

  function retry() {
    setReloadToken((token) => token + 1);
    refreshProfile().catch(() => {});
  }

  async function handleCancel() {
    if (!current?.id) return;

    setCancellingId(current.id);
    setActionError('');
    setNotice('');

    try {
      await cancelSubscription(current.id);

      setNotice(
        'Your membership has been cancelled. You can restart whenever you are ready.'
      );

      await refreshProfile().catch(() => {});
      setReloadToken((token) => token + 1);
    } catch (err) {
      setActionError(err.message || 'Unable to cancel this membership.');
    } finally {
      setCancellingId('');
    }
  }

  return (
    <>
      <DashboardNav />

      <main className="sub-page">
        <div className="container sub-page__container">
          <Link className="sub-page__back" to="/dashboard">
            <Icon name="arrow_back" size={16} />
            Back to dashboard
          </Link>

          <header className="sub-page__header">
            <p className="mono sub-page__eyebrow">Membership</p>
            <h1>Your membership</h1>
            <p className="sub-page__lead">
              Review your current plan, renewal date and payment details, or
              switch to a different plan at any time.
            </p>
          </header>

          {notice && (
            <div className="sub-page__alert sub-page__alert--success" role="status">
              <Icon name="check_circle" size={18} />
              <span>{notice}</span>
            </div>
          )}

          {actionError && (
            <div className="sub-page__alert sub-page__alert--error" role="alert">
              <Icon name="error" size={18} />
              <span>{actionError}</span>
            </div>
          )}

          {historyWarning && (
            <div className="sub-page__alert sub-page__alert--warning" role="status">
              <Icon name="warning" size={18} />
              <span>{historyWarning}</span>
              <button type="button" className="sub-page__alert-action" onClick={retry}>
                Retry
              </button>
            </div>
          )}

          <SubscriptionSummary
            subscription={current}
            state={current ? state : undefined}
            loading={showLoading}
            error={fatalError}
            onRetry={retry}
            onCancel={handleCancel}
            cancelling={Boolean(cancellingId)}
          />

          {!showLoading && subscriptions.length > 0 && (
            <section className="card sub-page__history">
              <div className="sub-page__history-head">
                <h2>Membership history</h2>
                <p className="text-muted text-sm">
                  Every subscription recorded on your account.
                </p>
              </div>

              <ul className="sub-page__history-list">
                {subscriptions.map((item) => {
                  const itemState = deriveSubscriptionState(item);

                  return (
                    <li key={item.id} className="sub-page__history-row">
                      <div className="sub-page__history-main">
                        <p className="sub-page__history-plan">
                          {item.plan_name || 'Membership plan'}
                        </p>
                        <p className="sub-page__history-dates">
                          {formatSubscriptionDate(item.start_date)} —{' '}
                          {formatSubscriptionDate(item.end_date)}
                        </p>
                        {item.cancellation_reason && (
                          <p className="sub-page__history-reason">
                            Reason: {item.cancellation_reason}
                          </p>
                        )}
                      </div>

                      <div className="sub-page__history-side">
                        <span
                          className={`sub-badge sub-badge--${itemState.tone}`}
                        >
                          {itemState.label}
                        </span>
                        <span className="sub-page__history-amount">
                          {formatSubscriptionMoney(item.amount ?? item.price)}
                        </span>
                        <span className="sub-page__history-meta">
                          {item.auto_renew ? 'Auto-renew on' : 'Auto-renew off'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
