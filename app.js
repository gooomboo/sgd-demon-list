// --- Database Setup ---
let db = []; // Gets filled from data.json on load
let bannedPlayers = JSON.parse(localStorage.getItem('ptr_bans')) || [];
let playerAccounts = JSON.parse(localStorage.getItem('ptr_users')) || {};
let submissions = JSON.parse(localStorage.getItem('ptr_subs')) || [];
let changelog = JSON.parse(localStorage.getItem('ptr_log')) || [{ date: new Date().toLocaleString(), isoDate: new Date().toISOString(), action: "System Initialization", type: "system", id: 0 }];
let dbHistory = JSON.parse(localStorage.getItem('ptr_history')) || [];
let currentLang = localStorage.getItem('ptr_lang') || 'en';
let guidelinesText = localStorage.getItem('ptr_guidelines') || 'All records must include valid video proof (raw footage required). No cheats, hacks, speedhacks, or unauthorized game modifications are allowed. Submissions must stay within the frame-rate limits set by staff. Be respectful to other members of the community \u2014 harassment or cheating can result in a ban.';

let viewingHistory = null;
let statsViewMode = 'individual';
let isMod = false;
let loggedInUser = null;
let currentTab = 'list';
let editingLevelIdx = null;
let roulette = { active: false, summary: false, victory: false, level: null, req: 0, score: 0, hardestBeaten: null, endReason: null, endPercent: null };

// This is a SHA-256 hash of the staff passcode, not the passcode itself \u2014 the value hasn't changed, it's just no longer sitting in the source as plain text.
const MOD_PASS_HASH = '0c9edd2025b926820718821ddd086cdc0b16a5bc989b6b6b238528b4aa6bddc2';

const countryList = [
  { code:'us', name:'United States', flag:'\uD83C\uDDFA\uD83C\uDDF8', lang:'en' },
  { code:'gb', name:'United Kingdom', flag:'\uD83C\uDDEC\uD83C\uDDE7', lang:'en' },
  { code:'ca', name:'Canada', flag:'\uD83C\uDDE8\uD83C\uDDE6', lang:'en' },
  { code:'de', name:'Germany', flag:'\uD83C\uDDE9\uD83C\uDDEA', lang:'de' },
  { code:'ru', name:'Russia', flag:'\uD83C\uDDF7\uD83C\uDDFA', lang:'ru' },
  { code:'es', name:'Spain', flag:'\uD83C\uDDEA\uD83C\uDDF8', lang:'es' },
  { code:'mx', name:'Mexico', flag:'\uD83C\uDDF2\uD83C\uDDFD', lang:'es' },
  { code:'jp', name:'Japan', flag:'\uD83C\uDDEF\uD83C\uDDF5', lang:'ja' },
  { code:'kr', name:'South Korea', flag:'\uD83C\uDDF0\uD83C\uDDF7', lang:'ko' },
  { code:'fr', name:'France', flag:'\uD83C\uDDEB\uD83C\uDDF7', lang:'en' },
  { code:'other', name:'Other / International', flag:'\uD83C\uDF10', lang:'en' }
];

