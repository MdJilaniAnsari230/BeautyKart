
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState({
    admins: [],
    users: [],
    products: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await apiFetch("/api/admin/dashboard");
        setDashboard({
          admins: data.admins || [],
          users: data.users || [],
          products: data.products || [],
        });
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          navigate("/admin-login", { replace: true });
          return;
        }
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Leave the dashboard either way; the server session may already be gone.
    }
    navigate("/admin-login", { replace: true });
  };


if (loading) {
  return (
    <main className="admin-dashboard-loading">
      Loading dashboard...
    </main>
  );
}

if (error) {
  return (
    <main className="admin-dashboard-error">
      <p>{error}</p>
      <button
        className="admin-dashboard-back-button"
        onClick={() => navigate("/admin-login")}
      >
        Back to Admin Login
      </button>
    </main>
  );
}

return (
  <main className="admin-dashboard-page">

<header className="admin-dashboard-header">
  <div>
    <h2 className="admin-dashboard-title">
      Admin Dashboard
    </h2>
    <p className="admin-dashboard-description">
      Manage your BeautyKart store overview.
    </p>
  </div>

  <div className="admin-dashboard-header-actions">
    <Link
      className="admin-dashboard-home"
      to="/admin-management"
    >
      Manage Admins
    </Link>

    <Link className="admin-dashboard-home" to="/">
      Back to Store
    </Link>

    <button
      type="button"
      className="admin-dashboard-home"
      onClick={handleLogout}
    >
      Log out
    </button>
  </div>
</header>


    <section className="admin-dashboard-stats">
      <article className="admin-stat-card">
        <p className="admin-stat-label">Total Admins</p>
        <p className="admin-stat-number">
          {dashboard.admins.length}
        </p>
      </article>

      <article className="admin-stat-card">
        <p className="admin-stat-label">Total Users</p>
        <p className="admin-stat-number">
          {dashboard.users.length}
        </p>
      </article>

      <article className="admin-stat-card">
        <p className="admin-stat-label">Total Products</p>
        <p className="admin-stat-number">
          {dashboard.products.length}
        </p>
      </article>
    </section>

    <section className="admin-dashboard-section">
      <h3>Admins</h3>
      {dashboard.admins.length === 0 ? (
        <p className="admin-dashboard-empty">No admins found.</p>
      ) : (
        <ul className="admin-dashboard-list">
          {dashboard.admins.map((admin) => (
            <li key={admin.adminId}>
              {admin.adminName || admin.name || "Admin"} —{" "}
              {admin.adminEmail || admin.email}
            </li>
          ))}
        </ul>
      )}
    </section>

    <section className="admin-dashboard-section">
      <h3>Users</h3>
      {dashboard.users.length === 0 ? (
        <p className="admin-dashboard-empty">No users found.</p>
      ) : (
        <ul className="admin-dashboard-list">
          {dashboard.users.map((user) => (
            <li key={user.userId}>
              {user.userName || user.name || "User"} —{" "}
              {user.userEmail || user.email}
            </li>
          ))}
        </ul>
      )}
    </section>

    <section className="admin-dashboard-section">
      <h3>Products</h3>
      {dashboard.products.length === 0 ? (
        <p className="admin-dashboard-empty">No products found.</p>
      ) : (
        <ul className="admin-dashboard-list">
          {dashboard.products.map((product) => (
            <li key={product.pid}>
              {product.pname || "Product"} — ID:{" "}
              {product.pid}
            </li>
          ))}
        </ul>
      )}
    </section>
  </main>
);
}

export default AdminDashboard;
