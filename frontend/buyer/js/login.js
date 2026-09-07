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
        tabLogin.classList.remove('ghost');
        tabRegister.classList.add('ghost');
        registerFields.style.display = 'none';
        submitBtn.innerText = 'Login';
        formTitle.innerText = 'Buyer Login';
        document.getElementById('name').removeAttribute('required');
      } else {
        tabRegister.classList.remove('ghost');
        tabLogin.classList.add('ghost');
        registerFields.style.display = 'flex';
        submitBtn.innerText = 'Register';
        formTitle.innerText = 'Buyer Registration';
        document.getElementById('name').setAttribute('required', 'true');
      }
    }
  
    tabLogin.addEventListener('click', (e) => { e.preventDefault(); setMode('login'); });
    tabRegister.addEventListener('click', (e) => { e.preventDefault(); setMode('register'); });
  
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorMessage.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Please wait...';
  
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;
  
      try {
        if (mode === 'login') {
          const res = await fetch('/api/buyers/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Login failed');
          
          localStorage.setItem('buyerId', data.buyer.id);
          localStorage.setItem('buyerName', data.buyer.name);
          localStorage.setItem('buyerPhone', data.buyer.phone);
          localStorage.setItem('buyerCity', data.buyer.city || '');
          window.location.href = 'index.html';
        } else {
          const name = document.getElementById('name').value.trim();
          const city = document.getElementById('city').value.trim();
          const res = await fetch('/api/buyers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, city, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Registration failed');
          
          localStorage.setItem('buyerId', data.buyer.id);
          localStorage.setItem('buyerName', data.buyer.name);
          localStorage.setItem('buyerPhone', data.buyer.phone);
          localStorage.setItem('buyerCity', data.buyer.city || '');
          window.location.href = 'index.html';
        }
      } catch (err) {
        errorMessage.innerText = err.message;
        errorMessage.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = mode === 'login' ? 'Login' : 'Register';
      }
    });
  });
