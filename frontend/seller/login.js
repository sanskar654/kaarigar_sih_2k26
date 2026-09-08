document.addEventListener('DOMContentLoaded', () => {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const registerFields = document.getElementById('registerFields');
  const submitBtn = document.getElementById('submitBtn');
  const formTitle = document.getElementById('formTitle');
  const authForm = document.getElementById('authForm');
  const errorMessage = document.getElementById('errorMessage');

  let mode = 'login'; // 'login' or 'register'

  function setMode(newMode) {
    mode = newMode;
    errorMessage.style.display = 'none';
    if (mode === 'login') {
      tabLogin.style.background = 'var(--orange-accent)';
      tabLogin.style.color = '#fff';
      tabRegister.style.background = 'transparent';
      tabRegister.style.color = 'var(--dark)';
      registerFields.style.display = 'none';
      submitBtn.innerHTML = 'Login &nbsp;&rarr;';
      formTitle.innerText = 'Seller Login';
      document.getElementById('name').removeAttribute('required');
    } else {
      tabRegister.style.background = 'var(--orange-accent)';
      tabRegister.style.color = '#fff';
      tabLogin.style.background = 'transparent';
      tabLogin.style.color = 'var(--dark)';
      registerFields.style.display = 'block';
      submitBtn.innerHTML = 'Register &nbsp;&rarr;';
      formTitle.innerText = 'Seller Registration';
      document.getElementById('name').setAttribute('required', 'true');
    }
  }

  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerText = 'Please wait...';

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    try {
      if (mode === 'login') {
        const res = await fetch('/api/artisans/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        });
        const data = await res.json().catch(() => ({ detail: `Server error (${res.status})` }));
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        
        localStorage.setItem('artisanId', data.artisan.id);
        localStorage.setItem('artisanLanguage', data.artisan.language || 'hi');
        window.location.href = 'seller.html';
      } else {
        const name = document.getElementById('name').value.trim();
        const language = document.getElementById('language').value;
        const res = await fetch('/api/artisans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, password })
        });
        const data = await res.json().catch(() => ({ detail: `Server error (${res.status})` }));
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        
        localStorage.setItem('artisanId', data.id);
        localStorage.setItem('artisanLanguage', language);
        window.location.href = 'seller.html';
      }
    } catch (err) {
      errorMessage.innerText = err.message;
      errorMessage.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = mode === 'login' ? 'Login &nbsp;&rarr;' : 'Register &nbsp;&rarr;';
    }
  });
});
