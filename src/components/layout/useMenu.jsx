import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMemberProfile } from '../../context/MemberProfileContext';
import { getProfilePictureUrl } from '../../utils/profilePicture.js';
import Icon from '../ui/Icon';
import './userMenu.css';

const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Manager',
  coach: 'Coach',
  member: 'Member',
};

function UserAvatar({ imageUrl, initial, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <span
      className={`user-menu__avatar${large ? ' user-menu__avatar--large' : ''}${imageUrl && !imageFailed ? ' user-menu__avatar--image' : ''}`}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt=""
          onError={() => setImageFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}

export default function UserMenu({ onLogout, className = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { member, subscription } = useMemberProfile();

  const name =
    member?.fullName ||
    member?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.email ||
    'Member';

  const email = member?.email || user?.email || '';
  const initial = name.trim().charAt(0).toUpperCase() || 'M';
  const profilePictureUrl = getProfilePictureUrl(
    member?.profilePicture || user?.profilePicture || user?.profile_picture_url
  );
  const roleLabel = ROLE_LABELS[user?.role] || 'Member';
  const isMember = !user?.role || user?.role === 'member';

  const membershipStatus =
    subscription?.status ||
    (Array.isArray(subscription)
      ? subscription.find((item) => item.status === 'active')?.status
      : null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleLogout() {
    setIsOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    logout();
    navigate('/', { replace: true });
  }

  // No signed-in user = nothing to show.
  if (!user) return null;

  return (
    <div className={`user-menu ${className}`.trim()} ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open account menu"
      >
        <UserAvatar imageUrl={profilePictureUrl} initial={initial} />

        <span className="user-menu__trigger-name">{name}</span>

        <Icon
          name={isOpen ? 'expand_less' : 'expand_more'}
          size={18}
          className="user-menu__chevron"
        />
      </button>

      {isOpen && (
        <div className="user-menu__dropdown" role="menu">
          <div className="user-menu__identity">
            <UserAvatar imageUrl={profilePictureUrl} initial={initial} large />

            <div className="user-menu__identity-details">
              <strong>{name}</strong>
              <span>{email}</span>

              {membershipStatus ? (
                <span className="user-menu__status">
                  <span className="user-menu__status-dot" />
                  {membershipStatus}
                </span>
              ) : (
                <span className="user-menu__role">{roleLabel}</span>
              )}
            </div>
          </div>

          <div className="user-menu__divider" />

          <nav className="user-menu__links">
            {isMember && (
              <Link
                to="/member/profile"
                className="user-menu__link"
                role="menuitem"
                onClick={() => setIsOpen(false)}
              >
                <Icon name="person" />
                <span>View Profile</span>
              </Link>
            )}

            <Link
              to="/dashboard"
              className="user-menu__link"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <Icon name="dashboard" />
              <span>My Dashboard</span>
            </Link>
          </nav>

          <div className="user-menu__divider" />

          <button
            type="button"
            className="user-menu__link user-menu__logout"
            role="menuitem"
            onClick={handleLogout}
          >
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
