let globalData = { levels: [], moderators: [] };
let currentTab = 'list';
let selectedLevelIndex = null;
let rouletteState = { active: false, currentLevelIdx: 0, pool: [] };

// Persistent Theme Initialization (Prevents visual flash)
(function() {
  const savedTheme = localStorage.getItem('gd_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initPersistentAudio();
});

async function loadData() {
  try {
    const response = await fetch('data.json');
    globalData = await response.json();
    renderApp();
  } catch (err) {
    console.error('Failed to load data.json:', err);
  }
}

function switchTab(tab) {
  currentTab = tab;
  selectedLevelIndex = null;
  
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  // Find matching tab button
  event && event.target && event.target.classList.contains('nav-btn') && event.target.classList.add('active');
  
  renderApp();
}

function renderApp() {
  const container = document.getElementById('app-container');
  container.innerHTML = '';

  if (currentTab === 'list') {
    if (selectedLevelIndex !== null) {
      container.innerHTML = renderLevelDetail(selectedLevelIndex);
    } else {
      container.innerHTML = renderMainList();
    }
  } else if (currentTab === 'leaderboard') {
    container.innerHTML = renderLeaderboard();
  } else if (currentTab === 'roulette') {
    container.innerHTML = renderRoulette();
  } else if (currentTab === 'moderators') {
    container.innerHTML = renderModerators();
  }
}

/* --- Main List & Detail Logic --- */
function renderMainList() {
  if (!globalData.levels || globalData.levels.length === 0) {
    return `<p style="text-align:center;">No levels found in data.json</p>`;
  }

  return globalData.levels.map((lvl, idx) => `
    <div class="level-card" onclick="selectLevel(${idx})">
      <img src="images/${lvl.image}" class="card-banner" alt="${lvl.name}" onerror="this.src='https://via.placeholder.com/600x220?text=No+Image'">
      <div class="card-info">
        <h3 class="card-title"><span class="rank">#${idx + 1}</span> ${lvl.name}</h3>
        <p class="card-author">By ${lvl.creator} — Verifier: ${lvl.verifier}</p>
        <p class="card-points">Points Value: ${calculateLevelPoints(idx)} pts | Req: ${lvl.reqPercent}%</p>
      </div>
    </div>
  `).join('');
}

function selectLevel(idx) {
  selectedLevelIndex = idx;
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToList() {
  selectedLevelIndex = null;
  renderApp();
}

function renderLevelDetail(idx) {
  const lvl = globalData.levels[idx];
  const points = calculateLevelPoints(idx);
  
  // Calculate average enjoyment
  let totalEnjoyment = 0;
  let enjoymentCount = 0;
  if (lvl.records && lvl.records.length > 0) {
    lvl.records.forEach(r => {
      if (typeof r.enjoyment === 'number') {
        totalEnjoyment += r.enjoyment;
        enjoymentCount++;
      }
    });
  }
  const avgEnjoyment = enjoymentCount > 0 ? (totalEnjoyment / enjoymentCount).toFixed(1) : 'N/A';

  const recordsRows = lvl.records && lvl.records.length > 0 ? lvl.records.map(r => `
    <tr>
      <td><span class="player-link">${r.player}</span></td>
      <td>${r.percent}%</td>
      <td>${r.enjoyment !== undefined ? r.enjoyment + '/10' : 'N/A'}</td>
    </tr>
  `).join('') : `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No records submitted yet.</td></tr>`;

  return `
    <div class="detail-view">
      <div class="detail-header">
        <h1>#${idx + 1} - ${lvl.name} <span onclick="backToList()">[Back to List]</span></h1>
        <div class="detail-subtitle">Created by ${lvl.creator} | Verified by ${lvl.verifier}</div>
      </div>
      
      <img src="images/${lvl.image}" class="card-image" alt="${lvl.name}" onerror="this.src='https://via.placeholder.com/600x220?text=No+Image'">
      
      <div class="stats-grid">
        <div class="stat-box">
          <h4>Points Awarded</h4>
          <p>${points} pts</p>
        </div>
        <div class="stat-box">
          <h4>Average Enjoyment</h4>
          <p>${avgEnjoyment} / 10</p>
        </div>
      </div>

      <h3 style="margin-top: 30px;">Records & Victors</h3>
      <table class="records-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Progress</th>
            <th>Enjoyment</th>
          </tr>
        </thead>
        <tbody>
          ${recordsRows}
        </tbody>
      </table>
    </div>
  `;
}

function calculateLevelPoints(idx) {
  // Formula matching official Demon List scaling curves
  const rank = idx + 1;
  if (rank === 1) return 250;
  if (rank <= 3) return 200;
  if (rank <= 10) return 150;
  if (rank <= 25) return 100;
  if (rank <= 50) return 75;
  if (rank <= 75) return 50;
  return 25;
}

/* --- Automated Leaderboard & Purging Logic --- */
function generateLeaderboardData() {
  const playerMap = {};

  if (!globalData.levels) return [];

  globalData.levels.forEach((lvl, lvlIdx) => {
    if (!lvl.records) return;
    const lvlPoints = calculateLevelPoints(lvlIdx);

    lvl.records.forEach(rec => {
      if (rec.percent === 100) {
        if (!playerMap[rec.player]) {
          playerMap[rec.player] = { name: rec.player, points: 0, completed: [] };
        }
        playerMap[rec.player].points += lvlPoints;
        playerMap[rec.player].completed.push(lvl.name);
      }
    });
  });

  let leaderboard = Object.values(playerMap);
  
  // Automated Purging Logic: Omit users with 0 points or empty record lists automatically
  leaderboard = leaderboard.filter(p => p.points > 0 && p.completed.length > 0);

  // Sort descending by total points
  leaderboard.sort((a, b) => b.points - a.points);
  return leaderboard;
}

function renderLeaderboard() {
  const lbData = generateLeaderboardData();

  const rows = lbData.length > 0 ? lbData.map((p, i) => `
    <div class="lb-row">
      <span style="font-weight:700; width:40px;">#${i + 1}</span>
      <span class="lb-name">${p.name}</span>
      <span style="color: var(--accent-green); font-weight:600;">${p.points} pts</span>
    </div>
  `).join('') : `<p style="text-align:center; padding: 20px; color:var(--text-muted);">No players found with completed records.</p>`;

  return `
    <div class="detail-view">
      <h2 style="margin-top:0; text-align:center;">Player Leaderboard</h2>
      <input type="text" class="search-bar" id="lb-search" placeholder="Search player..." oninput="filterLeaderboard()">
      <div id="lb-container">
        ${rows}
      </div>
    </div>
  `;
}

function filterLeaderboard() {
  const query = document.getElementById('lb-search').value.toLowerCase();
  const lbData = generateLeaderboardData().filter(p => p.name.toLowerCase().includes(query));
  
  const container = document.getElementById('lb-container');
  container.innerHTML = lbData.length > 0 ? lbData.map((p, i) => `
    <div class="lb-row">
      <span style="font-weight:700; width:40px;">#${i + 1}</span>
      <span class="lb-name">${p.name}</span>
      <span style="color: var(--accent-green); font-weight:600;">${p.points} pts</span>
    </div>
  `).join('') : `<p style="text-align:center; padding: 20px; color:var(--text-muted);">No matching players found.</p>`;
}

/* --- Accurate Demon Roulette Feature --- */
function renderRoulette() {
  if (!rouletteState.active) {
    return `
      <div class="roulette-box">
        <h2>Demon Roulette</h2>
        <p style="color: var(--text-muted);">Test your survival skills! A random demon will be picked. Beat it or advance to increasingly harder levels.</p>
        <button class="btn btn-primary" onclick="startRoulette()">Start Roulette</button>
      </div>
    `;
  }

  const currentLevel = globalData.levels[rouletteState.currentLevelIdx];
  const roundNumber = rouletteState.pool.length;

  return `
    <div class="roulette-box">
      <h2>Demon Roulette — Round ${roundNumber}</h2>
      <div class="roulette-level">
        <h3 style="margin:0 0 10px 0;">Target Demon: #${rouletteState.currentLevelIdx + 1} ${currentLevel.name}</h3>
        <p style="margin:0; color:var(--text-muted);">Creator: ${currentLevel.creator} | Req %: ${currentLevel.reqPercent}%</p>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button class="btn btn-primary" onclick="roulettePass()">Passed Level</button>
        <button class="btn" style="background:#e74c3c; color:white; border-color:#c0392b;" onclick="quitRoulette()">Failed / Quit</button>
      </div>
    </div>
  `;
}

function startRoulette() {
  if (!globalData.levels || globalData.levels.length === 0) {
    alert("No levels available for roulette!");
    return;
  }
  // Mirror official demon list roulette rules: randomly pick a starting demon from the entire list
  const randomIndex = Math.floor(Math.random() * globalData.levels.length);
  rouletteState = {
    active: true,
    currentLevelIdx: randomIndex,
    pool: [randomIndex]
  };
  renderApp();
}

function roulettePass() {
  // Filter remaining levels that are HARDER or higher-ranked (lower index number) than the current level
  const validIndices = [];
  for (let i = 0; i < rouletteState.currentLevelIdx; i++) {
    if (!rouletteState.pool.includes(i)) {
      validIndices.push(i);
    }
  }

  if (validIndices.length === 0) {
    alert("Congratulations! You have successfully cleared through all available harder levels in the roulette pool!");
    quitRoulette();
    return;
  }

  // Randomly pick from the subset of harder levels
  const nextIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
  rouletteState.currentLevelIdx = nextIdx;
  rouletteState.pool.push(nextIdx);
  renderApp();
}

function quitRoulette() {
  rouletteState = { active: false, currentLevelIdx: 0, pool: [] };
  renderApp();
}

/* --- Moderators Tab Rendering --- */
function renderModerators() {
  const mods = globalData.moderators || [];
  const cards = mods.map(m => `
    <div class="mod-card">
      <span class="mod-name">${m.name}</span>
      <span class="mod-role">${m.role}</span>
    </div>
  `).join('');

  return `
    <div class="detail-view">
      <h2 style="margin-top:0; text-align:center;">List Staff & Moderators</h2>
      <p style="text-align:center; color:var(--text-muted); margin-bottom:25px;">The team responsible for reviewing and managing submissions.</p>
      ${cards}
    </div>
  `;
}

/* --- Theme Persistence Controller --- */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('gd_theme', newTheme);
}

/* --- Persistent Background Audio & Custom File System --- */
function initPersistentAudio() {
  const audio = document.getElementById('bg-music');
  const savedTime = localStorage.getItem('gd_audio_time');
  const wasPlaying = localStorage.getItem('gd_audio_playing') === 'true';
  const customSrc = localStorage.getItem('gd_custom_audio');

  if (customSrc) {
    audio.src = customSrc;
  }

  if (savedTime) {
    audio.currentTime = parseFloat(savedTime);
  }

  // Save playback time periodically
  audio.addEventListener('timeupdate', () => {
    localStorage.setItem('gd_audio_time', audio.currentTime);
  });

  if (wasPlaying) {
    audio.play().then(() => {
      updateAudioButtons(true);
    }).catch(() => {
      // Browser autoplay policy block handled gracefully
      updateAudioButtons(false);
    });
  }
}

function toggleMusic() {
  const audio = document.getElementById('bg-music');
  if (audio.paused) {
    audio.play();
    localStorage.setItem('gd_audio_playing', 'true');
    updateAudioButtons(true);
  } else {
    audio.pause();
    localStorage.setItem('gd_audio_playing', 'false');
    updateAudioButtons(false);
  }
}

function toggleMute() {
  const audio = document.getElementById('bg-music');
  audio.muted = !audio.muted;
  const muteBtn = document.getElementById('mute-toggle-btn');
  muteBtn.textContent = audio.muted ? '🔇 Unmute' : '🔊 Mute';
}

function updateAudioButtons(isPlaying) {
  const playBtn = document.getElementById('music-toggle-btn');
  const muteBtn = document.getElementById('mute-toggle-btn');
  
  if (isPlaying) {
    playBtn.textContent = '⏸ Pause Music';
    muteBtn.style.display = 'inline-flex';
  } else {
    playBtn.textContent = '▶ Play Music';
  }
}

function loadCustomSong(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Audio = e.target.result;
    localStorage.setItem('gd_custom_audio', base64Audio);
    
    const audio = document.getElementById('bg-music');
    audio.src = base64Audio;
    audio.play();
    localStorage.setItem('gd_audio_playing', 'true');
    updateAudioButtons(true);
    alert('Custom song loaded successfully! It will persist across page reloads.');
  };
  reader.readAsDataURL(file);
}
