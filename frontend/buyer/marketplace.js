// marketplace.js
document.addEventListener('DOMContentLoaded', async () => {
  const productsGrid = document.getElementById('productsGrid');
  if (!productsGrid) return;

  try {
    const res = await fetch('/api/listings?all=true');
    if (!res.ok) throw new Error('Failed to fetch listings');
    const data = await res.json();
    const rawListings = Array.isArray(data) ? data : (data.listings || []);

    productsGrid.innerHTML = '';

    const publishedListings = rawListings.filter(l => l.status === 'published' || !l.status || l.status === 'active');

    if (publishedListings.length === 0) {
      productsGrid.innerHTML = '<div class="product-artisan" style="padding:20px;text-align:center;">No products available yet.</div>';
      return;
    }

    publishedListings.forEach(listing => {
      const imageUrl = listing.image_url || (listing.photo && (listing.photo.enhanced || listing.photo.original)) || 'https://picsum.photos/seed/kaarigar-diya/800/800';
      const prodName = listing.title || (listing.product && listing.product.name) || 'Handmade Craft';
      const category = listing.category || (listing.product && listing.product.category) || 'Handicraft';
      const artisanName = listing.artisan_name || (listing.artisan && listing.artisan.name) || 'Verified Artisan';
      const location = listing.artisan_village || (listing.artisan && (listing.artisan.location || listing.artisan.village)) || 'India';
      const price = listing.price || (listing.pricing && listing.pricing.finalPrice) || 0;

      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${imageUrl}" alt="${prodName}" loading="lazy" onerror="this.onerror=null; this.src='https://picsum.photos/seed/kaarigar-diya/800/800';">
        </div>
        <div class="product-info">
          <div class="product-category">${category}</div>
          <h3 class="product-name">${prodName}</h3>
          <div class="product-artisan">By ${artisanName} • ${location}</div>
          <div class="product-price">₹${price}</div>
          <a href="product.html?id=${listing.id}" class="btn-primary btn-view-product">View Product</a>
        </div>
      `;
      productsGrid.appendChild(card);
    });

  } catch (err) {
    productsGrid.innerHTML = `<div class="error-box" style="padding:20px;color:#C62828;">Error loading products: ${err.message}</div>`;
  }
});
