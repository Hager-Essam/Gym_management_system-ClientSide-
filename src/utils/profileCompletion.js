/**
 * Profile completion + client-side validation.
 *
 * These rules mirror the backend where it validates (`fullName` min 2,
 * `phone` mobile format, `dateOfBirth` ISO date, `gender` enum) and match the
 * database column limits so we never submit a value Postgres would reject.
 *
 * The completion score is a product guideline only; it never blocks the API.
 */

export const PROFILE_COMPLETION_FIELDS = [
  { key: 'fullName', label: 'full name' },
  { key: 'phone', label: 'phone number' },
  { key: 'dateOfBirth', label: 'date of birth' },
  { key: 'gender', label: 'gender' },
  { key: 'address', label: 'address' },
  { key: 'emergencyContact', label: 'emergency contact' },
];

export const PROFILE_LIMITS = {
  fullName: 150,
  phone: 20,
  emergencyContact: 150,
};

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

/** @returns {{ total:number, completed:number, percentage:number, missing:string[], isComplete:boolean }} */
export function getProfileCompletion(member = {}) {
  const missing = [];
  let completed = 0;

  for (const field of PROFILE_COMPLETION_FIELDS) {
    if (hasValue(member[field.key])) {
      completed += 1;
    } else {
      missing.push(field.label);
    }
  }

  const total = PROFILE_COMPLETION_FIELDS.length;

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    missing,
    isComplete: completed === total,
  };
}

/** Validate one editable field. Returns an empty string when it is valid. */
export function validateProfileField(name, value) {
  const text = typeof value === 'string' ? value.trim() : '';

  switch (name) {
    case 'fullName': {
      if (!text) return 'Full name is required.';
      if (text.length < 2) {
        return 'Full name must be at least 2 characters.';
      }
      if (text.length > PROFILE_LIMITS.fullName) {
        return `Full name must be ${PROFILE_LIMITS.fullName} characters or fewer.`;
      }
      return '';
    }

    case 'phone': {
      if (!text) return '';
      if (text.length > PROFILE_LIMITS.phone) {
        return `Phone number must be ${PROFILE_LIMITS.phone} characters or fewer.`;
      }

      const digits = text.replace(/\D/g, '');

      if (
        !/^\+?[\d\s().-]+$/.test(text) ||
        digits.length < 6 ||
        digits.length > 15
      ) {
        return 'Please provide a valid phone number.';
      }

      return '';
    }

    case 'dateOfBirth': {
      if (!text) return '';

      const date = new Date(`${text}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return 'Please provide a valid date.';
      }

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (date > endOfToday) {
        return 'Date of birth cannot be in the future.';
      }

      return '';
    }

    case 'gender': {
      if (text && !['male', 'female', 'other'].includes(text)) {
        return 'Invalid gender value.';
      }
      return '';
    }

    case 'emergencyContact': {
      if (text.length > PROFILE_LIMITS.emergencyContact) {
        return `Emergency contact must be ${PROFILE_LIMITS.emergencyContact} characters or fewer.`;
      }
      return '';
    }

    default:
      return '';
  }
}

/** Validate the whole edit form. Returns `{ fieldName: message }`. */
export function validateProfileForm(form = {}) {
  const errors = {};

  for (const field of [
    'fullName',
    'phone',
    'dateOfBirth',
    'gender',
    'emergencyContact',
  ]) {
    const message = validateProfileField(field, form[field]);

    if (message) errors[field] = message;
  }

  return errors;
}
