import { useState } from 'react';
import FormField from '../auth/FormField.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { createAdminStaff } from '../../services/trainerService.js';
import './AdminForms.css';

export default function AddManagerForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (!values.fullName || !values.email || !values.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (values.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const newManager = await createAdminStaff({ ...values, role: 'manager' });
      
      onSuccess(newManager);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && (
        <div className="admin-form__alert admin-form__alert--error">
          <Icon name="error" size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-form__grid">
        <FormField
          id="fullName"
          name="fullName"
          label="Full Name *"
          placeholder="Jane Johnson"
          value={values.fullName}
          onChange={handleChange}
          required
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email Address *"
          placeholder="jane@ironforge.com"
          value={values.email}
          onChange={handleChange}
          required
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="Password *"
          placeholder="At least 6 characters"
          value={values.password}
          onChange={handleChange}
          required
        />

        <FormField
          id="phone"
          name="phone"
          type="tel"
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
          value={values.phone}
          onChange={handleChange}
        />

      </div>

      <div className="admin-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          <Icon name={loading ? 'hourglass_empty' : 'person_add'} />
          {loading ? 'Creating...' : 'Add Manager'}
        </Button>
      </div>
    </form>
  );
}
