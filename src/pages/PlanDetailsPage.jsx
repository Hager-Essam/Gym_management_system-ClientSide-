import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Footer from '../components/layout/Footer.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getPlanById } from '../services/planService.js';
import {
  describePlanClasses,
  formatPlanDuration,
  formatPlanPrice,
  getPlanAction,
} from '../utils/planFormat.js';
import './PlanDetailsPage.css';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Public page: /plans/:planId
// Shows one plan in full, with the same next step the pricing card uses.
export default function PlanDetailsPage() {
  const { planId } = useParams();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      if (!UUID_PATTERN.test(planId || '')) {
        setPlan(null);
        setError('This plan link is not valid.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await getPlanById(planId);

        if (active) setPlan(data);
      } catch (err) {
        if (active) {
          setPlan(null);
          setError(err.message || 'Unable to load this plan.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      active = false;
    };
  }, [planId]);

  const features = Array.isArray(plan?.features) ? plan.features : [];
  const isAvailable = Boolean(plan?.is_active && plan?.is_visible);
  const action = getPlanAction(plan?.id, user);

  const callToAction =
    plan && isAvailable && action ? (
      <Button to={action.to}>{action.label}</Button>
    ) : null;

  return (
    <div id="top">
      <Navbar />

      <main className="plan-details">
        <div className="container">
          <Link className="plan-details__back" to="/#pricing">
            <Icon name="arrow_back" size={16} />
            Back to membership plans
          </Link>

          {loading && (
            <div className="plan-details__state" role="status" aria-live="polite">
              <span className="plan-details__spinner" aria-hidden="true" />
              <p>Loading plan details…</p>
            </div>
          )}

          {!loading && error && (
            <section className="card plan-details__state plan-details__state--error">
              <Icon name="error" size={30} />
              <h1>Plan unavailable</h1>
              <p>{error}</p>
              <Button to="/#pricing">Browse all plans</Button>
            </section>
          )}

          {!loading && !error && plan && (
            <>
              <section className="plan-details__hero">
                <div className="plan-details__intro">
                  <p className="mono plan-details__eyebrow">
                    {(plan.access_level || 'membership').toUpperCase()} MEMBERSHIP
                  </p>

                  <h1>{plan.name}</h1>

                  <p className="plan-details__description">
                    {plan.description || 'Membership plan at IronForge Gym.'}
                  </p>

                  <div className="plan-details__badges">
                    <span
                      className={`plan-details__badge ${
                        isAvailable
                          ? 'plan-details__badge--available'
                          : 'plan-details__badge--unavailable'
                      }`}
                    >
                      {isAvailable ? 'Available now' : 'Currently unavailable'}
                    </span>

                    <span className="plan-details__badge">
                      {formatPlanDuration(plan.duration)}
                    </span>
                  </div>
                </div>

                <aside className="card plan-details__price-card">
                  <p className="mono text-muted">Membership price</p>

                  <p className="plan-details__price">
                    <span>${formatPlanPrice(plan.price)}</span>
                    <small>/ {plan.duration || 'month'}</small>
                  </p>

                  <dl className="plan-details__info">
                    <div>
                      <dt>Access level</dt>
                      <dd>{plan.access_level || '—'}</dd>
                    </div>
                    <div>
                      <dt>Group classes</dt>
                      <dd>{describePlanClasses(plan.max_classes)}</dd>
                    </div>
                    <div>
                      <dt>Personal training</dt>
                      <dd>
                        {plan.includes_personal_training
                          ? 'Included'
                          : 'Not included'}
                      </dd>
                    </div>
                  </dl>

                  {isAvailable ? (
                    callToAction
                  ) : (
                    <p className="plan-details__unavailable">
                      This plan is not open for new subscriptions right now.
                      Please choose another plan or ask the front desk.
                    </p>
                  )}

                  {!user && isAvailable && (
                    <p className="plan-details__fineprint">
                      You'll create your account first. Your selected plan is
                      kept so you can finish checkout straight after sign-up.
                    </p>
                  )}
                </aside>
              </section>

              <section className="plan-details__content">
                <div className="card plan-details__features">
                  <h2>What's included</h2>

                  {features.length > 0 ? (
                    <ul className="plan-details__feature-list">
                      {features.map((feature, index) => (
                        <li key={`${feature}-${index}`}>
                          <Icon name="check_circle" size={18} />
                          {feature}
                        </li>
                      ))}

                      <li
                        className={
                          plan.includes_personal_training ? '' : 'is-off'
                        }
                      >
                        <Icon
                          name={
                            plan.includes_personal_training
                              ? 'check_circle'
                              : 'cancel'
                          }
                          size={18}
                        />
                        Personal training
                      </li>
                    </ul>
                  ) : (
                    <p className="plan-details__empty">
                      No feature list is published for this plan yet. Contact
                      the front desk for full details.
                    </p>
                  )}
                </div>

                <div className="card plan-details__next">
                  <h2>Next step</h2>

                  {isAvailable ? (
                    <ol>
                      <li>
                        {!user
                          ? 'Create your member account.'
                          : 'Confirm the plan on the checkout page.'}
                      </li>
                      <li>Choose a payment method and auto-renew preference.</li>
                      <li>
                        Your membership becomes active immediately after
                        checkout.
                      </li>
                    </ol>
                  ) : (
                    <p>
                      New subscriptions are paused for this plan. Browse the
                      currently available plans instead.
                    </p>
                  )}

                  <Button to="/plans" variant="outline">
                    Compare other plans
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
