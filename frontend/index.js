document.addEventListener('DOMContentLoaded', () => {
  const startForm = document.getElementById('startForm');
  
  startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('artisanName').value.trim();
    const langSelect = document.getElementById('languageSelect').value;
    
    const nameError = document.getElementById('nameError');
    const langError = document.getElementById('langError');
    
    let isValid = true;
    
    if (!nameInput) {
      nameError.style.display = 'block';
      isValid = false;
    } else {
      nameError.style.display = 'none';
    }
    
    if (!langSelect) {
      langError.style.display = 'block';
      isValid = false;
    } else {
      langError.style.display = 'none';
    }
    
    if (isValid) {
      // Use existing ARTISAN_001 session as base, passing name via URL parameter
      // so seller.js can integrate it minimally.
      const artisanId = 'ARTISAN_001';
      window.location.href = `seller.html?artisanId=${artisanId}&lang=${langSelect}&name=${encodeURIComponent(nameInput)}`;
    }
  });
});
