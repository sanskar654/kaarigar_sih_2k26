// product.js
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('productDetailContainer');
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) {
    container.innerHTML = '<div class="error-box">Product not found.</div>';
    return;
  }

  try {
    const res = await fetch(`/api/listing/${id}`);
    if (!res.ok) throw new Error('Failed to load product');
    const listing = await res.json();

    const imageUrl = listing.photo.enhanced ? listing.photo.enhanced : listing.photo.original;
    const description = listing.description.generatedEnglish || listing.description.original;

    container.innerHTML = `
      <div style="display:flex; gap:30px; flex-wrap:wrap; margin-top:20px;">
        <div style="flex:1; min-width:300px;">
          <img src="${imageUrl}" alt="${listing.product.name}" style="width:100%; border:1px solid var(--border-color); border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
        </div>
        <div style="flex:1; min-width:300px; display:flex; flex-direction:column; gap:15px;">
          <h2 style="font-size:2.2rem; color:var(--header-bg); margin:0;">${listing.product.name}</h2>
          <div style="font-size:1.8rem; color:var(--orange-accent); font-weight:bold;">₹${listing.pricing.finalPrice}</div>
          
          <div style="padding:15px; background:var(--white); border:1px solid var(--border-color); border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
            <div style="font-weight:700; margin-bottom:10px; color:var(--section-header-bg); border-bottom:1px solid var(--border-color); padding-bottom:5px;">Artisan Information</div>
            <div style="margin-bottom:6px;"><strong>Name:</strong> ${listing.artisan.name} ${listing.artisan.verified ? '<span style="color:var(--success-green); margin-left:4px;">✓ Verified</span>' : ''}</div>
            <div style="margin-bottom:6px;"><strong>Craft:</strong> ${listing.product.category} <span style="color:var(--text-muted); font-size:0.9em;">(${listing.product.subcategory})</span></div>
            <div><strong>Location:</strong> ${listing.artisan.location}</div>
          </div>

          <p style="color:var(--text-primary); line-height:1.7; font-size:1.05rem; margin:10px 0;">
            ${description}
          </p>

          <div style="color:var(--text-muted); font-size:0.9rem;">Available Quantity: ${listing.product.quantity}</div>

          <div style="margin-top:auto; padding-top:20px;">
            <button class="btn-primary" id="buyBtn" style="width:100%; font-size:1.2rem; padding:15px; border-radius:4px;">Buy / Enquire</button>
            <div id="buyMessage" style="display:none; margin-top:12px; color:var(--success-green); font-weight:bold; text-align:center; padding:10px; background:#e8f5e9; border-radius:4px;">
              Thank you for supporting local artisans!
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('buyBtn').addEventListener('click', () => {
      document.getElementById('buyMessage').style.display = 'block';
    });

  } catch (err) {
    container.innerHTML = `<div class="error-box">Error loading product: ${err.message}</div>`;
  }
});
