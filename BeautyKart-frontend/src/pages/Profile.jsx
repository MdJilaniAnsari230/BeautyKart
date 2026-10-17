import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, assetUrl } from '../api';
import { useAuth } from '../AuthContext';

function Profile() {
  const { user, status, logout, refresh, setUser } = useAuth();
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/account', {
      replace: true,
      state: { notice: 'You have logged out successfully.' },
    });
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Only JPG, PNG and WEBP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Image must be 2 MB or smaller.');
      return;
    }

    try {
      setUploading(true);
      setMessage('');
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiFetch('/api/auth/profile-image', { method: 'POST', formData });
      setUser({ ...user, profileImagePath: data.profileImagePath });
      setMessage(data.message || 'Profile photo updated.');
    } catch (err) {
      setMessage(err.message || 'Photo upload failed.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  if (status === 'loading') {
    return <main className="login-page">Loading profile...</main>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/account" replace />;
  }

  if (status === 'error' || !user) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <h1>My Profile</h1>
          <p className="form-message">
            Unable to reach the server right now. Please try again.
          </p>
          <button type="button" className="login-submit" onClick={refresh}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  const name = user.userName || 'BeautyKart User';
  const photo = assetUrl(user.profileImagePath);

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">YOUR ACCOUNT</p>

        {location.state?.notice && (
          <p className="form-message" role="status">
            {location.state.notice}
          </p>
        )}

        <h1>My Profile</h1>

        <p className="login-description">
          Manage your BeautyKart account details.
        </p>

        <div className="profile-avatar">
          {photo ? (
            <img
              src={photo}
              alt={`${name} profile`}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span>{name.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          hidden
        />
        <button
          type="button"
          className="account-text-link"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change photo'}
        </button>

        <h2>{name}</h2>

        <p className="login-description">BeautyKart Member</p>

        <div className="profile-details">
          <div className="profile-detail">
            <span>Full name</span>
            <strong>{name}</strong>
          </div>

          <div className="profile-detail">
            <span>Email address</span>
            <strong>{user.userEmail}</strong>
          </div>

          <div className="profile-detail">
            <span>Phone number</span>
            <strong>{user.userNumber || 'Not added yet'}</strong>
          </div>

          <div className="profile-detail">
            <span>Account ID</span>
            <strong>{user.userId ?? '—'}</strong>
          </div>
        </div>

        <div className="profile-actions">
          <Link to="/products">Continue Shopping</Link>

          <button type="button" className="login-submit" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {message && (
          <p className="form-message" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

export default Profile;
