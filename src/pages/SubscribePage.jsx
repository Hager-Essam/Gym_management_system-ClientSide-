import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';

import DashboardNav from '../components/layout/DashboardNav.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import { getPlanById } from '../services/planService.js';
import { confirmCheckout, createCheckout } from '../services/paymentService.js';

import './SubscribePage.css';

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : `$${value}`;
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
}

export default function SubscribePage() {
  const { planId } = useParams();
  const { user } = useAuth();
  const { refreshProfile } = useMemberProfile();
  const location = useLocation();

  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [autoRenew, setAutoRenew] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      setLoadingPlan(true);
      setPlanError('');
      setPlan(null);

      try {
        const data = await getPlanById(planId);

        if (!data?.id && !data?.name) {
          throw new Error('This membership plan could not be found.');
        }

        if (active) {
          setPlan(data);
        }
      } catch (err) {
        if (active) {
          setPlanError(err.message || 'Unable to load this membership plan.');
        }
      } finally {
        if (active) {
          setLoadingPlan(false);
        }
      }
    }

    loadPlan();

    return () => {
      active = false;
    };
  }, [planId]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user?.id) {
      setError('We could not find your account ID. Please sign in again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const checkout = await createCheckout({
        planId: plan?.id || planId,
        paymentMethod,
        autoRenew,
      });

      const paymentId = checkout?.payment?.id;
      if (!paymentId) {
        throw new Error('The server did not create a checkout payment.');
      }

      const result = await confirmCheckout(paymentId);
      setCheckoutResult(result);

      if (result?.payment?.status === 'completed') {
        refreshProfile().catch(() => {});
      }
    } catch (err) {
      setError(err.message || 'Unable to create your subscription.');
    } finally {
      setSubmitting(false);
    }
  }

  // The route is protected, but keep a safe fallback.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const features = Array.isArray(plan?.features) ? plan.features : [];

  return (
    <>
      <DashboardNav />

      <main className="subscribe">
        <div className="container subscribe__container">
          <Link to="/#pricing" className="subscribe__back">
            <Icon name="arrow_back" size={16} />
            Back to plans
          </Link>

          {loadingPlan && (
            <p className="subscribe__loading">Loading membership plan...</p>
          )}

          {!loadingPlan && planError && (
            <div className="card subscribe__empty">
              <Icon name="error" size={32} />
              <h1>Plan unavailable</h1>
              <p>{planError}</p>
              <Button to="/#pricing" variant="outline">Browse plans</Button>
            </div>
          )}

          {!loadingPlan && !planError && plan && (
            <>
              <header className="subscribe__header">
                <p className="mono text-accent">Membership checkout</p>
                <h1>Subscribe to {plan.name}</h1>
                <p className="subscribe__lead">
                  Confirm your membership details below. Your access starts as soon
                  as the subscription is activated.
                </p>
              </header>

              <div className="subscribe__grid">
                <section className="card subscribe__plan">
                  <p className="mono text-muted">
                    {plan.access_level
                      ? plan.access_level.toUpperCase()
                      : 'Membership plan'}
                  </p>

                  <h2 className="subscribe__plan-name">{plan.name}</h2>

                  <p className="subscribe__price">
                    {formatMoney(plan.price)}
                    <span> / {plan.duration || 'month'}</span>
                  </p>

                  {plan.description && (
                    <p className="subscribe__description">{plan.description}</p>
                  )}

                  <ul className="subscribe__features">
                    {features.map((feature, index) => (
                      <li key={`${feature}-${index}`}>
                        <Icon name="check_circle" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}

                    <li
                      className={plan.includes_personal_training ? '' : 'is-off'}
                    >
                      <Icon
                        name={plan.includes_personal_training ? 'check_circle' : 'cancel'}
                        size={16}
                      />
                      <span>Personal training</span>
                    </li>
                  </ul>
                </section>

                <section className="card subscribe__checkout">
                  {checkoutResult ? (
                    <div className="subscribe__success">
                      <span className="subscribe__success-icon">
                        <Icon
                          name={checkoutResult.payment?.status === 'completed' ? 'check_circle' : 'error'}
                          size={40}
                        />
                      </span>

                      <h2>
                        {checkoutResult.payment?.status === 'completed'
                          ? 'Subscription activated'
                          : 'Payment was not completed'}
                      </h2>

                      <p>
                        {checkoutResult.payment?.status === 'completed'
                          ? <>You are now subscribed to <strong>{plan.name}</strong>. Your membership is ready to use.</>
                          : 'The payment could not be completed. Your membership has not been activated.'}
                      </p>

                      <dl className="subscribe__summary">
                        <div>
                          <dt>Payment status</dt>
                          <dd>{checkoutResult.payment?.status || 'unknown'}</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd>{formatMoney(checkoutResult.payment?.amount ?? plan.price)}</dd>
                        </div>
                        <div>
                          <dt>Membership status</dt>
                          <dd>{checkoutResult.subscription?.status || 'pending'}</dd>
                        </div>
                        <div>
                          <dt>Invoice</dt>
                          <dd>{checkoutResult.payment?.invoiceNumber || checkoutResult.payment?.invoice_number || '—'}</dd>
                        </div>
                        <div>
                          <dt>Payment</dt>
                          <dd>{checkoutResult.payment?.paymentMethod || checkoutResult.payment?.payment_method || paymentMethod}</dd>
                        </div>
                      </dl>

                      {checkoutResult.payment?.status === 'completed' ? (
                        <Button to="/dashboard/member" className="btn--block">
                          Go to my dashboard
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="btn--block"
                          onClick={() => setCheckoutResult(null)}
                        >
                          Try checkout again
                        </Button>
                      )}

                      {checkoutResult.payment?.status === 'completed' && (
                        <Button
                          to="/member/profile"
                          variant="outline"
                          className="btn--block"
                        >
                          View my profile
                        </Button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <h2>Confirm subscription</h2>

                      <p className="subscribe__checkout-subtitle">
                        Choose how you would like to pay. This is a demo checkout,
                        so no real payment is taken.
                      </p>

                      <fieldset className="subscribe__payments">
                        <legend className="mono text-muted">Payment method</legend>

                        <label
                          className={`subscribe__payment ${paymentMethod === 'card' ? 'is-active' : ''
                            }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={() => setPaymentMethod('card')}
                          />
                          <Icon name="credit_card" />
                          <span>
                            <strong>Credit / debit card</strong>
                            <small>Billed every month</small>
                          </span>
                        </label>

                        <label
                          className={`subscribe__payment ${paymentMethod === 'cash' ? 'is-active' : ''
                            }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="wallet"
                            checked={paymentMethod === 'wallet'}
                            onChange={() => setPaymentMethod('wallet')}
                          />
                          <Icon name="payments" />
                          <span>
                            <strong>Digital wallet</strong>
                            <small>Demo checkout only; no payment credentials are collected</small>
                          </span>
                        </label>
                      </fieldset>

                      <label className="subscribe__toggle">
                        <input
                          type="checkbox"
                          checked={autoRenew}
                          onChange={(event) => setAutoRenew(event.target.checked)}
                        />
                        <span>
                          Auto-renew my membership
                          <small>
                            Keeps your access active until you cancel.
                          </small>
                        </span>
                      </label>

                      {error && (
                        <p className="subscribe__error" role="alert">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="btn--block"
                        disabled={submitting}
                      >
                        <Icon name="lock" size={16} />
                        {submitting
                          ? 'Confirming payment...'
                          : `Continue for ${formatMoney(plan.price)}`}
                      </Button>

                      <p className="subscribe__fine">
                        By confirming, you agree to the membership terms and
                        cancellation policy.
                      </p>
                    </form>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
