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
    picturesHtml = `<div class="pictures-grid">${agent.pictures.map((p) => {
      const url = typeof p === 'object' ? p.url : p;
      const likes = typeof p === 'object' ? p.likes : 0;
      const idx = typeof p === 'object' ? p.index : 0;
      const commentCount = typeof p === 'object' && p.comments ? p.comments.length : 0;
      return `<div class="picture-card" data-pic-idx="${idx}">
        <img src="${esc(url)}" alt="picture">
        <div class="picture-meta">${likes} like${likes !== 1 ? 's' : ''} &middot; ${commentCount} comment${commentCount !== 1 ? 's' : ''}</div>
      </div>`;
    }).join('')}</div>
    <div class="picture-expanded hidden" id="pic-expanded"></div>`;
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

  body.querySelectorAll('.picture-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = Number(card.dataset.picIdx);
      const p = agent.pictures[idx];
      if (!p) return;
      const url = typeof p === 'object' ? p.url : p;
      const likes = typeof p === 'object' ? p.likes : 0;
      const description = typeof p === 'object' && p.description ? p.description : '';
      const comments = typeof p === 'object' && p.comments ? p.comments : [];
      const commentsHtml = comments.length > 0
        ? comments.map((c) =>
            `<div class="comment"><span class="comment-author">${esc(c.fromName)}</span> ${esc(c.text)}</div>`
          ).join('')
        : '<p class="empty">No comments yet</p>';
      const descHtml = description
        ? `<div class="expanded-description">${esc(description)}</div>`
        : '';
      const expanded = body.querySelector('#pic-expanded');
      if (!expanded) return;
      expanded.innerHTML = `
        <button class="pic-back-btn">&larr; Back</button>
        <img class="expanded-img" src="${esc(url)}" alt="picture">
        ${descHtml}
        <div class="expanded-likes">${likes} like${likes !== 1 ? 's' : ''}</div>
        <div class="expanded-comments">
          <h4>Comments</h4>
          ${commentsHtml}
        </div>
      `;
      body.querySelector('.pictures-grid').classList.add('hidden');
      expanded.classList.remove('hidden');
      expanded.querySelector('.pic-back-btn').addEventListener('click', () => {
        expanded.classList.add('hidden');
        body.querySelector('.pictures-grid').classList.remove('hidden');
      });
    });
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

// Copy buttons
document.querySelectorAll('.btn-copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.copy;
    const el = document.getElementById(targetId);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});

// Escape HTML
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initial load
loadAgents();
