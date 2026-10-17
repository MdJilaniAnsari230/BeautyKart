
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Account() {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, signup } = useAuth();

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return; // ignore duplicate submissions
    setMessage('');

    const isSignup = mode === 'signup';

    if (isSignup) {
      if (!form.name.trim()) {
        setMessage('Please enter your name.');
        return;
      }

      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        setMessage('Enter a valid 10-digit Indian mobile number.');
        return;
      }

      if (form.password.length < 8) {
        setMessage('Password must contain at least 8 characters.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
    }

    try {
      setLoading(true);

      if (isSignup) {
        await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          password: form.password,
        });
      } else {
        await login(form.email.trim(), form.password);
      }

      navigate('/profile', {
        state: {
          notice: isSignup ? 'Account created successfully!' : 'Welcome back!',
        },
      });
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">
          {mode === 'signup' ? 'A FRESH START' : 'WELCOME BACK'}
        </p>

        <h1>
          {mode === 'signup'
            ? 'Create your account.'
            : 'Good to see you.'}
        </h1>

        <p className="login-description">
          {mode === 'signup'
            ? 'Join BeautyKart and make room for a little self-care.'
            : 'Sign in to continue exploring your beauty favourites.'}
        </p>

        <div className="account-switch">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {mode === 'signup' && (
            <>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                autoComplete="tel-national"
                required
              />
            </>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={
              mode === 'signup'
                ? 'At least 8 characters'
                : 'Enter your password'
            }
            autoComplete={
              mode === 'signup' ? 'new-password' : 'current-password'
            }
            minLength={mode === 'signup' ? 8 : undefined}
            required
          />

          {mode === 'signup' && (
            <>
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Enter password again"
                autoComplete="new-password"
                required
              />
            </>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
                ? 'Create account'
                : 'Sign in'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
        </form>

        <p className="login-back">
          {mode === 'signup' ? (
            <>
              Already registered?{' '}
              <button
                type="button"
                className="account-text-link"
                onClick={() => switchMode('login')}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New to BeautyKart?{' '}
              <button
                type="button"
                className="account-text-link"
                onClick={() => switchMode('signup')}
              >
                Create account
              </button>
            </>
          )}
        </p>

        <p className="login-back">
          Just browsing? <Link to="/products">Explore products</Link>
        </p>
      </section>
    </main>
  );
}

export default Account;
