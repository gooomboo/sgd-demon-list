/* ============================================================
   DEMONLIST — app.js
   ============================================================ */

let siteData = { levels: [], moderators: [] };
let currentTab = 'list';
let roulette = { active: false, currentIdx: null, streak: 0, hardestIdx: null };

// ---------- Load data.json ----------
async function loadData() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    siteData = await res.json();
    if (!siteData.levels) siteData.levels = [];
    if (!siteData.moderators) siteData.moderators = [];
  } catch (err) {
    document.getElementById('contentContainer').innerHTML =
      '<p style="text-align:center;color:var(--text-muted);">Could not load data.json (' + err.message + '). ' +
      'If you just opened this file directly from your computer, you must run a local server or push to GitHub Pages to test it.</p>';
    return;
  }
  render();
}

function render() {
  if (currentTab === 'list') renderList();
  else if (currentTab === 'stats') renderStats();
  else if (currentTab === 'roulette') renderRoulette();
  else if (currentTab === 'moderators') renderModerators();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-' + tab);
  if (btn) btn.classList.add('active');
  render();
}

// ---------- Scoring & Enjoyment Logic ----------
function getPoints(rank, percent, reqPercent) {
  const base = rank === 1 ? 350 : rank === 2 ? 331.71 : Math.max(5, 300 * Math.exp(-0.03 * rank));
  if (percent >= 100) return base;
  if (percent < reqPercent) return 0;
  const partial = base * 0.1 * Math.pow((percent - reqPercent) / (100 - reqPercent), 2);
  return Math.max(partial, base * 0.1);
}

function avgEnjoyment(level) {
  const vals = (level.records || []).map(r => Number(r.enjoyment)).filter(v => !isNaN(v));
  if (!vals.length) return 'N/A';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + '/10';
}

// ---------- Tab: Demonlist ----------
function renderList() {
  const container = document.getElementById('contentContainer');
  let html = '<input type="text" id="listSearch" class="search-bar" placeholder="Search by name or creator..." oninput="filterList(this.value)">';

  siteData.levels.forEach((level, idx) => {
    const rank = idx + 1;
    html += `
      <div class="level-card list-item" data-search="${(level.name + ' ' + level.creator).toLowerCase()}" onclick="openLevel(${idx})">
        <img src="images/${level.image}" class="card-banner" alt="${level.name}" onerror="this.src='https://via.placeholder.com/600x220?text=No+Image'">
        <div class="card-info">
          <h2 class="card-title"><span class="rank">#${rank}</span> \u2013 ${level.name}</h2>
          <p class="card-author">by <b>${level.creator}</b> &middot; Avg Enjoyment: <b>${avgEnjoyment(level)}</b></p>
          <p class="card-points">${getPoints(rank, level.reqPercent, level.reqPercent).toFixed(2)} pts (${level.reqPercent}%) \u2014 ${getPoints(rank, 100, level.reqPercent).toFixed(2)} pts (100%)</p>
        </div>
      </div>`;
  });
  container.innerHTML = html || '<p style="text-align:center;color:var(--text-muted);">No levels yet.</p>';
}

function filterList(val) {
  document.querySelectorAll('.list-item').forEach(row => {
    row.style.display = row.dataset.search.includes(val.toLowerCase()) ? 'block' : 'none';
  });
}

function openLevel(idx) {
  const level = siteData.levels[idx];
  const rank = idx + 1;
  const recordsHTML = (level.records || [])
    .slice()
    .sort((a, b) => b.percent - a.percent)
    .map(r => `
      <tr>
        <td>${r.player}</td>
        <td style="text-align:right;">${r.percent}% (${r.enjoyment != null ? r.enjoyment : '?'}/10)${r.link ? ' <a href="' + r.link + '" target="_blank">\uD83D\uDD17</a>' : ''}</td>
      </tr>`).join('');

  document.getElementById('contentContainer').innerHTML = `
    <div class="detail-view">
      <div class="detail-header">
        <h1>${level.name} <span onclick="switchTab('list')">\u2716</span></h1>
        <div class="detail-subtitle">by ${level.creator}, verified by ${level.verifier}</div>
      </div>
      <img class="card-image" src="images/${level.image}" alt="${level.name}" onerror="this.src='https://via.placeholder.com/600x220?text=No+Image'">
      <div class="stats-grid">
        <div class="stat-box"><h4>Rank</h4><p>#${rank}</p></div>
        <div class="stat-box"><h4>Required %</h4><p>${level.reqPercent}%</p></div>
        <div class="stat-box"><h4>Avg Enjoyment</h4><p>${avgEnjoyment(level)}</p></div>
        <div class="stat-box"><h4>Total Records</h4><p>${(level.records || []).length}</p></div>
      </div>
      <h2>Records</h2>
      <table class="records-table">
        <thead><tr><th>Player</th><th style="text-align:right;">Progress</th></tr></thead>
        <tbody>${recordsHTML || '<tr><td colspan="2">No records yet.</td></tr>'}</tbody>
      </table>
    </div>`;
}

