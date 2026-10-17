
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function AdminManagement() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminNumber: "",
  });

  const loadAdmins = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/admins");
      setAdmins(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/admin-login", { replace: true });
        return;
      }
      setError(err.message || "Could not load admins.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // loadAdmins() only sets state after awaiting the network, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdmins();
  }, [loadAdmins]);

  const refreshAdmins = () => {
    setLoading(true);
    setError("");
    loadAdmins();
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      adminName: "",
      adminEmail: "",
      adminPassword: "",
      adminNumber: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const isEditing = editingId !== null;

    const payload = {
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      adminNumber: form.adminNumber.trim(),
    };

    // Password is required when creating an admin.
    // When editing, a blank password keeps the existing password.
    if (!isEditing || form.adminPassword.trim() !== "") {
      payload.adminPassword = form.adminPassword;
    }

    try {
      await apiFetch(
        isEditing ? `/api/admin/admins/${editingId}` : "/api/admin/admins",
        { method: isEditing ? "PUT" : "POST", body: payload }
      );

      setMessage(
        isEditing
          ? "Admin updated successfully."
          : "Admin added successfully."
      );

      resetForm();
      await loadAdmins();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/admin-login", { replace: true });
        return;
      }
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.adminId);
    setForm({
      adminName: admin.adminName || "",
      adminEmail: admin.adminEmail || "",
      adminPassword: "",
      adminNumber: admin.adminNumber || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (admin) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${admin.adminName}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await apiFetch(`/api/admin/admins/${admin.adminId}`, { method: "DELETE" });

      setMessage("Admin deleted successfully.");

      if (editingId === admin.adminId) {
        resetForm();
      }

      await loadAdmins();
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        navigate("/admin-login", { replace: true });
        return;
      }
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <main className="admin-management-page">
      <header className="admin-management-header">
        <div>
          <h1>Admin Management</h1>
          <p>Manage BeautyKart administrator accounts.</p>
        </div>

        <Link
          to="/admin-dashboard"
          className="admin-management-back"
        >
          Back to Dashboard
        </Link>
      </header>

      {message && (
        <p className="admin-management-message">{message}</p>
      )}

      {error && (
        <p className="admin-management-error">{error}</p>
      )}

      <section className="admin-management-card">
        <h2>{editingId !== null ? "Update Admin" : "Add New Admin"}</h2>

        <form
          className="admin-management-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="adminName">Full Name</label>
          <input
            id="adminName"
            name="adminName"
            value={form.adminName}
            onChange={handleChange}
            placeholder="Enter admin name"
            required
          />

          <label htmlFor="adminEmail">Email Address</label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            value={form.adminEmail}
            onChange={handleChange}
            placeholder="Enter admin email"
            required
          />

          <label htmlFor="adminPassword">
            Password {editingId !== null && "(leave blank to keep current)"}
          </label>
          <input
            id="adminPassword"
            name="adminPassword"
            type="password"
            value={form.adminPassword}
            onChange={handleChange}
            placeholder={
              editingId !== null
                ? "Enter new password if changing"
                : "Enter password"
            }
            required={editingId === null}
            autoComplete="new-password"
          />

          <label htmlFor="adminNumber">Phone Number</label>
          <input
            id="adminNumber"
            name="adminNumber"
            type="tel"
            value={form.adminNumber}
            onChange={handleChange}
            placeholder="Enter phone number"
          />

          <div className="admin-management-actions">
            <button
              type="submit"
              disabled={saving}
              className="admin-management-primary"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Admin"
                  : "Add Admin"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="admin-management-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-management-card">
        <div className="admin-management-list-header">
          <h2>All Admins</h2>
          <button
            type="button"
            className="admin-management-secondary"
            onClick={refreshAdmins}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading admins...</p>
        ) : admins.length === 0 ? (
          <p>No admins found.</p>
        ) : (
          <div className="admin-management-table-wrapper">
            <table className="admin-management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.adminId}>
                    <td>{admin.adminId}</td>
                    <td>{admin.adminName}</td>
                    <td>{admin.adminEmail}</td>
                    <td>{admin.adminNumber || "—"}</td>
                    <td>
                      <div className="admin-management-row-actions">
                        <button
                          type="button"
                          className="admin-management-edit"
                          onClick={() => handleEdit(admin)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-management-delete"
                          onClick={() => handleDelete(admin)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminManagement;
