// marketplace.js
document.addEventListener('DOMContentLoaded', async () => {
  const productsGrid = document.getElementById('productsGrid');

  try {
    const res = await fetch('/api/listings?all=true');
    if (!res.ok) throw new Error('Failed to fetch listings');
    const listings = await res.json();

    productsGrid.innerHTML = '';

    const publishedListings = listings.filter(l => l.status === 'published');

    if (publishedListings.length === 0) {
      productsGrid.innerHTML = '<div class="product-artisan">No products available yet.</div>';
      return;
    }

    publishedListings.forEach(listing => {
      // Use enhanced if available, else original
      const imageUrl = listing.photo.enhanced ? listing.photo.enhanced : listing.photo.original;

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${imageUrl}" alt="${listing.product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="product-category">${listing.product.category}</div>
          <h3 class="product-name">${listing.product.name}</h3>
          <div class="product-artisan">By ${listing.artisan.name} • ${listing.artisan.location}</div>
          <div class="product-price">₹${listing.pricing.finalPrice}</div>
          <a href="product.html?id=${listing.id}" class="btn-primary btn-view-product">View Product</a>
        </div>
      `;
      productsGrid.appendChild(card);
    });

  } catch (err) {
    productsGrid.innerHTML = `<div class="error-box">Error loading products: ${err.message}</div>`;
  }
});
