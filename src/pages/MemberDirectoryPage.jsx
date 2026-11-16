import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import { getAllMembers } from '../services/memberService.js';
import './MemberDirectoryPage.css';

function mapDirectoryMember(member) {
  const subscription = member.subscription;
  const endDate = subscription?.endDate
    ? new Date(subscription.endDate)
    : null;
  const daysUntilEnd = endDate
    ? Math.ceil((endDate.getTime() - Date.now()) / 86400000)
    : null;
  const activeSubscription = subscription?.status === 'active';
  const name = member.fullName || 'Member';

  return {
    ...member,
    name,
    rosterId: member.id,
    initials: name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: 'blue',
    verified: false,
    tier: {
      name: subscription?.planName || 'No active plan',
      class: 'tier1',
      details: subscription?.status || 'No subscription',
    },
    coach: null,
    attendance: {
      recent: false,
      daysAgo: 'No attendance data',
      location: '—',
    },
    expiry: {
      text: activeSubscription
        ? daysUntilEnd !== null && daysUntilEnd <= 7
          ? `Expires in ${Math.max(daysUntilEnd, 0)} days`
          : 'Active'
        : 'No active subscription',
      class: activeSubscription
        ? daysUntilEnd !== null && daysUntilEnd <= 7
          ? 'expiring'
          : 'active'
        : 'expired',
      date: endDate ? endDate.toLocaleDateString() : '—',
      action: null,
    },
    payment: {
      status: '—',
      class: 'pending',
      method: 'Not available in roster data',
      details: '',
    },
  };
}

