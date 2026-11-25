import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  cancelAdminClassBooking,
  cancelClassSchedule,
  createAdminClassBooking,
  createClass,
  createClassSchedule,
  deleteClass,
  getAdminClassBookings,
  getAdminClasses,
  getAdminClassSchedules,
  setClassScheduleStatus,
  setClassStatus,
  updateClass,
  updateClassBookingStatus,
  updateClassSchedule,
} from '../services/classService.js';
import { getAdminReport, getAdminAuditLogs, getSystemSettings, updateSystemSetting } from '../services/adminService.js';
import { sendAdminNotification } from '../services/notificationService.js';
import {
  createAdminTrainerAssignment,
  deleteAdminTrainerAssignment,
  getAdminTrainerAssignments,
  getAdminTrainers,
} from '../services/trainerService.js';
import { getAllMembers } from '../services/memberService.js';
import './AdminOperationsPage.css';

const TABS = [
  ['classes', 'Classes'],
  ['schedules', 'Class schedules'],
  ['bookings', 'Bookings'],
  ['trainers', 'Trainer assignments'],
  ['reports', 'Reports'],
  ['notifications', 'Notifications'],
  ['settings', 'Settings'],
  ['audit', 'Audit log'],
  ['roles', 'Roles'],
];

export default function AdminOperationsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const initialTab = TABS.some(([id]) => id === requestedTab) ? requestedTab : 'classes';
  const [tab, setTab] = useState(initialTab);

  if (user?.role !== 'admin') {
    return (
      <>
        <DashboardNav />
        <main className="container admin-ops">
          <div className="admin-ops__notice" role="alert">
            Only administrators can manage these operations.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <main className="container admin-ops">
        <header className="admin-ops__header">
          <div>
            <p className="mono text-accent">Admin controls</p>
            <h1>Gym operations</h1>
            <p className="text-muted">
              Manage classes, bookings, staff assignments, reports, and system settings.
            </p>
          </div>
          <Link className="admin-ops__back" to="/dashboard">Back to dashboard</Link>
        </header>

        <div className="admin-ops__tabs" role="tablist" aria-label="Administration sections">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'is-active' : ''}
              onClick={() => {
                setTab(id);
                setSearchParams({ tab: id }, { replace: true });
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'classes' && <ClassesSection />}
        {tab === 'schedules' && <SchedulesSection />}
        {tab === 'bookings' && <BookingsSection />}
        {tab === 'trainers' && <TrainerAssignmentsSection />}
        {tab === 'reports' && <ReportsSection />}
        {tab === 'notifications' && <NotificationsSection />}
        {tab === 'settings' && <SettingsSection />}
        {tab === 'audit' && <AuditSection />}
        {tab === 'roles' && <RolesSection />}
      </main>
    </>
  );
}

const EMPTY_CLASS = {
  name: '',
  description: '',
  classType: '',
  difficultyLevel: '',
  durationMinutes: 45,
  capacity: 12,
  room: '',
  requiredPlanLevel: '',
  requiresBooking: true,
  bookingDeadlineHours: 2,
  isActive: true,
};

