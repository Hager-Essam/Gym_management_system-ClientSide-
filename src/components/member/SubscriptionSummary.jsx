import { useEffect, useState } from 'react';

import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import {
  deriveSubscriptionState,
  formatPaymentMethod,
  formatSubscriptionDate,
  formatSubscriptionDuration,
  formatSubscriptionMoney,
  getDaysRemaining,
  getSubscriptionDaysMessage,
  getSubscriptionPlanId,
  getSubscriptionProgress,
} from '../../utils/subscriptionFormat.js';

import './SubscriptionSummary.css';

const STATE_ICON = {
  active: 'check_circle',
  'ending-soon': 'schedule',
  expired: 'error',
  cancelled: 'cancel',
  pending: 'hourglass_top',
  paused: 'pause_circle',
  none: 'info',
  unknown: 'help',
};

const ACTION_LABEL = {
  pending: 'Complete checkout',
  expired: 'Renew membership',
  cancelled: 'Restart membership',
  paused: 'Resume or change plan',
};

function getActionLabel(stateKey) {
  return ACTION_LABEL[stateKey] || 'Renew or change plan';
}

/**
 * The single membership card used by the subscription page.
 * Presentation only: the page owns fetching, retrying and cancelling.
 */
export default function SubscriptionSummary({
  subscription = null,
  state,
  loading = false,
  error = '',
  onRetry,
  onCancel,
  cancelling = false,
}) {
  const [confirming, setConfirming] = useState(false);

  // A new/refetched subscription invalidates any pending confirmation.
  useEffect(() => {
    setConfirming(false);
  }, [subscription?.id]);

  if (loading) {
    return (
      <section
        className="card sub-summary sub-summary--loading"
        role="status"
        aria-live="polite"
      >
        <span className="sub-summary__spinner" aria-hidden="true" />
        <p>Loading your membership…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card sub-summary sub-summary--error" role="alert">
        <Icon name="error" size={32} />
        <h2>We couldn't load your membership</h2>
        <p>{error}</p>

        <div className="sub-summary__actions">
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button to="/dashboard" variant="outline">
            Back to dashboard
          </Button>
        </div>
      </section>
    );
  }

  const resolvedState = state || deriveSubscriptionState(subscription);
  const hasSubscription = Boolean(subscription);
  const planId = getSubscriptionPlanId(subscription);
  const planHref = planId ? `/subscribe/${planId}` : '/plans';
  const features = Array.isArray(subscription?.features)
    ? subscription.features
    : [];

  const daysLeft = hasSubscription
    ? getDaysRemaining(subscription.end_date)
    : null;
  const progress = hasSubscription
    ? getSubscriptionProgress(subscription)
    : null;

  const canCancel =
    Boolean(subscription?.id && onCancel) &&
    ['active', 'ending-soon', 'pending', 'paused'].includes(resolvedState.key);

  const amount = subscription?.amount ?? subscription?.price;
  const duration = subscription?.duration || subscription?.payment_frequency;

  return (
    <section className={`card sub-summary sub-summary--${resolvedState.key}`}>
      <header className="sub-summary__header">
        <div className="sub-summary__identity">
          <p className="mono sub-summary__eyebrow">Membership</p>

          <h2 className="sub-summary__plan">
            {subscription?.plan_name || 'No plan selected'}
          </h2>

          {hasSubscription && amount !== undefined && amount !== null && (
            <p className="sub-summary__price">
              {formatSubscriptionMoney(amount)}
              {duration && <span> / {formatSubscriptionDuration(duration)}</span>}
            </p>
          )}

          {subscription?.id && (
            <p className="mono sub-summary__id" title={subscription.id}>
              ID {subscription.id}
            </p>
          )}
        </div>

        <span className={`sub-badge sub-badge--${resolvedState.tone}`}>
          <Icon
            name={STATE_ICON[resolvedState.key] || 'help'}
            size={14}
          />
          {resolvedState.label}
        </span>
      </header>

      {!hasSubscription && (
        <div className="sub-summary__empty">
          <p>
            You don't have a membership yet. Pick a plan and your access starts
            as soon as checkout is confirmed.
          </p>
          <Button to="/plans">Choose a plan</Button>
        </div>
      )}

      {hasSubscription && (
        <>
          <div className="sub-summary__period">
            <div className="sub-summary__period-head">
              <span>
                Started {formatSubscriptionDate(subscription.start_date)}
              </span>
              <span>Ends {formatSubscriptionDate(subscription.end_date)}</span>
            </div>

            {progress !== null && (
              <div
                className="sub-summary__track"
                role="progressbar"
                aria-label="Billing period elapsed"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            )}

            <p className="sub-summary__days">
              {getSubscriptionDaysMessage(resolvedState.key, daysLeft)}
            </p>
          </div>

          <dl className="sub-summary__facts">
            <div>
              <dt>Status</dt>
              <dd>{resolvedState.label}</dd>
            </div>
            <div>
              <dt>Next billing</dt>
              <dd>
                {subscription.next_billing_date
                  ? formatSubscriptionDate(subscription.next_billing_date)
                  : 'Not scheduled'}
              </dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>{formatPaymentMethod(subscription.payment_method)}</dd>
            </div>
            <div>
              <dt>Auto-renew</dt>
              <dd>{subscription.auto_renew ? 'On' : 'Off'}</dd>
            </div>
            <div>
              <dt>Billing cycle</dt>
              <dd>
                {formatSubscriptionDuration(
                  subscription.payment_frequency || subscription.duration
                ) || '—'}
              </dd>
            </div>
          </dl>

          {features.length > 0 && (
            <div className="sub-summary__features">
              <p className="mono sub-summary__features-title">
                Included in your plan
              </p>
              <ul>
                {features.map((feature, index) => (
                  <li key={`${feature}-${index}`}>
                    <Icon name="check" size={15} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sub-summary__actions">
            <Button to={planHref}>
              {planId
                ? getActionLabel(resolvedState.key)
                : 'Browse plans'}
            </Button>

            <Button to="/member/profile" variant="outline">
              My profile
            </Button>

            <Button to="/plans" variant="outline">
              Compare plans
            </Button>
          </div>

          {canCancel && (
            <div className="sub-summary__cancel">
              {confirming ? (
                <div
                  className="sub-summary__confirm"
                  role="alertdialog"
                  aria-label="Confirm membership cancellation"
                >
                  <p>
                    Cancel this membership? Your access will stop immediately
                    and you can restart at any time.
                  </p>

                  <div className="sub-summary__confirm-actions">
                    <Button
                      type="button"
                      variant="outline"
                      className="sub-summary__danger"
                      onClick={onCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling…' : 'Yes, cancel membership'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirming(false)}
                      disabled={cancelling}
                    >
                      Keep membership
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="sub-summary__cancel-link"
                  onClick={() => setConfirming(true)}
                >
                  Cancel membership
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
