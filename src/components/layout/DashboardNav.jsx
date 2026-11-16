import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import Icon from '../ui/Icon.jsx';
import UserMenu from './useMenu.jsx';
import './DashboardNav.css';

export default function DashboardNav() {
  const { user } = useAuth();

  const navItems = user?.role === 'coach' 
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
        { label: 'My Members', href: '/dashboard/coach#members', icon: 'groups' },
        { label: 'Programs', href: '/dashboard/coach#programs', icon: 'fitness_center' },
        { label: 'Schedule', href: '/dashboard/coach#schedule', icon: 'calendar_month' },
      ]
    : user?.role === 'admin' || user?.role === 'manager'
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
        { label: 'Members', href: '/operations/members', icon: 'groups' },
        { label: 'Operations', href: '/operations/floor', icon: 'business' },
        { label: 'Reports', href: '/operations/reports', icon: 'analytics' },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
        { label: 'Membership', href: '/member/subscription', icon: 'card_membership' },
        { label: 'My profile', href: '/member/profile', icon: 'person' },
      ];

  return (
    <nav className="dash-nav">
      <div className="container dash-nav__inner">
        <div className="dash-nav__left">
          <div className="dash-nav__logo">
            <Logo />
          </div>
          
          <div className="dash-nav__links">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="dash-nav__link">
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="dash-nav__right">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
