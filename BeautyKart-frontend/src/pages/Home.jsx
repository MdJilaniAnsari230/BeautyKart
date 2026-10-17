
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { useCart } from '../CartContext';
import { formatPrice, handleImageError, mapProduct } from '../productDisplay';
import heroImage from '../assets/hero.png';

const categories = [
  { number: '01', name: 'Skincare', description: 'Care for your everyday glow' },
  { number: '02', name: 'Makeup', description: 'Make every look your own' },
  { number: '03', name: 'Haircare', description: 'A little love for your hair' },
  { number: '04', name: 'Fragrance', description: 'Find your signature scent' },
];

function Home() {
  const { addToCart, cartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [productsState, setProductsState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    const controller = new AbortController();

    apiFetch('/api/products', { signal: controller.signal })
      .then((data) => {
        setProducts(Array.isArray(data) ? data.slice(0, 3).map((item) => mapProduct(item)) : []);
        setProductsState('ready');
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setProductsState('error');
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="home-page">
      <section
        className="home-hero"
        style={{ '--hero-image': `url("${heroImage}")` }}
      >
        <div className="hero-copy">
          <p className="eyebrow">A LITTLE SOMETHING FOR YOU</p>
          <h1>
            Good skin days.
            <br />
            <span>Good mood days.</span>
          </h1>
          <p className="hero-description">
            Your everyday beauty favourites, thoughtfully brought
            together in one place.
          </p>
          <Link className="primary-button" to="/products">
            Find your favourites <span>↗</span>
          </Link>
          <p className="hero-note">
            SKINCARE · MAKEUP · SELF-CARE
          </p>
        </div>
      </section>

      <section className="home-categories" id="categories">
        <div className="section-intro">
          <div>
            <p className="eyebrow">A GOOD PLACE TO START</p>
            <h2>What are you in the mood for?</h2>
          </div>
          <p className="section-description">
            From everyday essentials to little treats, start with what you love.
          </p>
        </div>

        <div className="home-category-grid">
          {categories.map((category) => (
            <Link
              className="home-category"
              to={`/products?category=${encodeURIComponent(category.name)}`}
              key={category.number}
            >
              <span className="category-number">{category.number}</span>
              <div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="section-intro">
          <div>
            <p className="eyebrow">THE ONES WORTH KNOWING</p>
            <h2>Currently on our shelf.</h2>
          </div>
          <Link className="text-link" to="/products">
            See all products →
          </Link>
        </div>

        {productsState === 'loading' && <p>Loading products...</p>}
        {productsState === 'error' && (
          <p>Products could not be loaded right now. Please try again shortly.</p>
        )}
        {productsState === 'ready' && products.length === 0 && (
          <p>New products are coming soon.</p>
        )}

        <div className="featured-grid">
          {products.map((product) => (
            <article className="featured-card" key={product.id}>
              <Link
                to={`/products/${product.id}`}
                className="featured-image-link"
                aria-label={`Explore ${product.name}`}
              >
                <img
                  className="featured-image"
                  src={product.image}
                  alt={product.name}
                  loading="lazy" onError={handleImageError}
                />
              </Link>

              <div className="featured-info">
                <p className="product-category">{product.category}</p>
                <h3>
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                </h3>

                <div className="product-bottom">
                  <span className="product-price">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    className="add-to-cart"
                    onClick={() => addToCart(product)}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="cart-feedback" aria-live="polite">
          {cartCount > 0
            ? `${cartCount} item${cartCount === 1 ? '' : 's'} in your cart`
            : ''}
        </p>
      </section>

      <section className="home-note" id="about">
        <p className="eyebrow">A NOTE FROM BEAUTYKART</p>
        <h2>
          Beauty isn't about doing more.
          <br />
          <span>It's about finding what feels right.</span>
        </h2>
        <p>
          We're here to make discovering your next beauty favourite
          feel simple, personal and a little more fun.
        </p>
        <Link className="text-link" to="/about">
          A little about us →
        </Link>
      </section>
    </main>
  );
}

export default Home;
