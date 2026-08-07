/* ============================================================
   GEOMETRY DASH DEMON LIST — app.js
   ============================================================ */

let siteData = { levels: [], moderators: [] };
let currentTab = 'list';
let roulette = { active: false, currentIdx: null, streak: 0, hardestIdx: null, cleared: false };

// ---------- Load Data from data.json ----------
async function loadData() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    siteData = await res.json();
    if (!siteData.levels) siteData.levels = [];
    if (!siteData.moderators) siteData.moderators = [];
  } catch (err) {
    document.getElementById('contentContainer').innerHTML = `
      <div class="detail-view" style="text-align:center;">
        <h3 style="color:var(--accent-blue);">Local Preview Notice</h3>
        <p style="color:var(--text-muted);">Browsers block file loading via <code>fetch()</code> if you just double-click <code>index.html</code>. Use a local server (like VS Code Live Server) or deploy to GitHub Pages to view it live.</p>
        <p style="color:var(--text-muted);">Error: ${err.message}</p>
      </div>`;
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

// ---------- Scoring & Average Enjoyment Logic ----------
function getPoints(rank, percent, reqPercent) {
  const base = rank === 1 ? 350 : rank === 2 ? 331.71 : Math.max(5, 300 * Math.exp(-0.03 * rank));
  if (percent >= 100) return base;
  if (percent < reqPercent) return 0;
  const partial = base * 0.1 * Math.pow((percent - reqPercent) / (100 - reqPercent), 2);
  return Math.max(partial, base * 0.1);
}

function avgEnjoyment(level) {
  const vals = (level.records || []).map(r => Number(r.enjoyment)).filter(v => !isNaN(v) && v > 0);
  if (!vals.length) return 'N/A';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + '/10';
}

// ---------- Tab 1: Demonlist ----------
function renderList() {
  const container = document.getElementById('contentContainer');
  let html = '<input type="text" id="listSearch" class="search-bar" placeholder="Search by name or creator..." oninput="filterList(this.value)">';

  siteData.levels.forEach((level, idx) => {
    const rank = idx + 1;
    const pts100 = getPoints(rank, 100, level.reqPercent).toFixed(2);
    const ptsReq = getPoints(rank, level.reqPercent, level.reqPercent).toFixed(2);
    
    html += `
      <div class="level-card list-item" data-search="${(level.name + ' ' + level.creator).toLowerCase()}" onclick="openLevel(${idx})">
        <img src="images/${level.image}" class="card-banner" alt="${level.name}" onerror="this.src='https://via.placeholder.com/200x120?text=No+Image'">
        <div class="card-info">
          <h2 class="card-title"><span class="rank">#${rank}</span> &ndash; ${level.name}</h2>
          <p class="card-author">by <b>${level.creator}</b> &bull; Enjoyment: <b>${avgEnjoyment(level)}</b></p>
          <p class="card-points">${ptsReq} pts (${level.reqPercent}%) &mdash; ${pts100} pts (100%)</p>
        </div>
      </div>`;
  });
  container.innerHTML = html || '<p style="text-align:center;color:var(--text-muted);">No levels listed yet.</p>';
}

function filterList(val) {
  document.querySelectorAll('.list-item').forEach(row => {
    row.style.display = row.dataset.search.includes(val.toLowerCase()) ? 'flex' : 'none';
  });
}

function openLevel(idx) {
  const level = siteData.levels[idx];
  const rank = idx + 1;
  const sortedRecords = (level.records || []).slice().sort((a, b) => b.percent - a.percent);
  
  const recordsHTML = sortedRecords.map(r => `
    <tr>
      <td><b>${r.player}</b></td>
      <td style="text-align:right;">${r.percent}% &nbsp;(${r.enjoyment != null ? r.enjoyment : '?'}/10)${r.link ? ' <a href="' + r.link + '" target="_blank">🔗</a>' : ''}</td>
    </tr>`).join('');

  document.getElementById('contentContainer').innerHTML = `
    <div class="detail-view">
      <div class="detail-header">
        <h1>${level.name} <span onclick="switchTab('list')">✕ Close</span></h1>
        <div class="detail-subtitle">Created by ${level.creator} &bull; Verified by ${level.verifier}</div>
      </div>
      <img class="card-image" src="images/${level.image}" alt="${level.name}" onerror="this.src='https://via.placeholder.com/550x300?text=No+Image'">
      <div class="stats-grid">
        <div class="stat-box"><h4>Rank</h4><p>#${rank}</p></div>
        <div class="stat-box"><h4>Required %</h4><p>${level.reqPercent}%</p></div>
        <div class="stat-box"><h4>Avg Enjoyment</h4><p>${avgEnjoyment(level)}</p></div>
        <div class="stat-box"><h4>Victors</h4><p>${sortedRecords.length}</p></div>
      </div>
      <h2 style="margin-top:20px;">Records</h2>
      <table class="records-table">
        <thead><tr><th>Player</th><th style="text-align:right;">Progress & Enjoyment</th></tr></thead>
        <tbody>${recordsHTML || '<tr><td colspan="2" style="text-align:center;color:var(--text-muted);">No records recorded yet.</td></tr>'}</tbody>
      </table>
    </div>`;
}

// ---------- Tab 2: Stats Viewer (Automated Scoring & Player Purging) ----------
function renderStats() {
  const container = document.getElementById('contentContainer');
  const totals = {};

  siteData.levels.forEach((level, idx) => {
    const rank = idx + 1;
    if (level.verifier) {
      totals[level.verifier] = (totals[level.verifier] || 0) + getPoints(rank, 100, level.reqPercent);
    }
    (level.records || []).forEach(r => {
      totals[r.player] = (totals[r.player] || 0) + getPoints(rank, r.percent, level.reqPercent);
    });
  });

  // Automatically purges players who have 0 points or records
  const sorted = Object.entries(totals).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]);
  
  let html = '<div class="detail-view"><h2 style="margin-top:0;">Leaderboard</h2><input type="text" class="search-bar" placeholder="Search player..." oninput="filterStats(this.value)">';
  sorted.forEach(([name, pts], i) => {
    html += `<div class="lb-row" data-search="${name.toLowerCase()}"><div style="width:40px;font-weight:bold;color:var(--accent-blue);">#${i + 1}</div><div class="lb-name">${name}</div><div style="color:var(--text-muted);">${pts.toFixed(2)} pts</div></div>`;
  });
  if (!sorted.length) html += '<p style="color:var(--text-muted); text-align:center;">No player records found.</p>';
  container.innerHTML = html + '</div>';
}

