// --- SIGNUP FUNCTION ---
async function doSignup() {
  const first = document.getElementById('suFirst').value.trim();
  const last = document.getElementById('suLast').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const blood = document.getElementById('suBlood').value;
  const pass = document.getElementById('suPass').value;

  if (!first || !email || !pass) { showErr('signupErr', '⚠ Please fill fields.'); return; }

  try {
    const res = await fetch(`${API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: first, last_name: last, email, blood_group: blood, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { showErr('signupErr', '✕ ' + data.error); return; }

    // SUCCESS: Clear Form
    document.getElementById('suFirst').value = '';
    document.getElementById('suLast').value = '';
    document.getElementById('suEmail').value = '';
    document.getElementById('suPass').value = '';
    document.getElementById('suBlood').selectedIndex = 0;

    const s = document.getElementById('signupSuccess');
    s.textContent = '✅ Account created! Redirecting to login...';
    s.style.display = 'block';
    setTimeout(() => { s.style.display = 'none'; switchAuthTab('login'); }, 2000);
  } catch (err) { showErr('signupErr', '🔴 Server offline.'); }
}

// --- LOGIN FUNCTION ---
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  
  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { showErr('loginErr', '✕ ' + data.error); return; }

    // SUCCESS: Clear Form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPass').value = '';

    saveSession({ token: data.token, user: data.user });
    closeModal('userModal');
    showUserBadge(data.user.name);
  } catch (err) { showErr('loginErr', '🔴 Server unreachable.'); }
}

// --- DONATE FUNCTION ---
async function submitForm() {
  const session = getSession();
  if (!session) { alert('Please login first.'); openModal('user'); return; }

  const payload = {
    age: document.getElementById('age').value,
    phone: document.getElementById('phone').value,
    organisation: document.getElementById('org').value,
    venue: document.getElementById('venue').value,
    camp_day: document.getElementById('day') ? document.getElementById('day').value : 'Day 1'
  };

  try {
    const res = await fetch(`${API}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) { alert('⚠ ' + data.error); return; }

    // SUCCESS: Clear Donation Form
    document.getElementById('successMsg').style.display = 'block';
    setTimeout(() => {
      ['fname', 'lname', 'age', 'blood', 'phone', 'email', 'org', 'venue', 'day'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; if(el.tagName === 'SELECT') el.selectedIndex = 0; }
      });
      document.getElementById('successMsg').style.display = 'none';
    }, 3000);
  } catch (err) { alert('🔴 Server unreachable.'); }
}