function ClassesSection() {
  const [classes, setClasses] = useState([]);
  const [draft, setDraft] = useState(EMPTY_CLASS);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getAdminClasses({ page: 1, limit: 100 });
      setClasses(result.classes || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function edit(item) {
    setEditingId(item.id);
    setDraft({
      name: item.name || '',
      description: item.description || '',
      classType: item.class_type || '',
      difficultyLevel: item.difficulty_level || '',
      durationMinutes: item.duration_minutes || 45,
      capacity: item.capacity || 12,
      room: item.room || '',
      requiredPlanLevel: item.required_plan_level || '',
      requiresBooking: item.requires_booking !== false,
      bookingDeadlineHours: item.booking_deadline_hours ?? 2,
      isActive: item.is_active !== false,
    });
    setNotice('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...draft,
        durationMinutes: Number(draft.durationMinutes),
        capacity: Number(draft.capacity),
        bookingDeadlineHours: Number(draft.bookingDeadlineHours),
      };
      if (editingId) {
        await updateClass(editingId, payload);
        setNotice('Class updated.');
      } else {
        await createClass(payload);
        setNotice('Class created.');
      }
      setDraft(EMPTY_CLASS);
      setEditingId('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item) {
    setError('');
    try {
      await setClassStatus(item.id, !item.is_active);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove "${item.name}"?`)) return;
    setError('');
    try {
      await deleteClass(item.id);
      setNotice('Class removed or deactivated.');
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setDraft((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  return (
    <section className="admin-ops__section">
      <h2>Class catalog</h2>
      <p className="text-muted">Create, edit, activate, or remove bookable classes.</p>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form" onSubmit={submit}>
        <h3>{editingId ? 'Edit class' : 'Add a class'}</h3>
        <div className="admin-ops__form-grid">
          <Field label="Name" name="name" value={draft.name} onChange={updateField} required />
          <Field label="Class type" name="classType" value={draft.classType} onChange={updateField} placeholder="Yoga, strength…" />
          <Field label="Difficulty" name="difficultyLevel" value={draft.difficultyLevel} onChange={updateField} placeholder="Beginner, intermediate…" />
          <Field label="Duration (minutes)" name="durationMinutes" type="number" min="1" value={draft.durationMinutes} onChange={updateField} required />
          <Field label="Capacity" name="capacity" type="number" min="1" value={draft.capacity} onChange={updateField} required />
          <Field label="Room" name="room" value={draft.room} onChange={updateField} />
          <Field label="Required plan level" name="requiredPlanLevel" value={draft.requiredPlanLevel} onChange={updateField} placeholder="Optional" />
          <Field label="Booking deadline (hours)" name="bookingDeadlineHours" type="number" min="0" value={draft.bookingDeadlineHours} onChange={updateField} />
        </div>
        <label className="admin-ops__field admin-ops__field--wide">
          <span>Description</span>
          <textarea name="description" rows="3" value={draft.description} onChange={updateField} />
        </label>
        <label className="admin-ops__check">
          <input type="checkbox" name="requiresBooking" checked={draft.requiresBooking} onChange={updateField} />
          Booking required
        </label>
        <label className="admin-ops__check">
          <input type="checkbox" name="isActive" checked={draft.isActive} onChange={updateField} />
          Active and visible
        </label>
        <div className="admin-ops__actions">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save class' : 'Create class'}</Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={() => { setEditingId(''); setDraft(EMPTY_CLASS); }}>
              Stop editing
            </Button>
          )}
        </div>
      </form>

      <div className="admin-ops__table-wrap">
        <table className="admin-ops__table">
          <thead><tr><th>Class</th><th>Type</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <EmptyRow colSpan={5}>Loading classes…</EmptyRow> : classes.length === 0 ? <EmptyRow colSpan={5}>No classes found.</EmptyRow> : classes.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.class_type || '—'}</td>
                <td>{item.capacity}</td>
                <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                <td className="admin-ops__row-actions">
                  <Button size="sm" variant="outline" onClick={() => edit(item)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(item)}>{item.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(item)}>Remove</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const EMPTY_SCHEDULE = {
  classId: '',
  trainerId: '',
  scheduledDate: '',
  startTime: '',
  endTime: '',
  notes: '',
};

function SchedulesSection() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [draft, setDraft] = useState(EMPTY_SCHEDULE);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [classResult, trainerResult, scheduleResult] = await Promise.all([
        getAdminClasses({ page: 1, limit: 100 }),
        getAdminTrainers({ page: 1, limit: 100, status: 'active' }),
        getAdminClassSchedules({ page: 1, limit: 100 }),
      ]);
      setClasses(classResult.classes || []);
      setTrainers(trainerResult || []);
      setSchedules(scheduleResult.schedules || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function edit(item) {
    setEditingId(item.id);
    setDraft({
      classId: item.class_id || '',
      trainerId: item.trainer_id || '',
      scheduledDate: String(item.scheduled_date || '').slice(0, 10),
      startTime: String(item.start_time || '').slice(0, 5),
      endTime: String(item.end_time || '').slice(0, 5),
      notes: item.notes || '',
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      if (editingId) {
        await updateClassSchedule(editingId, {
          trainerId: draft.trainerId || null,
          scheduledDate: draft.scheduledDate,
          startTime: draft.startTime,
          endTime: draft.endTime,
          notes: draft.notes,
        });
        setNotice('Schedule updated.');
      } else {
        await createClassSchedule({
          ...draft,
          trainerId: draft.trainerId || null,
        });
        setNotice('Schedule created.');
      }
      setDraft(EMPTY_SCHEDULE);
      setEditingId('');
      await load();
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function cancel(item) {
    const reason = window.prompt('Cancellation reason:', 'Cancelled by administrator');
    if (reason === null) return;
    setError('');
    try {
      await cancelClassSchedule(item.id, reason);
      setNotice('Class schedule cancelled.');
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function changeStatus(item, status) {
    let cancellationReason = '';
    if (status === 'cancelled') {
      cancellationReason = window.prompt('Cancellation reason:', 'Cancelled by administrator');
      if (cancellationReason === null) return;
    }
    setError('');
    try {
      await setClassScheduleStatus(item.id, status, cancellationReason);
      setNotice('Schedule status updated.');
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  function updateField(event) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <section className="admin-ops__section">
      <h2>Class schedules</h2>
      <p className="text-muted">Assign trainers and publish upcoming class sessions.</p>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form" onSubmit={submit}>
        <h3>{editingId ? 'Edit schedule' : 'Schedule a class'}</h3>
        <div className="admin-ops__form-grid">
          <label className="admin-ops__field">
            <span>Class</span>
            <select name="classId" value={draft.classId} onChange={updateField} required disabled={Boolean(editingId)}>
              <option value="">Select a class</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="admin-ops__field">
            <span>Trainer (optional)</span>
            <select name="trainerId" value={draft.trainerId} onChange={updateField}>
              <option value="">Unassigned</option>
              {trainers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
            </select>
          </label>
          <Field label="Date" name="scheduledDate" type="date" value={draft.scheduledDate} onChange={updateField} required />
          <Field label="Starts" name="startTime" type="time" value={draft.startTime} onChange={updateField} required />
          <Field label="Ends" name="endTime" type="time" value={draft.endTime} onChange={updateField} required />
          <Field label="Notes" name="notes" value={draft.notes} onChange={updateField} />
        </div>
        <div className="admin-ops__actions">
          <Button type="submit">{editingId ? 'Save schedule' : 'Create schedule'}</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(''); setDraft(EMPTY_SCHEDULE); }}>Stop editing</Button>}
        </div>
      </form>
      <div className="admin-ops__table-wrap">
        <table className="admin-ops__table">
          <thead><tr><th>Class</th><th>Date</th><th>Time</th><th>Trainer</th><th>Bookings</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <EmptyRow colSpan={7}>Loading schedules…</EmptyRow> : schedules.length === 0 ? <EmptyRow colSpan={7}>No schedules found.</EmptyRow> : schedules.map((item) => (
              <tr key={item.id}>
                <td>{item.class_name}</td>
                <td>{String(item.scheduled_date || '').slice(0, 10)}</td>
                <td>{String(item.start_time || '').slice(0, 5)}–{String(item.end_time || '').slice(0, 5)}</td>
                <td>{item.trainer_name || 'Unassigned'}</td>
                <td>{item.booking_count ?? 0}</td>
                <td>
                  <select
                    aria-label={`Schedule status for ${item.class_name}`}
                    value={item.status}
                    onChange={(event) => changeStatus(item, event.target.value)}
                  >
                    {['scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="admin-ops__row-actions">
                  <Button size="sm" variant="outline" onClick={() => edit(item)} disabled={item.status === 'cancelled'}>Edit</Button>
                  {item.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => cancel(item)}>Cancel</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState({ scheduleId: '', memberId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [bookingResult, scheduleResult, memberResult] = await Promise.all([
        getAdminClassBookings(),
        getAdminClassSchedules({ page: 1, limit: 100 }),
        getAllMembers({ page: 1, limit: 100 }),
      ]);
      setBookings(bookingResult.bookings || []);
      setSchedules(scheduleResult.schedules || []);
      setMembers(memberResult.members || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createBooking(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await createAdminClassBooking(draft);
      setNotice('Member booked into the class.');
      setDraft({ scheduleId: '', memberId: '' });
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function changeStatus(bookingId, status) {
    setError('');
    try {
      await updateClassBookingStatus(bookingId, status);
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function cancel(booking) {
    if (!window.confirm(`Cancel ${booking.member_name}'s booking?`)) return;
    setError('');
    try {
      await cancelAdminClassBooking(booking.id, 'Cancelled by administrator');
      setNotice('Booking cancelled.');
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <section className="admin-ops__section">
      <h2>Class bookings</h2>
      <p className="text-muted">Create bookings for members and update attendance or waitlist status.</p>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form admin-ops__form-grid" onSubmit={createBooking}>
        <label className="admin-ops__field">
          <span>Schedule</span>
          <select value={draft.scheduleId} onChange={(event) => setDraft((value) => ({ ...value, scheduleId: event.target.value }))} required>
            <option value="">Choose a schedule</option>
            {schedules.filter((item) => item.status !== 'cancelled').map((item) => (
              <option key={item.id} value={item.id}>
                {item.class_name} · {String(item.scheduled_date).slice(0, 10)} · {String(item.start_time).slice(0, 5)}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-ops__field">
          <span>Member</span>
          <select value={draft.memberId} onChange={(event) => setDraft((value) => ({ ...value, memberId: event.target.value }))} required>
            <option value="">Choose a member</option>
            {members.map((item) => <option key={item.id} value={item.id}>{item.fullName} · {item.email}</option>)}
          </select>
        </label>
        <Button type="submit">Create booking</Button>
      </form>
      <div className="admin-ops__table-wrap">
        <table className="admin-ops__table">
          <thead><tr><th>Member</th><th>Class</th><th>Session</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <EmptyRow colSpan={5}>Loading bookings…</EmptyRow> : bookings.length === 0 ? <EmptyRow colSpan={5}>No bookings found.</EmptyRow> : bookings.map((item) => (
              <tr key={item.id}>
                <td>{item.member_name}<br /><small>{item.member_email}</small></td>
                <td>{item.class_name}</td>
                <td>{String(item.scheduled_date).slice(0, 10)} · {String(item.start_time).slice(0, 5)}</td>
                <td>
                  <select aria-label={`Booking status for ${item.member_name}`} value={item.booking_status} onChange={(event) => changeStatus(item.id, event.target.value)}>
                    {['confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show'].map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td>{['confirmed', 'waitlisted'].includes(item.booking_status) && <Button size="sm" variant="outline" onClick={() => cancel(item)}>Cancel</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrainerAssignmentsSection() {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [draft, setDraft] = useState({ memberId: '', trainerId: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [assignmentResult, memberResult, trainerResult] = await Promise.all([
        getAdminTrainerAssignments({ page: 1, limit: 100, status: 'active' }),
        getAllMembers({ page: 1, limit: 100 }),
        getAdminTrainers({ page: 1, limit: 100, status: 'active' }),
      ]);
      setAssignments(assignmentResult || []);
      setMembers(memberResult.members || []);
      setTrainers(trainerResult || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function assign(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await createAdminTrainerAssignment(draft);
      setNotice('Trainer assigned to member.');
      setDraft({ memberId: '', trainerId: '', notes: '' });
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function end(assignmentId) {
    setError('');
    try {
      await deleteAdminTrainerAssignment(assignmentId);
      setNotice('Trainer assignment ended.');
      await load();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <section className="admin-ops__section">
      <h2>Member trainer assignments</h2>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form admin-ops__form-grid" onSubmit={assign}>
        <label className="admin-ops__field">
          <span>Member</span>
          <select value={draft.memberId} onChange={(event) => setDraft((current) => ({ ...current, memberId: event.target.value }))} required>
            <option value="">Choose a member</option>
            {members.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
          </select>
        </label>
        <label className="admin-ops__field">
          <span>Trainer</span>
          <select value={draft.trainerId} onChange={(event) => setDraft((current) => ({ ...current, trainerId: event.target.value }))} required>
            <option value="">Choose a trainer</option>
            {trainers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
          </select>
        </label>
        <Field label="Notes" name="notes" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        <Button type="submit">Assign trainer</Button>
      </form>
      <div className="admin-ops__table-wrap">
        <table className="admin-ops__table">
          <thead><tr><th>Member</th><th>Trainer</th><th>Assigned</th><th>Notes</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <EmptyRow colSpan={5}>Loading assignments…</EmptyRow> : assignments.length === 0 ? <EmptyRow colSpan={5}>No active assignments.</EmptyRow> : assignments.map((item) => (
              <tr key={item.id}>
                <td>{item.member_name}</td>
                <td>{item.trainer_name}</td>
                <td>{item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : '—'}</td>
                <td>{item.notes || '—'}</td>
                <td><Button size="sm" variant="outline" onClick={() => end(item.id)}>End assignment</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportsSection() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [revenue, members, subscriptions, attendance, classes] = await Promise.all([
        getAdminReport('revenue'),
        getAdminReport('members'),
        getAdminReport('subscriptions'),
        getAdminReport('attendance'),
        getAdminReport('classes'),
      ]);
      setReports({ revenue, members, subscriptions, attendance, classes });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="admin-ops__section">
      <div className="admin-ops__section-heading">
        <div><h2>Business reports</h2><p className="text-muted">Live reports from the gym API.</p></div>
        <Button type="button" variant="outline" onClick={load} disabled={loading}><Icon name="refresh" size={17} /> Refresh</Button>
      </div>
      <Feedback error={error} />
      {loading ? <p role="status">Loading reports…</p> : reports && (
        <div className="admin-ops__report-grid">
          <ReportCard title="Revenue" rows={[
            ['Total revenue', `${reports.revenue.revenue ?? 0} EGP`],
            ['Transactions', reports.revenue.transactions ?? 0],
            ['Average transaction', `${reports.revenue.average_transaction ?? 0} EGP`],
          ]} />
          <ReportCard title="Members" rows={(reports.members.statistics || []).map((item) => [item.status, item.count])} />
          <ReportCard title="Memberships" rows={(reports.subscriptions.statistics || []).map((item) => [item.status, item.count])} />
          <ReportCard title="Attendance" rows={[
            ['Total visits', reports.attendance.total_visits ?? 0],
            ['Access granted', reports.attendance.granted_visits ?? 0],
            ['Access denied', reports.attendance.denied_visits ?? 0],
          ]} />
          <ReportCard title="Class occupancy" rows={(reports.classes.occupancy || []).map((item) => [
            item.name,
            `${item.confirmed_bookings} confirmed · ${item.attended_bookings} attended · capacity ${item.capacity}`,
          ])} />
          <ReportCard title="Monthly revenue" rows={(reports.revenue.monthly || []).map((item) => [
            item.month,
            `${item.revenue} EGP · ${item.transactions} payments`,
          ])} />
          <ReportCard title="Member growth" rows={(reports.members.growth || []).map((item) => [item.month, item.registrations])} />
        </div>
      )}
    </section>
  );
}

function NotificationsSection() {
  const [draft, setDraft] = useState({
    title: '',
    message: '',
    notificationType: 'info',
    priority: 'normal',
    recipientRole: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await sendAdminNotification({
        ...draft,
        recipientRole: draft.recipientRole || undefined,
      });
      setNotice(`Notification sent to ${result.recipientCount} recipient(s).`);
      setDraft({ title: '', message: '', notificationType: 'info', priority: 'normal', recipientRole: '' });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-ops__section">
      <h2>Send a notification</h2>
      <p className="text-muted">Broadcast a message to everyone or to one account role.</p>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form admin-ops__notification-form" onSubmit={submit}>
        <Field label="Title" name="title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} required />
        <label className="admin-ops__field">
          <span>Audience</span>
          <select value={draft.recipientRole} onChange={(event) => setDraft((current) => ({ ...current, recipientRole: event.target.value }))}>
            <option value="">Everyone</option>
            <option value="member">Members</option>
            <option value="trainer">Trainers</option>
            <option value="manager">Managers</option>
            <option value="admin">Administrators</option>
          </select>
        </label>
        <label className="admin-ops__field">
          <span>Type</span>
          <select value={draft.notificationType} onChange={(event) => setDraft((current) => ({ ...current, notificationType: event.target.value }))}>
            {['info', 'success', 'warning', 'error'].map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="admin-ops__field">
          <span>Priority</span>
          <select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
            {['low', 'normal', 'high', 'urgent'].map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="admin-ops__field admin-ops__field--wide">
          <span>Message</span>
          <textarea rows="5" value={draft.message} onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))} required />
        </label>
        <Button type="submit" disabled={saving}>{saving ? 'Sending…' : 'Send notification'}</Button>
        <Link to="/notifications" className="admin-ops__inbox-link">View your notification inbox</Link>
      </form>
    </section>
  );
}

function SettingsSection() {
  const [settings, setSettings] = useState([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await getSystemSettings();
      setSettings(result);
      setEdits(Object.fromEntries(result.map((item) => [item.key, JSON.stringify(item.value, null, 2)])));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(settingKey, rawValue) {
    setError('');
    setNotice('');
    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      setError(`Setting "${settingKey}" must contain valid JSON.`);
      return;
    }
    try {
      await updateSystemSetting(settingKey, parsed);
      setNotice(`Saved "${settingKey}".`);
      await load();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function createSetting(event) {
    event.preventDefault();
    if (!key.trim()) return;
    await save(key.trim(), value);
    setKey('');
    setValue('');
  }

  return (
    <section className="admin-ops__section">
      <h2>System settings</h2>
      <p className="text-muted">Setting values are stored as JSON by the API.</p>
      <Feedback error={error} notice={notice} />
      <form className="admin-ops__form" onSubmit={createSetting}>
        <h3>Add or replace a setting</h3>
        <Field label="Key" value={key} onChange={(event) => setKey(event.target.value)} required />
        <label className="admin-ops__field admin-ops__field--wide">
          <span>JSON value</span>
          <textarea rows="3" value={value} onChange={(event) => setValue(event.target.value)} placeholder={'"example" or {"enabled": true}'} required />
        </label>
        <Button type="submit">Save setting</Button>
      </form>
      {loading ? <p role="status">Loading settings…</p> : settings.length === 0 ? <p>No settings have been configured.</p> : (
        <div className="admin-ops__settings">
          {settings.map((item) => (
            <article className="card admin-ops__setting" key={item.key}>
              <label className="admin-ops__field">
                <span>{item.key}</span>
                <textarea rows="3" value={edits[item.key] ?? ''} onChange={(event) => setEdits((current) => ({ ...current, [item.key]: event.target.value }))} />
              </label>
              <Button size="sm" onClick={() => save(item.key, edits[item.key] ?? '')}>Save</Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AuditSection() {
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAdminAuditLogs({ page, limit: 25 })
      .then((data) => { if (active) setResult(data); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  const logs = result?.logs || [];
  const pagination = result?.pagination;

  return (
    <section className="admin-ops__section">
      <h2>Audit log</h2>
      <p className="text-muted">Recent administrative and account activity.</p>
      <Feedback error={error} />
      <div className="admin-ops__table-wrap">
        <table className="admin-ops__table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
          <tbody>
            {loading ? <EmptyRow colSpan={5}>Loading audit events…</EmptyRow> : logs.length === 0 ? <EmptyRow colSpan={5}>No audit events found.</EmptyRow> : logs.map((item) => (
              <tr key={item.id}>
                <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                <td>{item.actor_name || item.actor_email || 'System'}</td>
                <td>{item.action}</td>
                <td>{item.entity_type || '—'}</td>
                <td><code>{JSON.stringify(item.metadata || {})}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-ops__pagination">
        <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button>
        <span>Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}</span>
        <Button variant="outline" size="sm" disabled={loading || page >= (pagination?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section className="admin-ops__section">
      <h2>Roles & permissions</h2>
      <p className="text-muted">
        The API defines fixed access roles; it does not expose endpoints to create roles or edit permission policies.
        This panel shows the supported roles without implying changes can be saved here.
      </p>
      <div className="admin-ops__role-list">
        {[
          ['Admin', 'Manage members, plans, staff, classes, payments, settings, and reports.'],
          ['Manager', 'View operations, members, subscriptions, attendance, payments, and reports.'],
          ['Trainer', 'Trainer account and class responsibilities.'],
          ['Member', 'Manage own profile, membership, bookings, notifications, and trainer assignments.'],
        ].map(([name, description]) => (
          <article className="card" key={name}><h3>{name}</h3><p>{description}</p></article>
        ))}
      </div>
    </section>
  );
}

function ReportCard({ title, rows }) {
  return (
    <article className="card admin-ops__report-card">
      <h3>{title}</h3>
      {rows.length ? (
        <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      ) : <p className="text-muted">No data available.</p>}
    </article>
  );
}

function Field({ label, name, value, onChange, type = 'text', ...props }) {
  return (
    <label className="admin-ops__field">
      <span>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} {...props} />
    </label>
  );
}

function Feedback({ error, notice }) {
  return (
    <>
      {error && <p className="admin-ops__feedback admin-ops__feedback--error" role="alert">{error}</p>}
      {notice && <p className="admin-ops__feedback admin-ops__feedback--success" role="status">{notice}</p>}
    </>
  );
}

function EmptyRow({ colSpan, children }) {
  return <tr><td className="admin-ops__empty" colSpan={colSpan}>{children}</td></tr>;
}
