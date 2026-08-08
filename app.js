let db = { levels: [], moderators: [] };
let currentTab = 'list';
let roulette = { active: false, current: 0, streak: 0 };

// 1. Fetch Data
async function loadData() {
  try {
    const res = await fetch('data.json');
    db = await res.json();
    renderList();
  } catch (err) {
    document.getElementById('contentContainer').innerHTML = `
      <div class="card" style="text-align:center;">
        <h2 style="color:red;">Cannot load data.json</h2>
        <p>If you are testing this on your computer, double-clicking index.html blocks the data.json file from loading due to browser security. <b>Upload it to GitHub Pages / Cloudflare to see it work perfectly!</b></p>
      </div>`;
  }
}

// 2. Math Functions
function getPoints(rank, percent, reqPercent) {
  let base = rank === 1 ? 250 : rank <= 3 ? 200 : rank <= 10 ? 150 : rank <= 50 ? 100 : 50;
  if (percent >= 100) return base;
  if (percent < reqPercent) return 0;
  return base * 0.1 * Math.pow((percent - reqPercent) / (100 - reqPercent), 2);
}

function getEnjoyment(level) {
  let records = level.records || [];
  let total = 0;
  records.forEach(r => total += r.enjoyment);
  return records.length > 0 ? (total / records.length).toFixed(1) + "/10" : "N/A";
}

// 3. Tab Switching
function switchTab(tab) {
  currentTab = tab;
  if (tab === 'list') renderList();
  if (tab === 'stats') renderStats();
  if (tab === 'roulette') renderRoulette();
  if (tab === 'moderators') renderMods();
}

// 4. Render Main List
function renderList() {
  let html = '';
  db.levels.forEach((lvl, idx) => {
    html += `
      <div class="card level-row" onclick="openLevel(${idx})">
        <img src="images/${lvl.image}" class="level-img" onerror="this.src='https://via.placeholder.com/200'">
        <div class="level-info">
          <h2><span class="rank">#${idx + 1}</span> ${lvl.name}</h2>
          <p>By ${lvl.creator} | Verifier: ${lvl.verifier}</p>
          <p>Points: ${getPoints(idx + 1, 100, lvl.reqPercent)} | Enjoyment: ${getEnjoyment(lvl)}</p>
        </div>
      </div>`;
  });
  document.getElementById('contentContainer').innerHTML = html;
}

function openLevel(idx) {
  let lvl = db.levels[idx];
  let recordsHtml = lvl.records.map(r => `<tr><td>${r.player}</td><td>${r.percent}%</td><td>${r.enjoyment}/10</td></tr>`).join('');
  
  document.getElementById('contentContainer').innerHTML = `
    <div class="card">
      <button onclick="renderList()" style="margin-bottom: 15px; cursor: pointer;">🔙 Back</button>
      <h1 style="color:var(--accent-blue); margin: 0 0 10px 0;">#${idx + 1} - ${lvl.name}</h1>
      <p style="color:var(--text-muted);">Creator: ${lvl.creator} | Verifier: ${lvl.verifier}</p>
      <img src="images/${lvl.image}" class="detail-img" onerror="this.style.display='none'">
      <h3>Records</h3>
      <table>
        <tr><th>Player</th><th>Percent</th><th>Enjoyment</th></tr>
        ${recordsHtml || '<tr><td colspan="3">No records yet</td></tr>'}
      </table>
    </div>`;
}

// 5. Render Stats (Auto Purges empty players)
function renderStats() {
  let players = {};

  db.levels.forEach((lvl, idx) => {
    if (lvl.verifier) {
      if (!players[lvl.verifier]) players[lvl.verifier] = 0;
      players[lvl.verifier] += getPoints(idx + 1, 100, lvl.reqPercent);
    }
    (lvl.records || []).forEach(r => {
      if (!players[r.player]) players[r.player] = 0;
      players[r.player] += getPoints(idx + 1, r.percent, lvl.reqPercent);
    });
  });

  // Only keep players with > 0 points and sort them
  let sorted = Object.entries(players).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]);

  let html = `<div class="card"><h2>Leaderboard</h2>`;
  sorted.forEach((p, i) => {
    html += `<div class="lb-row"><b>#${i + 1} &nbsp; ${p[0]}</b> <span>${p[1].toFixed(1)} pts</span></div>`;
  });
  html += `</div>`;
  document.getElementById('contentContainer').innerHTML = html;
}

// 6. Roulette
function renderRoulette() {
  if (!roulette.active) {
    document.getElementById('contentContainer').innerHTML = `
      <div class="card" style="text-align:center;">
        <h2>Demon Roulette</h2>
        <button onclick="startRoulette()" style="padding:10px 20px; cursor:pointer;">Start Game</button>
      </div>`;
    return;
  }
  let lvl = db.levels[roulette.current];
  document.getElementById('contentContainer').innerHTML = `
    <div class="card" style="text-align:center;">
      <h3 style="color:var(--text-muted);">Streak: ${roulette.streak}</h3>
      <h1 style="color:var(--accent-blue);">#${roulette.current + 1} - ${lvl.name}</h1>
      <br><br>
      <button onclick="passRoulette()" style="background:green; color:white; padding:10px; cursor:pointer;">Passed</button>
      <button onclick="roulette.active=false; renderRoulette();" style="background:red; color:white; padding:10px; cursor:pointer;">Failed</button>
    </div>`;
}

function startRoulette() {
  roulette = { active: true, current: Math.floor(Math.random() * db.levels.length), streak: 0 };
  renderRoulette();
}

function passRoulette() {
  roulette.streak++;
  if (roulette.current === 0) {
    alert("You beat the hardest level! Run over!");
    roulette.active = false;
  } else {
    roulette.current = Math.floor(Math.random() * roulette.current);
  }
  renderRoulette();
}

// 7. Render Mods
function renderMods() {
  let html = `<div class="card"><h2>Moderators</h2>`;
  db.moderators.forEach(m => html += `<div style="padding:10px; border-bottom:1px solid var(--border);"><b>${m.name}</b> - ${m.role}</div>`);
  html += `</div>`;
  document.getElementById('contentContainer').innerHTML = html;
}

// 8. Theme & Music
function toggleTheme() {
  let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').innerText = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
}

function toggleMusic() {
  let audio = document.getElementById('bg-music');
  if (audio.paused) {
    audio.play();
    document.getElementById('musicBtn').innerText = '⏸️ Pause Music';
  } else {
    audio.pause();
    document.getElementById('musicBtn').innerText = '▶️ Play Music';
  }
}

// Init
if (localStorage.getItem('theme') === 'dark') toggleTheme();
loadData();
