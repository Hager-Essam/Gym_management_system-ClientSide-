import { useCallback, useEffect, useState } from 'react';

import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import Icon from '../components/ui/Icon.jsx';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getNotifications();
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  async function markRead(id) {
    setActionId(id);
    setError('');
    try {
      const updated = await markNotificationRead(id);
      setNotifications((current) => current.map((item) => item.id === id ? updated : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (actionError) {
      setError(actionError.message || 'Unable to mark notification as read.');
    } finally {
      setActionId('');
    }
  }

  async function markAllRead() {
    setActionId('all');
    setError('');
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (actionError) {
      setError(actionError.message || 'Unable to mark notifications as read.');
    } finally {
      setActionId('');
    }
  }

  return (
    <>
      <DashboardNav />
      <main className="container notifications-page">
        <header className="notifications-page__header">
          <div>
            <p className="mono text-accent">Updates</p>
            <h1>Notifications</h1>
            <p className="text-muted">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}.</p>
          </div>
          <div className="notifications-page__actions">
            <Button type="button" variant="outline" onClick={loadNotifications} disabled={loading}>
              <Icon name="refresh" size={18} /> Refresh
            </Button>
            {unreadCount > 0 && (
              <Button type="button" onClick={markAllRead} disabled={actionId === 'all'}>
                Mark all read
              </Button>
            )}
          </div>
        </header>

        {error && <p className="notifications-page__error" role="alert">{error}</p>}
        {loading ? (
          <p className="notifications-page__empty" role="status">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="notifications-page__empty">
            <Icon name="notifications_none" size={40} />
            <p>You are all caught up.</p>
          </div>
        ) : (
          <ul className="notifications-page__list">
            {notifications.map((item) => (
              <li key={item.id} className={`card notifications-page__item ${item.is_read ? '' : 'is-unread'}`}>
                <div className={`notifications-page__icon notifications-page__icon--${item.notification_type || 'info'}`}>
                  <Icon name={item.notification_type === 'warning' ? 'warning' : 'notifications'} size={20} />
                </div>
                <div className="notifications-page__content">
                  <div className="notifications-page__title">
                    <h2>{item.title}</h2>
                    {!item.is_read && <span>New</span>}
                  </div>
                  <p>{item.message}</p>
                  <time dateTime={item.created_at}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                  </time>
                </div>
                {!item.is_read && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={actionId === item.id}
                    onClick={() => markRead(item.id)}
                  >
                    {actionId === item.id ? 'Saving…' : 'Mark read'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
