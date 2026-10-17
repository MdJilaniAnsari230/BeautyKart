import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Login() {
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [message, setMessage] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return; // ignore duplicate submissions

    if (!form.email.trim() || !form.password) {
      setMessage('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      await login(form.email.trim(), form.password);
      navigate('/products');
    } catch (error) {
      setMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Good to see you.</h1>
        <p className="login-description">
          Sign in to continue exploring your beauty favourites.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
        </form>

        <p className="login-back">
          Just browsing? <Link to="/products">Explore products</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
