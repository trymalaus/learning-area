const appEl = document.getElementById('app');

let store = JSON.parse(localStorage.getItem('mvtApp') || '{"users": []}');
let currentEmail = localStorage.getItem('currentUser');
let currentUser = store.users.find(u => u.email === currentEmail) || null;

function save() {
  localStorage.setItem('mvtApp', JSON.stringify(store));
  if (currentUser) {
    localStorage.setItem('currentUser', currentUser.email);
  } else {
    localStorage.removeItem('currentUser');
  }
}

function sendEmail(to, subject, text) {
  console.log(`EMAIL to ${to}: ${subject} - ${text}`);
}

function isFirstWorkday(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // weekend
  const d = date.getDate();
  return d <= 7; // first week day
}

function needsReminder(user) {
  const now = new Date();
  if (!user.lastUpdate) return true;
  const last = new Date(user.lastUpdate);
  return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
}

function checkReminder() {
  if (!currentUser) return;
  const now = new Date();
  if (isFirstWorkday(now) && needsReminder(currentUser)) {
    sendEmail(currentUser.email, 'Monthly reminder', 'Please update your MVT and AI highlight.');
  }
}

function render() {
  appEl.innerHTML = '';
  const nav = document.createElement('nav');
  if (currentUser) {
    nav.innerHTML = `Welcome ${currentUser.email} | <a href="#" id="logout">Logout</a>`;
  } else {
    nav.innerHTML = `<a href="#" id="showLogin">Login</a> <a href="#" id="showRegister">Register</a>`;
  }
  appEl.appendChild(nav);

  if (currentUser) {
    checkReminder();
    renderDashboard();
    renderLeaderboard();
    document.getElementById('logout').addEventListener('click', () => {
      currentUser = null;
      save();
      render();
    });
  } else {
    renderAuth();
  }
}

function renderAuth() {
  const container = document.createElement('div');
  container.innerHTML = `
    <form id="loginForm">
      <h2>Login</h2>
      <input type="email" id="loginEmail" placeholder="Email" required>
      <input type="password" id="loginPass" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <form id="registerForm">
      <h2>Register</h2>
      <input type="email" id="regEmail" placeholder="Email" required>
      <input type="password" id="regPass" placeholder="Password" required>
      <h3>Minimum Viable Toolkit</h3>
      <input id="mvtGeneral" placeholder="General-Purpose" required>
      <input id="mvtWriting" placeholder="Writing" required>
      <input id="mvtResearch" placeholder="Research" required>
      <input id="mvtCoding" placeholder="Coding" required>
      <input id="mvtTask" placeholder="Task-dependent" required>
      <h3>AI Highlight</h3>
      <textarea id="highlightText" placeholder="Highlight" required></textarea>
      <button type="submit">Register</button>
    </form>`;
  appEl.appendChild(container);

  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    const user = store.users.find(u => u.email === email && u.password === pass);
    if (user) {
      currentUser = user;
      save();
      render();
    } else {
      alert('Invalid credentials');
    }
  });

  document.getElementById('registerForm').addEventListener('submit', e => {
    e.preventDefault();
    const user = {
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPass').value,
      mvt: {
        general: document.getElementById('mvtGeneral').value,
        writing: document.getElementById('mvtWriting').value,
        research: document.getElementById('mvtResearch').value,
        coding: document.getElementById('mvtCoding').value,
        task: document.getElementById('mvtTask').value
      },
      highlight: {
        text: document.getElementById('highlightText').value,
        month: new Date().toISOString().slice(0,7),
        likes: 0,
        likedBy: []
      },
      lastUpdate: new Date().toISOString()
    };
    store.users.push(user);
    currentUser = user;
    save();
    sendEmail(user.email, 'Welcome', 'Thanks for registering your toolkit.');
    render();
  });
}

