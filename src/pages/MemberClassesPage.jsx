import { useCallback, useEffect, useState } from 'react';

import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import {
  bookClass,
  cancelClassBooking,
  getClassSchedules,
  getClasses,
  getMyClassBookings,
} from '../services/classService.js';
import {
  assignMyTrainer,
  endMyTrainerAssignment,
  getMyTrainerAssignments,
  getTrainers,
} from '../services/trainerService.js';
import './MemberClassesPage.css';

const TABS = [
  { id: 'classes', label: 'Upcoming classes' },
  { id: 'bookings', label: 'My bookings' },
  { id: 'trainers', label: 'My trainers' },
];

function formatScheduleDate(date) {
  if (!date) return 'Date to be announced';
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function formatTime(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MemberClassesPage() {
  const [tab, setTab] = useState('classes');
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [classResult, scheduleResult, bookingResult, trainerResult, assignmentResult] =
        await Promise.all([
          getClasses({ page: 1, limit: 100 }),
          getClassSchedules({
            page: 1,
            limit: 100,
            ...(classFilter ? { classId: classFilter } : {}),
            ...(dateFilter ? { date: dateFilter } : {}),
          }),
          getMyClassBookings({ page: 1, limit: 100 }),
          getTrainers(),
          getMyTrainerAssignments(),
        ]);

      setClasses(classResult.classes || []);
      setSchedules(scheduleResult.schedules || []);
      setBookings(bookingResult.bookings || []);
      setTrainers(trainerResult || []);
      setAssignments(assignmentResult || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load classes and trainer information.');
    } finally {
      setLoading(false);
    }
  }, [classFilter, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData, reloadToken]);

  async function handleBook(schedule) {
    setActionId(schedule.schedule_id);
    setError('');
    setNotice('');

    try {
      const booking = await bookClass(schedule.schedule_id);
      setNotice(
        booking.booking_status === 'waitlisted'
          ? 'You are on the waitlist for this class.'
          : 'Your class booking is confirmed.'
      );
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Unable to book this class.');
    } finally {
      setActionId('');
    }
  }

  async function handleCancelBooking(booking) {
    setActionId(booking.booking_id);
    setError('');
    setNotice('');

    try {
      await cancelClassBooking(booking.booking_id);
      setNotice('Your class booking has been cancelled.');
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Unable to cancel this booking.');
    } finally {
      setActionId('');
    }
  }

  async function handleAssignTrainer(trainerId) {
    setActionId(trainerId);
    setError('');
    setNotice('');

    try {
      await assignMyTrainer(trainerId, trainerNotes);
      setTrainerNotes('');
      setNotice('Trainer added to your team.');
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Unable to assign this trainer.');
    } finally {
      setActionId('');
    }
  }

  async function handleEndAssignment(assignmentId) {
    setActionId(assignmentId);
    setError('');
    setNotice('');

    try {
      await endMyTrainerAssignment(assignmentId);
      setNotice('Trainer assignment ended.');
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Unable to end this assignment.');
    } finally {
      setActionId('');
    }
  }

  const activeTrainerIds = new Set(assignments.map((item) => item.trainerId));

  return (
    <div className="member-classes">
      <DashboardNav />
      <main className="container member-classes__main">
        <header className="member-classes__header">
          <div>
            <p className="mono text-accent">Training at IronForge</p>
            <h1>Classes & coaches</h1>
            <p className="text-muted">
              Book a class, manage your reservations, or choose an active trainer.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadToken((token) => token + 1)}
            disabled={loading}
          >
            <Icon name="refresh" size={18} />
            Refresh
          </Button>
        </header>

        {error && <div className="member-classes__alert member-classes__alert--error" role="alert">{error}</div>}
        {notice && <div className="member-classes__alert member-classes__alert--success" role="status">{notice}</div>}

        <div className="member-classes__tabs" role="tablist" aria-label="Class and trainer sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'classes' && (
          <section className="member-classes__section" role="tabpanel">
            <div className="member-classes__filters">
              <label>
                <span>Class</span>
                <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                  <option value="">All classes</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Date</span>
                <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
              </label>
              {(classFilter || dateFilter) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setClassFilter('');
                    setDateFilter('');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {loading ? (
              <p className="member-classes__empty" role="status">Loading upcoming classes…</p>
            ) : schedules.length === 0 ? (
              <p className="member-classes__empty">No upcoming classes match your filters.</p>
            ) : (
              <div className="member-classes__grid">
                {schedules.map((schedule) => {
                  const alreadyBooked = ['confirmed', 'waitlisted'].includes(schedule.my_booking_status);
                  return (
                    <article className="card member-classes__card" key={schedule.schedule_id}>
                      <div className="member-classes__card-top">
                        <span className="member-classes__tag">{schedule.class_type || 'Group class'}</span>
                        <span>{schedule.difficulty_level || 'All levels'}</span>
                      </div>
                      <h2>{schedule.class_name}</h2>
                      <p className="member-classes__when">
                        <Icon name="event" size={17} />
                        {formatScheduleDate(schedule.scheduled_date)}
                      </p>
                      <p className="member-classes__when">
                        <Icon name="schedule" size={17} />
                        {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
                      </p>
                      <dl className="member-classes__details">
                        <div><dt>Coach</dt><dd>{schedule.trainer_name || 'To be announced'}</dd></div>
                        <div><dt>Location</dt><dd>{schedule.room || 'Main floor'}</dd></div>
                        <div><dt>Spots</dt><dd>{schedule.spots_remaining} remaining</dd></div>
                      </dl>
                      {alreadyBooked ? (
                        <p className="member-classes__booking-state">
                          {schedule.my_booking_status === 'waitlisted' ? 'You are on the waitlist' : 'You are booked'}
                        </p>
                      ) : (
                        <Button
                          type="button"
                          className="btn--block"
                          disabled={actionId === schedule.schedule_id || schedule.schedule_status !== 'scheduled'}
                          onClick={() => handleBook(schedule)}
                        >
                          {actionId === schedule.schedule_id
                            ? 'Booking…'
                            : schedule.spots_remaining > 0
                            ? 'Book this class'
                            : 'Join waitlist'}
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'bookings' && (
          <section className="member-classes__section" role="tabpanel">
            {loading ? (
              <p className="member-classes__empty" role="status">Loading your bookings…</p>
            ) : bookings.length === 0 ? (
              <div className="member-classes__empty">
                <p>You do not have any class bookings yet.</p>
                <Button type="button" variant="outline" onClick={() => setTab('classes')}>Browse classes</Button>
              </div>
            ) : (
              <div className="member-classes__booking-list">
                {bookings.map((booking) => {
                  const canCancel = ['confirmed', 'waitlisted'].includes(booking.booking_status);
                  return (
                    <article className="card member-classes__booking" key={booking.booking_id}>
                      <div>
                        <span className={`member-classes__status member-classes__status--${booking.booking_status}`}>
                          {booking.booking_status.replace('_', ' ')}
                        </span>
                        <h2>{booking.class_name}</h2>
                        <p>{formatScheduleDate(booking.scheduled_date)} · {formatTime(booking.start_time)}</p>
                        <p className="text-muted">
                          {booking.trainer_name || 'Coach to be announced'}
                          {booking.waitlist_position ? ` · Waitlist position ${booking.waitlist_position}` : ''}
                        </p>
                      </div>
                      {canCancel && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actionId === booking.booking_id}
                          onClick={() => handleCancelBooking(booking)}
                        >
                          {actionId === booking.booking_id ? 'Cancelling…' : 'Cancel booking'}
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'trainers' && (
          <section className="member-classes__section" role="tabpanel">
            {assignments.length > 0 && (
              <>
                <h2>Your active trainers</h2>
                <div className="member-classes__grid">
                  {assignments.map((assignment) => (
                    <article className="card member-classes__card" key={assignment.assignmentId}>
                      <span className="member-classes__tag">Assigned</span>
                      <h3>{assignment.trainerName}</h3>
                      <p>{assignment.trainerEmail}</p>
                      {assignment.trainerPhone && <p>{assignment.trainerPhone}</p>}
                      {assignment.notes && <p className="text-muted">{assignment.notes}</p>}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionId === assignment.assignmentId}
                        onClick={() => handleEndAssignment(assignment.assignmentId)}
                      >
                        {actionId === assignment.assignmentId ? 'Updating…' : 'End assignment'}
                      </Button>
                    </article>
                  ))}
                </div>
              </>
            )}
            <h2>Choose a trainer</h2>
            <label className="member-classes__notes">
              <span>Optional training focus</span>
              <input
                value={trainerNotes}
                onChange={(event) => setTrainerNotes(event.target.value)}
                maxLength={500}
                placeholder="Strength, conditioning, mobility…"
              />
            </label>
            {loading ? (
              <p className="member-classes__empty" role="status">Loading trainers…</p>
            ) : trainers.length === 0 ? (
              <p className="member-classes__empty">No active trainers are available right now.</p>
            ) : (
              <div className="member-classes__grid">
                {trainers.map((trainer) => {
                  const trainerName = trainer.fullName || trainer.full_name || 'Trainer';
                  const assigned = activeTrainerIds.has(trainer.id);
                  return (
                    <article className="card member-classes__card" key={trainer.id}>
                      <span className="member-classes__tag">IronForge trainer</span>
                      <h3>{trainerName}</h3>
                      {trainer.profilePicture && (
                        <img className="member-classes__trainer-photo" src={trainer.profilePicture} alt="" />
                      )}
                      <Button
                        type="button"
                        disabled={assigned || actionId === trainer.id}
                        onClick={() => handleAssignTrainer(trainer.id)}
                      >
                        {assigned ? 'Already assigned' : actionId === trainer.id ? 'Assigning…' : 'Choose trainer'}
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
