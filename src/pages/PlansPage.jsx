import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Footer from '../components/layout/Footer.jsx';
import Navbar from '../components/layout/Navbar.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getActivePlans } from '../services/planService.js';
import {
  describePlanClasses,
  formatPlanPrice,
  getPlanAction,
} from '../utils/planFormat.js';
import './PlansPage.css';

const normalizeFeature = (feature) => String(feature).trim().toLowerCase();

/** Union of every feature across plans, keeping first-seen order. */
function collectFeatureRows(plans) {
  const rows = [];
  const seen = new Set();

  for (const plan of plans) {
    for (const feature of plan.features || []) {
      const key = normalizeFeature(feature);

      // Personal training has its own dedicated row.
      if (!key || key === 'personal training' || seen.has(key)) continue;

      seen.add(key);
      rows.push(feature);
    }
  }

  return rows;
}

// Public page: /plans
// Side-by-side comparison using the real active plans endpoint.
export default function PlansPage() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      setLoading(true);
      setError('');

      try {
        const data = await getActivePlans();

        if (active) setPlans(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) {
          setPlans([]);
          setError(err.message || 'Unable to load membership plans.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPlans();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const featureRows = collectFeatureRows(plans);

  return (
    <div id="top">
      <Navbar />

      <main className="plans-page">
        <div className="container">
          <Link className="plans-page__back" to="/#pricing">
            <Icon name="arrow_back" size={16} />
            Back to membership plans
          </Link>

          <header className="plans-page__head">
            <p className="mono plans-page__eyebrow">MEMBERSHIP PLANS</p>
            <h1>Find the plan that fits</h1>
            <p className="plans-page__lead">
              Compare price, access level, classes and what's included, side by
              side. Open any plan for the full details.
            </p>
          </header>

          {loading && (
            <div className="plans-page__state" role="status" aria-live="polite">
              <span className="plans-page__spinner" aria-hidden="true" />
              <p>Loading membership plans…</p>
            </div>
          )}

          {!loading && error && (
            <div className="plans-page__state plans-page__state--error" role="alert">
              <Icon name="error" size={30} />
              <h2>We couldn't load the plans</h2>
              <p>{error}</p>
              <div className="plans-page__state-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReloadToken((token) => token + 1)}
                >
                  Try again
                </Button>
                <Button to="/">Back to home</Button>
              </div>
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="plans-page__state">
              <Icon name="info" size={28} />
              <h2>No plans available right now</h2>
              <p>
                Membership plans are temporarily unavailable. Please check back
                soon or ask the front desk for current options.
              </p>
              <Button to="/">Back to home</Button>
            </div>
          )}

          {!loading && !error && plans.length > 0 && (
            <div className="plans-page__scroll">
              <table
                className="plans-compare"
                aria-label="Membership plan comparison"
              >
                <thead>
                  <tr>
                    <th scope="col" className="plans-compare__corner">
                      Plan
                    </th>

                    {plans.map((plan) => {
                      const available = Boolean(
                        plan.is_active && plan.is_visible
                      );
                      const action = getPlanAction(plan.id, user);

                      return (
                        <th
                          scope="col"
                          key={plan.id}
                          className="plans-compare__plan"
                        >
                          <span className="plans-compare__tier">
                            {plan.access_level || 'membership'}
                          </span>

                          <span className="plans-compare__name">
                            {plan.name}
                          </span>

                          <span className="plans-compare__price">
                            ${formatPlanPrice(plan.price)}
                            <small>/ {plan.duration || 'month'}</small>
                          </span>

                          <Link
                            className="plans-compare__details"
                            to={`/plans/${plan.id}`}
                          >
                            Full details
                          </Link>

                          {available && action ? (
                            <Button
                              to={action.to}
                              size="sm"
                              className="btn--block"
                            >
                              {action.label}
                            </Button>
                          ) : (
                            <span className="plans-compare__unavailable">
                              Unavailable
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <th scope="row">Description</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>
                        {plan.description || 'Membership plan'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th scope="row">Access level</th>
                    {plans.map((plan) => (
                      <td key={plan.id} className="plans-compare__capitalize">
                        {plan.access_level || '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th scope="row">Group classes</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>
                        {describePlanClasses(plan.max_classes)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th scope="row">Personal training</th>
                    {plans.map((plan) => (
                      <td key={plan.id}>
                        {plan.includes_personal_training ? (
                          <>
                            <span className="plans-compare__yes">
                              <Icon name="check_circle" size={18} />
                            </span>
                            <span className="plans-compare__sr">Included</span>
                          </>
                        ) : (
                          <>
                            <span className="plans-compare__no">—</span>
                            <span className="plans-compare__sr">
                              Not included
                            </span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>

                  {featureRows.map((feature) => (
                    <tr key={feature}>
                      <th scope="row">{feature}</th>
                      {plans.map((plan) => {
                        const included = (plan.features || []).some(
                          (item) => normalizeFeature(item) === normalizeFeature(feature)
                        );

                        return (
                          <td key={plan.id}>
                            {included ? (
                              <>
                                <span className="plans-compare__yes">
                                  <Icon name="check_circle" size={18} />
                                </span>
                                <span className="plans-compare__sr">
                                  Included
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="plans-compare__no">—</span>
                                <span className="plans-compare__sr">
                                  Not included
                                </span>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