export default function MemberDirectoryPage() {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [planFilter, setPlanFilter] = useState('All Plans');
  const [trainerFilter, setTrainerFilter] = useState('All Coaches');
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      setLoading(true);
      setError('');

      try {
        const pageSize = 100;
        const firstPage = await getAllMembers({ page: 1, limit: pageSize });
        const pageCount = firstPage.pagination?.totalPages || 1;
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            getAllMembers({ page: index + 2, limit: pageSize })
          )
        );
        const rows = [
          ...(firstPage.members || []),
          ...remainingPages.flatMap((page) => page.members || []),
        ];

        if (active) setMembers(rows.map(mapDirectoryMember));
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load members.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMembers();
    return () => {
      active = false;
    };
  }, []);

  const activeSubscriptions = members.filter(
    (member) => member.subscription?.status === 'active'
  ).length;
  const expiringCount = members.filter((member) => {
    const endDate = member.subscription?.endDate;
    if (member.subscription?.status !== 'active' || !endDate) return false;
    const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;
  const suspendedCount = members.filter(
    (member) => member.status === 'suspended'
  ).length;
  const activePercent = members.length
    ? `${Math.round((activeSubscriptions / members.length) * 100)}%`
    : '0%';
  const stats = {
    totalRegistered: members.length,
    totalChange: 0,
    totalCapacity: 'Current roster from the API',
    activeSubscriptions,
    activeHealthPercentage: activePercent,
    activeHealthText: 'Members with an active subscription',
    expiringCount,
    expiringText: 'Subscriptions ending within seven days',
    expiringSubtext: 'Based on current API data',
    suspendedCount,
    suspendedChange: '—',
    suspendedText: 'Members with suspended accounts',
    suspendedSubtext: 'Current API status',
  };

  const visibleMembers = members.filter((member) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.id.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'All Statuses' ||
      member.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const toggleMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedMembers(prev =>
      prev.length === visibleMembers.length
        ? []
        : visibleMembers.map(m => m.id)
    );
  };

  return (
    <div className="member-directory">
      <DashboardNav />
      
      <div className="member-directory__wrapper">
        {/* Sidebar */}
        <aside className="member-directory__sidebar">
        <div className="member-directory__logo">
          <div className="member-directory__logo-icon">
            <Icon name="fitness_center" size={24} />
          </div>
          <div>
            <h3 className="member-directory__logo-title">IronForge</h3>
            <p className="member-directory__logo-subtitle mono">OPERATIONS</p>
          </div>
        </div>

        <div className="member-directory__instance">
          <p className="mono text-xs text-muted">ACTIVE INSTANCE</p>
          <p className="member-directory__instance-name">HQ Node #01 - Downtown</p>
        </div>

        <nav className="member-directory__nav">
          <div className="member-directory__nav-section">
            <p className="mono text-xs text-muted">CORE OPERATIONS</p>
            <Link to="/operations/dashboard" className="member-directory__nav-link">
              <Icon name="dashboard" size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/operations/staff" className="member-directory__nav-link">
              <Icon name="badge" size={20} />
              <span>Users & Staff</span>
            </Link>
            <Link to="/operations/members" className="member-directory__nav-link active">
              <Icon name="groups" size={20} />
              <span>Members</span>
              <span className="member-directory__nav-badge">{stats.totalRegistered}</span>
            </Link>
            <Link to="/operations/trainers" className="member-directory__nav-link">
              <Icon name="sports" size={20} />
              <span>Trainers & Coaches</span>
            </Link>
          </div>

          <div className="member-directory__nav-section">
            <p className="mono text-xs text-muted">BUSINESS & BILLING</p>
            <Link to="/operations/plans" className="member-directory__nav-link">
              <Icon name="card_membership" size={20} />
              <span>Membership Plans</span>
            </Link>
            <Link to="/operations/subscriptions" className="member-directory__nav-link">
              <Icon name="autorenew" size={20} />
              <span>Subscriptions</span>
            </Link>
            <Link to="/operations/payments" className="member-directory__nav-link">
              <Icon name="payments" size={20} />
              <span>Payments & POS</span>
              <span className="member-directory__nav-badge accent">$48.2k</span>
            </Link>
          </div>

          <div className="member-directory__nav-section">
            <p className="mono text-xs text-muted">FACILITY & HEALTH</p>
            <Link to="/operations/attendance" className="member-directory__nav-link">
              <Icon name="door_front" size={20} />
              <span>Live Attendance</span>
              <span className="member-directory__nav-badge success">142 Active</span>
            </Link>
            <Link to="/operations/reports" className="member-directory__nav-link">
              <Icon name="analytics" size={20} />
              <span>Reports & Analytics</span>
            </Link>
            <Link to="/operations/notifications" className="member-directory__nav-link">
              <Icon name="notifications" size={20} />
              <span>Notifications</span>
              <span className="member-directory__nav-dot"></span>
            </Link>
            <Link to="/operations/settings" className="member-directory__nav-link">
              <Icon name="settings" size={20} />
              <span>Gym Settings & Rules</span>
            </Link>
          </div>
        </nav>

        <div className="member-directory__footer">
          <div className="member-directory__health">
            <Icon name="favorite" size={16} />
            <span className="text-sm">FLOOR HEALTH</span>
            <span className="member-directory__health-status">100% OK</span>
          </div>
          <p className="text-xs text-muted">UPTIME: 99.8% • Next floor cycle starts at 17:30.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="member-directory__main">
        <header className="member-directory__header">
          <div>
            <h1 className="member-directory__title">Member Directory & Subscriptions</h1>
            <p className="text-muted">Member roster, account status, and current subscription details from the gym API.</p>
          </div>
          <div className="member-directory__header-actions">
            <Button variant="outline" size="sm">
              <Icon name="download" />
              Export CSV / PDF
            </Button>
            <Button variant="outline" size="sm">
              <Icon name="bolt" />
              Bulk Actions ({selectedMembers.length} selected)
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="member-directory__stats">
          <div className="member-directory__stat-card">
            <div className="member-directory__stat-icon">
              <Icon name="groups" />
            </div>
            <div>
              <p className="mono text-xs text-muted">TOTAL REGISTERED</p>
              <div className="member-directory__stat-value">
                <span className="stat-number">{stats.totalRegistered}</span>
                <span className={`member-directory__stat-change ${stats.totalChange >= 0 ? 'positive' : 'negative'}`}>
                  {stats.totalChange ? `+${stats.totalChange}%` : '—'}
                </span>
              </div>
              <p className="text-xs text-muted">{stats.totalCapacity}</p>
              <div className="member-directory__stat-bar">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`member-directory__stat-bar-segment ${i === 4 ? 'active' : ''}`}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="member-directory__stat-card">
            <div className="member-directory__stat-icon success">
              <Icon name="check_circle" />
            </div>
            <div>
              <p className="mono text-xs text-muted">ACTIVE SUBSCRIPTIONS</p>
              <div className="member-directory__stat-value">
                <span className="stat-number">{stats.activeSubscriptions}</span>
                <span className="member-directory__stat-change positive">
                  {stats.activeHealthPercentage}
                </span>
              </div>
              <p className="text-xs text-muted">{stats.activeHealthText}</p>
              <div className="member-directory__progress-bar">
                <div className="member-directory__progress-fill success" style={{ width: stats.activeHealthPercentage }}></div>
              </div>
            </div>
          </div>

          <div className="member-directory__stat-card">
            <div className="member-directory__stat-icon warning">
              <Icon name="schedule" />
            </div>
            <div>
              <p className="mono text-xs text-muted">EXPIRING &lt;7 DAYS</p>
              <div className="member-directory__stat-value">
                <span className="stat-number">{stats.expiringCount}</span>
                <span className="member-directory__stat-badge warning">
                  <Icon name="warning" size={14} />
                  Action Req.
                </span>
              </div>
              <p className="text-xs text-muted">{stats.expiringText}</p>
              <p className="text-xs text-muted">{stats.expiringSubtext}</p>
            </div>
          </div>

          <div className="member-directory__stat-card">
            <div className="member-directory__stat-icon critical">
              <Icon name="block" />
            </div>
            <div>
              <p className="mono text-xs text-muted">SUSPENDED / FROZEN</p>
              <div className="member-directory__stat-value">
                <span className="stat-number">{stats.suspendedCount}</span>
                <span className="member-directory__stat-change negative">
                  {stats.suspendedChange}
                </span>
              </div>
              <p className="text-xs text-muted">{stats.suspendedText}</p>
              <p className="text-xs text-muted">{stats.suspendedSubtext}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="member-directory__filters">
          <div className="member-directory__search">
            <Icon name="search" size={20} />
            <input
              type="text"
              placeholder="Search by member / ID / email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="member-directory__filter-group">
            <select
              className="member-directory__filter-btn"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter members by status"
            >
              <option>All Statuses</option>
              <option>active</option>
              <option>suspended</option>
            </select>
            <button className="member-directory__filter-btn">
              TIER: <span>{planFilter}</span>
              <Icon name="expand_more" size={16} />
            </button>
            <button className="member-directory__filter-btn">
              TRAINER: <span>{trainerFilter}</span>
              <Icon name="expand_more" size={16} />
            </button>
            <button className="member-directory__filter-btn">
              <Icon name="event" size={16} />
              Check-in &lt; 48h
              <Icon name="expand_more" size={16} />
            </button>
          </div>
        </div>

        {/* Member Tabs */}
        <div className="member-directory__tabs">
          <button className="member-directory__tab active">
            All Members
            <span className="member-directory__tab-count">{stats.totalRegistered}</span>
          </button>
          <button className="member-directory__tab">
            Active
            <span className="member-directory__tab-count">{stats.activeSubscriptions}</span>
          </button>
          <button className="member-directory__tab">
            Expiring
            <span className="member-directory__tab-count warning">{stats.expiringCount}</span>
          </button>
          <button className="member-directory__tab">
            Suspended
            <span className="member-directory__tab-count critical">{stats.suspendedCount}</span>
          </button>
          <button className="member-directory__tab">
            Expired / Lapsed
            <span className="member-directory__tab-count critical">—</span>
          </button>
          <button className="member-directory__tab">
            Staff / Comp
            <span className="member-directory__tab-count">—</span>
          </button>
          <button className="member-directory__tab">
            Faulty Data / Med
          </button>
          <button className="member-directory__tab">
            <Icon name="add" size={16} />
          </button>
        </div>

        {/* Table Headers */}
        <div className="member-directory__table-header">
          <div className="member-directory__table-col checkbox">
            <input
              type="checkbox"
              checked={visibleMembers.length > 0 && selectedMembers.length === visibleMembers.length}
              onChange={toggleAll}
            />
          </div>
          <div className="member-directory__table-col member">
            <span className="mono text-xs">MEMBER ROSTER ID</span>
          </div>
          <div className="member-directory__table-col membership">
            <span className="mono text-xs">MEMBERSHIP TIER</span>
          </div>
          <div className="member-directory__table-col coach">
            <span className="mono text-xs">ASSIGNED COACH</span>
          </div>
          <div className="member-directory__table-col attendance">
            <span className="mono text-xs">ATTENDANCE / CHECK-IN</span>
          </div>
          <div className="member-directory__table-col subscription">
            <span className="mono text-xs">SUBSCRIPTION EXPIRY</span>
          </div>
          <div className="member-directory__table-col payment">
            <span className="mono text-xs">PAYMENT STATUS</span>
          </div>
        </div>

        {/* Member Rows */}
        <div className="member-directory__table-body">
          {error && <p className="admin-form__alert admin-form__alert--error" role="alert">{error}</p>}
          {loading && <p role="status">Loading members…</p>}
          {!loading && !error && visibleMembers.length === 0 && (
            <p className="text-muted">No members match this search.</p>
          )}
          {visibleMembers.map((member) => (
            <div key={member.id} className={`member-directory__row ${member.status.toLowerCase()}`}>
              <div className="member-directory__table-col checkbox">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                />
              </div>
              
              <div className="member-directory__table-col member">
                <div className="member-directory__member-info">
                  <div className={`member-directory__avatar ${member.avatarColor}`}>
                    {member.initials}
                    {member.verified && <div className="member-directory__verified-badge"></div>}
                  </div>
                  <div>
                    <p className="member-directory__member-name">{member.name}</p>
                    <p className="member-directory__member-id mono">{member.rosterId}</p>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                </div>
              </div>

              <div className="member-directory__table-col membership">
                <div className="member-directory__tier">
                  <span className={`member-directory__tier-badge ${member.tier.class}`}>
                    {member.tier.name}
                  </span>
                  <p className="text-xs text-muted">{member.tier.details}</p>
                </div>
              </div>

              <div className="member-directory__table-col coach">
                <div className="member-directory__coach">
                  {member.coach ? (
                    <>
                      <div className="member-directory__coach-avatar">
                        <Icon name="person" size={16} />
                      </div>
                      <div>
                        <p className="text-sm">{member.coach.name}</p>
                        <p className="text-xs text-muted">{member.coach.title}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted text-sm">(Unassigned)</span>
                  )}
                </div>
              </div>

              <div className="member-directory__table-col attendance">
                <div className="member-directory__attendance">
                  {member.attendance.recent ? (
                    <>
                      <div className="member-directory__attendance-badge recent">
                        <Icon name="schedule" size={14} />
                        {member.attendance.time}
                      </div>
                      <p className="text-xs text-muted">{member.attendance.location}</p>
                    </>
                  ) : (
                    <>
                      <div className="member-directory__attendance-badge old">
                        <Icon name="event" size={14} />
                        {member.attendance.daysAgo}
                      </div>
                      <p className="text-xs text-muted">{member.attendance.location}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="member-directory__table-col subscription">
                <div className="member-directory__subscription">
                  <span className={`member-directory__expiry-badge ${member.expiry.class}`}>
                    {member.expiry.text}
                  </span>
                  <p className="text-xs text-muted">{member.expiry.date}</p>
                  {member.expiry.action && (
                    <p className="text-xs text-muted">{member.expiry.action}</p>
                  )}
                </div>
              </div>

              <div className="member-directory__table-col payment">
                <div className="member-directory__payment">
                  <span className={`member-directory__payment-badge ${member.payment.class}`}>
                    {member.payment.status}
                  </span>
                  <p className="text-xs text-muted">{member.payment.method}</p>
                  {member.payment.details && (
                    <p className="text-xs text-muted">{member.payment.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scanner Status */}
        <div className="member-directory__scanner">
          <Icon name="contactless" className="scanning" />
          <div>
            <p className="member-directory__scanner-title">SCANNER ONLINE: GATE-01</p>
            <p className="text-xs text-muted">Tap physical RFID badge or pass phone near reader</p>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