// ---------- Tab: Stats Viewer (Automated Logic) ----------
function renderStats() {
  const container = document.getElementById('contentContainer');
  const totals = {};

  // Auto-calculates players based purely on level records.
  // If a player has 0 records/points, they naturally do not appear here.
  siteData.levels.forEach((level, idx) => {
    const rank = idx + 1;
    if (level.verifier) {
      totals[level.verifier] = (totals[level.verifier] || 0) + getPoints(rank, 100, level.reqPercent);
    }
    (level.records || []).forEach(r => {
      totals[r.player] = (totals[r.player] || 0) + getPoints(rank, r.percent, level.reqPercent);
    });
  });

  const sorted = Object.entries(totals).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]);
  
  let html = '<div class="detail-view"><h2 style="margin-top:0;">Stats Viewer</h2><input type="text" class="search-bar" placeholder="Search player..." oninput="filterStats(this.value)">';
  sorted.forEach(([name, pts], i) => {
    html += `<div class="lb-row" data-search="${name.toLowerCase()}"><div style="width:40px;font-weight:bold;color:var(--accent);">#${i + 1}</div><div class="lb-name">${name}</div><div style="color:var(--text-muted);">${pts.toFixed(2)} pts</div></div>`;
  });
  if (!sorted.length) html += '<p style="color:var(--text-muted);">No records yet.</p>';
  container.innerHTML = html + '</div>';
}

function filterStats(val) {
  document.querySelectorAll('.lb-row').forEach(row => {
    row.style.display = row.dataset.search.includes(val.toLowerCase()) ? 'flex' : 'none';
  });
}

// ---------- Tab: Moderators ----------
function renderModerators() {
  const container = document.getElementById('contentContainer');
  let html = '<div class="detail-view"><h2 style="margin-top:0;">Moderators</h2>';
  siteData.moderators.forEach(m => {
    html += `<div class="mod-card"><span class="mod-name">${m.name}</span><span class="mod-role">${m.role}</span></div>`;
  });
  if (!siteData.moderators.length) html += '<p style="color:var(--text-muted);">No moderators listed yet.</p>';
  container.innerHTML = html + '</div>';
}

// ---------- Tab: Accurate Demon Roulette ----------
function startRoulette() {
  if (!siteData.levels.length) return;
  roulette = { active: true, currentIdx: Math.floor(Math.random() * siteData.levels.length), streak: 0, hardestIdx: null };
  renderRoulette();
}

function passRoulette() {
  roulette.streak++;
  if (roulette.hardestIdx === null || roulette.currentIdx < roulette.hardestIdx) roulette.hardestIdx = roulette.currentIdx;

  // Exact logic: The next level must be ranked higher (lower index number) than the current one.
  const harderPool = [];
  for (let i = 0; i < roulette.currentIdx; i++) harderPool.push(i);

  if (harderPool.length === 0) {
    roulette.active = false;
    roulette.cleared = true;
    renderRoulette();
    return;
  }
  
  roulette.currentIdx = harderPool[Math.floor(Math.random() * harderPool.length)];
  renderRoulette();
}

function failRoulette() {
  roulette.active = false;
  roulette.cleared = false;
  renderRoulette();
}