const translations = {
  en: { nav_list:'Demonlist', nav_stats:'Stats Viewer', nav_roulette:'Roulette', nav_submit:'Submit', nav_catalog:'Catalog', nav_audit:'Audit & Bans', nav_logout_staff:'Logout Staff', login:'Player Login', login_title:'Player Login / Register', username:'Username', email:'Email', password:'Password', country:'Country', signin:'Sign In / Create Account', cancel:'Cancel', search:'Search by name, creator, or enjoyment...', welcome:'Welcome', logout:'Log Out' },
  de: { nav_list:'Demonliste', nav_stats:'Statistiken', nav_roulette:'Roulette', nav_submit:'Einreichen', nav_catalog:'Katalog', nav_audit:'Audit & Sperren', nav_logout_staff:'Team-Logout', login:'Spieler-Login', login_title:'Spieler-Login / Registrieren', username:'Benutzername', email:'E-Mail', password:'Passwort', country:'Land', signin:'Anmelden / Konto erstellen', cancel:'Abbrechen', search:'Suche nach Name, Ersteller oder Bewertung...', welcome:'Willkommen', logout:'Abmelden' },
  ru: { nav_list:'\u0414\u0435\u043c\u043e\u043d\u043b\u0438\u0441\u0442', nav_stats:'\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430', nav_roulette:'\u0420\u0443\u043b\u0435\u0442\u043a\u0430', nav_submit:'\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c', nav_catalog:'\u041a\u0430\u0442\u0430\u043b\u043e\u0433', nav_audit:'\u0410\u0443\u0434\u0438\u0442 \u0438 \u0431\u0430\u043d\u044b', nav_logout_staff:'\u0412\u044b\u0439\u0442\u0438 (\u043f\u0435\u0440\u0441.)', login:'\u0412\u0445\u043e\u0434 \u0438\u0433\u0440\u043e\u043a\u0430', login_title:'\u0412\u0445\u043e\u0434 / \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0438\u0433\u0440\u043e\u043a\u0430', username:'\u0418\u043c\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f', email:'\u042d\u043b. \u043f\u043e\u0447\u0442\u0430', password:'\u041f\u0430\u0440\u043e\u043b\u044c', country:'\u0421\u0442\u0440\u0430\u043d\u0430', signin:'\u0412\u043e\u0439\u0442\u0438 / \u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442', cancel:'\u041e\u0442\u043c\u0435\u043d\u0430', search:'\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0438\u043c\u0435\u043d\u0438, \u0430\u0432\u0442\u043e\u0440\u0443 \u0438\u043b\u0438 \u043e\u0446\u0435\u043d\u043a\u0435...', welcome:'\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c', logout:'\u0412\u044b\u0439\u0442\u0438' },
  es: { nav_list:'Lista Demon', nav_stats:'Estad\u00edsticas', nav_roulette:'Ruleta', nav_submit:'Enviar', nav_catalog:'Cat\u00e1logo', nav_audit:'Auditor\u00eda y Baneos', nav_logout_staff:'Salir (Staff)', login:'Acceso de Jugador', login_title:'Acceso / Registro de Jugador', username:'Usuario', email:'Correo electr\u00f3nico', password:'Contrase\u00f1a', country:'Pa\u00eds', signin:'Iniciar sesi\u00f3n / Crear cuenta', cancel:'Cancelar', search:'Buscar por nombre, creador o disfrute...', welcome:'Bienvenido', logout:'Cerrar sesi\u00f3n' },
  ja: { nav_list:'\u30c7\u30fc\u30e2\u30f3\u30ea\u30b9\u30c8', nav_stats:'\u7d71\u8a08\u30d3\u30e5\u30fc\u30a2', nav_roulette:'\u30eb\u30fc\u30ec\u30c3\u30c8', nav_submit:'\u6295\u7a3f', nav_catalog:'\u30ab\u30bf\u30ed\u30b0', nav_audit:'\u76e3\u67fb\u3068BAN', nav_logout_staff:'\u30b9\u30bf\u30c3\u30d5\u30ed\u30b0\u30a2\u30a6\u30c8', login:'\u30d7\u30ec\u30a4\u30e4\u30fc\u30ed\u30b0\u30a4\u30f3', login_title:'\u30d7\u30ec\u30a4\u30e4\u30fc\u30ed\u30b0\u30a4\u30f3 / \u767b\u9332', username:'\u30e6\u30fc\u30b6\u30fc\u540d', email:'\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9', password:'\u30d1\u30b9\u30ef\u30fc\u30c9', country:'\u56fd', signin:'\u30ed\u30b0\u30a4\u30f3 / \u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210', cancel:'\u30ad\u30e3\u30f3\u30bb\u30eb', search:'\u540d\u524d\u30fb\u4f5c\u8005\u30fb\u8a55\u4fa1\u3067\u691c\u7d22...', welcome:'\u3088\u3046\u3053\u305d', logout:'\u30ed\u30b0\u30a2\u30a6\u30c8' },
  ko: { nav_list:'\ub370\ubaac\ub9ac\uc2a4\ud2b8', nav_stats:'\ud1b5\uacc4 \ubdf0\uc5b4', nav_roulette:'\ub67c\ub81b', nav_submit:'\uc81c\ucd9c', nav_catalog:'\uce74\ud0c8\ub85c\uadf8', nav_audit:'\uac10\uc0ac \ubc0f \ubc34', nav_logout_staff:'\uc2a4\ud0dc\ud504 \ub85c\uadf8\uc544\uc6c3', login:'\ud50c\ub808\uc774\uc5b4 \ub85c\uadf8\uc778', login_title:'\ud50c\ub808\uc774\uc5b4 \ub85c\uadf8\uc778 / \uac00\uc785', username:'\uc0ac\uc6a9\uc790 \uc774\ub984', email:'\uc774\uba54\uc77c', password:'\ube44\ubc00\ubc88\ud638', country:'\uad6d\uac00', signin:'\ub85c\uadf8\uc778 / \uacc4\uc815 \uc0dd\uc131', cancel:'\ucde8\uc18c', search:'\uc774\ub984, \uc81c\uc791\uc790, \ud3c9\uc810\uc73c\ub85c \uac80\uc0c9...', welcome:'\ud658\uc601\ud569\ub2c8\ub2e4', logout:'\ub85c\uadf8\uc544\uc6c3' }
};

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

// Secret Key Listener ("12ABD")
let keyBuffer = [];
window.addEventListener('keydown', (e) => {
  keyBuffer.push(e.key.toLowerCase());
  if (keyBuffer.length > 5) keyBuffer.shift();
  if (keyBuffer.join('') === '12abd') { document.getElementById('loginModal').classList.add('active'); keyBuffer = []; }
});

function saveState() {
  localStorage.setItem('ptr_db', JSON.stringify(db));
  localStorage.setItem('ptr_users', JSON.stringify(playerAccounts));
  localStorage.setItem('ptr_subs', JSON.stringify(submissions));
  localStorage.setItem('ptr_log', JSON.stringify(changelog));
  localStorage.setItem('ptr_bans', JSON.stringify(bannedPlayers));
  localStorage.setItem('ptr_history', JSON.stringify(dbHistory));
  localStorage.setItem('ptr_lang', currentLang);
  localStorage.setItem('ptr_guidelines', guidelinesText);
}

function addLog(action, type) {
  const now = new Date();
  changelog.unshift({ date: now.toLocaleString(), isoDate: now.toISOString(), action, type, id: Date.now() });
  dbHistory.push({ isoDate: now.toISOString(), db: JSON.parse(JSON.stringify(db)) });
  if (dbHistory.length > 200) dbHistory.shift();
  saveState();
}

async function hashPassword(pass) {
  const enc = new TextEncoder().encode(pass);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function populateCountrySelect(selectEl, includeNoChangeOption) {
  if (!selectEl) return;
  selectEl.innerHTML = (includeNoChangeOption ? '<option value="">-- No change --</option>' : '') +
    countryList.map(c => `<option value="${c.code}">${c.flag} ${c.name}</option>`).join('');
}

function renderUserStatus() {
  const el = document.getElementById('userStatus');
  if (loggedInUser) {
    el.innerHTML = `<span>${t('welcome')}, ${loggedInUser}</span> <button class="btn btn-danger" style="padding: 5px 10px; font-size:0.85rem;" onclick="logoutPlayer()">${t('logout')}</button>`;
  } else {
    el.innerHTML = `<button class="nav-btn" onclick="openPlayerLogin()">${t('login')}</button>`;
  }
}

function renderNav() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerText = t(el.dataset.i18n); });
  const langSel = document.getElementById('langSwitcher');
  if (langSel) langSel.value = currentLang;
  renderUserStatus();
}

function setLanguage(code) {
  currentLang = code;
  localStorage.setItem('ptr_lang', code);
  if (loggedInUser && playerAccounts[loggedInUser]) { playerAccounts[loggedInUser].language = code; saveState(); }
  renderNav();
  switchTab(currentTab);
}

