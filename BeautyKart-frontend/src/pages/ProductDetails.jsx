import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../CartContext';
import { apiFetch } from '../api';
import { formatPrice, handleImageError, mapProduct } from '../productDisplay';


function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      setLoading(true);
      setError('');
      setProduct(null);
      setQuantity(1);

      try {
        const item = await apiFetch(
          `/api/products/${encodeURIComponent(id)}`,
          { signal: controller.signal }
        );

        setProduct(mapProduct(item));
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Product details error:', err);
          setError(
            err.status === 404
              ? 'Product not found.'
              : err.message || 'Something went wrong.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => controller.abort();
  }, [id]);

  function handleAddToCart() {
    if (!product) return;

    // Add the selected quantity to the shared cart
    addToCart({ ...product, quantity });
  }

  if (loading) {
    return (
      <main className="product-details-page">
        <p>Loading product details...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <h2>Product unavailable</h2>
        <p>{error || 'This product could not be found.'}</p>
        <Link to="/products">Back to Products</Link>
      </main>
    );
  }

  return (
    <main className="product-details-page">
      <div className="product-details-layout">
        <div className="product-details-image">
          <img src={product.image} alt={product.name} onError={handleImageError} />
        </div>

        <div className="product-details-info">
          <p className="product-category">{product.category}</p>

          <h1>{product.name}</h1>

          <p className="product-price">{formatPrice(product.price)}</p>

          <p className="product-details-description">
            {product.description}
          </p>

          <div className="product-quantity">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <p>
            Total: {formatPrice(product.price * quantity)}
          </p>

          <button
            type="button"
            className="add-to-cart"
            onClick={handleAddToCart}
          >
            Add {quantity} to Cart
          </button>

          <p>
            <Link to="/products">Continue Shopping</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default ProductDetails;
