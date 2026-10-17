import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Signup() {
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
  const { signup } = useAuth();

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

    try {
      setLoading(true);
      setMessage('');

      // The backend signs the new user in, so go straight to the profile.
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      });

      navigate('/profile', { state: { notice: 'Account created successfully!' } });
    } catch (error) {
      setMessage(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">A FRESH START</p>
        <h1>Create your account.</h1>

        <p className="login-description">
          Join BeautyKart and make room for a little self-care.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
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

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

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

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
        </form>

        <p className="login-back">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default Signup;
