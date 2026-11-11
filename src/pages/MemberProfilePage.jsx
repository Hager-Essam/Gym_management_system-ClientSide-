import { useState } from 'react';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import Button from '../components/ui/Button.jsx';
import './MemberProfilePage.css';

export default function MemberProfilePage() {
  const {
    member,
    subscription,
    loading,
    updateProfile,
  } = useMemberProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState(null);

  function startEditing() {
    setForm({
      full_name: member.fullName || '',
      phone: member.phone || '',
      address: member.address || '',
      date_of_birth: member.dateOfBirth
        ? member.dateOfBirth.slice(0, 10)
        : '',
      gender: member.gender || '',
      emergency_contact: member.emergencyContact || '',
      bio: member.bio || '',
    });

    setError('');
    setSuccess('');
    setIsEditing(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(form);

      setIsEditing(false);
      setSuccess('Your profile has been updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!member) {
    return <div className="profile-loading">Unable to load your profile.</div>;
  }

  const firstLetter = member.fullName?.trim()?.charAt(0).toUpperCase() || 'M';

  const joinedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString()
    : 'Not available';

  return (
    <main className="member-profile">
      <div className="profile-container">

        <section className="profile-hero">
          <div className="profile-avatar">
            {firstLetter}
          </div>

          <div className="profile-hero-info">
            <span className="profile-eyebrow">IRONFORGE MEMBER</span>
            <h1>{member.fullName}</h1>
            <p>{member.email}</p>
            <span className="profile-status">
              {member.status || 'Active'}
            </span>
          </div>

          {!isEditing && (
            <Button onClick={startEditing}>
              Edit Profile
            </Button>
          )}
        </section>

        {success && (
          <div className="profile-message profile-message--success">
            {success}
          </div>
        )}

        {error && (
          <div className="profile-message profile-message--error">
            {error}
          </div>
        )}

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <span className="profile-eyebrow">YOUR ACCOUNT</span>
              <h2>Personal Information</h2>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="profile-form-grid">

                <label>
                  Full Name
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Email
                  <input value={member.email} disabled />
                </label>

                <label>
                  Phone
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Gender
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label>
                  Emergency Contact
                  <input
                    name="emergency_contact"
                    value={form.emergency_contact}
                    onChange={handleChange}
                  />
                </label>

                <label className="profile-form-full">
                  Address
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </label>

                <label className="profile-form-full">
                  Bio
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us a little about yourself..."
                  />
                </label>

              </div>

              <div className="profile-form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="profile-info-grid">
              <Info label="Full Name" value={member.fullName} />
              <Info label="Email" value={member.email} />
              <Info label="Phone" value={member.phone} />
              <Info
                label="Date of Birth"
                value={
                  member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString()
                    : 'Not provided'
                }
              />
              <Info label="Gender" value={member.gender} />
              <Info
                label="Emergency Contact"
                value={member.emergencyContact}
              />
              <Info label="Address" value={member.address} />
              <Info label="Bio" value={member.bio} />
              <Info label="Member Since" value={joinedDate} />
            </div>
          )}
        </section>

        <section className="profile-card">
          <span className="profile-eyebrow">YOUR MEMBERSHIP</span>
          <h2>Membership Details</h2>

          {subscription ? (
            <div className="profile-info-grid">
              <Info label="Plan" value={subscription.plan_name} />
              <Info label="Price" value={`$${subscription.price}`} />
              <Info label="Duration" value={subscription.duration} />
              <Info label="Status" value={subscription.status} />
              <Info
                label="Start Date"
                value={new Date(subscription.start_date).toLocaleDateString()}
              />
              <Info
                label="End Date"
                value={new Date(subscription.end_date).toLocaleDateString()}
              />
            </div>
          ) : (
            <p>No active subscription information available.</p>
          )}
        </section>

      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="profile-info-item">
      <span>{label}</span>
      <strong>{value || 'Not provided'}</strong>
    </div>
  );
}