function getPoints(rank, percent = 100, reqPercent = 66) {
  let base = (rank === 1) ? 350.00 : (rank === 2) ? 331.71 : Math.max(5, 300 * Math.exp(-0.03 * rank));
  if (percent === 100) return base.toFixed(2);
  if (percent < reqPercent) return "0.00";
  let partial = base * 0.1 * Math.pow((percent - reqPercent) / (100 - reqPercent), 2);
  return (Math.max(partial, base * 0.1)).toFixed(2);
}

function getEnjoyment(level) {
  let total = 0, count = 0;
  level.records.forEach(r => { if(r.enjoyment) { total += Number(r.enjoyment); count++; } });
  return count > 0 ? (total / count).toFixed(1) + "/10" : "N/A";
}

function switchTab(tab) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  try { event.target.classList.add('active'); } catch(e){}
  currentTab = tab;

  const container = document.getElementById('contentContainer');
  container.innerHTML = '';

  if (tab === 'list') renderList();
  else if (tab === 'leaderboard') renderLeaderboard();
  else if (tab === 'roulette') renderRoulette();
  else if (tab === 'submit') renderSubmit();
  else if (tab === 'catalog') renderCatalog();
  else if (tab === 'audit') renderAudit();
}

// --- Tab: Demonlist ---
function renderList() {
  const container = document.getElementById('contentContainer');
  const activeDB = viewingHistory ? viewingHistory.db : db;
  let html = '';

  if (viewingHistory) {
    html += `<div style="background:#fff3cd;border:1px solid #ffeeba;padding:12px 15px;border-radius:4px;margin-bottom:15px;text-align:center;">
      <b>\uD83D\uDD50 Viewing list as of ${new Date(viewingHistory.date).toLocaleString()}</b>
      <button class="btn" style="margin-left:10px;padding:5px 12px;font-size:0.85rem;" onclick="returnToPresent()">Return to Present</button>
    </div>`;
  }

  html += `<div style="display:flex; gap:10px; margin-bottom:15px;">
    <input type="text" id="listSearch" class="search-bar" style="margin-bottom:0;" placeholder="${t('search')}" oninput="filterDemonlist(this.value)">
    <button class="btn" onclick="openTimeMachine()" title="Time Machine">\uD83D\uDD50</button>
    ${(isMod && !viewingHistory) ? '<button class="btn btn-primary" onclick="openLevelForm()">+ Add Level</button>' : ''}
  </div>`;

  activeDB.forEach((level, idx) => {
    const rank = idx + 1;
    let modRow = '';
    if (isMod && !viewingHistory) {
      modRow = '<div class="mod-row" onclick="event.stopPropagation()">' +
        '<button class="btn" style="padding:4px 8px;font-size:0.8rem;" onclick="moveLevel(' + idx + ', -1)">\u2191 Up</button>' +
        '<button class="btn" style="padding:4px 8px;font-size:0.8rem;" onclick="moveLevel(' + idx + ', 1)">\u2193 Down</button>' +
        '<button class="btn" style="padding:4px 8px;font-size:0.8rem;" onclick="openLevelForm(' + idx + ')">Edit</button>' +
        '<button class="btn btn-danger" style="padding:4px 8px;font-size:0.8rem;" onclick="deleteLevel(' + idx + ')">Delete</button>' +
        '</div>';
    }
    html += `
      <div class="level-card list-item" data-search="${level.name} ${level.creators} ${getEnjoyment(level)}" onclick="openLevel(${idx})">
        <img src="${level.image}" class="card-banner">
        <div class="card-info">
          <h2 class="card-title">#${rank} \u2013 ${level.name}</h2>
          <p class="card-author">published by <b><u>${level.publisher}</u></b> | Avg Enjoyment: <b>${getEnjoyment(level)}</b></p>
          <p class="card-points">${getPoints(rank, level.reqPercent, level.reqPercent)} (${level.reqPercent}%) \u2014 ${getPoints(rank, 100, level.reqPercent)} (100%) points</p>
          ${modRow}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function filterDemonlist(val) {
  document.querySelectorAll('.list-item').forEach(row => {
    row.style.display = row.dataset.search.toLowerCase().includes(val.toLowerCase()) ? 'block' : 'none';
  });
}

function openLevel(idx) {
  const activeDB = viewingHistory ? viewingHistory.db : db;
  const level = activeDB[idx];
  const rank = idx + 1;
  let recordsHTML = level.records.filter(r => !bannedPlayers.includes(r.player)).sort((a,b) => b.percent - a.percent).map(r => `
      <tr>
        <td><a class="player-link" onclick="openPlayer('${r.player}')">${r.player}</a></td>
        <td style="text-align:right;">${r.percent}% (${r.enjoyment || '?'}/10) <a href="${r.link}" target="_blank">\uD83D\uDD17</a></td>
      </tr>`).join('');

  let levelHistory = changelog.filter(l => l.action.includes(level.name)).slice(0, 15).map(l => `<div class="history-card">${l.date}: ${l.action}</div>`).join('');
  if (!levelHistory) levelHistory = '<p style="color:var(--text-muted);">No history recorded yet.</p>';

  let modControls = '';
  if (isMod && !viewingHistory) {
    modControls = `
      <div style="border-top:1px dashed var(--border); margin-top:20px; padding-top:20px;">
        <h3>Mod: Add Record Directly</h3>
        <div class="form-group"><label>Player</label><input type="text" id="mrPlayer"></div>
        <div class="form-group"><label>Progress %</label><input type="number" id="mrProgress" min="1" max="100"></div>
        <div class="form-group"><label>Enjoyment (1-10)</label><input type="number" id="mrEnjoy" min="1" max="10"></div>
        <div class="form-group"><label>Video Link</label><input type="text" id="mrLink"></div>
        <button class="btn btn-success" onclick="addRecordDirect(${idx})">Add Record</button>
        <div style="margin-top:15px;">
          <button class="btn" onclick="openLevelForm(${idx})">Edit Level</button>
          <button class="btn btn-danger" onclick="deleteLevel(${idx})">Delete Level</button>
        </div>
      </div>`;
  }

  document.getElementById('contentContainer').innerHTML = `
    <div class="detail-view" style="display:block;">
      <div class="detail-header">
        <h1>${level.name} <span onclick="switchTab('list')">\u276F</span></h1>
        <div class="detail-subtitle">by <u>${level.creators}</u>, verified by <a class="player-link" onclick="openPlayer('${level.verifier}')">${level.verifier}</a></div>
      </div>
      <div class="video-container"><img src="${level.image}"></div>
      <div class="stats-grid">
        <div class="stat-box"><h4>Length</h4><p>${level.length}</p></div>
        <div class="stat-box"><h4>Difficulty</h4><p>${level.difficulty}</p></div>
        <div class="stat-box"><h4>Engine</h4><p>${level.engine}</p></div>
        <div class="stat-box"><h4>Avg Enjoyment</h4><p>${getEnjoyment(level)}</p></div>
      </div>
      <div class="records-section">
        <h2>Records</h2>
        <table class="records-table">
          <thead><tr><th>Player</th><th style="text-align:right;">Progress</th></tr></thead>
          <tbody>${recordsHTML || '<tr><td colspan="2">No records.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="border-top:1px dashed var(--border); margin-top:20px; padding-top:20px;">
        <h3>Level History</h3>
        ${levelHistory}
      </div>
      ${modControls}
    </div>
  `;
}

// --- Mod: Level CRUD & Reordering ---
function moveLevel(idx, direction) {
  if (viewingHistory) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= db.length) return;
  const movedName = db[idx].name;
  const otherName = db[newIdx].name;
  [db[idx], db[newIdx]] = [db[newIdx], db[idx]];
  addLog(`Rank Change: ${movedName} moved to #${newIdx+1} (swapped with ${otherName})`, 'rank');
  renderList();
}

function openLevelForm(idx) {
  editingLevelIdx = (typeof idx === 'number') ? idx : null;
  const isEdit = editingLevelIdx !== null;
  document.getElementById('levelFormTitle').innerText = isEdit ? 'Edit Level' : 'Add Level';
  const lvl = isEdit ? db[editingLevelIdx] : { name:'',publisher:'',verifier:'',creators:'',length:'',engine:'2.2',reqPercent:66,image:'' };
  document.getElementById('lfRank').value = isEdit ? editingLevelIdx+1 : db.length+1;
  document.getElementById('lfName').value = lvl.name;
  document.getElementById('lfPublisher').value = lvl.publisher;
  document.getElementById('lfVerifier').value = lvl.verifier;
  document.getElementById('lfCreators').value = lvl.creators;
  document.getElementById('lfLength').value = lvl.length;
  document.getElementById('lfEngine').value = lvl.engine;
  document.getElementById('lfReq').value = lvl.reqPercent;
  document.getElementById('lfImage').value = lvl.image;
  document.getElementById('levelFormModal').classList.add('active');
}

function saveLevelForm() {
  const name = document.getElementById('lfName').value.trim();
  if (!name) return alert('Level name is required.');
  const data = {
    name,
    publisher: document.getElementById('lfPublisher').value.trim(),
    verifier: document.getElementById('lfVerifier').value.trim(),
    creators: document.getElementById('lfCreators').value.trim(),
    length: document.getElementById('lfLength').value.trim(),
    difficulty: 'Extreme Demon',
    engine: document.getElementById('lfEngine').value.trim(),
    reqPercent: parseInt(document.getElementById('lfReq').value) || 66,
    image: document.getElementById('lfImage').value.trim() || 'https://via.placeholder.com/600x220',
  };
  let rank = parseInt(document.getElementById('lfRank').value);
  if (isNaN(rank)) rank = (editingLevelIdx !== null) ? editingLevelIdx + 1 : db.length + 1;

  if (editingLevelIdx !== null) {
    const existingRecords = db[editingLevelIdx].records || [];
    db.splice(editingLevelIdx, 1);
    rank = Math.min(Math.max(rank, 1), db.length+1);
    data.records = existingRecords;
    db.splice(rank-1, 0, data);
    addLog(`Level Edited: ${data.name} (#${rank})`, 'level');
  } else {
    rank = Math.min(Math.max(rank, 1), db.length+1);
    data.records = [];
    db.splice(rank-1, 0, data);
    addLog(`Level Added: ${data.name} (#${rank})`, 'level');
  }
  closeModal('levelFormModal');
  switchTab('list');
}

function deleteLevel(idx) {
  if (confirm(`Delete "${db[idx].name}" from the list? This can't be undone (it will still show up in Time Machine history).`)) {
    const name = db[idx].name;
    db.splice(idx, 1);
    addLog(`Level Deleted: ${name}`, 'level');
    switchTab('list');
  }
}

function addRecordDirect(idx) {
  const player = document.getElementById('mrPlayer').value.trim();
  const progress = parseInt(document.getElementById('mrProgress').value);
  const enjoyment = document.getElementById('mrEnjoy').value;
  const link = document.getElementById('mrLink').value.trim();
  if (!player || !progress || !link) return alert('Player, progress, and link are required.');
  db[idx].records.push({ player, percent: progress, enjoyment, link });
  addLog(`Record Added (mod): ${player} on ${db[idx].name} (${progress}%)`, 'record');
  openLevel(idx);
}

// --- Time Machine ---
function openTimeMachine() { document.getElementById('timeMachineModal').classList.add('active'); }

function goToTime() {
  const val = document.getElementById('tmDateInput').value;
  if (!val) return;
  const target = new Date(val).toISOString();
  let found = null;
  for (let i = 0; i < dbHistory.length; i++) {
    if (dbHistory[i].isoDate <= target) found = dbHistory[i]; else break;
  }
  if (!found) { alert('No data available before that date.'); return; }
  viewingHistory = { date: val, db: found.db };
  closeModal('timeMachineModal');
  switchTab('list');
}

function returnToPresent() {
  viewingHistory = null;
  switchTab('list');
}

// --- Tab: Stats Viewer & Player Profile ---
function setStatsMode(mode) { statsViewMode = mode; renderLeaderboard(); }

function renderLeaderboard() {
  const container = document.getElementById('contentContainer');
  let html = `<div style="background:var(--card-bg); padding:30px; border:1px solid var(--border);"><h2>${t('nav_stats')}</h2>
    <div style="display:flex; gap:10px; margin-bottom:15px;">
      <button class="btn ${statsViewMode==='individual'?'btn-primary':''}" onclick="setStatsMode('individual')">Individual</button>
      <button class="btn ${statsViewMode==='nations'?'btn-primary':''}" onclick="setStatsMode('nations')">Nations</button>
    </div>
    <input type="text" class="search-bar" placeholder="Search..." oninput="filterLB(this.value)">`;

  if (statsViewMode === 'individual') {
    let playerStats = {};
    Object.keys(playerAccounts).forEach(u => playerStats[u] = 0);
    db.forEach((lvl, idx) => {
      const rank = idx + 1;
      if(lvl.verifier && !bannedPlayers.includes(lvl.verifier)) playerStats[lvl.verifier] = (playerStats[lvl.verifier] || 0) + parseFloat(getPoints(rank, 100, lvl.reqPercent));
      lvl.records.forEach(r => {
        if(!bannedPlayers.includes(r.player)) playerStats[r.player] = (playerStats[r.player] || 0) + parseFloat(getPoints(rank, r.percent, lvl.reqPercent));
      });
    });
    let sorted = Object.entries(playerStats).sort((a,b) => b[1] - a[1]);
    sorted.forEach((p, idx) => {
      const info = countryList.find(c => c.code === (playerAccounts[p[0]]||{}).country);
      const flag = info ? info.flag : '';
      html += `<div class="lb-row"><div style="width:40px; font-weight:bold;">#${idx+1}</div><div class="lb-name" onclick="openPlayer('${p[0]}')">${flag} ${p[0]}</div><div style="color:var(--text-muted);">${p[1].toFixed(2)}</div></div>`;
    });
  } else {
    let nationStats = {};
    Object.entries(playerAccounts).forEach(([name, acct]) => {
      if (bannedPlayers.includes(name)) return;
      const c = acct.country || 'other';
      nationStats[c] = nationStats[c] || 0;
    });
    const addTo = (name, pts) => {
      if (bannedPlayers.includes(name)) return;
      const c = (playerAccounts[name] || {}).country || 'other';
      nationStats[c] = (nationStats[c] || 0) + pts;
    };
    db.forEach((lvl, idx) => {
      const rank = idx + 1;
      if (lvl.verifier) addTo(lvl.verifier, parseFloat(getPoints(rank, 100, lvl.reqPercent)));
      lvl.records.forEach(r => addTo(r.player, parseFloat(getPoints(rank, r.percent, lvl.reqPercent))));
    });
    let sorted = Object.entries(nationStats).sort((a,b) => b[1]-a[1]);
    sorted.forEach(([code, pts], idx) => {
      const info = countryList.find(c => c.code === code) || {name:'Other / International', flag:'\uD83C\uDF10'};
      html += `<div class="lb-row"><div style="width:40px; font-weight:bold;">#${idx+1}</div><div class="lb-name">${info.flag} ${info.name}</div><div style="color:var(--text-muted);">${pts.toFixed(2)}</div></div>`;
    });
  }
  container.innerHTML = html + `</div>`;
}

function filterLB(val) {
  document.querySelectorAll('.lb-row').forEach(row => {
    row.style.display = row.querySelector('.lb-name').innerText.toLowerCase().includes(val.toLowerCase()) ? 'flex' : 'none';
  });
}

function openPlayer(name) {
  const acct = playerAccounts[name] || {};
  let score = 0, completed = [], hardest = null;

  db.forEach((lvl, idx) => {
    const rank = idx + 1;
    let isComplete = false;
    if (lvl.verifier === name) { isComplete = true; score += parseFloat(getPoints(rank, 100, lvl.reqPercent)); }
    let record = lvl.records.find(r => r.player === name);
    if (record) {
       score += parseFloat(getPoints(rank, record.percent, lvl.reqPercent));
       if (record.percent === 100) isComplete = true;
    }
    if (isComplete) { completed.push(lvl.name); if (!hardest) hardest = lvl.name; }
  });

  const flagInfo = countryList.find(c => c.code === acct.country);
  const flag = flagInfo ? flagInfo.flag : '';

  let pastRuns = '';
  if (acct.pastRoulettes && acct.pastRoulettes.length) {
    pastRuns = acct.pastRoulettes.map(r => {
      const resultText = r.result ? (' - ' + r.result) : (r.failed ? (' - Failed: ' + r.failed) : '');
      return `<div class="history-card"><b>Levels Cleared: ${r.score}</b> - Hardest: ${r.hardest}${resultText}</div>`;
    }).join('');
  } else {
    pastRuns = '<p>No saved runs.</p>';
  }

  let deleteBtn = (loggedInUser === name) ? `<button class="btn btn-danger" style="margin-top:20px; width:100%;" onclick="deleteAccount()">Delete My Account</button>` : '';

  document.getElementById('contentContainer').innerHTML = `
    <div class="detail-view" style="display:block;">
      <h1 style="text-align:center;">${flag} ${name}</h1>
      <div style="text-align:center; margin-bottom:20px;">Score: <b>${score.toFixed(2)}</b> | Hardest: <b>${hardest || 'None'}</b></div>
      <div style="border-top:1px dashed var(--border); padding-top:20px;">
        <h3>Past Roulette Runs</h3>${pastRuns}
      </div>
      ${deleteBtn}
    </div>
  `;
}

// --- Tab: Submit ---
function renderSubmit() {
  const container = document.getElementById('contentContainer');
  if (!loggedInUser) {
    container.innerHTML = `<div style="text-align:center; padding:40px; background:var(--card-bg);"><h2 style="margin-top:0;">Authentication Required</h2><p>You must be signed in to submit records or levels.</p><button class="btn btn-primary" onclick="openPlayerLogin()">Sign In</button></div>`;
    return;
  }

  let levelOpts = db.map(l => `<option value="${l.name}">${l.name}</option>`).join('');

  container.innerHTML = `
    <div style="background:var(--card-bg); padding:30px; border:1px solid var(--border);">
      <h2 style="margin-top:0;">Submit to Demonlist</h2>

      <div class="form-group"><label>Submission Type</label>
        <select id="subType"><option value="Completion">Record / Completion</option><option value="Verification">New Level / Verification</option></select>
      </div>
      <div class="form-group"><label>Level Name (Select existing or type new for verification)</label>
        <input type="text" id="subLevel" list="levelData" placeholder="Level name...">
        <datalist id="levelData">${levelOpts}</datalist>
      </div>
      <div class="form-group"><label>Progress (%)</label><input type="number" id="subProgress" placeholder="100" min="0" max="100"></div>
      <div class="form-group"><label>Personal Enjoyment (1-10)</label><input type="number" id="subEnjoy" placeholder="10" min="1" max="10"></div>
      <div class="form-group"><label>Video Proof URL</label><input type="text" id="subLink" placeholder="https://youtube.com/..."></div>

      <button class="btn btn-primary" onclick="submitData()">Send Submission</button>
    </div>
  `;
}

function submitData() {
  let sub = {
    id: Date.now(),
    user: loggedInUser,
    type: document.getElementById('subType').value,
    level: document.getElementById('subLevel').value,
    progress: document.getElementById('subProgress').value,
    enjoyment: document.getElementById('subEnjoy').value,
    link: document.getElementById('subLink').value,
    date: new Date().toLocaleString()
  };
  if(!sub.level || !sub.link) return alert("Missing required fields.");
  submissions.push(sub);
  saveState();
  alert("Submission sent to catalog for Mod review!");
  switchTab('list');
}

// --- Tab: Catalog (Changelog, Submissions Queue, Community Mgmt, Guidelines) ---
function renderCatalog() {
  const container = document.getElementById('contentContainer');

  let guidelinesEditBlock = '';
  if (isMod) {
    guidelinesEditBlock = `<textarea id="guidelinesEdit" style="display:none; width:100%; min-height:120px; margin-top:10px; padding:10px; font-family:inherit; border:1px solid var(--border); border-radius:4px;">${guidelinesText}</textarea>
      <button class="btn" style="margin-top:10px;" onclick="toggleGuidelinesEdit()" id="guidelinesEditBtn">Edit Guidelines</button>`;
  }

  let html = `<div style="background:var(--card-bg); padding:30px; border:1px solid var(--border); margin-bottom:20px;">
    <h2>Guidelines</h2>
    <div id="guidelinesDisplay" style="white-space:pre-wrap; line-height:1.6;">${guidelinesText}</div>
    ${guidelinesEditBlock}
  </div>`;

  html += `<div style="background:var(--card-bg); padding:30px; border:1px solid var(--border); margin-bottom:20px;"><h2>Public Changelog</h2><table class="catalog-table"><thead><tr><th>Date</th><th>Action</th><th>Type</th>${isMod?'<th>Mod Tools</th>':''}</tr></thead><tbody>`;

  changelog.forEach((log, index) => {
    html += `<tr><td>${log.date}</td><td>${log.action}</td><td>${log.type}</td>`;
    if (isMod) html += `<td><button class="btn btn-danger" style="padding:5px 10px; font-size:0.8rem;" onclick="revertAction(${index})">Revert/Delete</button></td>`;
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;

  if (isMod) {
    let subsHTML = '';
    if (submissions.length === 0) {
      subsHTML = '<p>No pending submissions.</p>';
    } else {
      submissions.forEach((s, idx) => {
        subsHTML += `<div class="history-card" style="background:#fff;">
          <b>User:</b> ${s.user} | <b>Type:</b> ${s.type} | <b>Level:</b> ${s.level} | <b>Progress:</b> ${s.progress}% | <b>Enjoyment:</b> ${s.enjoyment}/10<br>
          <b>Link:</b> <a href="${s.link}" target="_blank">${s.link}</a><br>
          <div style="margin-top:10px;">
            <button class="btn btn-success" onclick="resolveSub(${idx}, true)">Accept</button>
            <button class="btn btn-danger" onclick="resolveSub(${idx}, false)">Reject</button>
          </div>
        </div>`;
      });
    }
    html += `<div style="background:#fff3cd; padding:30px; border:1px solid #ffeeba; margin-bottom:20px;"><h2>Mod Submissions Queue</h2>${subsHTML}</div>`;

    html += `<div style="background:var(--card-bg); padding:30px; border:1px solid var(--border);">
      <h2>Manage Community</h2>
      <p style="color:var(--text-muted); font-size:0.85rem;">Rename a player or update their country. Leave "New Name" blank to only change country.</p>
      <div class="form-group"><label>Current Player Name</label><input type="text" id="cmOldName" placeholder="Exact current name"></div>
      <div class="form-group"><label>New Name</label><input type="text" id="cmNewName" placeholder="Leave blank for no change"></div>
      <div class="form-group"><label>Set Country</label><select id="cmCountry"></select></div>
      <button class="btn btn-primary" onclick="updatePlayerCommunity()">Apply Changes</button>
    </div>`;
  }
  container.innerHTML = html;
  if (isMod) populateCountrySelect(document.getElementById('cmCountry'), true);
}

function toggleGuidelinesEdit() {
  const display = document.getElementById('guidelinesDisplay');
  const edit = document.getElementById('guidelinesEdit');
  const btn = document.getElementById('guidelinesEditBtn');
  if (edit.style.display === 'none') {
    edit.style.display = 'block'; display.style.display = 'none'; btn.innerText = 'Save Guidelines';
  } else {
    guidelinesText = edit.value;
    localStorage.setItem('ptr_guidelines', guidelinesText);
    addLog('Guidelines updated', 'system');
    display.innerText = guidelinesText; display.style.display = 'block'; edit.style.display = 'none'; btn.innerText = 'Edit Guidelines';
  }
}

function updatePlayerCommunity() {
  const oldName = document.getElementById('cmOldName').value.trim();
  const newName = document.getElementById('cmNewName').value.trim();
  const country = document.getElementById('cmCountry').value;
  if (!oldName) return alert("Enter the player's current name.");

  if (newName && newName !== oldName) {
    if (playerAccounts[newName]) return alert('That name is already taken.');
    if (playerAccounts[oldName]) { playerAccounts[newName] = playerAccounts[oldName]; delete playerAccounts[oldName]; }
    db.forEach(lvl => {
      if (lvl.verifier === oldName) lvl.verifier = newName;
      if (lvl.publisher === oldName) lvl.publisher = newName;
      lvl.records.forEach(r => { if (r.player === oldName) r.player = newName; });
    });
    const banIdx = bannedPlayers.indexOf(oldName);
    if (banIdx !== -1) bannedPlayers[banIdx] = newName;
    if (loggedInUser === oldName) loggedInUser = newName;
    addLog(`Player Renamed: ${oldName} \u2192 ${newName}`, 'user');
  }
  if (country) {
    const target = (newName && newName !== oldName) ? newName : oldName;
    if (!playerAccounts[target]) playerAccounts[target] = { bestRoulette:0, pastRoulettes:[] };
    playerAccounts[target].country = country;
    addLog(`Nationality Updated: ${target} \u2192 ${country.toUpperCase()}`, 'user');
  }
  saveState();
  renderCatalog();
  renderUserStatus();
  alert('Player updated.');
}

function resolveSub(idx, accepted) {
  let s = submissions.splice(idx, 1)[0];
  if (accepted) {
    let target = db.find(l => l.name.toLowerCase() === s.level.toLowerCase());
    if (s.type === 'Completion' && target) {
      target.records.push({ player: s.user, percent: parseInt(s.progress), enjoyment: s.enjoyment, link: s.link });
      addLog(`Accepted record: ${s.user} on ${s.level} (${s.progress}%)`, "record");
    } else if (s.type === 'Verification' || !target) {
      db.unshift({
        name: s.level, publisher: s.user, verifier: s.user, creators: "Unknown", length: "Unknown", difficulty: "Extreme Demon", engine: "2.2", reqPercent: 50, image: "https://via.placeholder.com/600x220", records: []
      });
      addLog(`Added New Level: ${s.level} verified by ${s.user}`, "level");
    }
  }
  saveState();
  renderCatalog();
}

function revertAction(idx) {
  if(confirm("Are you sure? This will remove the log entry. (Manual database fix may be required depending on the action.)")) {
    changelog.splice(idx, 1);
    saveState();
    renderCatalog();
  }
}

// --- Tab: Roulette ---
function startRoulette() {
  roulette = { active: true, summary: false, victory: false, level: null, req: 0, score: 0, hardestBeaten: null, endReason: null, endPercent: null };
  nextRLevel();
}

function nextRLevel() {
  roulette.level = db[Math.floor(Math.random() * db.length)];
  roulette.req = Math.min(100, 10 + roulette.score);
  renderRoulette();
}

function submitRouletteAttempt() {
  const input = document.getElementById('rouletteAttempt');
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0 || val > 100) { alert('Enter a valid percent between 0 and 100.'); return; }
  if (val >= roulette.req) {
    const currentRank = db.indexOf(roulette.level) + 1;
    if (!roulette.hardestBeaten || currentRank < roulette.hardestBeaten.rank) roulette.hardestBeaten = { name: roulette.level.name, rank: currentRank };
    roulette.score += 1;
    if (roulette.score >= 100) { finishRoulette('victory'); return; }
    nextRLevel();
  } else {
    roulette.endPercent = val;
    finishRoulette('fell_short');
  }
}

function bankRoulette() { finishRoulette('banked'); }

function finishRoulette(reason) {
  roulette.active = false;
  roulette.summary = true;
  roulette.victory = (reason === 'victory');
  roulette.endReason = reason;
  if (loggedInUser) {
    const acct = playerAccounts[loggedInUser];
    acct.bestRoulette = Math.max(acct.bestRoulette || 0, roulette.score);
    if (!acct.pastRoulettes) acct.pastRoulettes = [];
    let resultText = reason === 'victory' ? '100 Levels Completed!' : reason === 'fell_short' ? `Fell short on ${roulette.level.name} (needed ${roulette.req}%, got ${roulette.endPercent}%)` : `Banked score on ${roulette.level.name}`;
    acct.pastRoulettes.push({ score: roulette.score, hardest: roulette.hardestBeaten ? roulette.hardestBeaten.name : 'None', result: resultText });
    saveState();
  }
  renderRoulette();
}

function renderRoulette() {
  const container = document.getElementById('contentContainer');
  const userBestHTML = loggedInUser ? `<p style="color:var(--accent-blue); font-weight:bold; margin-top:0;">Your Personal Best: ${(playerAccounts[loggedInUser].bestRoulette) || 0} levels</p>` : '';

  if (roulette.summary) {
    const hardestText = roulette.hardestBeaten ? `#${roulette.hardestBeaten.rank} - ${roulette.hardestBeaten.name}` : 'None';
    const headline = roulette.victory ? '\uD83C\uDF89 100 Levels Cleared!' : 'Run Over!';
    let detail;
    if (roulette.victory) {
      detail = `<p>You cleared all 100 rounds of the roulette. Incredible run!</p>`;
    } else if (roulette.endReason === 'fell_short') {
      detail = `<p><b>Fell short on:</b> ${roulette.level.name} \u2014 needed ${roulette.req}%, reached ${roulette.endPercent}%</p>`;
    } else {
      detail = `<p><b>Banked score on:</b> ${roulette.level.name}</p>`;
    }
    container.innerHTML = `
      <div style="background:var(--card-bg); padding:40px; text-align:center; border:1px solid var(--border);">
        <h1 style="margin:0 0 10px 0;">${headline}</h1>
        <div style="background:#f0f8ff; border:1px solid #b6d4fe; padding:20px; text-align:left; margin:20px 0;">
          <h3>Levels Cleared: ${roulette.score} / 100</h3>
          ${detail}
          <p><b>Hardest Level Beaten:</b> ${hardestText}</p>
        </div>
        ${userBestHTML}
        <button class="btn btn-primary" onclick="startRoulette()">Play Again</button>
      </div>`;
    return;
  }

  if (!roulette.active || !roulette.level) {
    container.innerHTML = `<div style="background:var(--card-bg); padding:40px; text-align:center; border:1px solid var(--border);">
        <h1 style="margin:0 0 10px 0;">Demon Roulette</h1>
        <p style="color:var(--text-muted);">Random levels, climbing difficulty. Type in the % you reach each round \u2014 clear all 100 rounds to complete it!</p>
        ${userBestHTML}
        <button class="btn btn-primary" style="margin-top:20px;" onclick="startRoulette()">Start Roulette</button>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="background:var(--card-bg); padding:40px; text-align:center; border:1px solid var(--border);">
      <div style="color:var(--text-muted); margin-bottom:10px;">Levels Cleared: <b>${roulette.score}</b> / 100</div>
      <div style="background:#f8f9fa; border:1px solid var(--border); padding:30px; margin-bottom:25px;">
        <h2>${roulette.level.name}</h2>
        <h1 style="margin:20px 0 0 0; color:var(--accent-blue); font-size:3rem;">${roulette.req}% required</h1>
      </div>
      <div class="form-group" style="max-width:220px;margin:0 auto 15px auto;">
        <label>% You Reached</label>
        <input type="number" id="rouletteAttempt" min="0" max="100" placeholder="e.g. 78">
      </div>
      <button class="btn btn-primary" onclick="submitRouletteAttempt()">Submit Attempt</button>
      <button class="btn btn-danger" onclick="bankRoulette()">Bank Score & Quit</button>
    </div>`;
}

// --- Authentication & Accounts ---
function openPlayerLogin() { document.getElementById('playerLoginModal').classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

async function loginPlayer() {
  const name = document.getElementById('playerName').value.trim();
  const email = document.getElementById('playerEmail').value.trim().toLowerCase();
  const pass = document.getElementById('playerPass').value;
  const country = document.getElementById('playerCountry').value;

  if (!name) return alert('Enter a username.');
  if (!pass) return alert('Enter a password.');

  if (!playerAccounts[name]) {
    if (!email) return alert('New accounts require an email address!');
    if (pass.length < 4) return alert('Password must be at least 4 characters.');
    let emailExists = Object.values(playerAccounts).some(acc => acc.email === email);
    if (emailExists) return alert('That email is already registered to another account.');
    const passHash = await hashPassword(pass);
    const langForCountry = (countryList.find(c => c.code === country) || {}).lang || 'en';
    playerAccounts[name] = { email, passHash, country: country || 'other', language: langForCountry, bestRoulette: 0, pastRoulettes: [] };
    addLog(`New Player Registered: ${name}`, "user");
    setLanguage(langForCountry);
  } else {
    const acct = playerAccounts[name];
    if (!acct.passHash) {
      acct.passHash = await hashPassword(pass);
      addLog(`Password set for existing account: ${name}`, 'user');
      saveState();
    } else {
      const passHash = await hashPassword(pass);
      if (acct.passHash !== passHash) return alert('Incorrect password.');
    }
    if (acct.language) setLanguage(acct.language);
  }

  loggedInUser = name;
  renderUserStatus();
  closeModal('playerLoginModal');
  if (currentTab === 'submit') renderSubmit();
}

function logoutPlayer() {
  loggedInUser = null;
  renderUserStatus();
  if (currentTab === 'submit') switchTab('list');
}

function deleteAccount() {
  if (!loggedInUser) return;
  if (confirm("Are you SURE you want to delete your account? Your username will be freed and you will be removed from the Stats Viewer. Your existing records on the list will stay, same as any other player's history.")) {
    const name = loggedInUser;
    logoutPlayer();
    delete playerAccounts[name];
    addLog(`Account Deleted: ${name}`, "user");
    saveState();
    alert('Your account has been deleted and you have been logged out.');
    switchTab('list');
  }
}

// --- Audit & Mod ---
function renderAudit() {
  document.getElementById('contentContainer').innerHTML = `
    <div style="background:var(--card-bg); padding:30px; border:1px solid var(--border);">
      <h2>Audit & Ban Management</h2>
      <div style="display:flex; gap:10px; margin-bottom:20px;">
        <input type="text" id="banInput" class="search-bar" style="margin:0;" placeholder="Exact player name to ban...">
        <button class="btn btn-danger" onclick="banPlayer()">Ban</button>
      </div>
      <p><b>Banned:</b> ${bannedPlayers.join(', ') || 'None'}</p>
      <p style="color:var(--text-muted); font-size:0.85rem; border-top:1px dashed var(--border); padding-top:15px; margin-top:15px;">
        This bans a name/account from the leaderboard and record lists. A true device/IP-level ban that blocks someone everywhere isn't possible on a site built this way (no server) \u2014 see Claude's note in the chat about this.
      </p>
    </div>`;
}

function banPlayer() {
  let val = document.getElementById('banInput').value.trim();
  if(val && !bannedPlayers.includes(val)) {
    bannedPlayers.push(val);
    addLog(`Banned Player: ${val}`, "ban");
    renderAudit();
  }
}

async function verifyMod() {
  const entered = document.getElementById('modSecret').value;
  const hash = await hashPassword(entered);
  if (hash === MOD_PASS_HASH) {
    isMod = true; document.body.classList.add('mod-active');
    closeModal('loginModal'); switchTab(currentTab);
  } else alert("Incorrect passcode.");
}

function logoutStaff() { isMod = false; document.body.classList.remove('mod-active'); switchTab('list'); }

// Init - Now fetches from data.json!
async function initApp() {
  try {
    const res = await fetch('data.json', { cache: 'no-store' });
    const fetchedDB = await res.json();
    
    // Check if the user already has data saved to their local browser.
    // If they do, keep it so their history/time machine doesn't break! 
    // Otherwise, use the fresh data from data.json.
    db = JSON.parse(localStorage.getItem('ptr_db'));
    if (!db || db.length === 0) {
      db = fetchedDB;
    }

    if (dbHistory.length === 0) {
      dbHistory.push({ isoDate: (changelog[changelog.length-1] && changelog[changelog.length-1].isoDate) || new Date().toISOString(), db: JSON.parse(JSON.stringify(db)) });
    }
  } catch (err) {
    console.error("Could not load data.json. If you are previewing locally, this is expected.", err);
    db = JSON.parse(localStorage.getItem('ptr_db')) || [];
  }

  populateCountrySelect(document.getElementById('playerCountry'), false);
  renderNav();
  renderList();
}

document.addEventListener('DOMContentLoaded', initApp);
