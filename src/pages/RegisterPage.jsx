import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import CheckboxField from '../components/auth/CheckboxField.jsx';
import FormAlert from '../components/auth/FormAlert.jsx';
import FormField from '../components/auth/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getActivePlans } from '../services/planService.js';
import { validateRegister } from '../utils/validators.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Pricing cards link here as /register?plan=<plan uuid>. Keep that selection
  // so the new member can continue to checkout after creating the account.
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || '';
  const initialPlan = UUID_PATTERN.test(planFromUrl) ? planFromUrl : '';

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState('');

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    planId: initialPlan,
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlans() {
      try {
        const data = await getActivePlans();

        if (!active) return;

        const nextPlans = Array.isArray(data) ? data : [];
        setPlans(nextPlans);

        // Drop a plan id that is no longer offered.
        if (
          values.planId &&
          nextPlans.length > 0 &&
          !nextPlans.some((plan) => String(plan.id) === values.planId)
        ) {
          setValues((current) => ({ ...current, planId: '' }));
        }
      } catch (error) {
        if (active) {
          setPlansError(
            error.message || 'Membership plans are temporarily unavailable.'
          );
        }
      } finally {
        if (active) setPlansLoading(false);
      }
    }

    loadPlans();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateRegister(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // The backend assigns the member role. Never send it from the client.
      // We also do not send planId here: registration would create a pending
      // subscription, and the checkout page creates the real one. Sending both
      // would leave the member with a duplicate pending record.
      await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      });

      const target = UUID_PATTERN.test(values.planId)
        ? `/subscribe/${values.planId}`
        : '/dashboard';

      navigate(target, { replace: true });
    } catch (error) {
      setSubmitError(error.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join IronForge and claim your complimentary 7-day access pass."
      footer={
        <>
          Already a member?{' '}
          <Link to={`/login${values.planId ? `?plan=${values.planId}` : ''}`}>
            Sign in
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormAlert>{submitError}</FormAlert>

        <FormField
          id="fullName"
          name="fullName"
          label="Full name"
          placeholder="Alex Rivera"
          autoComplete="name"
          value={values.fullName}
          onChange={handleChange}
          error={errors.fullName}
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />

        <FormField
          as="select"
          id="planId"
          name="planId"
          label="Membership plan"
          hint="You can confirm the price and payment method on the next step."
          value={values.planId}
          onChange={handleChange}
          disabled={plansLoading}
        >
          <option value="">
            {plansLoading ? 'Loading plans…' : "I'll choose later"}
          </option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} – ${Number(plan.price).toFixed(0)}/{plan.duration}
            </option>
          ))}
        </FormField>

        {plansError && (
          <p className="field__hint" role="status">
            {plansError} You can still create an account and pick a plan later.
          </p>
        )}

        <div className="auth-form__two">
          <FormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="8+ characters"
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number."
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />
          <FormField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm password"
            placeholder="Repeat password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
        </div>

        <CheckboxField id="terms" name="terms" checked={values.terms} onChange={handleChange} error={errors.terms}>
          I agree to the <a href="#bylaws">Facility Bylaws</a> and the <a href="#safety">Liability &amp; Safety</a> waiver.
        </CheckboxField>

        <Button type="submit" className="btn--block" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
