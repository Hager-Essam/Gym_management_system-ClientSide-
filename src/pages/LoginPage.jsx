import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import CheckboxField from '../components/auth/CheckboxField.jsx';
import FormAlert from '../components/auth/FormAlert.jsx';
import FormField from '../components/auth/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin } from '../utils/validators.js';

function buildPath(location) {
  if (!location?.pathname) return null;
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
}

export default function LoginPage() {
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const planId = searchParams.get('plan');
  const intendedPath = buildPath(location.state?.from);

  // If ProtectedRoute sent us here, go back to the exact page (including
  // ?query) the user originally wanted.
  const redirectAfterLogin = intendedPath || (planId ? `/subscribe/${planId}` : '/dashboard');

  // One state object for all inputs ("controlled inputs": React owns the values).
  const [values, setValues] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // clear that field's error while typing
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page

    const validationErrors = validateLogin(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const loggedIn = await login(values);

      // Only members can continue to a plan checkout.
      const target =
        planId && loggedIn?.role === 'member'
          ? `/subscribe/${planId}`
          : redirectAfterLogin;

      navigate(target, { replace: true });
    } catch (error) {
      setSubmitError(error.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Member portal login"
      subtitle="Sign in to manage your membership, book coaches, and view your telemetry."
      footer={
        <>
          New to IronForge?{' '}
          <Link to={`/register${planId ? `?plan=${planId}` : ''}`}>
            Create an account
          </Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormAlert>{submitError || authError}</FormAlert>

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
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />

        <div className="auth-form__row">
          <CheckboxField id="remember" name="remember" checked={values.remember} onChange={handleChange}>
            Remember me
          </CheckboxField>
          <a href="#forgot">Forgot password?</a>
        </div>

        <Button type="submit" className="btn--block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
