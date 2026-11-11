import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMemberProfile } from '../../context/MemberProfileContext.jsx';
import './UserMenu.css';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const { logout } = useAuth();
  const { member, subscription, loading } = useMemberProfile();

  const navigate = useNavigate();

  const fullName = member?.fullName || 'Member';
  const firstLetter = fullName.trim().charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleLogout() {
    setIsOpen(false);
    logout();
    navigate('/');
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Open account menu"
      >
        <span className="user-menu__avatar">
          {firstLetter}
        </span>

        <span className="user-menu__name">
          {loading ? 'Loading...' : fullName}
        </span>

        <Icon name="expand_more" size={18} />
      </button>

      {isOpen && (
        <div className="user-menu__dropdown">
          <div className="user-menu__header">
            <span className="user-menu__avatar user-menu__avatar--large">
              {firstLetter}
            </span>

            <div className="user-menu__info">
              <strong>{fullName}</strong>
              <span>{member?.email}</span>
              <small>{member?.status || 'Member'}</small>
            </div>
          </div>

          {subscription && (
            <div className="user-menu__membership">
              <span>YOUR MEMBERSHIP</span>
              <strong>{subscription.plan_name}</strong>
              <small>{subscription.status}</small>
            </div>
          )}

          <div className="user-menu__divider" />

          <Link
            to="/member/profile"
            className="user-menu__item"
            onClick={() => setIsOpen(false)}
          >
            <Icon name="user" size={18} />
            View Profile
          </Link>

          <Link
            to="/dashboard"
            className="user-menu__item"
            onClick={() => setIsOpen(false)}
          >
            <Icon name="dashboard" size={18} />
            My Dashboard
          </Link>

          <button
            type="button"
            className="user-menu__item user-menu__logout"
            onClick={handleLogout}
          >
            <Icon name="logout" size={18} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}