function renderDashboard() {
  const dash = document.createElement('div');
  dash.innerHTML = `
    <h1>Dashboard</h1>
    <form id="mvtForm">
      <h2>Update Toolkit & Highlight</h2>
      <input id="editGeneral" placeholder="General-Purpose" value="${currentUser.mvt.general || ''}">
      <input id="editWriting" placeholder="Writing" value="${currentUser.mvt.writing || ''}">
      <input id="editResearch" placeholder="Research" value="${currentUser.mvt.research || ''}">
      <input id="editCoding" placeholder="Coding" value="${currentUser.mvt.coding || ''}">
      <input id="editTask" placeholder="Task-dependent" value="${currentUser.mvt.task || ''}">
      <textarea id="editHighlight" placeholder="Highlight">${currentUser.highlight.text || ''}</textarea>
      <button type="submit">Save</button>
    </form>
    <div class="mvt-display" id="mvtDisplay"></div>
    <div class="search">
      <h2>Search</h2>
      <input type="text" id="searchInput" placeholder="Search...">
      <div class="search-results" id="searchResults"></div>
    </div>
  `;
  appEl.appendChild(dash);

  document.getElementById('mvtForm').addEventListener('submit', e => {
    e.preventDefault();
    currentUser.mvt.general = document.getElementById('editGeneral').value;
    currentUser.mvt.writing = document.getElementById('editWriting').value;
    currentUser.mvt.research = document.getElementById('editResearch').value;
    currentUser.mvt.coding = document.getElementById('editCoding').value;
    currentUser.mvt.task = document.getElementById('editTask').value;
    currentUser.highlight.text = document.getElementById('editHighlight').value;
    currentUser.highlight.month = new Date().toISOString().slice(0,7);
    currentUser.lastUpdate = new Date().toISOString();
    save();
    render();
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    const query = e.target.value.toLowerCase();
    const resEl = document.getElementById('searchResults');
    resEl.innerHTML = '';
    if (!query) return;
    store.users.filter(u =>
      u.email.toLowerCase().includes(query) ||
      Object.values(u.mvt).some(v => v.toLowerCase().includes(query)) ||
      u.highlight.text.toLowerCase().includes(query)
    ).forEach(u => {
      const div = document.createElement('div');
      div.className = 'user';
      div.innerHTML = `<strong>${u.email}</strong><p>${u.highlight.text}</p>`;
      resEl.appendChild(div);
    });
  });

  renderMVT();
}

function renderMVT() {
  const mvtEl = document.getElementById('mvtDisplay');
  mvtEl.innerHTML = '<h2>My Minimum Viable Toolkit</h2>' +
    `<div class="mvt">` +
    `<div class="category"><span>General-Purpose</span><span>${currentUser.mvt.general}</span></div>` +
    `<div class="category"><span>Writing</span><span>${currentUser.mvt.writing}</span></div>` +
    `<div class="category"><span>Research</span><span>${currentUser.mvt.research}</span></div>` +
    `<div class="category"><span>Coding</span><span>${currentUser.mvt.coding}</span></div>` +
    `<div class="category"><span>Task-dependent</span><span>${currentUser.mvt.task}</span></div>` +
    `</div>`;
}

function renderLeaderboard() {
  const board = document.createElement('div');
  board.innerHTML = '<h2>AI Highlight Leaderboard</h2>';
  const list = [...store.users].sort((a, b) => (b.highlight.likes || 0) - (a.highlight.likes || 0));
  list.forEach(u => {
    const div = document.createElement('div');
    div.className = 'highlight';
    div.innerHTML = `<strong>${u.email}</strong><p>${u.highlight.text}</p><p>Likes: ${u.highlight.likes || 0}</p>`;
    if (currentUser && u.email !== currentUser.email) {
      if (!u.highlight.likedBy) u.highlight.likedBy = [];
      if (!u.highlight.likedBy.includes(currentUser.email)) {
        const btn = document.createElement('button');
        btn.textContent = 'Like';
        btn.addEventListener('click', () => {
          u.highlight.likes = (u.highlight.likes || 0) + 1;
          u.highlight.likedBy.push(currentUser.email);
          save();
          render();
        });
        div.appendChild(btn);
      }
    }
    board.appendChild(div);
  });
  appEl.appendChild(board);
}

render();
