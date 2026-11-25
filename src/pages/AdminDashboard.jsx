import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Modal from '../components/ui/Modal.jsx';
import AddTrainerForm from '../components/admin/AddTrainerForm.jsx';
import AddManagerForm from '../components/admin/AddManagerForm.jsx';
import AddPlanForm from '../components/admin/AddPlanForm.jsx';
import AddMemberForm from '../components/admin/AddMemberForm.jsx';
import EditMemberForm from '../components/admin/EditMemberForm.jsx';
import EditStaffForm from '../components/admin/EditStaffForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAdminDashboard,
  getAllUsers,
  updateMemberStatus,
} from '../services/adminService.js';
import {
  deleteMember,
  getAllMembers,
  getMemberById,
  updateMember,
} from '../services/memberService.js';
import {
  deletePlan,
  getAllPlans,
  updatePlan,
} from '../services/planService.js';
import {
  approveSubscription,
  cancelSubscription,
  getAllSubscriptions,
  getExpiringSubscriptions,
  rejectSubscription,
  renewSubscription,
  getSubscriptionById,
  updateSubscription,
} from '../services/subscriptionService.js';
import {
  getAllPayments,
  getPaymentById,
  getPaymentStats,
  recordManualPayment,
} from '../services/paymentService.js';
import {
  checkIn,
  checkOut,
  getAllAttendance,
  getTodayAttendance,
} from '../services/attendanceService.js';
import { getApiHealth } from '../services/systemService.js';
import {
  deleteAdminStaff,
  getAdminStaff,
  getAdminTrainers,
  updateAdminStaffStatus,
  updateAdminTrainerStatus,
} from '../services/trainerService.js';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    let active = true;
    getApiHealth()
      .then((health) => {
        if (active) setApiOnline(health?.status === 'ok');
      })
      .catch(() => {
        if (active) setApiOnline(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [staffCount, setStaffCount] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminDashboard(), getAdminStaff({ page: 1, limit: 100 })])
      .then(([data, staff]) => {
        if (!active) return;
        setDashboardData(data);
        setStaffCount(staff.filter((person) => person.role === 'manager').length);
      })
      .catch((error) => {
        if (active) setDashboardError(error.message || 'Unable to load admin dashboard data.');
      });
    return () => { active = false; };
  }, []);

  const stats = {
    totalMembers: dashboardData?.totalMembers,
    totalTrainers: dashboardData?.totalTrainers,
    totalManagers: staffCount,
    activeSubscriptions: dashboardData?.activeSubscriptions,
    totalUsers: dashboardData
      ? dashboardData.totalMembers + dashboardData.totalTrainers + (staffCount || 0)
      : undefined,
    monthlyRevenue: dashboardData?.totalRevenue,
    currentCheckIns: dashboardData?.attendanceOverview?.currently_checked_in,
  };

  return (
    <div className="admin-dashboard">
      <DashboardNav />

      <div className="admin-dashboard__wrapper">
        {/* Sidebar */}
        <aside className="admin-dashboard__sidebar">
          <div className="admin-dashboard__logo">
            <div className="admin-dashboard__logo-icon">
              <Icon name="admin_panel_settings" size={24} />
            </div>
            <div>
              <h3 className="admin-dashboard__logo-title">Admin Portal</h3>
              <p className="admin-dashboard__logo-subtitle mono">SYSTEM CONTROL</p>
            </div>
          </div>

          <div className="admin-dashboard__user-info">
            <div className="admin-dashboard__user-avatar">
              <Icon name="person" size={20} />
            </div>
            <div>
              <p className="admin-dashboard__user-name">{user.fullName}</p>
              <p className="admin-dashboard__user-role mono">SYSTEM ADMINISTRATOR</p>
            </div>
          </div>

          <nav className="admin-dashboard__nav">
            <div className="admin-dashboard__nav-section">
              <p className="mono text-xs text-muted">DASHBOARD</p>
              <button
                onClick={() => setActiveSection('overview')}
                className={`admin-dashboard__nav-link ${activeSection === 'overview' ? 'active' : ''}`}
              >
                <Icon name="dashboard" size={20} />
                <span>Overview</span>
              </button>
              <Link to="/admin/operations?tab=reports" className="admin-dashboard__nav-link">
                <Icon name="analytics" size={20} />
                <span>Analytics & Reports</span>
              </Link>
            </div>

            <div className="admin-dashboard__nav-section">
              <p className="mono text-xs text-muted">USER MANAGEMENT</p>
              <button
                onClick={() => setActiveSection('members')}
                className={`admin-dashboard__nav-link ${activeSection === 'members' ? 'active' : ''}`}
              >
                <Icon name="groups" size={20} />
                <span>Members</span>
                <span className="admin-dashboard__nav-badge">{stats.totalMembers ?? '—'}</span>
              </button>
              <button
                onClick={() => setActiveSection('trainers')}
                className={`admin-dashboard__nav-link ${activeSection === 'trainers' ? 'active' : ''}`}
              >
                <Icon name="sports" size={20} />
                <span>Trainers & Coaches</span>
                <span className="admin-dashboard__nav-badge">{stats.totalTrainers ?? '—'}</span>
              </button>
              <button
                onClick={() => setActiveSection('managers')}
                className={`admin-dashboard__nav-link ${activeSection === 'managers' ? 'active' : ''}`}
              >
                <Icon name="badge" size={20} />
                <span>Managers & Staff</span>
                <span className="admin-dashboard__nav-badge">{stats.totalManagers ?? '—'}</span>
              </button>
              <button
                onClick={() => setActiveSection('users')}
                className={`admin-dashboard__nav-link ${activeSection === 'users' ? 'active' : ''}`}
              >
                <Icon name="people" size={20} />
                <span>All Users</span>
                <span className="admin-dashboard__nav-badge">{stats.totalUsers ?? '—'}</span>
              </button>
            </div>

            <div className="admin-dashboard__nav-section">
              <p className="mono text-xs text-muted">BUSINESS & BILLING</p>
              <button
                onClick={() => setActiveSection('plans')}
                className={`admin-dashboard__nav-link ${activeSection === 'plans' ? 'active' : ''}`}
              >
                <Icon name="card_membership" size={20} />
                <span>Membership Plans</span>
              </button>
              <button
                onClick={() => setActiveSection('subscriptions')}
                className={`admin-dashboard__nav-link ${activeSection === 'subscriptions' ? 'active' : ''}`}
              >
                <Icon name="autorenew" size={20} />
                <span>Subscriptions</span>
                <span className="admin-dashboard__nav-badge success">{stats.activeSubscriptions ?? '—'}</span>
              </button>
              <button
                onClick={() => setActiveSection('payments')}
                className={`admin-dashboard__nav-link ${activeSection === 'payments' ? 'active' : ''}`}
              >
                <Icon name="payments" size={20} />
                <span>Payments & Revenue</span>
                <span className="admin-dashboard__nav-badge accent">{stats.monthlyRevenue ?? '—'}</span>
              </button>
            </div>

            <div className="admin-dashboard__nav-section">
              <p className="mono text-xs text-muted">OPERATIONS</p>
              <button
                onClick={() => setActiveSection('attendance')}
                className={`admin-dashboard__nav-link ${activeSection === 'attendance' ? 'active' : ''}`}
              >
                <Icon name="door_front" size={20} />
                <span>Attendance & Check-ins</span>
                <span className="admin-dashboard__nav-badge success">{stats.currentCheckIns ?? '—'}</span>
              </button>
              <Link to="/admin/operations?tab=bookings" className="admin-dashboard__nav-link">
                <Icon name="fitness_center" size={20} />
                <span>Floor & class operations</span>
              </Link>
              <Link to="/admin/operations?tab=classes" className="admin-dashboard__nav-link">
                <Icon name="fitness_center" size={20} />
                <span>Classes & bookings</span>
              </Link>
              <Link to="/operations/members" className="admin-dashboard__nav-link">
                <Icon name="view_list" size={20} />
                <span>Member Directory</span>
              </Link>
            </div>

            <div className="admin-dashboard__nav-section">
              <p className="mono text-xs text-muted">SYSTEM & SETTINGS</p>
              <Link to="/admin/operations?tab=settings" className="admin-dashboard__nav-link">
                <Icon name="settings" size={20} />
                <span>Gym Settings</span>
              </Link>
              <Link to="/admin/operations?tab=roles" className="admin-dashboard__nav-link">
                <Icon name="shield" size={20} />
                <span>Roles & Permissions</span>
              </Link>
              <Link to="/admin/operations?tab=audit" className="admin-dashboard__nav-link">
                <Icon name="tune" size={20} />
                <span>Audit & system activity</span>
              </Link>
              <Link to="/admin/operations?tab=notifications" className="admin-dashboard__nav-link">
                <Icon name="notifications" size={20} />
                <span>Send notifications</span>
              </Link>
            </div>
          </nav>

          <div className="admin-dashboard__footer">
            <div className="admin-dashboard__system-status">
              <Icon name={apiOnline ? 'check_circle' : 'error'} size={16} />
              <span className="text-sm">SYSTEM STATUS</span>
              <span className={`admin-dashboard__status-indicator ${apiOnline ? 'success' : ''}`}>
                {apiOnline === null ? 'CHECKING' : apiOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-muted">All services operational • v3.4.2</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-dashboard__main">
          {dashboardError && (
            <div className="admin-form__alert admin-form__alert--error" role="alert">
              {dashboardError}
            </div>
          )}
          {activeSection === 'overview' && <OverviewSection data={dashboardData} />}
          {activeSection === 'members' && <MembersSection />}
          {activeSection === 'trainers' && <TrainersSection />}
          {activeSection === 'managers' && <ManagersSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'plans' && <PlansSection />}
          {activeSection === 'subscriptions' && <SubscriptionsSection />}
          {activeSection === 'payments' && <PaymentsSection />}
          {activeSection === 'attendance' && <AttendanceSection />}
        </main>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection({ data }) {
  const attendance = data?.attendanceOverview || {};
  const statCards = [
    ['TOTAL MEMBERS', data?.totalMembers, `Active: ${data?.activeMembers ?? '—'} · Inactive: ${data?.inactiveMembers ?? '—'}`, 'groups'],
    ['TOTAL REVENUE', data?.totalRevenue === undefined ? undefined : `${data.totalRevenue} EGP`, 'Completed payments', 'payments'],
    ['ACTIVE SUBSCRIPTIONS', data?.activeSubscriptions, `Pending: ${data?.pendingSubscriptions ?? '—'} · Expired: ${data?.expiredSubscriptions ?? '—'}`, 'autorenew'],
    ['CHECK-INS TODAY', attendance.total_today, `Currently in gym: ${attendance.currently_checked_in ?? '—'}`, 'door_front'],
  ];

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">System Overview</h1>
          <p className="text-muted">Live membership, revenue, attendance, and operations metrics</p>
        </div>
        <div className="admin-section__actions">
          <Link to="/admin/operations?tab=reports"><Button variant="outline" size="sm"><Icon name="analytics" /> Reports</Button></Link>
          <Link to="/admin/operations?tab=classes"><Button variant="primary" size="sm"><Icon name="fitness_center" /> Manage classes</Button></Link>
        </div>
      </header>

      <div className="admin-stats-grid">
        {statCards.map(([label, value, note, icon]) => (
          <div className="admin-stat-card" key={label}>
            <div className="admin-stat-card__icon users"><Icon name={icon} size={24} /></div>
            <div className="admin-stat-card__content">
              <p className="mono text-xs text-muted">{label}</p>
              <div className="admin-stat-card__value"><span className="stat-number">{value ?? '—'}</span></div>
              <p className="text-xs text-muted">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard__stats">
        <section className="admin-table-container">
          <h2 className="admin-section__subtitle">Upcoming classes</h2>
          <table className="admin-table">
            <thead><tr><th>Class</th><th>Date</th><th>Time</th><th>Trainer</th></tr></thead>
            <tbody>
              {!data ? <tr><td colSpan="4" className="admin-table__empty">Loading live dashboard…</td></tr>
                : (data.upcomingClasses || []).length === 0
                ? <tr><td colSpan="4" className="admin-table__empty">No upcoming classes scheduled.</td></tr>
                : data.upcomingClasses.map((item) => (
                  <tr key={item.id}>
                    <td>{item.class_name}</td>
                    <td>{String(item.scheduled_date || '').slice(0, 10)}</td>
                    <td>{String(item.start_time || '').slice(0, 5)}</td>
                    <td>{item.trainer_name || 'Unassigned'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
        <section className="admin-table-container">
          <h2 className="admin-section__subtitle">Recent registrations</h2>
          <table className="admin-table">
            <thead><tr><th>Member</th><th>Email</th><th>Joined</th></tr></thead>
            <tbody>
              {!data ? <tr><td colSpan="3" className="admin-table__empty">Loading live dashboard…</td></tr>
                : (data.recentRegistrations || []).length === 0
                ? <tr><td colSpan="3" className="admin-table__empty">No registrations found.</td></tr>
                : data.recentRegistrations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.full_name}</td><td>{item.email}</td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

// Members Section
function MembersSection() {
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setError('');

    try {
      const result = await getAllMembers({ page: 1, limit: 100 });
      setMembers(result.members || []);
    } catch (err) {
      setError(err.message || 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(memberId) {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMember(memberId);
      await loadMembers();
    } catch (err) {
      alert('Error deleting member: ' + err.message);
    }
  }

  async function handleSuspend(memberId) {
    if (!confirm('Suspend this member?')) return;

    try {
      await updateMemberStatus(memberId, 'suspended');
      await loadMembers();
    } catch (err) {
      alert('Error suspending member: ' + err.message);
    }
  }

  async function handleActivate(memberId) {
    try {
      await updateMemberStatus(memberId, 'active');
      await loadMembers();
    } catch (err) {
      alert('Error activating member: ' + err.message);
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      (member.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Member Management</h1>
          <p className="text-muted">Manage all gym members, subscriptions, and access</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Icon name="person_add" />
            Add Member
          </Button>
          <Link to="/operations/members">
            <Button variant="outline" size="sm">
              <Icon name="view_list" />
              Directory View
            </Button>
          </Link>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search">
          <Icon name="search" size={20} />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search__input"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Members Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-table__empty">Loading members…</td></tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-table__empty">
                  <Icon name="search_off" size={32} />
                  <p>No members found</p>
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <div className="admin-table__user">
                      <div className="admin-table__avatar">
                        <Icon name="person" size={20} />
                      </div>
                      <div>
                        <p className="admin-table__name">{member.fullName}</p>
                        <p className="text-xs text-muted">ID: {member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>{member.phone || '—'}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${member.status}`}>
                      {member.status}
                    </span>
                  </td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        onClick={async () => {
                          try {
                            const result = await getMemberById(member.id);
                            setEditingMember(result.member);
                          } catch (err) {
                            alert('Error loading member: ' + err.message);
                          }
                        }}
                        className="admin-action-btn"
                        title="Edit member"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await getMemberById(member.id);
                            const details = result.member;
                            window.alert(
                              `${details.fullName}\n${details.email}\nPhone: ${details.phone || '—'}\nSubscription: ${result.subscription?.plan_name || 'None'}`
                            );
                          } catch (err) {
                            alert('Error loading member: ' + err.message);
                          }
                        }}
                        className="admin-action-btn"
                        title="View member details"
                      >
                        <Icon name="visibility" size={18} />
                      </button>
                      {member.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(member.id)}
                          className="admin-action-btn admin-action-btn--warning"
                          title="Suspend"
                        >
                          <Icon name="block" size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(member.id)}
                          className="admin-action-btn admin-action-btn--success"
                          title="Activate"
                        >
                          <Icon name="check_circle" size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="admin-action-btn admin-action-btn--danger"
                        title="Delete"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <Modal title="Add New Member" onClose={() => setShowAddModal(false)}>
          <AddMemberForm
            onSuccess={async () => {
              setShowAddModal(false);
              await loadMembers();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
      {editingMember && (
        <Modal title="Edit Member" onClose={() => setEditingMember(null)}>
          <EditMemberForm
            member={editingMember}
            onSuccess={async () => {
              setEditingMember(null);
              await loadMembers();
            }}
            onCancel={() => setEditingMember(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// Trainers Section
function TrainersSection() {
  const [trainers, setTrainers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrainers();
  }, []);

  async function loadTrainers() {
    setLoading(true);
    setError('');
    try {
      setTrainers(await getAdminTrainers({ page: 1, limit: 100 }));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load trainers.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(trainerId) {
    if (!confirm('Are you sure you want to remove this trainer?')) {
      return;
    }

    try {
      await deleteAdminStaff(trainerId);
      await loadTrainers();
    } catch (err) {
      alert('Error deleting trainer: ' + err.message);
    }
  }

  async function handleSuspend(trainerId) {
    try {
      await updateAdminTrainerStatus(trainerId, 'suspended');
      await loadTrainers();
    } catch (err) {
      alert('Error suspending trainer: ' + err.message);
    }
  }

  async function handleActivate(trainerId) {
    try {
      await updateAdminTrainerStatus(trainerId, 'active');
      await loadTrainers();
    } catch (err) {
      alert('Error activating trainer: ' + err.message);
    }
  }

  function handleAddSuccess(newTrainer) {
    setShowAddModal(false);
    loadTrainers();
    alert(`Trainer ${newTrainer.fullName} added successfully!`);
  }

  const filteredTrainers = trainers.filter((trainer) =>
    (trainer.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Trainer & Coach Management</h1>
          <p className="text-muted">Manage coaching staff, schedules, and client assignments</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Icon name="person_add" />
            Add Trainer
          </Button>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      {/* Search */}
      <div className="admin-filters">
        <div className="admin-search">
          <Icon name="search" size={20} />
          <input
            type="text"
            placeholder="Search trainers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search__input"
          />
        </div>
      </div>

      {/* Trainers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Trainer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-table__empty">Loading trainers…</td></tr>
            ) : filteredTrainers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-table__empty">
                  <Icon name="search_off" size={32} />
                  <p>No trainers found</p>
                </td>
              </tr>
            ) : (
              filteredTrainers.map(trainer => (
                <tr key={trainer.id}>
                  <td>
                    <div className="admin-table__user">
                      <div className="admin-table__avatar">
                        <Icon name="sports" size={20} />
                      </div>
                      <div>
                        <p className="admin-table__name">{trainer.fullName}</p>
                        <p className="text-xs text-muted">Coach</p>
                      </div>
                    </div>
                  </td>
                  <td>{trainer.email}</td>
                  <td>{trainer.phone || '—'}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${trainer.status}`}>
                      {trainer.status}
                    </span>
                  </td>
                  <td>{new Date(trainer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table__actions">
                      {trainer.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(trainer.id)}
                          className="admin-action-btn admin-action-btn--warning"
                          title="Suspend"
                        >
                          <Icon name="block" size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(trainer.id)}
                          className="admin-action-btn admin-action-btn--success"
                          title="Activate"
                        >
                          <Icon name="check_circle" size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTrainer(trainer)}
                        className="admin-action-btn"
                        title="Edit trainer"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(trainer.id)}
                        className="admin-action-btn admin-action-btn--danger"
                        title="Delete"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <Modal
          title="Add New Trainer"
          onClose={() => setShowAddModal(false)}
        >
          <AddTrainerForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
      {editingTrainer && (
        <Modal title="Edit Trainer" onClose={() => setEditingTrainer(null)}>
          <EditStaffForm
            person={editingTrainer}
            isTrainer
            onSuccess={async () => {
              setEditingTrainer(null);
              await loadTrainers();
            }}
            onCancel={() => setEditingTrainer(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// Managers Section
function ManagersSection() {
  const [managers, setManagers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManagers();
  }, []);

  async function loadManagers() {
    setLoading(true);
    setError('');
    try {
      setManagers(await getAdminStaff({ page: 1, limit: 100, role: 'manager' }));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load managers.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(managerId) {
    if (!confirm('Are you sure you want to remove this manager?')) {
      return;
    }

    try {
      await deleteAdminStaff(managerId);
      await loadManagers();
    } catch (err) {
      alert('Error deleting manager: ' + err.message);
    }
  }

  async function handleSuspend(managerId) {
    try {
      await updateAdminStaffStatus(managerId, 'suspended');
      await loadManagers();
    } catch (err) {
      alert('Error suspending manager: ' + err.message);
    }
  }

  async function handleActivate(managerId) {
    try {
      await updateAdminStaffStatus(managerId, 'active');
      await loadManagers();
    } catch (err) {
      alert('Error activating manager: ' + err.message);
    }
  }

  function handleAddSuccess(newManager) {
    setShowAddModal(false);
    loadManagers();
    alert(`Manager ${newManager.fullName} added successfully!`);
  }

  const filteredManagers = managers.filter((manager) =>
    (manager.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (manager.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Manager & Staff Management</h1>
          <p className="text-muted">Manage operational staff and administrative users</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Icon name="person_add" />
            Add Manager
          </Button>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      {/* Search */}
      <div className="admin-filters">
        <div className="admin-search">
          <Icon name="search" size={20} />
          <input
            type="text"
            placeholder="Search managers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search__input"
          />
        </div>
      </div>

      {/* Managers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Manager</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-table__empty">Loading managers…</td></tr>
            ) : filteredManagers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-table__empty">
                  <Icon name="search_off" size={32} />
                  <p>No managers found</p>
                </td>
              </tr>
            ) : (
              filteredManagers.map(manager => (
                <tr key={manager.id}>
                  <td>
                    <div className="admin-table__user">
                      <div className="admin-table__avatar">
                        <Icon name="badge" size={20} />
                      </div>
                      <div>
                        <p className="admin-table__name">{manager.fullName}</p>
                        <p className="text-xs text-muted">Manager</p>
                      </div>
                    </div>
                  </td>
                  <td>{manager.email}</td>
                  <td>{manager.phone || '—'}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${manager.status}`}>
                      {manager.status}
                    </span>
                  </td>
                  <td>{new Date(manager.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-table__actions">
                      {manager.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(manager.id)}
                          className="admin-action-btn admin-action-btn--warning"
                          title="Suspend"
                        >
                          <Icon name="block" size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(manager.id)}
                          className="admin-action-btn admin-action-btn--success"
                          title="Activate"
                        >
                          <Icon name="check_circle" size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingManager(manager)}
                        className="admin-action-btn"
                        title="Edit staff member"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(manager.id)}
                        className="admin-action-btn admin-action-btn--danger"
                        title="Delete"
                      >
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Manager Modal */}
      {showAddModal && (
        <Modal
          title="Add New Manager"
          onClose={() => setShowAddModal(false)}
        >
          <AddManagerForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
      {editingManager && (
        <Modal title="Edit Staff Member" onClose={() => setEditingManager(null)}>
          <EditStaffForm
            person={editingManager}
            onSuccess={async () => {
              setEditingManager(null);
              await loadManagers();
            }}
            onCancel={() => setEditingManager(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// Users Section
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAllUsers()
      .then((result) => { if (active) setUsers(result); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">All Users</h1>
          <p className="text-muted">Complete user directory across all roles</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="outline" size="sm">
            <Icon name="download" />
            Export Users
          </Button>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5" className="admin-table__empty">Loading users…</td></tr>
              : users.length === 0 ? <tr><td colSpan="5" className="admin-table__empty">No users found.</td></tr>
              : users.map((person) => (
                <tr key={person.id}>
                  <td>{person.fullName || '—'}</td>
                  <td>{person.email}</td>
                  <td>{person.role}</td>
                  <td>{person.status}</td>
                  <td>{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Plans Section
function normalizeAdminPlan(plan) {
  return {
    ...plan,
    tier: plan.tier || plan.access_level || plan.accessLevel || 'Membership',
    accessLevel: plan.accessLevel || plan.access_level || 'basic',
    features: Array.isArray(plan.features) ? plan.features : [],
    personalTraining:
      plan.personalTraining ??
      plan.includes_personal_training ??
      plan.includesPersonalTraining ??
      false,
    isActive: plan.isActive ?? plan.is_active ?? false,
  };
}

function PlansSection() {
  const [plans, setPlans] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    setError('');

    try {
      const allPlans = await getAllPlans(false);
      setPlans(allPlans.map(normalizeAdminPlan));
    } catch (err) {
      setError(err.message || 'Unable to load plans.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(planId) {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePlan(planId);
      await loadPlans();
    } catch (err) {
      alert('Error deleting plan: ' + err.message);
    }
  }

  async function handleToggleStatus(planId, currentStatus) {
    try {
      await updatePlan(planId, { isActive: !currentStatus });
      await loadPlans();
    } catch (err) {
      alert('Error updating plan: ' + err.message);
    }
  }

  function handleAddSuccess(newPlan) {
    setShowAddModal(false);
    loadPlans();
    if (newPlan?.name) alert(`Plan "${newPlan.name}" created successfully!`);
  }

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Membership Plans</h1>
          <p className="text-muted">Create and manage membership tiers and pricing</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Icon name="add" />
            Create Plan
          </Button>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      {/* Plans Grid */}
      <div className="admin-plans-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`admin-plan-card ${!plan.isActive ? 'inactive' : ''}`}>
            <div className="admin-plan-card__header">
              <div>
                <p className="admin-plan-card__tier">{plan.tier}</p>
                <h3 className="admin-plan-card__name">{plan.name}</h3>
              </div>
              <span className={`admin-badge admin-badge--${plan.isActive ? 'active' : 'inactive'}`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="admin-plan-card__price">
              <span className="admin-plan-card__currency">$</span>
              <span className="admin-plan-card__amount">{plan.price}</span>
              <span className="admin-plan-card__period">/{plan.duration}</span>
            </div>

            <p className="admin-plan-card__description">{plan.description}</p>

            <div className="admin-plan-card__features">
              {plan.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="admin-plan-card__feature">
                  <Icon name="check" size={16} />
                  <span>{feature}</span>
                </div>
              ))}
              {plan.features.length > 4 && (
                <p className="text-xs text-muted">+{plan.features.length - 4} more features</p>
              )}
            </div>

            <div className="admin-plan-card__meta">
              <span className="text-xs text-muted">Access: {plan.accessLevel}</span>
              {plan.personalTraining && (
                <span className="text-xs" style={{ color: 'var(--accent)' }}>
                  <Icon name="fitness_center" size={14} /> PT Included
                </span>
              )}
            </div>

            <div className="admin-plan-card__actions">
              <button
                onClick={() => handleToggleStatus(plan.id, plan.isActive)}
                className="admin-card-action-btn"
              >
                <Icon name={plan.isActive ? 'visibility_off' : 'visibility'} size={18} />
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="admin-card-action-btn admin-card-action-btn--danger"
              >
                <Icon name="delete" size={18} />
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && plans.length === 0 && !error && (
          <div className="admin-empty-state">
            <Icon name="card_membership" size={48} />
            <h3>No plans yet</h3>
            <p>Create your first membership plan to get started</p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Icon name="add" />
              Create Plan
            </Button>
          </div>
        )}
        {loading && <p role="status">Loading plans…</p>}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <Modal
          title="Create Membership Plan"
          onClose={() => setShowAddModal(false)}
        >
          <AddPlanForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// Subscriptions Section
function SubscriptionsSection() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  async function loadSubscriptions() {
    setLoading(true);
    setError('');

    try {
      const [allResult, expiringResult] = await Promise.all([
        getAllSubscriptions({ page: 1, limit: 50 }),
        getExpiringSubscriptions(7),
      ]);
      setSubscriptions(allResult.subscriptions || []);
      setExpiring(expiringResult.subscriptions || []);
    } catch (err) {
      setError(err.message || 'Unable to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function handleCancel(subscriptionId) {
    if (!confirm('Cancel this subscription?')) return;

    setActionError('');
    try {
      await cancelSubscription(subscriptionId, 'Cancelled by administrator');
      await loadSubscriptions();
    } catch (err) {
      setActionError(err.message || 'Unable to cancel subscription.');
    }
  }

  async function handleToggleRenewal(subscription) {
    setActionError('');
    try {
      await updateSubscription(subscription.id, {
        autoRenew: !subscription.auto_renew,
      });
      await loadSubscriptions();
    } catch (err) {
      setActionError(err.message || 'Unable to update auto-renewal.');
    }
  }

  async function handleApprove(subscriptionId) {
    setActionError('');
    try {
      await approveSubscription(subscriptionId);
      await loadSubscriptions();
    } catch (err) {
      setActionError(err.message || 'Unable to approve subscription.');
    }
  }

  async function handleReject(subscriptionId) {
    const reason = window.prompt('Reason for rejecting this subscription:', 'Rejected by administrator');
    if (reason === null) return;
    setActionError('');
    try {
      await rejectSubscription(subscriptionId, reason);
      await loadSubscriptions();
    } catch (err) {
      setActionError(err.message || 'Unable to reject subscription.');
    }
  }

  async function handleRenew(subscriptionId) {
    setActionError('');
    try {
      await renewSubscription(subscriptionId);
      await loadSubscriptions();
    } catch (err) {
      setActionError(err.message || 'Unable to renew subscription.');
    }
  }

  async function handleView(subscriptionId) {
    setActionError('');
    try {
      const subscription = await getSubscriptionById(subscriptionId);
      window.alert(
        `${subscription.full_name || 'Member'} — ${subscription.plan_name || 'Plan'} — ${subscription.status}`
      );
    } catch (err) {
      setActionError(err.message || 'Unable to load subscription details.');
    }
  }

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Subscription Management</h1>
          <p className="text-muted">Monitor and manage all active subscriptions</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="outline" size="sm" onClick={loadSubscriptions} disabled={loading}>
            <Icon name="refresh" />
            Refresh
          </Button>
        </div>
      </header>

      {(error || actionError) && (
        <div className="admin-form__alert admin-form__alert--error" role="alert">
          {error || actionError}
        </div>
      )}

      <h2 className="admin-section__subtitle">Expiring in the next 7 days ({expiring.length})</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Member</th><th>Plan</th><th>Expires</th></tr></thead>
          <tbody>
            {expiring.length === 0 ? (
              <tr><td colSpan="3" className="admin-table__empty">No subscriptions expiring soon</td></tr>
            ) : expiring.map((subscription) => (
              <tr key={subscription.id}>
                <td>{subscription.full_name} ({subscription.email})</td>
                <td>{subscription.plan_name}</td>
                <td>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="admin-section__subtitle">All subscriptions</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Member</th><th>Plan</th><th>Status</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-table__empty">Loading subscriptions…</td></tr>
            ) : subscriptions.length === 0 ? (
              <tr><td colSpan="6" className="admin-table__empty">No subscriptions found</td></tr>
            ) : subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td>{subscription.full_name}<br /><span className="text-xs text-muted">{subscription.email}</span></td>
                <td>{subscription.plan_name}</td>
                <td><span className={`admin-badge admin-badge--${subscription.status}`}>{subscription.status}</span></td>
                <td>{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : '—'}</td>
                <td>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : '—'}</td>
                <td>
                  <div className="admin-table__actions">
                    <button onClick={() => handleView(subscription.id)} className="admin-action-btn" title="View details">
                      <Icon name="visibility" size={18} />
                    </button>
                    {subscription.status === 'active' && (
                      <>
                        <button onClick={() => handleToggleRenewal(subscription)} className="admin-action-btn" title={subscription.auto_renew ? 'Disable auto-renewal' : 'Enable auto-renewal'}>
                          <Icon name={subscription.auto_renew ? 'autorenew' : 'sync_disabled'} size={18} />
                        </button>
                        <button onClick={() => handleCancel(subscription.id)} className="admin-action-btn admin-action-btn--danger" title="Cancel">
                          <Icon name="cancel" size={18} />
                        </button>
                      </>
                    )}
                    {subscription.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(subscription.id)} className="admin-action-btn admin-action-btn--success" title="Approve">
                          <Icon name="check_circle" size={18} />
                        </button>
                        <button onClick={() => handleReject(subscription.id)} className="admin-action-btn admin-action-btn--danger" title="Reject">
                          <Icon name="cancel" size={18} />
                        </button>
                      </>
                    )}
                    {subscription.status === 'expired' && (
                      <button onClick={() => handleRenew(subscription.id)} className="admin-action-btn admin-action-btn--success" title="Renew">
                        <Icon name="autorenew" size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Payments Section
function PaymentsSection() {
  const [payments, setPayments] = useState([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [manualPayment, setManualPayment] = useState({
    subscriptionId: '',
    paymentMethod: 'cash',
    description: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);

  async function loadPayments() {
    setLoading(true);
    setError('');

    try {
      const [paymentsResult, statsResult, subscriptionsResult] = await Promise.all([
        getAllPayments({ page: 1, limit: 50 }),
        getPaymentStats(),
        getAllSubscriptions({ page: 1, limit: 100 }),
      ]);
      setPayments(paymentsResult.payments || []);
      setStats(statsResult.overall || null);
      setPendingSubscriptions(
        (subscriptionsResult.subscriptions || []).filter((item) => item.status === 'pending')
      );
    } catch (err) {
      setError(err.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleViewPayment(paymentId) {
    setError('');
    try {
      setSelectedPayment(await getPaymentById(paymentId));
    } catch (err) {
      setError(err.message || 'Unable to load payment details.');
    }
  }

  async function handleRecordPayment(event) {
    event.preventDefault();
    setError('');
    setSavingPayment(true);
    try {
      await recordManualPayment(manualPayment);
      setManualPayment({ subscriptionId: '', paymentMethod: 'cash', description: '' });
      await loadPayments();
    } catch (actionError) {
      setError(actionError.message || 'Unable to record manual payment.');
    } finally {
      setSavingPayment(false);
    }
  }

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Payments & Revenue</h1>
          <p className="text-muted">Track transactions, invoices, and financial metrics</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="outline" size="sm" onClick={loadPayments} disabled={loading}>
            <Icon name="refresh" />
            Refresh
          </Button>
        </div>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      {stats && (
        <div className="admin-dashboard__stats">
          <div className="admin-stat-card"><span>Total revenue</span><strong>{stats.total_revenue ?? 0}</strong></div>
          <div className="admin-stat-card"><span>Transactions</span><strong>{stats.total_transactions ?? 0}</strong></div>
          <div className="admin-stat-card"><span>Pending amount</span><strong>{stats.pending_amount ?? 0}</strong></div>
        </div>
      )}

      <form className="admin-section__actions" onSubmit={handleRecordPayment}>
        <label>
          Pending subscription
          <select
            value={manualPayment.subscriptionId}
            onChange={(event) => setManualPayment((current) => ({ ...current, subscriptionId: event.target.value }))}
            required
          >
            <option value="">Select a pending subscription</option>
            {pendingSubscriptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.full_name || item.email || item.user_id} · {item.plan_name || 'Plan'} · {item.amount} {item.currency}
              </option>
            ))}
          </select>
        </label>
        <label>
          Payment method
          <select
            value={manualPayment.paymentMethod}
            onChange={(event) => setManualPayment((current) => ({ ...current, paymentMethod: event.target.value }))}
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
          </select>
        </label>
        <input
          value={manualPayment.description}
          onChange={(event) => setManualPayment((current) => ({ ...current, description: event.target.value }))}
          placeholder="Optional payment note"
          aria-label="Payment description"
        />
        <Button type="submit" disabled={savingPayment || pendingSubscriptions.length === 0}>
          {savingPayment ? 'Recording…' : 'Record manual payment'}
        </Button>
      </form>

      {selectedPayment && (
        <div className="admin-form__alert" role="status">
          Payment {selectedPayment.invoice_number || selectedPayment.id}: {selectedPayment.status}, {selectedPayment.amount} {selectedPayment.currency}
          <button type="button" onClick={() => setSelectedPayment(null)} aria-label="Close payment details"> ×</button>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Member</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Details</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="admin-table__empty">Loading payments…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="7" className="admin-table__empty">No payments found</td></tr>
            ) : payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.full_name}<br /><span className="text-xs text-muted">{payment.email}</span></td>
                <td>{payment.invoice_number || '—'}</td>
                <td>{payment.amount} {payment.currency}</td>
                <td>{payment.payment_method || '—'}</td>
                <td>{payment.status}</td>
                <td>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—'}</td>
                <td><button onClick={() => handleViewPayment(payment.id)} className="admin-action-btn" title="View details"><Icon name="visibility" size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Attendance Section
function AttendanceSection() {
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadAttendance() {
    setLoading(true);
    setError('');

    try {
      const today = new Date().toISOString().slice(0, 10);
      const [todayData, history] = await Promise.all([
        getTodayAttendance(),
        getAllAttendance({ date: today, page: 1, limit: 100 }),
      ]);
      setData(todayData);
      setRecords(history.attendance || []);
    } catch (err) {
      setError(err.message || "Unable to load today's attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  async function handleCheckIn(event) {
    event.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      await checkIn(memberId.trim());
      setMemberId('');
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut(attendanceId) {
    setActionLoading(true);
    setError('');
    try {
      await checkOut(attendanceId);
      await loadAttendance();
    } catch (err) {
      setError(err.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Attendance & Check-ins</h1>
          <p className="text-muted">Monitor facility usage and member check-ins</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAttendance} disabled={loading}>
          <Icon name="refresh" /> Refresh
        </Button>
      </header>

      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}

      <form className="admin-section__actions" onSubmit={handleCheckIn}>
        <input
          aria-label="Member ID"
          placeholder="Member ID to check in"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          required
        />
        <Button type="submit" variant="primary" disabled={actionLoading}>
          <Icon name="login" /> Check in
        </Button>
      </form>

      <p className="admin-section__subtitle">
        Currently in gym: {data?.currentlyInGym ?? '—'} · Total visits today: {data?.totalToday ?? '—'}
      </p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Member</th><th>Email</th><th>Check in</th><th>Check out</th><th>Location</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="admin-table__empty">Loading attendance…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan="6" className="admin-table__empty">No attendance records for today</td></tr>
            ) : records.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.full_name}</td>
                <td>{visit.email}</td>
                <td>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : '—'}</td>
                <td>{visit.check_out_time ? new Date(visit.check_out_time).toLocaleTimeString() : '—'}</td>
                <td>{visit.location || '—'}</td>
                <td>{!visit.check_out_time && <Button size="sm" variant="outline" disabled={actionLoading} onClick={() => handleCheckOut(visit.id)}>Check out</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Analytics & Reports</h1>
          <p className="text-muted">Business intelligence and data insights</p>
        </div>
      </header>

      <div className="admin-placeholder">
        <Icon name="analytics" size={48} />
        <h3>Analytics Dashboard</h3>
        <p>Revenue trends, member growth, retention rates, and operational KPIs.</p>
      </div>
    </div>
  );
}

// Gym Settings Section
function GymSettingsSection() {
  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Gym Settings</h1>
          <p className="text-muted">Configure gym operations and business rules</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm">
            <Icon name="save" />
            Save Changes
          </Button>
        </div>
      </header>

      <div className="admin-placeholder">
        <Icon name="settings" size={48} />
        <h3>Gym Configuration</h3>
        <p>Operating hours, facility rules, class schedules, and operational policies.</p>
      </div>
    </div>
  );
}

// Roles Section
function RolesSection() {
  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">Roles & Permissions</h1>
          <p className="text-muted">Manage user roles and access control</p>
        </div>
        <div className="admin-section__actions">
          <Button variant="primary" size="sm">
            <Icon name="add" />
            Create Role
          </Button>
        </div>
      </header>

      <div className="admin-placeholder">
        <Icon name="shield" size={48} />
        <h3>Role-Based Access Control</h3>
        <p>Define roles, permissions, and access levels for different user types.</p>
      </div>
    </div>
  );
}

// System Section
function SystemSection() {
  return (
    <div className="admin-section">
      <header className="admin-section__header">
        <div>
          <h1 className="admin-section__title">System Configuration</h1>
          <p className="text-muted">Advanced system settings and integrations</p>
        </div>
      </header>

      <div className="admin-placeholder">
        <Icon name="tune" size={48} />
        <h3>System Settings</h3>
        <p>API configurations, integrations, backup settings, and system maintenance.</p>
      </div>
    </div>
  );
}
