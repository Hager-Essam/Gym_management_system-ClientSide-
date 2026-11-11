
import { useEffect, useState } from 'react';

import PricingCard from '../components/cards/PricingCard.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';

import { pricingHeader } from '../data/landing.js';
import { getActivePlans } from '../services/planService.js';
import { mapPlanToPricingCard } from '../utils/planMapper.js';

import './Pricing.css';

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await getActivePlans();

        const mappedPlans = data.map(mapPlanToPricingCard);

        setPlans(mappedPlans);
      } catch (err) {
        console.error('Failed to load plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return (
    <section id="pricing" className="section section--deep">
      <div className="container">
        <SectionHeading align="center" {...pricingHeader} />

        {loading && <p>Loading membership plans...</p>}

        {error && <p className="pricing__error">{error}</p>}

        {!loading && !error && plans.length === 0 && (
          <p>No membership plans available.</p>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="pricing__grid">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
