import { useState } from 'react';

import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { updateMember } from '../../services/memberService.js';
import './AdminForms.css';

export default function EditMemberForm({ member, onSuccess, onCancel }) {
  const [values, setValues] = useState({
    fullName: member.fullName || '',
    phone: member.phone || '',
    address: member.address || '',
    dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : '',
    gender: member.gender || '',
    emergencyContact: member.emergencyContact || '',
    bio: member.bio || '',
    status: member.status || 'active',
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
      await updateMember(member.id, values);
      onSuccess();
    } catch (submitError) {
      setError(submitError.message || 'Unable to update member.');
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
          <span className="admin-form__label">Date of birth</span>
          <input name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={updateField} />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Gender</span>
          <select name="gender" value={values.gender} onChange={updateField}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Status</span>
          <select name="status" value={values.status} onChange={updateField}>
            {['active', 'inactive', 'suspended'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Address</span>
          <input name="address" value={values.address} onChange={updateField} />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Emergency contact</span>
          <input name="emergencyContact" value={values.emergencyContact} onChange={updateField} />
        </label>
      </div>
      <label className="admin-form__field">
        <span className="admin-form__label">Bio</span>
        <textarea name="bio" rows="3" value={values.bio} onChange={updateField} />
      </label>
      <div className="admin-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          <Icon name={saving ? 'hourglass_empty' : 'save'} />
          {saving ? 'Saving…' : 'Save member'}
        </Button>
      </div>
    </form>
  );
}
