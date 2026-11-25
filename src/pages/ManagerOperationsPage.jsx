import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import {
  getAdminDashboard,
  getAdminReport,
} from '../services/adminService.js';
import {
  checkIn,
  checkOut,
  getAllAttendance,
  getTodayAttendance,
} from '../services/attendanceService.js';
import './ManagerOperationsPage.css';

export default function ManagerOperationsPage() {
  const { view } = useParams();
  const isReports = view === 'reports';
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [visits, setVisits] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  async function load() {
    setLoading(true);
    setError('');
    try {
      if (isReports) {
        const [revenue, members, subscriptions, attendanceReport, classes] = await Promise.all([
          getAdminReport('revenue'),
          getAdminReport('members'),
          getAdminReport('subscriptions'),
          getAdminReport('attendance'),
          getAdminReport('classes'),
        ]);
        setReports({ revenue, members, subscriptions, attendance: attendanceReport, classes });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const [dashboardResult, summary, history] = await Promise.all([
          getAdminDashboard(),
          getTodayAttendance(),
          getAllAttendance({ date: today, page: 1, limit: 100 }),
        ]);
        setDashboard(dashboardResult);
        setAttendance(summary);
        setVisits(history.attendance || []);
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load operations data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [isReports, reloadToken]);

  async function handleCheckIn(event) {
    event.preventDefault();
    setActionLoading(true);
    setError('');
    setNotice('');
    try {
      await checkIn(memberId.trim());
      setMemberId('');
      setNotice('Member checked in.');
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut(id) {
    setActionLoading(true);
    setError('');
    setNotice('');
    try {
      await checkOut(id);
      setNotice('Member checked out.');
      setReloadToken((token) => token + 1);
    } catch (actionError) {
      setError(actionError.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <DashboardNav />
      <main className="container manager-ops">
        <header className="manager-ops__header">
          <div>
            <p className="mono text-accent">Staff operations</p>
            <h1>{isReports ? 'Business reports' : 'Floor operations'}</h1>
            <p className="text-muted">
              {isReports
                ? 'View current revenue, membership, attendance, and class reports.'
                : 'Monitor today’s attendance and record front-desk check-ins.'}
            </p>
          </div>
          <div className="manager-ops__links">
            <Link to="/operations/floor" aria-current={!isReports ? 'page' : undefined}>Floor</Link>
            <Link to="/operations/reports" aria-current={isReports ? 'page' : undefined}>Reports</Link>
            <Link to="/operations/members">Members</Link>
          </div>
        </header>

        {error && <p className="manager-ops__alert" role="alert">{error}</p>}
        {notice && <p className="manager-ops__notice" role="status">{notice}</p>}

        {isReports ? (
          loading ? <p role="status">Loading reports…</p> : reports && (
            <div className="manager-ops__grid">
              <ReportCard title="Revenue" rows={[
                ['Revenue', `${reports.revenue.revenue ?? 0} EGP`],
                ['Transactions', reports.revenue.transactions ?? 0],
                ['Average transaction', `${reports.revenue.average_transaction ?? 0} EGP`],
              ]} />
              <ReportCard title="Members" rows={(reports.members.statistics || []).map((item) => [item.status, item.count])} />
              <ReportCard title="Subscriptions" rows={(reports.subscriptions.statistics || []).map((item) => [item.status, item.count])} />
              <ReportCard title="Attendance" rows={[
                ['Total visits', reports.attendance.total_visits ?? 0],
                ['Access granted', reports.attendance.granted_visits ?? 0],
                ['Access denied', reports.attendance.denied_visits ?? 0],
              ]} />
              <ReportCard title="Class occupancy" rows={(reports.classes.occupancy || []).map((item) => [
                item.name,
                `${item.confirmed_bookings} confirmed / ${item.capacity} capacity`,
              ])} />
              <ReportCard title="Monthly revenue" rows={(reports.revenue.monthly || []).map((item) => [item.month, `${item.revenue} EGP`])} />
            </div>
          )
        ) : (
          <>
            <div className="manager-ops__summary">
              <article className="card"><span>Members</span><strong>{dashboard?.totalMembers ?? '—'}</strong></article>
              <article className="card"><span>Active subscriptions</span><strong>{dashboard?.activeSubscriptions ?? '—'}</strong></article>
              <article className="card"><span>Checked in now</span><strong>{attendance?.currentlyInGym ?? '—'}</strong></article>
              <article className="card"><span>Visits today</span><strong>{attendance?.totalToday ?? '—'}</strong></article>
            </div>

            <form className="manager-ops__checkin" onSubmit={handleCheckIn}>
              <label>
                Member ID
                <input value={memberId} onChange={(event) => setMemberId(event.target.value)} required />
              </label>
              <Button type="submit" disabled={actionLoading}>
                <Icon name="login" size={18} />
                {actionLoading ? 'Saving…' : 'Check in'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setReloadToken((token) => token + 1)} disabled={loading}>
                Refresh
              </Button>
            </form>

            <div className="manager-ops__table-wrap">
              <table>
                <thead><tr><th>Member</th><th>Email</th><th>Check in</th><th>Check out</th><th>Action</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="5">Loading today’s check-ins…</td></tr>
                    : visits.length === 0 ? <tr><td colSpan="5">No attendance records for today.</td></tr>
                    : visits.map((visit) => (
                      <tr key={visit.id}>
                        <td>{visit.full_name}</td>
                        <td>{visit.email}</td>
                        <td>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : '—'}</td>
                        <td>{visit.check_out_time ? new Date(visit.check_out_time).toLocaleTimeString() : '—'}</td>
                        <td>{!visit.check_out_time && <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleCheckOut(visit.id)}>Check out</Button>}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <section className="manager-ops__upcoming">
              <h2>Upcoming classes</h2>
              {dashboard?.upcomingClasses?.length ? dashboard.upcomingClasses.map((item) => (
                <article className="card" key={item.id}>
                  <strong>{item.class_name}</strong>
                  <span>{String(item.scheduled_date).slice(0, 10)} · {String(item.start_time).slice(0, 5)}</span>
                  <span>{item.trainer_name || 'Trainer unassigned'}</span>
                </article>
              )) : <p className="text-muted">No upcoming classes scheduled.</p>}
            </section>
          </>
        )}
      </main>
    </>
  );
}

function ReportCard({ title, rows }) {
  return (
    <article className="card manager-ops__report">
      <h2>{title}</h2>
      {rows.length ? <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="text-muted">No data.</p>}
    </article>
  );
}