function renderRoulette() {
  const container = document.getElementById('contentContainer');

  if (roulette.active && roulette.currentIdx !== null) {
    const level = siteData.levels[roulette.currentIdx];
    const rank = roulette.currentIdx + 1;
    container.innerHTML = `
      <div class="detail-view roulette-box">
        <div style="color:var(--text-muted);">Current Streak: <b style="color:var(--text-main); font-size:1.2rem;">${roulette.streak}</b></div>
        <div class="roulette-level">
          <h2>#${rank} \u2013 ${level.name}</h2>
          <p style="color:var(--text-muted);">by ${level.creator}</p>
        </div>
        <button class="btn btn-primary" onclick="passRoulette()">I Passed It</button>
        <button class="btn" onclick="failRoulette()">I Failed</button>
      </div>`;
    return;
  }

  if (roulette.cleared) {
    container.innerHTML = `
      <div class="detail-view roulette-box">
        <h1 style="color:var(--accent);">🎉 Full Clear!</h1>
        <p>You beat every level down to #1. Final streak: <b>${roulette.streak}</b></p>
        <button class="btn btn-primary" onclick="startRoulette()">Play Again</button>
      </div>`;
    return;
  }

  if (roulette.streak > 0 || roulette.currentIdx !== null) {
    const hardest = roulette.hardestIdx !== null ? `#${roulette.hardestIdx + 1} \u2013 ${siteData.levels[roulette.hardestIdx].name}` : 'None';
    container.innerHTML = `
      <div class="detail-view roulette-box">
        <h1 style="color:var(--accent);">Run Over</h1>
        <p>Final streak: <b>${roulette.streak}</b> &middot; Hardest beaten: <b>${hardest}</b></p>
        <button class="btn btn-primary" onclick="startRoulette()">Play Again</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="detail-view roulette-box">
      <h1 style="color:var(--accent);">Demon Roulette</h1>
      <p style="color:var(--text-muted);">You will be given a random level. If you beat it, your next level will randomly be selected from a harder rank. One fail ends the run.</p>
      <button class="btn btn-primary" style="margin-top:20px;" onclick="startRoulette()">Start Roulette</button>
    </div>`;
}

// ---------- Dark / Light mode (Persistent) ----------
function initTheme() {
  const savedTheme = localStorage.getItem('demonlist_theme');
  if (savedTheme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    // Default to dark mode
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeButton();
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('demonlist_theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('demonlist_theme', 'dark');
  }
  updateThemeButton();
}

function updateThemeButton() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('themeToggleBtn').textContent = isDark ? '☀️' : '🌙';
}

// ---------- Background music (Persistent via IndexedDB) ----------
const MUSIC_DB_NAME = 'demonlistMusicDB';
const MUSIC_STORE = 'files';
const MUSIC_KEY = 'bgMusic';

function openMusicDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MUSIC_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(MUSIC_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveMusicFile(file) {
  const db = await openMusicDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MUSIC_STORE, 'readwrite');
    tx.objectStore(MUSIC_STORE).put(file, MUSIC_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadMusicFile() {
  const db = await openMusicDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MUSIC_STORE, 'readonly');
    const req = tx.objectStore(MUSIC_STORE).get(MUSIC_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function setupAudioFromFile(file) {
  const audioEl = document.getElementById('bg-music');
  audioEl.src = URL.createObjectURL(file);
  document.getElementById('musicPlayBtn').disabled = false;
}

function toggleMusicPlay() {
  const audioEl = document.getElementById('bg-music');
  const btn = document.getElementById('musicPlayBtn');
  if (audioEl.paused) { 
    audioEl.play(); 
    btn.textContent = '⏸️'; 
  } else { 
    audioEl.pause(); 
    btn.textContent = '▶️'; 
  }
}

function toggleMute() {
  const audioEl = document.getElementById('bg-music');
  audioEl.muted = !audioEl.muted;
  localStorage.setItem('demonlist_muted', audioEl.muted ? 'true' : 'false');
  document.getElementById('muteBtn').textContent = audioEl.muted ? '🔇' : '🔊';
}

async function initMusic() {
  const audioEl = document.getElementById('bg-music');
  audioEl.muted = localStorage.getItem('demonlist_muted') === 'true';
  document.getElementById('muteBtn').textContent = audioEl.muted ? '🔇' : '🔊';

  document.getElementById('musicFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await saveMusicFile(file);
    setupAudioFromFile(file);
    audioEl.play();
    document.getElementById('musicPlayBtn').textContent = '⏸️';
  });

  try {
    const file = await loadMusicFile();
    if (file) setupAudioFromFile(file);
  } catch (e) { console.warn("Audio storage not supported."); }
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMusic();
  loadData();
});
