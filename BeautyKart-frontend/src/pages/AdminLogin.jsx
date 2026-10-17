import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/admin/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });

      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

return (
  <main className="admin-login-page">
    <section className="admin-login-card">
      <h2 className="admin-login-heading">Admin Login</h2>

      <p className="admin-login-subtitle">
        Welcome back! Sign in to manage BeautyKart.
      </p>

      <form className="admin-login-form" onSubmit={handleLogin}>
        <label htmlFor="admin-email">Email Address</label>
        <input
          id="admin-email"
          type="email"
          placeholder="Enter admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="admin-login-error">{error}</p>
        )}

        <button
          className="admin-login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login as Admin"}
        </button>
      </form>

      <div className="admin-login-back">
        <Link to="/">← Back to BeautyKart</Link>
      </div>
    </section>
  </main>
);
}

export default AdminLogin;
