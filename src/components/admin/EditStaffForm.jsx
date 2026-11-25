import { useState } from 'react';

import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import {
  updateAdminStaff,
  updateAdminTrainer,
} from '../../services/trainerService.js';
import './AdminForms.css';

export default function EditStaffForm({ person, isTrainer = false, onSuccess, onCancel }) {
  const [values, setValues] = useState({
    fullName: person.fullName || '',
    phone: person.phone || '',
    status: person.status || 'active',
    role: person.role || (isTrainer ? 'trainer' : 'manager'),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isTrainer) {
        await updateAdminTrainer(person.id, values);
      } else {
        await updateAdminStaff(person.id, values);
      }
      onSuccess();
    } catch (submitError) {
      setError(submitError.message || 'Unable to update staff member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      {error && <div className="admin-form__alert admin-form__alert--error" role="alert">{error}</div>}
      <div className="admin-form__grid">
        <label className="admin-form__field">
          <span className="admin-form__label">Full name</span>
          <input name="fullName" value={values.fullName} onChange={updateField} required />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Phone</span>
          <input name="phone" type="tel" value={values.phone} onChange={updateField} />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Status</span>
          <select name="status" value={values.status} onChange={updateField}>
            {['active', 'inactive', 'suspended'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        {!isTrainer && (
          <label className="admin-form__field">
            <span className="admin-form__label">Role</span>
            <select name="role" value={values.role} onChange={updateField}>
              <option value="manager">Manager</option>
              <option value="trainer">Trainer</option>
            </select>
          </label>
        )}
      </div>
      <div className="admin-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          <Icon name={saving ? 'hourglass_empty' : 'save'} />
          {saving ? 'Saving…' : 'Save staff'}
        </Button>
      </div>
    </form>
  );
}
