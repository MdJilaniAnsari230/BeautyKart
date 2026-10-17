
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPrice } from '../productDisplay';

function Checkout() {
  const { cartItems, cartTotal } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [message, setMessage] = useState('');

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
    setMessage('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (cartItems.length === 0) {
      setMessage('Your cart is empty. Please add a product first.');
      return;
    }

    // There is no order API yet, so nothing is saved or charged here.
    setMessage(
      'Online ordering is not available yet. Your details were not submitted, no order was placed and you have not been charged.'
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="section checkout-page">
        <p className="eyebrow">CHECKOUT</p>
        <h1>Your bag is empty</h1>
        <p>Add products before proceeding to checkout.</p>
        <Link to="/products" className="login-submit">
          Explore Products →
        </Link>
      </main>
    );
  }

  return (
    <main className="section checkout-page">
      <p className="eyebrow">ALMOST YOURS</p>
      <h1>Checkout</h1>
      <p className="checkout-description">
        Enter your details for delivery.
      </p>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Contact & Delivery Details</h2>

          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
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
            autoComplete="email"
            required
          />

          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="10-digit mobile number"
            required
          />

          <label htmlFor="address">House number and street</label>
          <textarea
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            autoComplete="street-address"
            rows={3}
            required
          />

          <div className="checkout-fields-row">
            <div>
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
                required
              />
            </div>

            <div>
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                autoComplete="address-level1"
                required
              />
            </div>
          </div>

          <label htmlFor="pincode">PIN code</label>
          <input
            id="pincode"
            name="pincode"
            type="text"
            inputMode="numeric"
            value={form.pincode}
            onChange={handleChange}
            autoComplete="postal-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit PIN code"
            required
          />

          <button type="submit" className="login-submit">
            Review Order →
          </button>

          {message && (
            <p className="form-message" role="status">
              {message}
            </p>
          )}
        </form>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          {cartItems.map((item) => (
            <div className="checkout-product" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>Qty: {item.quantity}</p>
              </div>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </div>
          ))}

          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>{formatPrice(cartTotal)}</strong>
          </div>

          <p className="checkout-note">
            Shipping charges and taxes are not included yet.
          </p>

          <button
            type="button"
            className="cart-continue"
            onClick={() => navigate('/cart')}
          >
            ← Back to Cart
          </button>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
