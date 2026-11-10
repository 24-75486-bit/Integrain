let products = [
  { name: 'Regular Milagrosa', type: 'Regular', price: 42, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Well Milled Rice', type: 'Well Milled', price: 46, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Premium Rice', type: 'Premium', price: 52, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' },
  { name: 'Sinandomeng', type: 'Regular', price: 44, weight: 'per kg', photo: 'photo-1574323347407-f5e1ad6d020b' },
  { name: 'Jasmine Rice', type: 'Premium', price: 48, weight: 'per kg', photo: 'photo-1516684732162-798a0062be99' },
  { name: 'Brown Rice', type: 'Well Milled', price: 56, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Dinorado Rice', type: 'Premium', price: 50, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Long Grain Rice', type: 'Regular', price: 40, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' }
];
const productStorageKey = 'integrain-products';
const photoUrl = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=720&q=80`;
const escapeProductMarkup = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function renderProducts(target, list = products) {
  const element = document.getElementById(target);
  if (!element) return;
  element.innerHTML = list.map(product => {
    const image = product.image || (product.photo ? photoUrl(product.photo) : '');
    const background = image ? `style="background-image:url('${escapeProductMarkup(image)}')"` : '';
    const unit = product.weight || 'per kg';
    return `<article class="product-card"><div class="product-photo" ${background}><span class="product-tag">${escapeProductMarkup(product.type)}</span></div><div class="product-info"><h3>${escapeProductMarkup(product.name)}</h3><div class="product-meta"><strong>₱${Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}<span style="font-size:10px;font-weight:500"> / ${escapeProductMarkup(unit.replace(/^per\s+/i, ''))}</span></strong><span>★★★★★</span></div><button data-add="${escapeProductMarkup(product.name)}">Add to basket&nbsp; +</button></div></article>`;
  }).join('');
}

function renderProductLists() {
  renderProducts('home-products', products.slice(0, 4));
  renderProducts('all-products');
}

let hasSavedProducts = false;
try {
  const storedProducts = localStorage.getItem(productStorageKey);
  if (storedProducts) {
    const parsedProducts = JSON.parse(storedProducts);
    if (Array.isArray(parsedProducts)) {
      products = parsedProducts;
      hasSavedProducts = true;
    }
  }
} catch { /* Keep the sample catalog if browser storage is unavailable. */ }
renderProductLists();

window.addEventListener('integrain-products-updated', event => {
  products = event.detail;
  renderProductLists();
});

if (!hasSavedProducts) {
  fetch('/api/products')
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load products')))
    .then(items => {
      try { if (localStorage.getItem(productStorageKey)) return; } catch { /* Use the fetched demo products. */ }
      products = items;
      renderProductLists();
    })
    .catch(() => {}); // Keep the built-in sample products available when opened without the server.
}
