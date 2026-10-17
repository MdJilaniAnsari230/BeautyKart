// Maps a backend Product (pid, pname, pprice, pdescription, category, imageUrl)
// to the shape the UI uses. Category/image come from the backend when set.
export const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Haircare', 'Fragrance'];
// Local images (frontend/public/images/products) - no dependency on external sites.
export const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';
const CATEGORY_IMAGES = {
  Skincare: '/images/products/skincare.svg',
  Makeup: '/images/products/makeup.svg',
  Haircare: '/images/products/haircare.svg',
  Fragrance: '/images/products/fragrance.svg',
};
// Only used when the database has no category for a product.
function guessCategory(name = '') {
  const n = name.toLowerCase();
  if (/(lipstick|lip|kajal|eyeliner|mascara|foundation|blush|compact|makeup|nail)/.test(n)) return 'Makeup';
  if (/(shampoo|conditioner|hair)/.test(n)) return 'Haircare';
  if (/(perfume|fragrance|deo|cologne|attar|mist)/.test(n)) return 'Fragrance';
  return 'Skincare';
}
// If an image URL is broken, swap in the local placeholder once (no infinite loop).
export function handleImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.src = PLACEHOLDER_IMAGE;
}
export function mapProduct(item) {
  const category = item.category || guessCategory(item.pname);
  const image = item.imageUrl || CATEGORY_IMAGES[category] || PLACEHOLDER_IMAGE;
  return {
    id: item.pid,
    name: item.pname || 'Unnamed product',
    price: Number(item.pprice) || 0,
    description: item.pdescription || '',
    category,
    image,
  };
}
export function formatPrice(value) {
  return `\u20B9${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}