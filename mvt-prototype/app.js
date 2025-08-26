// Basic localStorage based prototype
const authDiv = document.getElementById('auth');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const dashboard = document.getElementById('dashboard');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout');

const mvtCard = document.getElementById('mvt-card');
const mvtInput = document.getElementById('mvt-input');
const mvtSave = document.getElementById('mvt-save');

const highlightInput = document.getElementById('highlight-input');
const highlightSave = document.getElementById('highlight-save');

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const leaderboard = document.getElementById('leaderboard');

function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

function currentMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

function firstWorkdayOfMonth() {
  const d = new Date();
  d.setDate(1);
  while (d.getDay() === 0 || d.getDay() === 6) { // Sunday=0, Saturday=6
    d.setDate(d.getDate()+1);
  }
  return d;
}

function sendEmailSimulation(email, message) {
  console.log(`Email to ${email}: ${message}`);
}

function renderMVT(mvt) {
  mvtCard.innerHTML = '';
  if (!mvt) return;
  mvt.split('\n').forEach(line => {
    if (line.trim() === '') return;
    const div = document.createElement('div');
    div.className = 'mvt-item';
    div.textContent = line;
    mvtCard.appendChild(div);
  });
}

function refreshDashboard() {
  const users = getUsers();
  const user = users[localStorage.getItem('loggedUser')];
  renderMVT(user.mvt);
  // prepare leaderboard
  const highlights = [];
  Object.values(users).forEach(u => {
    (u.highlights||[]).forEach(h => highlights.push({email:u.email, text:h.text, month:h.month, likes:h.likes||[], id:h.id}));
  });
  highlights.sort((a,b)=> (b.likes.length) - (a.likes.length));
  leaderboard.innerHTML = '';
  highlights.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${h.email}: ${h.text}</span> <span class="like" data-id="${h.id}">❤ ${h.likes.length}</span>`;
    leaderboard.appendChild(li);
  });
}

function checkMonthlyUpdate() {
  const users = getUsers();
  const email = localStorage.getItem('loggedUser');
  const user = users[email];
  const month = currentMonth();
  const hasHighlight = (user.highlights||[]).some(h => h.month === month);
  const now = new Date();
  if (!hasHighlight && now >= firstWorkdayOfMonth()) {
    alert('Please update your MVT and AI highlight for this month. A reminder email was sent.');
    sendEmailSimulation(email, 'Time to update your MVT and AI highlight!');
  }
}

showRegister.addEventListener('click', () => {
  loginSection.style.display = 'none';
  registerSection.style.display = 'block';
});

showLogin.addEventListener('click', () => {
  loginSection.style.display = 'block';
  registerSection.style.display = 'none';
});

registerForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const mvt = document.getElementById('reg-mvt').value;
  const highlight = document.getElementById('reg-highlight').value;
  const users = getUsers();
  if (users[email]) { alert('User exists'); return; }
  users[email] = {email, password, mvt, highlights: [{month: currentMonth(), text: highlight, likes: [], id: Date.now()}]};
  saveUsers(users);
  loginSection.style.display = 'block';
  registerSection.style.display = 'none';
  alert('Registered. Please login.');
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const users = getUsers();
  if (!users[email] || users[email].password !== password) {
    alert('Invalid credentials');
    return;
  }
  localStorage.setItem('loggedUser', email);
  authDiv.style.display = 'none';
  dashboard.style.display = 'block';
  checkMonthlyUpdate();
  refreshDashboard();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('loggedUser');
  dashboard.style.display = 'none';
  authDiv.style.display = 'block';
});

mvtSave.addEventListener('click', () => {
  const users = getUsers();
  const email = localStorage.getItem('loggedUser');
  users[email].mvt = mvtInput.value;
  saveUsers(users);
  renderMVT(mvtInput.value);
  mvtInput.value = '';
});

highlightSave.addEventListener('click', () => {
  const users = getUsers();
  const email = localStorage.getItem('loggedUser');
  if(!users[email].highlights) users[email].highlights = [];
  users[email].highlights.push({month: currentMonth(), text: highlightInput.value, likes: [], id: Date.now()});
  saveUsers(users);
  highlightInput.value = '';
  refreshDashboard();
});

leaderboard.addEventListener('click', e => {
  if (e.target.classList.contains('like')) {
    const id = e.target.getAttribute('data-id');
    const users = getUsers();
    const email = localStorage.getItem('loggedUser');
    Object.values(users).forEach(u => {
      (u.highlights||[]).forEach(h => {
        if (String(h.id) === id && !h.likes.includes(email)) {
          h.likes.push(email);
        }
      });
    });
    saveUsers(users);
    refreshDashboard();
  }
});

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const users = getUsers();
  searchResults.innerHTML = '';
  Object.values(users).forEach(u => {
    if (u.email.toLowerCase().includes(query) ||
        (u.mvt && u.mvt.toLowerCase().includes(query)) ||
        (u.highlights||[]).some(h => h.text.toLowerCase().includes(query))) {
      const li = document.createElement('li');
      li.textContent = `${u.email} - ${u.mvt}`;
      searchResults.appendChild(li);
    }
  });
});

// auto login if session exists
if (localStorage.getItem('loggedUser')) {
  authDiv.style.display = 'none';
  dashboard.style.display = 'block';
  checkMonthlyUpdate();
  refreshDashboard();
}
