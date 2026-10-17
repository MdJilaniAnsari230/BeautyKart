
import './App.css';

import {
  Link,
  NavLink,
  Route,
  Routes
} from 'react-router-dom';

import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import Checkout from './pages/Checkout';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import Account from './pages/Account';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminManagement from './pages/AdminManagement';

function App() {
  const { cartCount } = useCart();
  const { isLoggedIn } = useAuth();

  return (
    <div className="app">
      <nav className="navbar">
        <Link className="logo" to="/">
          Beauty<span>Kart</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/products">
            Products
          </NavLink>

          <NavLink to="/#categories">
            Categories
          </NavLink>

          <NavLink to="/about">
            About Us
          </NavLink>

          <NavLink to="/cart" className="login-link">
            Cart 🛒 ({cartCount})
          </NavLink>
        </div>

        {/* Account/Profile is always visible */}
        <NavLink
          to={isLoggedIn ? '/profile' : '/account'}
          className={({ isActive }) =>
            `nav-account-link ${isActive ? 'active' : ''}`
          }
        >
          {isLoggedIn ? (
            <>
              <span className="nav-profile-icon">👤</span>
              Profile
            </>
          ) : (
            'Account'
          )}
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<Account />} />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin-management"
          element={<AdminManagement />}
        />

        <Route
          path="*"
          element={
            <main className="section">
              <h2>Page not found</h2>
              <Link to="/">Return home</Link>
            </main>
          }
        />
      </Routes>

      <footer className="footer">
        <Link className="logo" to="/">
          Beauty<span>Kart</span>
        </Link>

        <p>Discover beauty. Celebrate yourself.</p>
        <p>© {new Date().getFullYear()} BeautyKart</p>
      </footer>
    </div>
  );
}

export default App;
