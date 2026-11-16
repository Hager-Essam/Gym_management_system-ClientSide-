
import { Link } from 'react-router-dom';

import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './PricingCard.css';

export default function PricingCard({ plan }) {
  const { user } = useAuth();
  const isMember = user?.role === 'member';

  // Logged-in members go straight to the subscription page for this plan.
  // Visitors still sign up first; staff are sent to their dashboard.
  const target = !user
    ? `/register?plan=${plan.id}` : isMember ? `/subscribe/${plan.id}` : '/dashboard';

  const cta = !user ? plan.cta : isMember ? 'Subscribe now' : 'Go to dashboard';

  return (
    <article className={`card plan ${plan.popular ? 'plan--popular' : ''}`}>

      {plan.popular && (
        <span className="plan__badge mono">
          Most popular
        </span>
      )}

      <p className="mono text-muted">{plan.tier}</p>

      <h3 className="plan__name">{plan.name}</h3>

      <p className="plan__price">
        <span>${plan.price}</span> / {plan.duration}
      </p>

      <p className="plan__desc">{plan.description}</p>

      <ul className="plan__list">
        {plan.features.map((feature, index) => (
          <li
            key={`${feature.label}-${index}`}
            className={feature.included ? '' : 'is-off'}
          >
            <Icon
              name={feature.included ? 'check_circle' : 'cancel'}
              size={16}
            />
            {feature.label}
          </li>
        ))}
      </ul>

      <Link className="plan__details" to={`/plans/${plan.id}`}>
        View full details
        <Icon name="arrow_forward" size={14} />
      </Link>

      <Button
        to={target}
        variant={plan.popular ? 'primary' : 'outline'}
        className="btn--block"
      >
        {cta}
      </Button>

    </article>
  );
}
