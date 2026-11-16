/** Shared plan formatting + the one place that decides the next step per role. */

export function formatPlanPrice(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) return '—';

  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

export function formatPlanDuration(value) {
  if (!value) return '—';

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function describePlanClasses(maxClasses) {
  if (maxClasses === null || maxClasses === undefined) {
    return 'Unlimited group classes';
  }

  if (Number(maxClasses) === 0) {
    return 'No group classes included';
  }

  return `${maxClasses} group classes / month`;
}

/**
 * Where a plan CTA should send the visitor.
 * Guests sign up first (plan kept in the URL), members check out, staff use
 * their own dashboard. Returns null when there is no plan id.
 */
export function getPlanAction(planId, user) {
  if (!planId) return null;

  if (!user) {
    return { to: `/register?plan=${planId}`, label: 'Join with this plan' };
  }

  if (user.role === 'member') {
    return { to: `/subscribe/${planId}`, label: 'Subscribe to this plan' };
  }

  return { to: '/dashboard', label: 'Go to dashboard' };
}
