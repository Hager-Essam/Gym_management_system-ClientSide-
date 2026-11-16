import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import {
  getMemberAttendance,
  getMemberSubscriptions,
} from '../services/memberService.js';
import { getMyPayments } from '../services/paymentService.js';
import {
  formatDuration,
  formatVisitDay,
  formatVisitTime,
  getMonthLabel,
  getMonthStartDate,
  getVisitDurationMinutes,
  isVisitOpen,
} from '../utils/attendanceFormat.js';
import { getProfileCompletion } from '../utils/profileCompletion.js';
import {
  deriveSubscriptionState,
  formatPaymentMethod,
  formatSubscriptionDate,
  formatSubscriptionDuration,
  formatSubscriptionMoney,
  getDaysRemaining,
  getSubscriptionDaysMessage,
  getSubscriptionPlanId,
  pickCurrentSubscription,
} from '../utils/subscriptionFormat.js';

import './MemberDashboard.css';

const VISITS_PER_PAGE = 8;

// Everything below comes from real member endpoints:
//   GET /api/members/me
//   GET /api/members/:id/subscription
//   GET /api/members/:id/attendance
export default function MemberDashboard() {
  const {
    member,
    subscription,
    loading,
    error,
    refreshProfile,
  } = useMemberProfile();

  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [visitPagination, setVisitPagination] = useState(null);
  const [monthVisits, setMonthVisits] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [visitError, setVisitError] = useState('');
  const [monthError, setMonthError] = useState('');
  const [membershipError, setMembershipError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState('');

  useEffect(() => {
    if (!member?.id) return undefined;

    let active = true;
    const monthStart = getMonthStartDate();

    setDataLoading(true);
    setVisitError('');
    setMonthError('');
    setMembershipError('');
    setPaymentError('');

    Promise.allSettled([
      getMemberAttendance(member.id, { page: 1, limit: VISITS_PER_PAGE }),
      getMemberSubscriptions(member.id),
      getMemberAttendance(member.id, { startDate: monthStart, limit: 1 }),
      getMyPayments(member.id, { page: 1, limit: 5 }),
    ])
      .then(([visitsResult, subscriptionsResult, monthResult, paymentsResult]) => {
        if (!active) return;

        if (visitsResult.status === 'fulfilled') {
          setVisits(visitsResult.value?.attendance || []);
          setVisitPagination(visitsResult.value?.pagination || null);
        } else {
          setVisits([]);
          setVisitPagination(null);
          setVisitError(
            visitsResult.reason?.message || 'Unable to load your check-ins.'
          );
        }

        if (subscriptionsResult.status === 'fulfilled') {
          setSubscriptions(
            Array.isArray(subscriptionsResult.value)
              ? subscriptionsResult.value
              : []
          );
        } else {
          setSubscriptions([]);
          setMembershipError(
            subscriptionsResult.reason?.message ||
              'Unable to load your membership history.'
          );
        }

        if (monthResult.status === 'fulfilled') {
          setMonthVisits(monthResult.value?.pagination?.totalRecords ?? 0);
        } else {
          setMonthVisits(null);
          setMonthError(
            monthResult.reason?.message ||
              'Unable to load this month’s check-ins.'
          );
        }

        if (paymentsResult.status === 'fulfilled') {
          setPayments(paymentsResult.value?.payments || []);
        } else {
          setPayments([]);
          setPaymentError(
            paymentsResult.reason?.message || 'Unable to load payment history.'
          );
        }
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [member?.id, reloadToken]);

  // Any new page of data invalidates the old "load more" error.
  useEffect(() => {
    setMoreError('');
  }, [member?.id, reloadToken]);

  function retry() {
    setReloadToken((token) => token + 1);
    refreshProfile().catch(() => {});
  }

  async function loadMoreVisits() {
    if (!member?.id || !visitPagination) return;

    const nextPage = (visitPagination.currentPage || 1) + 1;

    setLoadingMore(true);
    setMoreError('');

    try {
      const data = await getMemberAttendance(member.id, {
        page: nextPage,
        limit: VISITS_PER_PAGE,
      });

      const nextRows = data?.attendance || [];

      setVisits((current) => {
        const seen = new Set(current.map((visit) => visit.id));
        return [
          ...current,
          ...nextRows.filter((visit) => !seen.has(visit.id)),
        ];
      });
      setVisitPagination(data?.pagination || visitPagination);
    } catch (err) {
      setMoreError(err.message || 'Unable to load older visits.');
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return (
      <div className="member-dash">
        <DashboardNav />

        <main
          className="container member-dash__page-state"
          role="status"
          aria-live="polite"
        >
          <span className="member-dash__spinner" aria-hidden="true" />
          <p>Loading your dashboard…</p>
        </main>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="member-dash">
        <DashboardNav />

        <main className="container member-dash__page-state">
          <div className="card member-dash__page-error" role="alert">
            <Icon name="error" size={32} />
            <h1>We couldn't load your dashboard</h1>
            <p>{error || 'Your member profile is unavailable right now.'}</p>

            <div className="member-dash__page-error-actions">
              <Button type="button" variant="outline" onClick={retry}>
                Try again
              </Button>
              <Button to="/" variant="outline">
                Back to home
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fullName = member.fullName || 'Member';
  const firstName = fullName.trim().split(' ')[0] || 'Member';
  const email = member.email || 'Email not recorded';

  const membership =
    pickCurrentSubscription(subscriptions) || subscription || null;
  const membershipState = deriveSubscriptionState(membership);
  const membershipPlanId = getSubscriptionPlanId(membership);
  const membershipDaysLeft = membership
    ? getDaysRemaining(membership.end_date)
    : null;

  const membershipAmount = membership?.amount ?? membership?.price;
  const membershipDuration =
    membership?.duration || membership?.payment_frequency;

  const completion = getProfileCompletion(member);
  const lastVisit = visits[0] || null;
  const totalVisits = visitPagination?.totalRecords ?? null;
  const monthLabel = getMonthLabel();

  const openVisit = visits.find((visit) => isVisitOpen(visit)) || null;
  const hasMoreVisits = Boolean(
    visitPagination &&
      visitPagination.currentPage < visitPagination.totalPages
  );

  return (
    <div className="member-dash">
      <DashboardNav />

      <header className="member-dash__header">
        <div className="container member-dash__header-top">
          <div>
            <p className="mono member-dash__terminal">
              <span className="member-dash__terminal-dot" aria-hidden="true" />
              MEMBER OVERVIEW
            </p>

            <h1 className="member-dash__greeting">
              Welcome back, {firstName}.
            </h1>

            <p className="member-dash__subtext">Signed in as {email}</p>

            <p className="member-dash__subtext">
              Member since {formatSubscriptionDate(member.createdAt)}
            </p>
          </div>

          <Button
            to={membership ? '/member/subscription' : '/plans'}
            variant="primary"
            size="lg"
            className="member-dash__launch-btn"
          >
            <Icon name="card_membership" size={18} />
            {membership ? 'Manage membership' : 'Choose a plan'}
          </Button>
        </div>
      </header>

      <div className="container">
        <div className="member-dash__content">
          {openVisit && (
            <p className="member-dash__strip">
              <Icon name="sensors" size={16} />
              You are checked in right now — started{' '}
              {formatVisitTime(openVisit.check_in_time)} at{' '}
              {openVisit.location || 'the gym'}.
            </p>
          )}

          <section className="member-dash__stats" aria-label="At a glance">
            <article className="card member-dash__stat-card">
              <p className="mono text-muted text-sm">TOTAL CHECK-INS</p>

              {dataLoading ? (
                <span className="member-dash__skeleton member-dash__skeleton--value" />
              ) : (
                <div className="member-dash__stat-value">
                  <span className="stat-number">
                    {visitError || totalVisits === null ? '—' : totalVisits}
                  </span>
                  <span className="stat-unit">visits</span>
                </div>
              )}

              <p className="member-dash__stat-note">
                {visitError
                  ? "Couldn't load your check-ins."
                  : totalVisits === 0
                  ? 'No visits recorded yet.'
                  : 'Recorded at the front desk.'}
              </p>
            </article>

            <article className="card member-dash__stat-card">
              <p className="mono text-muted text-sm">
                THIS MONTH · {monthLabel.toUpperCase()}
              </p>

              {dataLoading ? (
                <span className="member-dash__skeleton member-dash__skeleton--value" />
              ) : (
                <div className="member-dash__stat-value">
                  <span className="stat-number">
                    {monthError || monthVisits === null ? '—' : monthVisits}
                  </span>
                  <span className="stat-unit">visits</span>
                </div>
              )}

              <p className="member-dash__stat-note">
                {monthError
                  ? monthError
                  : monthVisits === 0
                  ? `No check-ins in ${monthLabel} yet.`
                  : `${monthLabel} check-ins so far.`}
              </p>
            </article>

            <article className="card member-dash__stat-card">
              <p className="mono text-muted text-sm">LAST VISIT</p>

              {dataLoading ? (
                <span className="member-dash__skeleton member-dash__skeleton--value" />
              ) : (
                <p className="member-dash__stat-text">
                  {lastVisit ? formatVisitDay(lastVisit.check_in_time) : '—'}
                </p>
              )}

              <p className="member-dash__stat-note">
                {visitError
                  ? "Couldn't load your check-ins."
                  : lastVisit
                  ? `${formatVisitTime(lastVisit.check_in_time)} · ${
                      lastVisit.location || 'Location not recorded'
                    }`
                  : 'No check-ins yet.'}
              </p>
            </article>

            <article className="card member-dash__stat-card">
              <div className="member-dash__stat-heading">
                <p className="mono text-muted text-sm">PROFILE</p>

                <Link to="/member/profile" className="member-dash__stat-link">
                  Edit
                </Link>
              </div>

              <div className="member-dash__stat-value">
                <span className="stat-number">{completion.percentage}</span>
                <span className="stat-unit">% complete</span>
              </div>

              <div
                className="member-dash__progress"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuenow={completion.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${completion.percentage}%` }} />
              </div>

              <p className="member-dash__stat-note">
                {completion.isComplete
                  ? 'All profile details are filled in.'
                  : `${completion.completed} of ${completion.total} details saved.`}
              </p>
            </article>
          </section>

          <div className="member-dash__main-grid">
            <div className="member-dash__left-col">
              <section className="card member-dash__card">
                <div className="member-dash__card-header">
                  <div>
                    <h2 className="member-dash__card-title">
                      Recent check-ins
                    </h2>

                    <p className="text-muted text-sm">
                      Your latest visits recorded by the gym.
                    </p>
                  </div>

                  {!dataLoading && !visitError && totalVisits !== null && (
                    <span className="member-dash__count">
                      {totalVisits} total
                    </span>
                  )}
                </div>

                {dataLoading && (
                  <div className="member-dash__visits" aria-hidden="true">
                    {[0, 1, 2].map((row) => (
                      <div className="member-dash__visit" key={row}>
                        <div className="member-dash__visit-main">
                          <span className="member-dash__skeleton member-dash__skeleton--line" />
                          <span className="member-dash__skeleton member-dash__skeleton--short" />
                        </div>
                        <div className="member-dash__visit-side">
                          <span className="member-dash__skeleton member-dash__skeleton--short" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!dataLoading && visitError && (
                  <div className="member-dash__inline-error" role="alert">
                    <Icon name="error" size={20} />
                    <p>{visitError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={retry}
                    >
                      Try again
                    </Button>
                  </div>
                )}

                {!dataLoading && !visitError && visits.length === 0 && (
                  <div className="member-dash__empty">
                    <Icon name="event_busy" size={30} />
                    <p>No check-ins yet.</p>
                    <p className="text-muted text-sm">
                      Your first visit appears here after the front desk records
                      your entry.
                    </p>
                  </div>
                )}

                {!dataLoading && !visitError && visits.length > 0 && (
                  <>
                    <ul className="member-dash__visits">
                      {visits.map((visit) => (
                        <VisitRow key={visit.id} visit={visit} />
                      ))}
                    </ul>

                    {moreError && (
                      <p className="member-dash__inline-error-text" role="alert">
                        {moreError}
                      </p>
                    )}

                    {hasMoreVisits && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="member-dash__more"
                        onClick={loadMoreVisits}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading…' : 'Show older visits'}
                      </Button>
                    )}
                  </>
                )}
              </section>

              <section className="card member-dash__card">
                <div className="member-dash__card-header">
                  <h2 className="member-dash__card-title">Recent payments</h2>
                  {paymentError && (
                    <button type="button" className="member-dash__more" onClick={retry}>
                      Retry
                    </button>
                  )}
                </div>

                {paymentError && (
                  <p className="member-dash__inline-error-text" role="alert">
                    {paymentError}
                  </p>
                )}

                {dataLoading ? (
                  <p className="text-muted text-sm">Loading payment history…</p>
                ) : payments.length > 0 ? (
                  <ul className="member-dash__visits">
                    {payments.map((payment) => (
                      <li key={payment.id} className="member-dash__visit">
                        <div>
                          <strong>{payment.description || payment.payment_type || 'Membership payment'}</strong>
                          <p className="text-xs text-muted">
                            {payment.invoice_number || payment.payment_method || 'Payment'}
                            {payment.created_at
                              ? ` · ${new Date(payment.created_at).toLocaleDateString()}`
                              : ''}
                          </p>
                        </div>
                        <span>
                          {payment.amount} {payment.currency} · {payment.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : !paymentError ? (
                  <p className="text-muted text-sm">No payments found.</p>
                ) : null}

                <p className="text-xs text-muted">
                  Class schedules, workout programs, and body-composition scans are not available in the API yet.
                </p>
              </section>
            </div>

            <div className="member-dash__right-col">
              <section className="card member-dash__card">
                <div className="member-dash__card-header member-dash__card-header--tight">
                  <p className="mono text-muted text-sm">MEMBERSHIP</p>

                  {membership && !dataLoading && (
                    <span
                      className={`member-dash__badge member-dash__badge--${membershipState.tone}`}
                    >
                      {membershipState.label}
                    </span>
                  )}
                </div>

                {dataLoading && (
                  <div className="member-dash__membership-loading" aria-hidden="true">
                    <span className="member-dash__skeleton member-dash__skeleton--title" />
                    <span className="member-dash__skeleton member-dash__skeleton--line" />
                    <span className="member-dash__skeleton member-dash__skeleton--short" />
                  </div>
                )}

                {!dataLoading && !membership && (
                  <div className="member-dash__membership-empty">
                    {membershipError ? (
                      <>
                        <p className="member-dash__inline-error-text" role="alert">
                          {membershipError}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={retry}
                        >
                          Try again
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted text-sm">
                          You don't have a membership yet. Pick a plan to start
                          training.
                        </p>
                        <Button to="/plans" size="sm">
                          Choose a plan
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {!dataLoading && membership && (
                  <>
                    <h3 className="member-dash__plan">
                      {membership.plan_name || 'Membership plan'}
                    </h3>

                    {membershipAmount !== undefined &&
                      membershipAmount !== null && (
                        <p className="member-dash__plan-price">
                          {formatSubscriptionMoney(membershipAmount)}
                          {membershipDuration && (
                            <span>
                              {' '}
                              / {formatSubscriptionDuration(membershipDuration)}
                            </span>
                          )}
                        </p>
                      )}

                    <p className="member-dash__plan-dates">
                      {formatSubscriptionDate(membership.start_date)} —{' '}
                      {formatSubscriptionDate(membership.end_date)}
                    </p>

                    <p
                      className={`member-dash__plan-state member-dash__plan-state--${membershipState.tone}`}
                    >
                      {getSubscriptionDaysMessage(
                        membershipState.key,
                        membershipDaysLeft
                      )}
                    </p>

                    <dl className="member-dash__facts">
                      <div>
                        <dt>Next billing</dt>
                        <dd>
                          {membership.next_billing_date
                            ? formatSubscriptionDate(
                                membership.next_billing_date
                              )
                            : 'Not scheduled'}
                        </dd>
                      </div>
                      <div>
                        <dt>Auto-renew</dt>
                        <dd>{membership.auto_renew ? 'On' : 'Off'}</dd>
                      </div>
                      <div>
                        <dt>Payment</dt>
                        <dd>
                          {formatPaymentMethod(membership.payment_method)}
                        </dd>
                      </div>
                    </dl>

                    {membershipError && (
                      <p className="member-dash__inline-error-text" role="alert">
                        {membershipError}
                      </p>
                    )}

                    <Button
                      to="/member/subscription"
                      variant="outline"
                      size="sm"
                      className="btn--block member-dash__manage"
                    >
                      <Icon name="card_membership" size={16} />
                      {membershipPlanId ? 'Manage membership' : 'View membership'}
                    </Button>
                  </>
                )}
              </section>

              <section className="card member-dash__card">
                <div className="member-dash__card-header">
                  <div>
                    <h2 className="member-dash__card-title">Your profile</h2>

                    <p className="text-muted text-sm">
                      Keep your contact details up to date.
                    </p>
                  </div>

                  <span className="member-dash__count">
                    {completion.percentage}%
                  </span>
                </div>

                <div
                  className="member-dash__progress"
                  role="progressbar"
                  aria-label="Profile completion"
                  aria-valuenow={completion.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${completion.percentage}%` }} />
                </div>

                <p className="text-muted text-sm member-dash__profile-copy">
                  {completion.completed} of {completion.total} profile details
                  are saved.
                </p>

                {!completion.isComplete && (
                  <p className="member-dash__missing">
                    Still missing: {completion.missing.join(', ')}.
                  </p>
                )}

                <Button
                  to="/member/profile"
                  variant="outline"
                  size="sm"
                  className="btn--block member-dash__manage"
                >
                  <Icon name="person" size={16} />
                  Edit profile
                </Button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitRow({ visit }) {
  const open = isVisitOpen(visit);
  const minutes = getVisitDurationMinutes(visit);
  const timeRange = visit.check_out_time
    ? `${formatVisitTime(visit.check_in_time)} – ${formatVisitTime(
        visit.check_out_time
      )}`
    : `${formatVisitTime(visit.check_in_time)} — still inside`;

  return (
    <li className="member-dash__visit">
      <div className="member-dash__visit-main">
        <p className="member-dash__visit-day">
          {formatVisitDay(visit.check_in_time)}
        </p>

        <p className="text-muted text-xs">
          {visit.location || 'Location not recorded'}
        </p>
      </div>

      <div className="member-dash__visit-side">
        <p className="member-dash__visit-time">{timeRange}</p>

        <span
          className={`member-dash__visit-tag ${
            open ? 'member-dash__visit-tag--open' : ''
          }`}
        >
          {open
            ? 'In gym now'
            : minutes === null
            ? 'Visit recorded'
            : formatDuration(minutes)}
        </span>
      </div>
    </li>
  );
}
