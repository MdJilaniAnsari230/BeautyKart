
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPrice } from '../productDisplay';

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  return (
    <main className="section cart-page">
      <p className="eyebrow">YOUR BAG</p>
      <h1>Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Discover your favourite beauty essentials.</p>
          <Link to="/products" className="login-submit">
            Explore Products →
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <img
                  className="cart-item-image"
                  src={item.image}
                  alt={item.name}
                />

                <div className="cart-item-info">
                  <p className="product-category">{item.category}</p>
                  <h3>{item.name}</h3>
                  <p>Price: {formatPrice(item.price)}</p>

                  <div className="cart-quantity">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>

                <strong>
                  {formatPrice(item.price * item.quantity)}
                </strong>
              </article>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-total-row">
              <span>Subtotal</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </div>

            <p>Shipping and taxes are calculated at checkout.</p>

            <Link to="/checkout" className="login-submit">
            Proceed to Checkout →
            </Link>

            <Link to="/products" className="cart-continue">
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

export default Cart;