function filterStats(val) {
  document.querySelectorAll('.lb-row').forEach(row => {
    row.style.display = row.dataset.search.includes(val.toLowerCase()) ? 'flex' : 'none';
  });
}

// ---------- Tab 3: Moderators ----------
function renderModerators() {
  const container = document.getElementById('contentContainer');
  let html = '<div class="detail-view"><h2 style="margin-top:0;">List Staff</h2>';
  siteData.moderators.forEach(m => {
    html += `<div class="mod-card"><span class="mod-name">${m.name}</span><span class="mod-role">${m.role}</span></div>`;
  });
  if (!siteData.moderators.length) html += '<p style="color:var(--text-muted);">No moderators listed.</p>';
  container.innerHTML = html + '</div>';
}

// ---------- Tab 4: Accurate Demon Roulette ----------
function startRoulette() {
  if (!siteData.levels.length) return;
  roulette = { active: true, currentIdx: Math.floor(Math.random() * siteData.levels.length), streak: 0, hardestIdx: null, cleared: false };
  renderRoulette();
}

function passRoulette() {
  roulette.streak++;
  if (roulette.hardestIdx === null || roulette.currentIdx < roulette.hardestIdx) {
    roulette.hardestIdx = roulette.currentIdx;
  }

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
        <div style="color:var(--text-muted); margin-bottom:10px;">Streak: <b style="color:var(--text-main); font-size:1.2rem;">${roulette.streak}</b></div>
        <div class="roulette-level">
          <h2 style="margin:0 0 5px 0;"><span style="color:var(--accent-blue);">#${rank}</span> &ndash; ${level.name}</h2>
          <p style="color:var(--text-muted); margin:0;">by ${level.creator}</p>
        </div>
        <button class="btn btn-primary" onclick="passRoulette()">Passed</button>
        <button class="btn" onclick="failRoulette()">Failed</button>
      </div>`;
    return;
  }

  if (roulette.cleared) {
    container.innerHTML = `
      <div class="detail-view roulette-box">
        <h2 style="color:var(--accent-blue);">🎉 Full Clear!</h2>
        <p style="color:var(--text-muted);">You cleared the path down to #1! Final streak: <b>${roulette.streak}</b></p>
        <button class="btn btn-primary" onclick="startRoulette()">Play Again</button>
      </div>`;
    return;
  }

  if (roulette.streak > 0 || roulette.currentIdx !== null) {
    const hardest = roulette.hardestIdx !== null ? `#${roulette.hardestIdx + 1} &ndash; ${siteData.levels[roulette.hardestIdx].name}` : 'None';
    container.innerHTML = `
      <div class="detail-view roulette-box">
        <h2 style="color:var(--accent-blue);">Run Ended</h2>
        <p style="color:var(--text-muted);">Final Streak: <b>${roulette.streak}</b> &bull; Hardest Reached: <b>${hardest}</b></p>
        <button class="btn btn-primary" onclick="startRoulette()">Try Again</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="detail-view roulette-box">
      <h2 style="color:var(--accent-blue); margin-top:0;">Demon Roulette</h2>
      <p style="color:var(--text-muted); max-width:500px; margin:0 auto 20px auto;">A random level is chosen. Pass it to proceed to a harder random level. One fail ends your run.</p>
      <button class="btn btn-primary" onclick="startRoulette()">Start Roulette</button>
    </div>`;
}

