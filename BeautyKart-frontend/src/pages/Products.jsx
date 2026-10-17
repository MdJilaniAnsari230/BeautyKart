import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../CartContext';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../api';
import { CATEGORIES as categories, formatPrice, handleImageError, mapProduct } from '../productDisplay';


function Products() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [category, setCategory] = useState(
    categories.includes(initialCategory) ? initialCategory : 'All'
  );
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError('');

        const data = await apiFetch('/api/products', {
          signal: controller.signal,
        });

        if (!Array.isArray(data)) {
          throw new Error('Unexpected response from products API');
        }

        const mappedProducts = data.map((item) => mapProduct(item));

        setProducts(mappedProducts);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Unable to fetch products:', err);
          setError(
            err.message || 'Products could not be loaded. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesCategory =
        category === 'All' || product.category === category;

      const searchText = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText) ||
        product.description.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });

    if (sort === 'low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, category, search, sort]);

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <p className="eyebrow">THE BEAUTYKART EDIT</p>
        <h1>Find your next favourite.</h1>
        <p>Everyday essentials for your own kind of beauty.</p>
      </header>

      <section className="catalog-content">
        <div className="catalog-toolbar">
          <label className="search-field">
            <span>Search</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try skincare or serum..."
            />
          </label>

          <label className="sort-field">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="catalog-categories" aria-label="Product categories">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item ? 'filter-chip active' : 'filter-chip'
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="catalog-summary">
          <h2>{category === 'All' ? 'All products' : category}</h2>
          <span>
            {loading ? 'Loading...' : `${visibleProducts.length} items`}
          </span>
        </div>

        {loading ? (
          <p>Loading products from BeautyKart server...</p>
        ) : error ? (
          <div className="empty-products">
            <h3>Unable to load products</h3>
            <p>{error}</p>
            <button
              className="add-to-cart"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="featured-grid">
            {visibleProducts.map((product) => (
              <article className="featured-card" key={product.id}>
                <Link
                  to={`/products/${product.id}`}
                  className="featured-image-link"
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
                    <Link
                      to={`/products/${product.id}`}
                      className="product-name-link"
                    >
                      {product.name}
                    </Link>
                  </h3>

                  <div className="product-bottom">
                    <span className="product-price">
                      {formatPrice(product.price)}
                    </span>

                    <button
                      className="add-to-cart"
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-products">
            <h3>
              {products.length === 0
                ? 'No products available yet'
                : 'No products found'}
            </h3>

            <p>
              {products.length === 0
                ? 'Products will appear here after they are added to the database.'
                : 'Try another search or select a different category.'}
            </p>

            <button
              className="add-to-cart"
              onClick={() => {
                setSearch('');
                setCategory('All');
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <p className="cart-feedback" aria-live="polite">
          {cartCount > 0
            ? `${cartCount} item${cartCount === 1 ? '' : 's'} in your cart`
            : ''}
        </p>
      </section>
    </main>
  );
}

export default Products;
