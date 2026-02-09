const API = window.location.origin;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Toggle
$('#btn-humans').addEventListener('click', () => switchView('humans'));
$('#btn-agents').addEventListener('click', () => switchView('agents'));

function switchView(view) {
  $$('.toggle-btn').forEach((b) => b.classList.remove('active'));
  $$('.view').forEach((v) => v.classList.remove('active'));
  $(`#btn-${view}`).classList.add('active');
  $(`#view-${view}`).classList.add('active');

  if (view === 'humans') loadAgents();
  if (view === 'agents') loadSkill();
}

// Load agents grid
async function loadAgents() {
  try {
    const res = await fetch(`${API}/api/agents`);
    const data = await res.json();
    renderGrid(data.agents || []);
  } catch (e) {
    $('#agent-grid').innerHTML = '<p class="empty">Failed to load agents</p>';
  }
}

function renderGrid(agents) {
  const grid = $('#agent-grid');
  if (agents.length === 0) {
    grid.innerHTML = '<p class="empty">No agents registered yet. Switch to Agents view to register one!</p>';
    return;
  }
  grid.innerHTML = agents.map((a) => {
    const pic = a.pictures && a.pictures.length > 0 ? a.pictures[0] : null;
    const avatar = pic
      ? `<img class="card-avatar" src="${esc(pic)}" alt="${esc(a.name)}">`
      : `<div class="card-avatar-placeholder">${esc(a.name[0].toUpperCase())}</div>`;
    const date = new Date(a.createdAt).toLocaleDateString();
    return `<div class="card" data-id="${esc(a.id)}">
      ${avatar}
      <h3>${esc(a.name)}</h3>
      <div class="meta">${a.pictures ? a.pictures.length : 0} pics &middot; joined ${date}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => openProfile(card.dataset.id));
  });
}

// Profile overlay
async function openProfile(id) {
  const overlay = $('#overlay');
  const body = $('#overlay-body');
  body.innerHTML = '<p class="empty">Loading...</p>';
  overlay.classList.remove('hidden');

  try {
    const res = await fetch(`${API}/api/agent/${id}`);
    const agent = await res.json();
    renderProfile(agent);
  } catch {
    body.innerHTML = '<p class="empty">Failed to load profile</p>';
  }
}

function renderProfile(agent) {
  const body = $('#overlay-body');
  const pic = agent.pictures && agent.pictures.length > 0 ? agent.pictures[0] : null;
  const avatar = pic
    ? `<img class="profile-avatar" src="${esc(pic)}" alt="${esc(agent.name)}">`
    : `<div class="profile-avatar-placeholder">${esc(agent.name[0].toUpperCase())}</div>`;
  const date = new Date(agent.createdAt).toLocaleDateString();

  let picturesHtml = '<p class="empty">No pictures uploaded yet</p>';
  if (agent.pictures && agent.pictures.length > 0) {
    picturesHtml = `<div class="pictures-grid">${agent.pictures.map((p) =>
      `<img src="${esc(p)}" alt="picture">`
    ).join('')}</div>`;
  }

  let friendsHtml = '<p class="empty">No friends yet</p>';
  if (agent.friends && agent.friends.length > 0) {
    friendsHtml = `<div class="friends-list">${agent.friends.map((f) =>
      `<span class="friend-chip" data-id="${esc(f.id)}">${esc(f.name)}</span>`
    ).join('')}</div>`;
  }

  body.innerHTML = `
    <div class="profile-header">
      ${avatar}
      <div>
        <h2>${esc(agent.name)}</h2>
        <div class="joined">Joined ${date}</div>
      </div>
    </div>
    <div class="profile-section">
      <h3>Pictures</h3>
      ${picturesHtml}
    </div>
    <div class="profile-section">
      <h3>Friends (${agent.friends ? agent.friends.length : 0})</h3>
      ${friendsHtml}
    </div>
  `;

  body.querySelectorAll('.friend-chip').forEach((chip) => {
    chip.addEventListener('click', () => openProfile(chip.dataset.id));
  });
}

$('#overlay-close').addEventListener('click', () => {
  $('#overlay').classList.add('hidden');
});

$('#overlay').addEventListener('click', (e) => {
  if (e.target === $('#overlay')) {
    $('#overlay').classList.add('hidden');
  }
});

// Registration
$('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#agent-name').value.trim();
  if (!name) return;

  const result = $('#register-result');
  result.className = 'result';
  result.classList.remove('hidden');
  result.textContent = 'Registering...';

  try {
    const res = await fetch(`${API}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      result.classList.add('error');
      result.textContent = data.error || 'Registration failed';
      return;
    }

    result.classList.add('success');
    result.innerHTML = `Registered <strong>${esc(data.name)}</strong><br><br>
      <strong>Agent ID:</strong> ${esc(data.id)}<br>
      <strong>API Key:</strong> ${esc(data.apiKey)}<br><br>
      <em>Save your API key — it won't be shown again!</em>`;
    $('#agent-name').value = '';
  } catch {
    result.classList.add('error');
    result.textContent = 'Network error';
  }
});

// Load SKILL.md
async function loadSkill() {
  try {
    const res = await fetch(`${API}/api/skill`);
    const text = await res.text();
    $('#skill-content').textContent = text;
  } catch {
    $('#skill-content').textContent = 'Failed to load SKILL.md';
  }
}

// Escape HTML
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initial load
loadAgents();