// ---------- Persistent Dark / Light Mode ----------
function initTheme() {
  const saved = localStorage.getItem('demonlist_theme');
  if (saved === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
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
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('themeToggleBtn').textContent = isDark ? '☀️' : '🌙';
}

// ---------- Persistent Audio System (IndexedDB Storage) ----------
const AUDIO_DB = 'dashAudioStoreDB';
const AUDIO_STORE = 'files';
const AUDIO_KEY = 'bgSong';

function openAudioDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(AUDIO_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(AUDIO_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudioFile(file) {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readwrite');
    tx.objectStore(AUDIO_STORE).put(file, AUDIO_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getStoredAudioFile() {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE, 'readonly');
    const req = tx.objectStore(AUDIO_STORE).get(AUDIO_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function setAudioSource(file) {
  const audioEl = document.getElementById('bg-music');
  audioEl.src = URL.createObjectURL(file);
  document.getElementById('musicPlayBtn').disabled = false;
}

function toggleMusicPlay() {
  const audioEl = document.getElementById('bg-music');
  const btn = document.getElementById('musicPlayBtn');
  if (audioEl.paused) {
    audioEl.play().catch(e => console.warn("Playback interaction required"));
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

async function initMusicSystem() {
  const audioEl = document.getElementById('bg-music');
  audioEl.muted = localStorage.getItem('demonlist_muted') === 'true';
  document.getElementById('muteBtn').textContent = audioEl.muted ? '🔇' : '🔊';

  document.getElementById('musicFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await saveAudioFile(file);
    setAudioSource(file);
    audioEl.play();
    document.getElementById('musicPlayBtn').textContent = '⏸️';
  });

  try {
    const savedFile = await getStoredAudioFile();
    if (savedFile) {
      setAudioSource(savedFile);
    }
  } catch (err) {
    console.warn("IndexedDB audio storage unavailable.");
  }
}

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMusicSystem();
  loadData();
});
