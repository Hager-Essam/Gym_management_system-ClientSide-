import { useEffect, useState } from 'react';
import { useMemberProfile } from '../context/MemberProfileContext.jsx';
import Button from '../components/ui/Button.jsx';
import DashboardNav from '../components/layout/DashboardNav.jsx';
import {
  getProfileCompletion,
  validateProfileForm,
} from '../utils/profileCompletion.js';
import { getProfilePictureUrl } from '../utils/profilePicture.js';
import './MemberProfilePage.css';

export default function MemberProfilePage() {
  const {
    member,
    subscription,
    loading,
    error: loadError,
    updateProfile,
  } = useMemberProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');
  const [pictureSaving, setPictureSaving] = useState(false);

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!picturePreview.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(picturePreview);
  }, [picturePreview]);

  function handlePictureChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('The profile photo must be 5 MB or smaller.');
      return;
    }

    setError('');
    setSuccess('');
    setPictureFile(file);
    setPicturePreview(URL.createObjectURL(file));
  }

  function cancelPictureChange() {
    setPictureFile(null);
    setPicturePreview('');
    setError('');
  }

  async function savePicture() {
    if (!pictureFile) return;

    setPictureSaving(true);
    setError('');
    setSuccess('');

    const payload = new FormData();
    payload.append('profilePicture', pictureFile);

    try {
      await updateProfile(payload);
      setPictureFile(null);
      setPicturePreview('');
      setSuccess('Your profile photo has been updated.');
    } catch (err) {
      setError(err.message || 'Failed to update your profile photo.');
    } finally {
      setPictureSaving(false);
    }
  }

  function startEditing() {
    setForm({
      fullName: member.fullName || '',
      phone: member.phone || '',
      address: member.address || '',
      dateOfBirth: member.dateOfBirth
        ? member.dateOfBirth.slice(0, 10)
        : '',
      gender: member.gender || '',
      emergencyContact: member.emergencyContact || '',
      bio: member.bio || '',
    });

    setError('');
    setSuccess('');
    setFieldErrors({});
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFieldErrors({});
    setError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    // Clear a field's error as soon as the member edits it.
    setFieldErrors((current) => {
      if (!current[name]) return current;

      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateProfileForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError('Please fix the highlighted fields before saving.');
      setSuccess('');

      const firstInvalid = Object.keys(validationErrors)[0];
      document.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    // The backend validator rejects empty strings for phone, dateOfBirth and
    // gender, so only send those when the member actually filled them in.
    const payload = {
      fullName: form.fullName.trim(),
      address: form.address,
      emergencyContact: form.emergencyContact,
      bio: form.bio,
    };

    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.gender) payload.gender = form.gender;

    try {
      await updateProfile(payload);

      setIsEditing(false);
      setFieldErrors({});
      setSuccess('Your profile has been updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="profile-loading">Loading profile...</div>
      </>
    );
  }

  if (!member) {
    return (
      <>
        <DashboardNav />
        <div className="profile-loading" role="alert">
          {loadError || 'Unable to load your profile.'}
        </div>
      </>
    );
  }

  const firstLetter = member.fullName?.trim()?.charAt(0).toUpperCase() || 'M';
  const profilePictureUrl = getProfilePictureUrl(member.profilePicture);

  const joinedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString()
    : 'Not available';

  const completion = getProfileCompletion(member);

  return (
    <>
      <DashboardNav />

      <main className="member-profile">
        <div className="profile-container">

        <section className="profile-hero">
          <div className="profile-picture">
            <div className={`profile-avatar ${picturePreview || profilePictureUrl ? 'profile-avatar--image' : ''}`}>
              {(picturePreview || profilePictureUrl) ? (
                <img
                  src={picturePreview || profilePictureUrl}
                  alt={`${member.fullName}'s profile`}
                />
              ) : (
                firstLetter
              )}
            </div>
            <div className="profile-picture-actions">
              <label className="profile-picture-control">
                Choose photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePictureChange}
                  disabled={pictureSaving}
                  aria-label="Choose profile photo"
                />
              </label>
              {pictureFile && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={savePicture}
                    disabled={pictureSaving}
                  >
                    {pictureSaving ? 'Uploading…' : 'Save photo'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelPictureChange}
                    disabled={pictureSaving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
            <span className="profile-picture-hint">JPEG, PNG, or WebP · max 5 MB</span>
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

        <section
          className={`profile-card profile-completion ${
            completion.isComplete ? 'profile-completion--done' : ''
          }`}
        >
          <div className="profile-completion__head">
            <div>
              <span className="profile-eyebrow">PROFILE STRENGTH</span>
              <h2>
                {completion.isComplete
                  ? 'Your profile is complete'
                  : 'Finish your profile'}
              </h2>
            </div>

            <span className="profile-completion__percent" aria-hidden="true">
              {completion.percentage}%
            </span>
          </div>

          <div
            className="profile-completion__track"
            role="progressbar"
            aria-label="Profile completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion.percentage}
          >
            <span
              className="profile-completion__fill"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          <p className="profile-completion__hint">
            {completion.isComplete
              ? 'Everything the front desk needs is on file. You can update it any time.'
              : `${completion.completed} of ${completion.total} details saved. Missing: ${completion.missing.join(', ')}.`}
          </p>

          {!completion.isComplete && !isEditing && (
            <Button variant="outline" onClick={startEditing}>
              Complete my profile
            </Button>
          )}
        </section>

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

                <label
                  className={fieldErrors.fullName ? 'profile-field--error' : ''}
                >
                  Full Name{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      fieldErrors.fullName ? 'profile-fullName-error' : undefined
                    }
                  />
                  {fieldErrors.fullName && (
                    <span
                      className="profile-field-error"
                      id="profile-fullName-error"
                      role="alert"
                    >
                      {fieldErrors.fullName}
                    </span>
                  )}
                </label>

                <label>
                  Email
                  <input value={member.email} disabled />
                </label>

                <label
                  className={fieldErrors.phone ? 'profile-field--error' : ''}
                >
                  Phone{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={20}
                    inputMode="tel"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? 'profile-phone-error' : undefined
                    }
                  />
                  {fieldErrors.phone && (
                    <span
                      className="profile-field-error"
                      id="profile-phone-error"
                      role="alert"
                    >
                      {fieldErrors.phone}
                    </span>
                  )}
                </label>

                <label
                  className={
                    fieldErrors.dateOfBirth ? 'profile-field--error' : ''
                  }
                >
                  Date of Birth{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                    aria-describedby={
                      fieldErrors.dateOfBirth
                        ? 'profile-dateOfBirth-error'
                        : undefined
                    }
                  />
                  {fieldErrors.dateOfBirth && (
                    <span
                      className="profile-field-error"
                      id="profile-dateOfBirth-error"
                      role="alert"
                    >
                      {fieldErrors.dateOfBirth}
                    </span>
                  )}
                </label>

                <label
                  className={fieldErrors.gender ? 'profile-field--error' : ''}
                >
                  Gender{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.gender)}
                    aria-describedby={
                      fieldErrors.gender ? 'profile-gender-error' : undefined
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {fieldErrors.gender && (
                    <span
                      className="profile-field-error"
                      id="profile-gender-error"
                      role="alert"
                    >
                      {fieldErrors.gender}
                    </span>
                  )}
                </label>

                <label
                  className={
                    fieldErrors.emergencyContact ? 'profile-field--error' : ''
                  }
                >
                  Emergency Contact{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <input
                    name="emergencyContact"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    maxLength={150}
                    aria-invalid={Boolean(fieldErrors.emergencyContact)}
                    aria-describedby={
                      fieldErrors.emergencyContact
                        ? 'profile-emergencyContact-error'
                        : undefined
                    }
                  />
                  {fieldErrors.emergencyContact && (
                    <span
                      className="profile-field-error"
                      id="profile-emergencyContact-error"
                      role="alert"
                    >
                      {fieldErrors.emergencyContact}
                    </span>
                  )}
                </label>

                <label className="profile-form-full">
                  Address{' '}
                  <span className="profile-required" aria-hidden="true">*</span>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </label>

                <label className="profile-form-full">
                  Bio (optional)
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
                  onClick={cancelEditing}
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
    </>
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