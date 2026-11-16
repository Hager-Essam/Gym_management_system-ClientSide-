/**
 * Shared formatting + state rules for a member's subscription.
 *
 * The backend stores `start_date` / `end_date` as SQL `DATE` (no time), so
 * "expires today" must stay valid until the end of that day. Everything here
 * works on the raw subscription rows returned by:
 *   GET /api/auth/me
 *   GET /api/members/me
 *   GET /api/members/:id/subscription
 */

import { formatPlanDuration, formatPlanPrice } from './planFormat.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseSubscriptionDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Last millisecond of the subscription end date (local time). */
function endOfSubscriptionDay(value) {
  const date = parseSubscriptionDate(value);
  if (!date) return null;

  date.setHours(23, 59, 59, 999);
  return date;
}

export function formatSubscriptionDate(value) {
  const date = parseSubscriptionDate(value);
  if (!date) return '—';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatSubscriptionMoney(value) {
  const amount = Number(value);

  return Number.isFinite(amount) ? `$${formatPlanPrice(amount)}` : '—';
}

export function formatSubscriptionDuration(value) {
  return value ? formatPlanDuration(value) : '';
}

export function formatPaymentMethod(value) {
  if (!value) return 'Not recorded';

  // Values come straight from the API; map the known ones, echo anything else.
  const labels = {
    card: 'Credit / debit card',
    cash: 'Cash at the front desk',
    bank_transfer: 'Bank transfer',
    wallet: 'Digital wallet',
  };

  return labels[value] || value;
}

/** Whole days until the membership stops being valid (0 = expires today). */
export function getDaysRemaining(endDate, now = Date.now()) {
  const end = parseSubscriptionDate(endDate);
  if (!end) return null;

  // Compare calendar days, not 24h windows: a membership ending today has 0.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(0, Math.round((end.getTime() - today.getTime()) / DAY_MS));
}

/** Short, state-aware sentence shown under the membership dates. */
export function getSubscriptionDaysMessage(stateKey, daysLeft) {
  if (stateKey === 'expired') return 'Expired — renew to keep training.';
  if (stateKey === 'cancelled') return 'Cancelled — access is inactive.';
  if (stateKey === 'pending') return 'Awaiting activation — complete checkout.';
  if (stateKey === 'paused') return 'Paused — resume when you are ready.';

  if (daysLeft === null || daysLeft === undefined) {
    return 'Renewal date not recorded.';
  }
  if (daysLeft === 0) return 'Expires today.';
  if (daysLeft === 1) return '1 day left.';

  return `${daysLeft} days left.`;
}

export function isSubscriptionExpired(subscription, now = Date.now()) {
  const end = endOfSubscriptionDay(subscription?.end_date);
  if (!end) return false;

  return end.getTime() < now;
}

/**
 * Turn a raw row into a consistent, display-ready state.
 * Returns `{ key, label, tone, daysLeft? }`.
 */
export function deriveSubscriptionState(subscription, now = Date.now()) {
  if (!subscription) {
    return { key: 'none', label: 'No membership', tone: 'neutral' };
  }

  const status = String(subscription.status || '').toLowerCase();

  if (status === 'cancelled') {
    return { key: 'cancelled', label: 'Cancelled', tone: 'muted' };
  }

  if (status === 'pending') {
    return { key: 'pending', label: 'Awaiting activation', tone: 'info' };
  }

  if (status === 'paused') {
    return { key: 'paused', label: 'Paused', tone: 'info' };
  }

  if (status === 'expired') {
    return { key: 'expired', label: 'Expired', tone: 'danger' };
  }

  if (status === 'active') {
    // Some rows are still flagged active after their end date; trust the date.
    if (isSubscriptionExpired(subscription, now)) {
      return { key: 'expired', label: 'Expired', tone: 'danger' };
    }

    const daysLeft = getDaysRemaining(subscription.end_date, now);

    if (daysLeft !== null && daysLeft <= 7) {
      return {
        key: 'ending-soon',
        label: 'Ending soon',
        tone: 'warning',
        daysLeft,
      };
    }

    return { key: 'active', label: 'Active', tone: 'success' };
  }

  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Unknown';

  return { key: 'unknown', label, tone: 'neutral' };
}

/**
 * The subscription the member should see first: a live one if possible,
 * then a pending checkout, then the most recent record (history).
 */
export function pickCurrentSubscription(subscriptions = []) {
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) return null;

  const byNewest = [...subscriptions].sort((a, b) => {
    const aDate = new Date(a.created_at || a.start_date || 0).getTime();
    const bDate = new Date(b.created_at || b.start_date || 0).getTime();
    return bDate - aDate;
  });

  return (
    byNewest.find((item) => item.status === 'active') ||
    byNewest.find((item) => item.status === 'pending') ||
    byNewest.find((item) => item.status === 'paused') ||
    byNewest[0] ||
    null
  );
}

/** Elapsed percentage of the billing period, for the progress bar. */
export function getSubscriptionProgress(subscription, now = Date.now()) {
  const start = parseSubscriptionDate(subscription?.start_date);
  const end = parseSubscriptionDate(subscription?.end_date);

  if (!start || !end || end.getTime() <= start.getTime()) return null;

  const total = end.getTime() - start.getTime();
  const elapsed = Math.min(Math.max(now - start.getTime(), 0), total);

  return Math.round((elapsed / total) * 100);
}

/** Plan id is only present on history rows (`s.*`), never on `/members/me`. */
export function getSubscriptionPlanId(subscription) {
  return subscription?.plan_id || subscription?.planId || null;
}
