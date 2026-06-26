// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let currentUser = null;
let users = [];

// Progress tracking: maps user email to module completion data
let userProgress = {};

let unlockedBadges = [];
let userAnalytics = {
  cpp_downloads: 0,
  lab_time: 0,
  weekly_activity: [0, 0, 0, 0, 0, 0, 0],
  recent_activity: [],
  shapesDrawn: 0
};

let currentGate = 'AND';
let inA = 0, inB = 0;
let activeModal = '';

// ════════════════════════════════════════
//  NAVIGATION HISTORY
// ════════════════════════════════════════
let navigationHistory = ['dashboard']; // Track visited sections
let currentSection = 'dashboard';

function goBack() {
  if (navigationHistory.length > 1) {
    navigationHistory.pop(); // Remove current
    const prevSection = navigationHistory[navigationHistory.length - 1];
    const navItem = findNavItemBySection(prevSection);
    showSection(prevSection, navItem);
  } else {
    // If at root, go to dashboard
    const navItem = findNavItemBySection('dashboard');
    showSection('dashboard', navItem);
  }
}

function findNavItemBySection(sectionId) {
  const sectionMap = {
    'dashboard': 0, 'gates': 5, 'combinational': 6, 'sequential': 7, 
    'truthtable': 8, 'circuit': 9, 'drawing': 12, 'transform2d': 13, 
    'transform3d': 14, 'clipping': 15, 'curves': 16, 'progress': 17, 
    'badges': 18, 'admin': 19
  };
  const index = sectionMap[sectionId];
  return document.querySelectorAll('.nav-item')[index] || null;
}

function updateBackButton() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.style.opacity = navigationHistory.length > 1 ? '1' : '0.3';
    backBtn.style.pointerEvents = navigationHistory.length > 1 ? 'auto' : 'none';
  }
}


// Load users from localStorage on startup
function loadUsers() {
  // No-op - we use Flask database
}

function saveUsers() {
  // No-op - we use Flask database
}

function restoreSession() {
  try {
    const saved = localStorage.getItem('currentUser');
    const token = localStorage.getItem('virtulab_token');
    if (saved && token) {
      currentUser = JSON.parse(saved);
      launchApp();
      return true;
    }
  } catch (e) {
    console.warn('Could not restore session', e);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('virtulab_token');
  }
  return false;
}

function initializeUserProgress() {
  // No-op - we use Flask database
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
function showSignup() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('forgotForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  document.getElementById('authTitle').textContent = 'Create Account';
  document.getElementById('authSub').textContent = 'Join the Virtual Lab';
}

function showLogin() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('forgotForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('authTitle').textContent = 'Welcome Back';
  document.getElementById('authSub').textContent = 'Sign in to your laboratory account';
}

function showForgot() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('forgotForm').classList.remove('hidden');
  document.getElementById('authTitle').textContent = 'Reset Password';
  document.getElementById('authSub').textContent = 'Enter your registered email';
}

async function doLogin() {
  const id = document.getElementById('loginId').value;
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  
  if (!id || !pass) {
    err.textContent = 'Please enter email/roll and password.';
    return;
  }
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: id, password: pass })
    });
    const data = await response.json();
    if (!response.ok) {
      err.textContent = data.error || 'Login failed.';
      return;
    }
    
    currentUser = {
      name: data.user.name,
      roll: data.user.roll_number,
      email: data.user.email,
      id: data.user.id
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('virtulab_token', data.token);
    document.cookie = `virtulab_token=${data.token}; path=/; max-age=${24 * 3600}; SameSite=Lax`;
    
    await launchApp();
  } catch (e) {
    err.textContent = 'Connection error: ' + e.message;
  }
}

async function adminLogin() {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'password' })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = {
        name: data.user.name,
        roll: data.user.roll_number,
        email: data.user.email,
        id: data.user.id
      };
    } else {
      currentUser = { name: 'Dr. Admin', roll: 'ADMIN', email: 'admin@college.edu', id: 0 };
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    launchApp();
    setTimeout(() => showSection('admin', document.querySelector('.nav-item:last-child')), 100);
  } catch (e) {
    currentUser = { name: 'Dr. Admin', roll: 'ADMIN', email: 'admin@college.edu', id: 0 };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    launchApp();
    setTimeout(() => showSection('admin', document.querySelector('.nav-item:last-child')), 100);
  }
}

async function doSignup() {
  const name = document.getElementById('regName').value;
  const roll = document.getElementById('regRoll').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const msg = document.getElementById('signupMsg');

  if (!name || !roll || !email || !pass) { 
    msg.style.color = 'var(--danger)'; 
    msg.textContent = 'Please fill all fields.'; 
    return; 
  }
  
  if (pass !== pass2) { 
    msg.style.color = 'var(--danger)'; 
    msg.textContent = 'Passwords do not match.'; 
    return; 
  }
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, roll_number: roll, email, password: pass })
    });
    const data = await response.json();
    if (!response.ok) {
      msg.style.color = 'var(--danger)';
      msg.textContent = data.error || 'Signup failed.';
      return;
    }
    
    msg.style.color = 'var(--accent3)';
    msg.textContent = 'Account created successfully. Please log in to continue.';
    
    document.getElementById('regName').value = '';
    document.getElementById('regRoll').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regPass2').value = '';

    setTimeout(() => showLogin(), 1500);
  } catch (e) {
    msg.style.color = 'var(--danger)';
    msg.textContent = 'Connection error: ' + e.message;
  }
}

async function launchApp() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('hidden');
  document.getElementById('sideUser').textContent = currentUser.name;
  document.getElementById('sideRoll').textContent = currentUser.roll;
  document.getElementById('sideAvatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
  
  updateBackButton();
  
  // Load saved per-user progress, badges, and analytics from database
  await loadUserData();
  
  if(typeof initActivityChart === 'function') initActivityChart();
  if(typeof initSRWaveform === 'function') initSRWaveform();
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('virtulab_token');
  document.cookie = "virtulab_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.getElementById('appPage').classList.add('hidden');
  document.getElementById('authPage').classList.remove('hidden');
  showLogin();
  document.getElementById('loginId').value = '';
  document.getElementById('loginPass').value = '';
}

// ════════════════════════════════════════
//  PROGRESS TRACKING
// ════════════════════════════════════════
function updateProgressDisplay() {
  if (!currentUser) return;
  
  // Calculate DELD progress percentage
  const gates = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];
  const gateCompleted = gates.filter(g => gateCompletion[g]).length;
  
  const deldSections = Object.values(deldCompletion);
  const sectionsCompleted = deldSections.filter(s => s === true).length;
  
  const totalDELDItems = gates.length + deldSections.length;
  const completedDELDItems = gateCompleted + sectionsCompleted;
  
  const deldProgressPct = Math.round((completedDELDItems / totalDELDItems) * 100);
  
  // Update DELD progress in UI
  const deldFill = document.getElementById('deld-progress');
  const deldText = document.getElementById('deld-text');
  if (deldFill) {
    deldFill.style.width = deldProgressPct + '%';
    if (deldText) deldText.textContent = deldProgressPct + '% complete';
  }
  
  // Calculate CG progress percentage
  const cgSections = Object.values(cgCompletion);
  const completedCGItems = cgSections.filter(s => s === true).length;
  const totalCGItems = cgSections.length;
  
  const cgProgressPct = totalCGItems > 0 ? Math.round((completedCGItems / totalCGItems) * 100) : 0;
  
  // Update CG progress in UI
  const cgFill = document.getElementById('cg-progress');
  const cgText = document.getElementById('cg-text');
  if (cgFill) {
    cgFill.style.width = cgProgressPct + '%';
    if (cgText) cgText.textContent = cgProgressPct + '% complete';
  }

  // Update top dashboard stats (experiments done and lab time)
  const cards = document.querySelectorAll('#sec-dashboard .stats-grid .card');
  if (cards && cards.length >= 4) {
    // Experiments Done (card 0)
    try {
      const expDone = gateCompleted + sectionsCompleted;
      const totalExp = 24;
      const statVal = cards[0].querySelector('.stat-val');
      const statLabel = cards[0].querySelector('.stat-label');
      const fill = cards[0].querySelector('.progress-fill');
      if (statVal) statVal.textContent = expDone;
      if (statLabel) statLabel.textContent = `of ${totalExp} total`;
      if (fill) fill.style.width = ((totalExp>0)?Math.round((expDone/totalExp)*100):0) + '%';
    } catch (e) { console.warn('Error updating experiments done UI', e); }

    // Lab Time (card 3)
    try {
      const labTime = userAnalytics.lab_time || 0;
      const labGoal = 40;
      const statVal = cards[3].querySelector('.stat-val');
      const fill = cards[3].querySelector('.progress-fill');
      if (statVal) statVal.textContent = labTime + 'h';
      if (fill) fill.style.width = Math.min(Math.round((labTime / labGoal) * 100), 100) + '%';
    } catch (e) { console.warn('Error updating lab time UI', e); }
  }

  // Also update top DELD/CG stat values and their small progress fills
  try {
    const deldCard = document.querySelector('#sec-dashboard .stats-grid .card:nth-child(2)');
    const cgCard = document.querySelector('#sec-dashboard .stats-grid .card:nth-child(3)');
    if (deldCard) {
      const statVal = deldCard.querySelector('.stat-val');
      const fill = deldCard.querySelector('.progress-fill');
      if (statVal) statVal.textContent = deldProgressPct + '%';
      if (fill) fill.style.width = deldProgressPct + '%';
    }
    if (cgCard) {
      const statVal = cgCard.querySelector('.stat-val');
      const fill = cgCard.querySelector('.progress-fill');
      if (statVal) statVal.textContent = cgProgressPct + '%';
      if (fill) fill.style.width = cgProgressPct + '%';
    }
  } catch (e) { console.warn('Error updating DELD/CG top cards', e); }
}

function updateModuleProgress(module, increment) {
}

function setModuleProgress(module, percentage) {
}

function getModuleProgress(module) {
  return 0;
}

function completeTask(module, taskName) {
  if (!currentUser) return;
  
  userAnalytics.lab_time = (userAnalytics.lab_time || 0) + 1;
  
  trackActivity('completed', `Task completed: ${taskName}`, module.toUpperCase());
  syncUserData();
}

// Real-time activity tracking system
function trackActivity(type, description, module) {
  if (!currentUser) return;
  
  const activity = {
    type: type,
    description: description,
    module: module,
    timestamp: new Date().toLocaleTimeString(),
    user: currentUser.email
  };
  
  if (!userAnalytics.recent_activity) userAnalytics.recent_activity = [];
  userAnalytics.recent_activity.unshift(activity);
  if (userAnalytics.recent_activity.length > 10) userAnalytics.recent_activity.pop();
  
  updateRecentActivityDisplay();
}

function updateRecentActivityDisplay() {
  const activityContainer = document.querySelector('#sec-dashboard .card:last-child div:last-child');
  if (!activityContainer || !userAnalytics.recent_activity) return;
  
  let html = '';
  for (let i = 0; i < Math.min(5, userAnalytics.recent_activity.length); i++) {
    const activity = userAnalytics.recent_activity[i];
    const iconMap = { 'completed': '✅', 'started': '▶', 'explored': '🔍', 'generated': '📝' };
    const icon = iconMap[activity.type] || '•';
    const time = activity.timestamp;
    html += `<div>${icon} <span style="color:var(--muted);">${activity.description}</span> <span style="color:var(--muted2);font-size:0.75rem;">${time}</span></div>`;
  }
  
  if (html) activityContainer.innerHTML = html;
}

// Reset current user's progress to zero
async function resetMyProgress() {
  if (!currentUser) return alert('No user session found.');
  const ok = confirm('Reset all your module progress to 0%? This action cannot be undone.');
  if (!ok) return;

  for (const g in gateCompletion) gateCompletion[g] = false;
  for (const s in deldCompletion) deldCompletion[s] = false;
  for (const s in cgCompletion) cgCompletion[s] = false;
  
  unlockedBadges = [];
  userAnalytics = {
    cpp_downloads: 0,
    lab_time: 0,
    weekly_activity: [0, 0, 0, 0, 0, 0, 0],
    recent_activity: [],
    shapesDrawn: 0
  };

  await syncUserData();

  // Clear checkboxes UI
  document.querySelectorAll('.check-circle.done').forEach(el => { el.classList.remove('done'); el.textContent = ''; });
  document.querySelectorAll('.topic-item.done').forEach(el => el.classList.remove('done'));
  // Convert green "Done" tags back to warning/not-started
  document.querySelectorAll('.tag.tag-green').forEach(el => {
    el.classList.remove('tag-green');
    el.classList.add('tag-warn');
    if (/done/i.test(el.textContent)) el.textContent = 'Pending';
  });

  const btn = document.getElementById('resetProgressBtn');
  if (btn) {
    btn.textContent = 'Progress reset';
    setTimeout(() => btn.textContent = 'Reset my progress', 1600);
  }

  // Clear recent activity log and UI
  const activityContainer = document.querySelector('#sec-dashboard .card:last-child div:last-child');
  if (activityContainer) activityContainer.innerHTML = '';
  
  // Reset weekly activity chart to zeros
  try {
    initActivityChart([0,0,0,0,0,0,0]);
  } catch (e) { console.warn('Could not reset activity chart', e); }
  if (userProgress[currentUser.email]) {
    userProgress[currentUser.email].experimentsDone = 0;
    userProgress[currentUser.email].labTime = 0;
    try { localStorage.setItem('userProgress_' + currentUser.email, JSON.stringify(userProgress[currentUser.email])); } catch (e) { console.warn('Could not persist reset progress', e); }
  }
  alert('Your progress has been reset to 0%');
}


// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
function showSection(id, el) {
  document.querySelectorAll('main section').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('fade-in');
  });

  let sec;
  if (id.startsWith('cg-')) {
    sec = document.getElementById('sec-cg-iframe');
  } else {
    sec = document.getElementById('sec-' + id);
  }

  if (sec) {
    sec.classList.remove('hidden');
    setTimeout(() => sec.classList.add('fade-in'), 10);
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  // Track navigation history
  if (currentSection !== id) {
    navigationHistory.push(id);
    currentSection = id;
    updateBackButton();
    
    // Update URL without reload
    window.history.pushState({ section: id }, '', `?module=${id}`);
  }

  // Note: Progress is now updated only via checkmark toggles

  // Init sub-modules
  if (id === 'gates') { renderGateSVG(); renderTruthTable(); }
  if (id === 'truthtable') { genTruthTable(); }
  if (id === 'circuit') { initCircuitCanvas(); }
  if (id === 'ar-simulation') { /* AR section ready — no extra init needed */ }
  // CG sections
  if (id.startsWith('cg-')) {
    const panelMap = {
      'cg-lines': 'panel-cg-lines',
      'cg-circle': 'panel-cg-circle',
      'cg-2d': 'panel-cg-2d',
      'cg-3d': 'panel-cg-3d',
      'cg-clip': 'panel-cg-clip',
      'cg-bezier': 'panel-cg-bezier',
      'cg-anim': 'panel-cg-anim'
    };
    const targetPanel = panelMap[id];
    if (targetPanel) {
      const iframe = document.getElementById('cgIframe');
      if (iframe) {
        try {
          if (iframe.contentWindow && typeof iframe.contentWindow.showPanel === 'function') {
            iframe.contentWindow.showPanel(targetPanel);
          } else {
            iframe.src = `/cg.html?embed=true&v=1.0.1&panel=${targetPanel}`;
          }
        } catch (e) {
          iframe.src = `/cg.html?embed=true&v=1.0.1&panel=${targetPanel}`;
        }
      }
    }
  }
}

function setTab(id, el) {
  document.querySelectorAll('[id^="tab-"]').forEach(t => t.classList.add('hidden'));
  document.getElementById('tab-' + id).classList.remove('hidden');
  document.querySelectorAll('#sec-combinational .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  
  trackActivity('explored', `${id.charAt(0).toUpperCase() + id.slice(1)} Circuit`, 'DELD');
}

function setFFTab(id, el) {
  document.querySelectorAll('[id^="ff-"]').forEach(t => t.classList.add('hidden'));
  document.getElementById('ff-' + id).classList.remove('hidden');
  document.querySelectorAll('#sec-sequential .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  
  trackActivity('explored', `${id.toUpperCase()} Flip-Flop`, 'DELD');
}

function setCGTab(id, el) {
  ['dda','bresenham','midcircle'].forEach(t => {
    document.getElementById('cg-' + t).classList.add('hidden');
  });
  document.getElementById('cg-' + id).classList.remove('hidden');
  document.querySelectorAll('#sec-drawing .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  setTimeout(() => { 
    if(id==='dda') drawDDA();
    if(id==='bresenham') drawBresenham();
    if(id==='midcircle') drawCircle();
  }, 30);
  
  const algorithmNames = { dda: 'DDA Algorithm', bresenham: 'Bresenham Algorithm', midcircle: 'Midpoint Circle Algorithm' };
  trackActivity('explored', algorithmNames[id] || id, 'CG');
}

function set2DTab(id, el) {
  const tabs = ['translate','rotate','scale','reflect','shear'];
  document.querySelectorAll('#sec-transform2d .tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  init2DTransform(id);
}

// ════════════════════════════════════════
//  ACTIVITY CHART
// ════════════════════════════════════════
function initActivityChart() {
  // default weekly data if not provided
  const defaultData = [20,45,30,80,60,90,55];
  const data = arguments.length && arguments[0] ? arguments[0] : defaultData;
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const wrap = document.getElementById('activityChart');
  wrap.innerHTML = '';
  data.forEach((v, i) => {
    const col = document.createElement('div');
    col.className = 'bar-col';
    const h = Math.round(v * 0.9) + 'px';
    col.innerHTML = `<div class="bar" style="height:${h};background:${i===5?'var(--accent)':'var(--accent2)'}"></div><div class="bar-lbl">${labels[i]}</div>`;
    wrap.appendChild(col);
  });
}

// ════════════════════════════════════════
//  GATE SIMULATOR
// ════════════════════════════════════════
const gateLogic = {
  AND: (a,b) => a & b, OR: (a,b) => a | b, NOT: (a) => a^1, NAND: (a,b) => (a&b)^1,
  NOR: (a,b) => (a|b)^1, XOR: (a,b) => a^b, XNOR: (a,b) => (a^b)^1, BUFFER: (a) => a
};

const gateCompletion = {
  AND: false, OR: false, NOT: false, NAND: false,
  NOR: false, XOR: false, XNOR: false, BUFFER: false
};

// Track which gates have been explored to avoid duplicate progress increases
const exploredGates = new Set();

// ════════════════════════════════════════
// SECTION COMPLETION TRACKING (ALL MODULES)
// ════════════════════════════════════════

// DELD Module: All sections and sub-sections
const deldCompletion = {
  // Logic Gates (8 gates - tracked separately in gateCompletion)
  // Combinational Circuits (5 subsections)
  halfAdder: false,
  fullAdder: false,
  mux: false,
  decoder: false,
  encoder: false,
  // Sequential Circuits (4 subsections)
  sr: false,
  jk: false,
  d: false,
  t: false,
  // Truth Table (1 section)
  truthtable: false,
  // Circuit Builder (1 section)
  circuit: false
};

// CG Module: All sections and sub-sections
// CG Module: All sections and sub-sections
const cgCompletion = {
  // Line & Shape Drawing (3 subsections)
  dda: false,
  bresenham: false,
  midcircle: false,
  // 2D Transforms (5 subsections)
  translate: false,
  rotate: false,
  scale: false,
  reflect: false,
  shear: false,
  transform3d: false,
  clipping: false,
  polygonClipping: false,
  bezier: false,
  bspline: false,
  animation: false
};

function toggleSectionCompletion(sectionId, event) {
  event.stopPropagation();
  
  const checkCircle = event.target;
  let moduleCompletion = deldCompletion;
  let moduleName = 'deld';
  
  // Determine which module this section belongs to
  if (cgCompletion.hasOwnProperty(sectionId)) {
    moduleCompletion = cgCompletion;
    moduleName = 'cg';
  }
  
  // Toggle the section completion state
  moduleCompletion[sectionId] = !moduleCompletion[sectionId];
  
  // Update visual state
  if (moduleCompletion[sectionId]) {
    checkCircle.classList.add('done');
    checkCircle.textContent = '✓';
  } else {
    checkCircle.classList.remove('done');
    checkCircle.textContent = '';
  }
  
  updateProgressDisplay();
  updateTopicListUI();
  updateBadgesUI();
  syncUserData();
}

function updateDELDProgress() {
  updateProgressDisplay();
}

function updateCGProgress() {
  updateProgressDisplay();
}

function toggleGateCompletion(gateName, event) {
  event.stopPropagation();
  gateCompletion[gateName] = !gateCompletion[gateName];
  
  const checkCircle = event.target;
  
  if (gateCompletion[gateName]) {
    checkCircle.classList.add('done');
    checkCircle.textContent = '✓';
  } else {
    checkCircle.classList.remove('done');
    checkCircle.textContent = '';
  }
  
  updateProgressDisplay();
  updateTopicListUI();
  updateBadgesUI();
  syncUserData();
}

function updateGatesCompletion() {
  updateProgressDisplay();
}

function restoreCheckboxesUI() {
  document.querySelectorAll('.check-circle').forEach(span => {
    const onclickStr = span.getAttribute('onclick') || '';
    if (onclickStr.includes('toggleGateCompletion')) {
      const match = onclickStr.match(/'([^']+)'/);
      if (match && match[1]) {
        const gate = match[1];
        if (gateCompletion[gate]) {
          span.classList.add('done');
          span.textContent = '✓';
        } else {
          span.classList.remove('done');
          span.textContent = '';
        }
      }
    } else if (onclickStr.includes('toggleSectionCompletion')) {
      const match = onclickStr.match(/'([^']+)'/);
      if (match && match[1]) {
        const section = match[1];
        const isCg = cgCompletion.hasOwnProperty(section);
        const isCompleted = isCg ? cgCompletion[section] : deldCompletion[section];
        if (isCompleted) {
          span.classList.add('done');
          span.textContent = '✓';
        } else {
          span.classList.remove('done');
          span.textContent = '';
        }
      }
    }
  });
}

function updateTopicListUI() {
  const deldList = document.querySelectorAll('#sec-progress .row .col:first-child .topic-list .topic-item');
  const cgList = document.querySelectorAll('#sec-progress .row .col:last-child .topic-list .topic-item');
  
  const deldTopicsCompleted = [
    gateCompletion.AND && gateCompletion.OR && gateCompletion.NOT,
    gateCompletion.NAND && gateCompletion.NOR,
    gateCompletion.XOR && gateCompletion.XNOR,
    deldCompletion.halfAdder,
    deldCompletion.fullAdder,
    deldCompletion.mux,
    deldCompletion.sr,
    deldCompletion.jk,
    deldCompletion.d,
    deldCompletion.t,
    deldCompletion.encoder && deldCompletion.decoder,
    deldCompletion.circuit
  ];
  
  deldTopicsCompleted.forEach((isDone, idx) => {
    const li = deldList[idx];
    if (li) {
      const circle = li.querySelector('.check-circle');
      const tag = li.querySelector('.tag');
      if (isDone) {
        li.classList.add('done');
        if (circle) { circle.classList.add('done'); circle.textContent = '✓'; }
        if (tag) { tag.className = 'tag tag-green'; tag.textContent = 'Done'; }
      } else {
        li.classList.remove('done');
        if (circle) { circle.classList.remove('done'); circle.textContent = ''; }
        if (tag) { tag.className = 'tag tag-warn'; tag.textContent = 'Pending'; }
      }
    }
  });

  const cgTopicsCompleted = [
    cgCompletion.dda,
    cgCompletion.bresenham,
    cgCompletion.midcircle,
    cgCompletion.translate,
    cgCompletion.rotate,
    cgCompletion.scale && cgCompletion.shear,
    cgCompletion.transform3d,
    cgCompletion.clipping,
    cgCompletion.polygonClipping,
    cgCompletion.bezier,
    cgCompletion.bspline,
    cgCompletion.animation
  ];

  cgTopicsCompleted.forEach((isDone, idx) => {
    const li = cgList[idx];
    if (li) {
      const circle = li.querySelector('.check-circle');
      const tag = li.querySelector('.tag');
      if (isDone) {
        li.classList.add('done');
        if (circle) { circle.classList.add('done'); circle.textContent = '✓'; }
        if (tag) { tag.className = 'tag tag-green'; tag.textContent = 'Done'; }
      } else {
        li.classList.remove('done');
        if (circle) { circle.classList.remove('done'); circle.textContent = ''; }
        if (tag) { tag.className = 'tag tag-warn'; tag.textContent = 'Pending'; }
      }
    }
  });

  const deldDoneCount = deldTopicsCompleted.filter(Boolean).length;
  const cgDoneCount = cgTopicsCompleted.filter(Boolean).length;
  
  const progressCards = document.querySelectorAll('#sec-progress .stats-grid .card');
  if (progressCards && progressCards.length >= 3) {
    const val0 = progressCards[0].querySelector('.stat-val');
    const fill0 = progressCards[0].querySelector('.progress-fill');
    if (val0) val0.textContent = `${deldDoneCount}/12`;
    if (fill0) fill0.style.width = Math.round((deldDoneCount / 12) * 100) + '%';
    
    const val1 = progressCards[1].querySelector('.stat-val');
    const fill1 = progressCards[1].querySelector('.progress-fill');
    if (val1) val1.textContent = `${cgDoneCount}/12`;
    if (fill1) fill1.style.width = Math.round((cgDoneCount / 12) * 100) + '%';
    
    const val2 = progressCards[2].querySelector('.stat-val');
    const fill2 = progressCards[2].querySelector('.progress-fill');
    if (val2) val2.textContent = userAnalytics.cpp_downloads;
    if (fill2) fill2.style.width = Math.min(Math.round((userAnalytics.cpp_downloads / 20) * 100), 100) + '%';
  }
}

function updateBadgesUI() {
  const badgeCards = document.querySelectorAll('#sec-badges .badges-grid .badge-card');
  let earnedCount = 0;
  
  const checkUnlock = (name, condition) => {
    if (condition && !unlockedBadges.includes(name)) {
      unlockedBadges.push(name);
      trackActivity('completed', `Earned Badge: ${name}`, 'GENERAL');
      syncUserData();
    }
  };
  
  const deldTopicsCompleted = [
    gateCompletion.AND && gateCompletion.OR && gateCompletion.NOT,
    gateCompletion.NAND && gateCompletion.NOR,
    gateCompletion.XOR && gateCompletion.XNOR,
    deldCompletion.halfAdder,
    deldCompletion.fullAdder,
    deldCompletion.mux,
    deldCompletion.sr,
    deldCompletion.jk,
    deldCompletion.d,
    deldCompletion.t,
    deldCompletion.encoder && deldCompletion.decoder,
    deldCompletion.circuit
  ];
  const cgTopicsCompleted = [
    cgCompletion.dda,
    cgCompletion.bresenham,
    cgCompletion.midcircle,
    cgCompletion.translate,
    cgCompletion.rotate,
    cgCompletion.scale && cgCompletion.shear,
    cgCompletion.transform3d,
    cgCompletion.clipping,
    cgCompletion.polygonClipping,
    cgCompletion.bezier,
    cgCompletion.bspline,
    cgCompletion.animation
  ];
  const deldDoneCount = deldTopicsCompleted.filter(Boolean).length;
  const cgDoneCount = cgTopicsCompleted.filter(Boolean).length;

  checkUnlock("Logic Master", gateCompletion.AND && gateCompletion.OR && gateCompletion.NOT && gateCompletion.NAND && gateCompletion.NOR && gateCompletion.XOR && gateCompletion.XNOR && gateCompletion.BUFFER);
  checkUnlock("Adder Pro", deldCompletion.halfAdder && deldCompletion.fullAdder);
  checkUnlock("Flip-Flop Expert", deldCompletion.sr && deldCompletion.jk && deldCompletion.d && deldCompletion.t);
  checkUnlock("Pixel Artist", (userAnalytics.shapesDrawn || 0) >= 5);
  checkUnlock("Transform Pro", cgCompletion.translate && cgCompletion.rotate && cgCompletion.scale && cgCompletion.reflect && cgCompletion.shear);
  checkUnlock("Clip Specialist", cgCompletion.clipping || cgCompletion.polygonClipping);
  checkUnlock("3D Explorer", cgCompletion.transform3d);
  checkUnlock("Lab Champion", deldDoneCount === 12 && cgDoneCount === 12);

  badgeCards.forEach(card => {
    const nameEl = card.querySelector('.badge-name');
    if (nameEl) {
      const name = nameEl.textContent.trim();
      const isEarned = unlockedBadges.includes(name);
      if (isEarned) {
        card.className = 'badge-card earned';
        earnedCount++;
      } else {
        card.className = 'badge-card badge-locked';
      }
    }
  });

  const alertEl = document.querySelector('#sec-badges .alert');
  if (alertEl) {
    alertEl.textContent = `You've earned ${earnedCount} out of 8 badges! Keep experimenting to unlock more.`;
  }
}

async function syncUserData() {
  if (!currentUser || !localStorage.getItem('virtulab_token')) return;
  
  const progressRecords = [];
  const addProgress = (title, status, score = 100) => {
    const titleMap = {
      "AND": 1, "OR": 2, "NOT": 3, "NAND": 4, "NOR": 5, "XOR": 6, "XNOR": 7, "BUFFER": 8,
      "halfAdder": 9, "fullAdder": 10, "mux": 11, "decoder": 12, "encoder": 13,
      "sr": 14, "jk": 15, "d": 16, "t": 17,
      "dda": 18, "bresenham": 19, "midcircle": 20, "translate": 21, "transform3d": 22, "clipping": 23, "bezier": 24
    };
    const id = titleMap[title];
    if (id) {
      progressRecords.push({ experiment_id: id, status: status ? 'completed' : 'not_started', score: score });
    }
  };

  for (const g in gateCompletion) { addProgress(g, gateCompletion[g]); }
  for (const s in deldCompletion) { addProgress(s, deldCompletion[s]); }
  for (const s in cgCompletion) { addProgress(s, cgCompletion[s]); }

  const syncPayload = {
    progress: progressRecords,
    badges: unlockedBadges,
    analytics: userAnalytics
  };

  try {
    const token = localStorage.getItem('virtulab_token');
    await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(syncPayload)
    });
  } catch (e) {
    console.warn('Sync failed', e);
  }
}

async function loadUserData() {
  const token = localStorage.getItem('virtulab_token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/user/sync', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    if (!response.ok) return;
    const data = await response.json();
    
    unlockedBadges = data.badges || [];
    if (data.analytics) {
      userAnalytics = data.analytics;
    }
    
    for (const g in gateCompletion) gateCompletion[g] = false;
    for (const s in deldCompletion) deldCompletion[s] = false;
    for (const s in cgCompletion) cgCompletion[s] = false;
    
    const titleMapRev = {
      1: "AND", 2: "OR", 3: "NOT", 4: "NAND", 5: "NOR", 6: "XOR", 7: "XNOR", 8: "BUFFER",
      9: "halfAdder", 10: "fullAdder", 11: "mux", 12: "decoder", 13: "encoder",
      14: "sr", 15: "jk", 16: "d", 17: "t",
      18: "dda", 19: "bresenham", 20: "midcircle", 21: "translate", 22: "transform3d", 23: "clipping", 24: "bezier"
    };

    if (data.progress) {
      data.progress.forEach(p => {
        const key = titleMapRev[p.experiment_id];
        if (key) {
          const isCompleted = p.status === 'completed';
          if (gateCompletion.hasOwnProperty(key)) {
            gateCompletion[key] = isCompleted;
          } else if (deldCompletion.hasOwnProperty(key)) {
            deldCompletion[key] = isCompleted;
          } else if (cgCompletion.hasOwnProperty(key)) {
            cgCompletion[key] = isCompleted;
          }
        }
      });
    }

    restoreCheckboxesUI();
    updateTopicListUI();
    updateBadgesUI();
    updateProgressDisplay();
  } catch (e) {
    console.warn('Failed to load user data', e);
  }
}

function selectGate(gate, el) {
  currentGate = gate;
  document.querySelectorAll('#gateList .topic-item').forEach(i => { i.style.color = ''; });
  el.style.color = 'var(--accent)';
  const isUnary = gate === 'NOT' || gate === 'BUFFER';
  document.getElementById('inputBWrap').style.opacity = isUnary ? '0.3' : '1';
  document.getElementById('inputBWrap').style.pointerEvents = isUnary ? 'none' : '';
  document.getElementById('gateTitle').textContent = gate + ' Gate Simulator';
  inA = 0; inB = 0;
  document.getElementById('btnA').textContent = '0'; document.getElementById('btnA').classList.remove('on');
  document.getElementById('btnB').textContent = '0'; document.getElementById('btnB').classList.remove('on');
  renderGateSVG();
  renderTruthTable();
  
  // Track gate interaction for activity logging
  if (!exploredGates.has(gate)) {
    exploredGates.add(gate);
    trackActivity('explored', `${gate} Gate`, 'DELD');
  }
}

function toggleInput(x) {
  if (x === 'A') { inA ^= 1; const b = document.getElementById('btnA'); b.textContent = inA; b.classList.toggle('on', inA === 1); }
  else { inB ^= 1; const b = document.getElementById('btnB'); b.textContent = inB; b.classList.toggle('on', inB === 1); }
  renderGateSVG();
  renderTruthTable();
  
  trackActivity('explored', `Gate input ${x}=${x==='A'?inA:inB}`, 'DELD');
}

function setInput(x, value) {
  let val = parseInt(value);
  // Validate input: only 0 or 1 allowed
  if (isNaN(val) || val < 0 || val > 1) {
    val = (x === 'A') ? inA : inB;
    alert('Please enter 0 or 1');
  }
  
  if (x === 'A') { 
    inA = val; 
    const b = document.getElementById('btnA'); 
    b.textContent = inA; 
    b.classList.toggle('on', inA === 1);
  } else { 
    inB = val; 
    const b = document.getElementById('btnB'); 
    b.textContent = inB; 
    b.classList.toggle('on', inB === 1);
  }
  renderGateSVG();
  renderTruthTable();
  
  trackActivity('explored', `Gate input ${x}=${x==='A'?inA:inB}`, 'DELD');
}

function renderGateSVG() {
  const isUnary = currentGate === 'NOT' || currentGate === 'BUFFER';
  const out = isUnary ? gateLogic[currentGate](inA) : gateLogic[currentGate](inA, inB);
  const led = document.getElementById('outputLed');
  led.textContent = out;
  led.classList.toggle('on', out === 1);

  const colors = { AND:'#00e5ff', OR:'#7c3aed', NOT:'#ef4444', NAND:'#f59e0b', NOR:'#f59e0b', XOR:'#10b981', XNOR:'#10b981', BUFFER:'#64748b' };
  const c = colors[currentGate] || '#00e5ff';

  const gates = {
    AND: `<path d="M30,15 L30,85 L70,85 Q100,85 100,50 Q100,15 70,15 Z" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    OR:  `<path d="M30,15 Q60,15 100,50 Q60,85 30,85 Q50,50 30,15Z" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    NOT: `<path d="M20,50 L90,15 L90,85 Z" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="96" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    NAND:`<path d="M30,15 L30,85 L70,85 Q100,85 100,50 Q100,15 70,15 Z" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="106" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    NOR: `<path d="M30,15 Q60,15 100,50 Q60,85 30,85 Q50,50 30,15Z" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="106" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    XOR: `<path d="M30,15 Q60,15 100,50 Q60,85 30,85 Q50,50 30,15Z" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M22,15 Q38,50 22,85" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    XNOR:`<path d="M30,15 Q60,15 100,50 Q60,85 30,85 Q50,50 30,15Z" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M22,15 Q38,50 22,85" fill="none" stroke="${c}" stroke-width="2.5"/><circle cx="106" cy="50" r="6" fill="none" stroke="${c}" stroke-width="2.5"/>`,
    BUFFER:`<path d="M20,15 L110,50 L20,85 Z" fill="none" stroke="${c}" stroke-width="2.5"/>`,
  };

  document.getElementById('gateSVG').innerHTML = `
    <svg width="160" height="100" viewBox="0 0 160 100">
      <line x1="0" y1="35" x2="30" y2="35" stroke="${c}" stroke-width="1.5" opacity="${isUnary?0.3:1}"/>
      <line x1="0" y1="65" x2="30" y2="65" stroke="${c}" stroke-width="1.5" opacity="${isUnary?0:1}"/>
      <text x="3" y="30" fill="#64748b" font-size="10" font-family="Space Mono">A=${inA}</text>
      <text x="3" y="60" fill="#64748b" font-size="10" font-family="Space Mono" opacity="${isUnary?0:1}">B=${inB}</text>
      ${gates[currentGate] || ''}
      <line x1="112" y1="50" x2="145" y2="50" stroke="${out?'var(--accent3)':'#334155'}" stroke-width="2.5"/>
      <circle cx="150" cy="50" r="6" fill="${out?'var(--accent3)':'#1e2330'}" stroke="${out?'var(--accent3)':'#334155'}" stroke-width="1.5"/>
    </svg>`;
}

function renderTruthTable() {
  const isUnary = currentGate === 'NOT' || currentGate === 'BUFFER';
  let html = '<table style="margin-top:1rem;">';
  if (isUnary) {
    html += '<tr><th>A</th><th>' + currentGate + '(A)</th></tr>';
    [0,1].forEach(a => {
      const o = gateLogic[currentGate](a);
      html += `<tr><td class="${a?'val-1':'val-0'}">${a}</td><td class="${o?'val-1':'val-0'}">${o}</td></tr>`;
    });
  } else {
    html += '<tr><th>A</th><th>B</th><th>Output</th></tr>';
    [[0,0],[0,1],[1,0],[1,1]].forEach(([a,b]) => {
      const o = gateLogic[currentGate](a, b);
      const rowStyle = (a===inA && b===inB) ? 'background:rgba(0,229,255,0.08);' : '';
      html += `<tr style="${rowStyle}"><td class="${a?'val-1':'val-0'}">${a}</td><td class="${b?'val-1':'val-0'}">${b}</td><td class="${o?'val-1':'val-0'}">${o}</td></tr>`;
    });
  }
  html += '</table>';
  document.getElementById('truthTableWrap').innerHTML = html;
}

// ════════════════════════════════════════
//  COMBINATIONAL
// ════════════════════════════════════════
function updateHA() {
  const a = parseInt(document.getElementById('haA').textContent);
  const b = parseInt(document.getElementById('haB').textContent);
  const sum = a^b, carry = a&b;
  const s = document.getElementById('haSum'); s.textContent = sum; s.classList.toggle('on', sum===1);
  const c = document.getElementById('haCarry'); c.textContent = carry; c.classList.toggle('on', carry===1);
}

// Toggle helper for combinational
document.addEventListener('click', e => {
  if (e.target.classList.contains('toggle-btn')) {
    const v = parseInt(e.target.textContent) ^ 1;
    e.target.textContent = v;
    e.target.classList.toggle('on', v === 1);
    const id = e.target.id;
    if (id === 'btnA') { inA = v; renderGateSVG(); renderTruthTable(); }
    else if (id === 'btnB') { inB = v; renderGateSVG(); renderTruthTable(); }
    else if (['haA','haB'].includes(id)) updateHA();
    else if (['faA','faB','faCin'].includes(id)) updateFA();
    else if (id.startsWith('mI') || id.startsWith('mS')) updateMux();
    else if (id.startsWith('dec')) updateDecoder();
    else if (id.startsWith('sr')) updateSR();
    else if (id.startsWith('jk')) updateJK();
    else if (id === 'dD') updateD();
    else if (id === 'tT') updateT();
  }
});

function updateFA() {
  const a = parseInt(document.getElementById('faA').textContent);
  const b = parseInt(document.getElementById('faB').textContent);
  const cin = parseInt(document.getElementById('faCin').textContent);
  const sum = a^b^cin, carry = (a&b)|(cin&(a^b));
  const s = document.getElementById('faSum'); s.textContent = sum; s.classList.toggle('on', sum===1);
  const c = document.getElementById('faCarry'); c.textContent = carry; c.classList.toggle('on', carry===1);
}

function updateMux() {
  const inputs = [
    parseInt(document.getElementById('mI0').textContent),
    parseInt(document.getElementById('mI1').textContent),
    parseInt(document.getElementById('mI2').textContent),
    parseInt(document.getElementById('mI3').textContent)
  ];
  const s0 = parseInt(document.getElementById('mS0').textContent);
  const s1 = parseInt(document.getElementById('mS1').textContent);
  const sel = s1*2 + s0;
  const out = inputs[sel];
  const o = document.getElementById('muxOut'); o.textContent = out; o.classList.toggle('on', out===1);
  document.getElementById('muxInfo').textContent = `Selected Input: I${sel} (S1=${s1}, S0=${s0}) → Y = I${sel} = ${out}`;
}

function updateDecoder() {
  const a1 = parseInt(document.getElementById('decA1').textContent);
  const a0 = parseInt(document.getElementById('decA0').textContent);
  const sel = a1*2 + a0;
  [0,1,2,3].forEach(i => {
    const d = document.getElementById('decD' + i);
    const v = i === sel ? 1 : 0;
    d.textContent = v; d.classList.toggle('on', v===1);
  });
}

// ════════════════════════════════════════
//  SEQUENTIAL
// ════════════════════════════════════════
let srQ = 0, jkQ = 0, dQ = 0, tQ = 0;

function updateSR() {
  const s = parseInt(document.getElementById('srS').textContent);
  const r = parseInt(document.getElementById('srR').textContent);
  const st = document.getElementById('srState');
  let msg, color;
  if (s===0 && r===0) { msg = 'State: No Change (Hold)'; color = 'rgba(0,229,255,0.2)'; }
  else if (s===0 && r===1) { srQ = 0; msg = 'State: RESET → Q=0'; color = 'rgba(124,58,237,0.2)'; }
  else if (s===1 && r===0) { srQ = 1; msg = 'State: SET → Q=1'; color = 'rgba(16,185,129,0.2)'; }
  else { msg = '⚠ INVALID STATE (S=R=1)'; color = 'rgba(239,68,68,0.2)'; }
  st.textContent = msg;
  st.style.background = color;
  const q = document.getElementById('srQ'); q.textContent = srQ; q.classList.toggle('on', srQ===1);
  const qn = document.getElementById('srQn'); qn.textContent = srQ^1; qn.classList.toggle('on', (srQ^1)===1);
}

function triggerClk(type) {
  const b = document.getElementById(type + 'Clk');
  b.classList.add('on'); b.textContent = '1';
  setTimeout(() => { b.classList.remove('on'); b.textContent = '0'; }, 300);
}

function updateJK() {
  const j = parseInt(document.getElementById('jkJ').textContent);
  const k = parseInt(document.getElementById('jkK').textContent);
  const st = document.getElementById('jkState');
  let msg, color;
  if (j===0 && k===0) { msg = 'State: No Change'; color = 'rgba(0,229,255,0.1)'; }
  else if (j===0 && k===1) { jkQ = 0; msg = 'State: RESET → Q=0'; color = 'rgba(124,58,237,0.1)'; }
  else if (j===1 && k===0) { jkQ = 1; msg = 'State: SET → Q=1'; color = 'rgba(16,185,129,0.1)'; }
  else { jkQ ^= 1; msg = 'State: TOGGLE → Q=' + jkQ; color = 'rgba(245,158,11,0.1)'; }
  st.textContent = msg; st.style.background = color;
  const q = document.getElementById('jkQ'); q.textContent = jkQ; q.classList.toggle('on', jkQ===1);
}

function updateD() {
  const d = parseInt(document.getElementById('dD').textContent);
  dQ = d;
  const q = document.getElementById('dQ'); q.textContent = dQ; q.classList.toggle('on', dQ===1);
}

function updateT() {
  const t = parseInt(document.getElementById('tT').textContent);
  const st = document.getElementById('tState');
  if (t === 1) { tQ ^= 1; st.textContent = 'State: TOGGLE → Q=' + tQ; st.style.background = 'rgba(245,158,11,0.1)'; }
  else { st.textContent = 'State: HOLD → Q=' + tQ; st.style.background = 'rgba(0,229,255,0.08)'; }
  const q = document.getElementById('tQ'); q.textContent = tQ; q.classList.toggle('on', tQ===1);
}

function initSRWaveform() {
  const wrap = document.getElementById('srWaveform');
  if (!wrap) return;
  const signals = [
    { name: 'CLK', pattern: [0,1,0,1,0,1,0,1] },
    { name: 'S', pattern: [0,0,1,1,0,0,0,0] },
    { name: 'R', pattern: [0,0,0,0,1,1,0,0] },
    { name: 'Q', pattern: [0,0,1,1,1,0,0,0] }
  ];
  const colors = { CLK: '#64748b', S: '#00e5ff', R: '#7c3aed', Q: '#10b981' };
  wrap.innerHTML = signals.map(s => `
    <div class="signal-row">
      <span class="signal-name">${s.name}</span>
      <div class="signal-wave">
        ${s.pattern.map(v => `<div style="flex:1;background:${v?colors[s.name]:'var(--surface2)'};border-right:1px solid var(--surface);"></div>`).join('')}
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════
//  TRUTH TABLE GENERATOR
// ════════════════════════════════════════
function genTruthTable() {
  const n = parseInt(document.getElementById('ttInputs').value) || 2;
  const vars = ['A','B','C','D'].slice(0, n);
  let html = '<table><tr>' + vars.map(v => `<th>${v}</th>`).join('') + '<th>Output</th></tr>';
  for (let i = 0; i < (1 << n); i++) {
    const vals = vars.map((_, j) => (i >> (n-1-j)) & 1);
    const out = vals.reduce((a, v) => a & v, 1); // AND all by default
    html += '<tr>' + vals.map(v => `<td class="${v?'val-1':'val-0'}">${v}</td>`).join('') + `<td class="${out?'val-1':'val-0'}">${out}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('genTruthWrap').innerHTML = html;
}

// ════════════════════════════════════════
//  CIRCUIT BUILDER
// ════════════════════════════════════════

// --- Components definitions ---
const moduleComponents = [
  { name: 'AND Gate', type: 'gate', icon: 'AND', inputs: 2, func: (a,b) => (a & b) | 0 },
  { name: 'OR Gate', type: 'gate', icon: 'OR', inputs: 2, func: (a,b) => (a | b) | 0 },
  { name: 'NOT Gate', type: 'gate', icon: 'NOT', inputs: 1, func: (a) => a ? 0 : 1 },
  { name: 'XOR Gate', type: 'gate', icon: 'XOR', inputs: 2, func: (a,b) => (a ^ b) | 0 },
  { name: 'INPUT Switch', type: 'input', icon: 'IN', value:0 },
  { name: 'OUTPUT LED', type: 'output', icon: 'OUT' }
];

// State
let components = [];
let idCounter = 0;
let tool = 'select';
let pending = null;
let lastExport = null;
let wires = [];

function initCircuitCanvas() {
  const list = document.getElementById('components-list');
  if (!list) return;
  setupComponentsPanel();
  setTool('select');
}

// --- Components panel ---
function setupComponentsPanel(){
  const list = document.getElementById('components-list');
  if (!list) return;
  list.innerHTML = '';
  moduleComponents.forEach(c => {
    const el = document.createElement('div');
    el.className = 'draggable-component';
    el.textContent = c.name;
    el.draggable = true;
    el.style.padding = '0.5rem';
    el.style.background = 'var(--surface2)';
    el.style.border = '1px solid var(--border)';
    el.style.borderRadius = '4px';
    el.style.cursor = 'move';
    el.style.textAlign = 'center';
    el.style.fontSize = '0.8rem';
    el.dataset.name = c.name;
    el.dataset.type = c.type;
    el.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('name', c.name);
      e.dataTransfer.setData('type', c.type);
    });
    el.addEventListener('click', ()=>{ createAt(30,30,c.name); });
    list.appendChild(el);
  });
}

// --- Drag/drop ---
function allowDrop(e){ e.preventDefault(); }

document.addEventListener('DOMContentLoaded', ()=>{
  const canvas = document.getElementById('canvas');
  if(canvas) {
    canvas.addEventListener('drop', function(e){ e.preventDefault(); const name = e.dataTransfer.getData('name'); if(!name) return; const rect = e.currentTarget.getBoundingClientRect(); let x = e.clientX - rect.left; let y = e.clientY - rect.top; createAt(x,y,name); });
    canvas.addEventListener('dragover', e => e.preventDefault());
  }
});

function createAt(x,y,name){
  document.getElementById('empty-state').style.display='none';
  const def = moduleComponents.find(m=>m.name===name);
  if(!def) return;
  idCounter++; const id = 'c'+idCounter;
  const dom = document.createElement('div');
  dom.className='dropped-item';
  dom.id=id;
  dom.style.left = (x)+ 'px';
  dom.style.top=(y)+'px';
  dom.style.position = 'absolute';
  dom.style.padding = '0.5rem';
  dom.style.background = 'var(--surface2)';
  dom.style.border = '2px solid var(--border)';
  dom.style.borderRadius = '6px';
  dom.style.cursor = 'grab';
  dom.style.minWidth = '80px';
  dom.style.position = 'absolute';
  dom.style.userSelect = 'none';

  const instanceName = `${def.name} ${idCounter}`;
  let inner = `<div style="padding:0.25rem;font-weight:600;font-size:0.85rem">${def.icon}</div><div style="font-size:0.7rem; font-weight:500; margin-top:0.25rem;">${instanceName}</div>`;
  if(def.type==='gate'){
    inner += '<div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.5rem;">';
    for(let i=0;i<def.inputs;i++) inner += `<div id="${id}-in-${i}" class="pin input-pin" data-pin-type="input" data-index="${i}" style="padding:0.25rem 0.5rem;background:var(--surface);border:1px solid var(--border);border-radius:3px;cursor:pointer;font-size:0.7rem;">A${i+1}</div>`;
    inner += `<div style="width:8px"></div>`;
    inner += `<div id="${id}-out-0" class="pin output-pin" data-pin-type="output" data-index="0" style="padding:0.25rem 0.5rem;background:var(--surface);border:1px solid var(--border);border-radius:3px;cursor:pointer;font-size:0.7rem;">Q: <span id="${id}-out-0-val" style="font-weight:600;color:#dc2626;">0</span></div>`;
    inner += '</div>';
  } else if(def.type==='input'){
    inner = `<button id="${id}-switch" class="toggle-btn" style="padding:0.35rem 0.75rem;background:#dc2626;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;margin-top:0.35rem;">0</button><div style="margin-top:0.5rem" id="${id}-out-0" class="pin output-pin" data-pin-type="output" data-index="0" style="padding:0.25rem 0.5rem;background:var(--surface);border:1px solid var(--border);border-radius:3px;cursor:pointer;font-size:0.7rem;">Q: <span id="${id}-out-0-val" style="font-weight:600;color:#dc2626;">0</span></div>`;
  } else if(def.type==='output'){
    inner = `<div style="padding:0.35rem;background:var(--surface);border-radius:4px;margin-top:0.35rem;">OUT: <span id="${id}-value" style="font-weight:600;color:#dc2626;">0</span></div><div style="margin-top:0.5rem" id="${id}-in-0" class="pin input-pin" data-pin-type="input" data-index="0" style="padding:0.25rem 0.5rem;background:var(--surface);border:1px solid var(--border);border-radius:3px;cursor:pointer;font-size:0.7rem;">A1</div>`;
  }

  dom.innerHTML = inner;
  document.getElementById('canvas').appendChild(dom);

  const model = { id, name: instanceName, baseName: def.name, type: def.type, x,y, inputs:[], outputs:[], func:def.func || null, value: def.value||0 };

  if(def.type==='gate'){
    for(let i=0;i<def.inputs;i++) model.inputs.push({ pinId:`${id}-in-${i}`, connectedTo:null, value:0 });
    model.outputs.push({ pinId:`${id}-out-0`, connectedTo:[], value:0 });
  } else if(def.type==='input'){
    model.outputs.push({ pinId:`${id}-out-0`, connectedTo:[], value:model.value });
  } else if(def.type==='output'){
    model.inputs.push({ pinId:`${id}-in-0`, connectedTo:null, value:0 });
  }

  components.push(model);

  dom.querySelectorAll('.pin').forEach(pin=>pin.addEventListener('click', onPinClick));
  const sw = dom.querySelector('.toggle-btn'); if(sw) sw.addEventListener('click', ()=>{ toggleCircuitInput(id); });

  makeDraggable(dom);
  assignProbeNames();
  updateProperties(model);
  drawWires();
  runSimulation();
}

// --- Dragging DOM elements ---
function makeDraggable(el){
  el.onmousedown = function(e){
    const pinEl = e.target.closest('.pin');
    const toggleEl = e.target.closest('.toggle-btn');
    if(pinEl || toggleEl) return;
    e.preventDefault();
    el.style.cursor = 'grabbing';
    const startX = e.clientX;
    const startY = e.clientY;
    const origLeft = el.offsetLeft;
    const origTop = el.offsetTop;
    function moveHandler(ev){
      el.style.left = origLeft + (ev.clientX - startX) + 'px';
      el.style.top = origTop + (ev.clientY - startY) + 'px';
      drawWires();
    }
    function upHandler(){
      el.style.cursor = 'grab';
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    }
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  };
}

// --- Pin click & connect logic ---
function onPinClick(e){
  e.stopPropagation();
  const el = e.currentTarget;
  const pinType = el.dataset.pinType;
  const index = Number(el.dataset.index);
  const compEl = el.closest('.dropped-item');
  const compId = compEl.id;
  if(tool!=='connect'){ select(compId); return; }

  if(!pending){
    pending = { compId, pinType, index, pinElId:el.id || (compId+'-pin') };
    el.style.boxShadow = '0 0 0 4px rgba(245,158,11,0.3)';
  } else {
    const a = pending;
    const b = { compId, pinType, index, pinElId:el.id || (compId+'-pin2') };
    const compA = components.find(c=>c.id===a.compId);
    const compB = components.find(c=>c.id===b.compId);
    let sourceComp, destComp, sourcePinObj, destPinObj;
    if(a.pinType==='output' && b.pinType==='input'){
      sourceComp=compA; destComp=compB;
      sourcePinObj = sourceComp.outputs[a.index];
      destPinObj = destComp.inputs[b.index];
    }
    else if(a.pinType==='input' && b.pinType==='output'){
      sourceComp=compB; destComp=compA;
      sourcePinObj = sourceComp.outputs[b.index];
      destPinObj = destComp.inputs[a.index];
    }
    else {
      alert('Invalid connection. Connect an output pin to an input pin.');
      clearPending();
      return;
    }

    if(!sourcePinObj || !destPinObj){ alert('Pin not found'); clearPending(); return; }
    if(destPinObj.connectedTo){ alert('Input already connected.'); clearPending(); return; }

    destPinObj.connectedTo = { componentId: sourceComp.id, outputIndex: sourceComp.outputs.indexOf(sourcePinObj) };
    sourcePinObj.connectedTo.push({ componentId: destComp.id, inputIndex: destComp.inputs.indexOf(destPinObj) });
    wires.push({ from: { compId: sourceComp.id, pinId: sourcePinObj.pinId }, to: { compId: destComp.id, pinId: destPinObj.pinId } });
    clearPending();
    drawWires();
    runSimulation();
  }
}

function clearPending(){
  if(!pending) return;
  const pinEl = document.querySelector(`#${pending.pinElId}`);
  if(pinEl) pinEl.style.boxShadow='none';
  pending = null;
}

// --- Drawing wires using SVG ---
function drawWires(){
  const canvas = document.getElementById('canvas');
  const old = canvas.querySelector('svg.drawing');
  if(old) old.remove();
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('drawing');
  svg.style.position='absolute';
  svg.style.left='0';
  svg.style.top='0';
  svg.style.width='100%';
  svg.style.height='100%';
  svg.style.pointerEvents='none';

  components.forEach(c=>{
    c.outputs.forEach(out=>{
      out.connectedTo.forEach(conn=>{
        const srcEl = document.getElementById(out.pinId);
        const destComp = components.find(x=>x.id===conn.componentId);
        if (!destComp || !destComp.inputs[conn.inputIndex]) return;
        const destIn = destComp.inputs[conn.inputIndex];
        const dstEl = document.getElementById(destIn.pinId);
        if(!srcEl || !dstEl) return;
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        const s = srcEl.getBoundingClientRect();
        const d = dstEl.getBoundingClientRect();
        const x1 = s.left + s.width/2 - canvasRect.left;
        const y1 = s.top + s.height/2 - canvasRect.top;
        const x2 = d.left + d.width/2 - canvasRect.left;
        const y2 = d.top + d.height/2 - canvasRect.top;
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',x1);
        line.setAttribute('y1',y1);
        line.setAttribute('x2',x2);
        line.setAttribute('y2',y2);
        line.setAttribute('stroke', out.value===1? '#10b981' : '#94a3b8');
        line.setAttribute('stroke-width','3');
        svg.appendChild(line);
      });
    });
  });

  document.getElementById('canvas').appendChild(svg);
}

// --- Simulation ---
function runSimulation(){
  assignProbeNames();
  let changed=true;
  let iter=0;
  const maxIter=50;
  while(changed && iter<maxIter){
    changed=false;
    iter++;

    components.filter(c=>c.type==='input').forEach(i=>{
      if (i.outputs[0].value !== i.value) {
        i.outputs[0].value = i.value;
        changed=true;
      }
      const valSpan = document.getElementById(`${i.id}-out-0-val`);
      if(valSpan) {
        valSpan.textContent = i.value;
        valSpan.style.color = i.value === 1 ? '#10b981' : '#dc2626';
      }
    });

    components.filter(c=>c.type==='gate').forEach(g=>{
      const inputs = g.inputs.map(inp=>{
        if(inp.connectedTo){
          const s = components.find(x=>x.id===inp.connectedTo.componentId);
          return s.outputs[inp.connectedTo.outputIndex].value;
        }
        return 0;
      });
      const out = g.func(...inputs) | 0;
      if(g.outputs[0].value !== out){ g.outputs[0].value = out; changed=true; }
      const valSpan = document.getElementById(`${g.id}-out-0-val`);
      if(valSpan) {
        valSpan.textContent = g.outputs[0].value;
        valSpan.style.color = g.outputs[0].value === 1 ? '#10b981' : '#dc2626';
      }
    });

    components.filter(c=>c.type==='output').forEach(o=>{
      let val=0;
      if(o.inputs[0].connectedTo){
        const s = components.find(x=>x.id===o.inputs[0].connectedTo.componentId);
        val = s.outputs[o.inputs[0].connectedTo.outputIndex].value;
      }
      const span = document.getElementById(`${o.id}-value`);
      if(span) {
        span.textContent = val;
        span.style.color = val === 1 ? '#10b981' : '#dc2626';
      }
      if(o.inputs[0]) o.inputs[0].value = val;
    });

    if(changed) drawWires();
  }

  const warnings = validateCircuit();
  if(iter>=maxIter && changed) warnings.push('Possible cyclic or oscillating connection.');
  document.getElementById('circuit-warnings').innerHTML = warnings.length ? warnings.map(w=>`• ${w}`).join('<br>') : '';

  generateTruthTable();
}

// --- Validation ---
function validateCircuit(){
  const warnings = [];
  components.forEach(c=>{
    if((c.type==='gate' || c.type==='output') && c.inputs){
      c.inputs.forEach((inp, idx)=>{
        if(!inp.connectedTo) warnings.push(`${c.name} input A${idx+1} is unconnected`);
      });
    }
  });
  return Array.from(new Set(warnings));
}

// --- Truth table ---
function generateTruthTable(){
  assignProbeNames();
  const inputs = components.filter(c=>c.type==='input');
  const outputs = components.filter(c=>c.type==='output');
  const container = document.getElementById('truth-table');
  if(inputs.length===0 || outputs.length===0){
    container.innerHTML = '<p style="color:var(--muted)">No inputs or outputs</p>';
    return;
  }

  const hasUnconnectedInputs = components.some(c =>
    (c.type === 'gate' || c.type === 'output') &&
    c.inputs.some(inp => !inp.connectedTo)
  );

  if (hasUnconnectedInputs) {
    container.innerHTML = '<p style="color:var(--warning)">Connect all inputs first</p>';
    return;
  }
  if(inputs.length > 8){ container.innerHTML = '<p style="color:var(--warning)">Too many inputs (>8)</p>'; return; }

  const inputOrder = inputs.map(i=>i.id);
  const combos = 1 << inputs.length;
  let html = '<table style="width:100%; border-collapse:collapse; font-size:0.7rem;"><tr>';
  inputs.forEach(i=> html += `<th style="padding:0.25rem; border-bottom:1px solid var(--border); text-align:left;">${i.probeName || i.name}</th>`);
  outputs.forEach(o=> html += `<th style="padding:0.25rem; border-bottom:1px solid var(--border); text-align:left;">${o.probeName || o.name}</th>`);
  html += '</tr>';
  for(let k=0;k<combos;k++){
    const vals = [];
    for(let b=0;b<inputs.length;b++) vals.push((k >> (inputs.length-1-b)) & 1);
    const outVals = evaluateOnClone(vals, inputOrder);
    html += '<tr>';
    vals.forEach(v=> html += `<td style="padding:0.25rem; border-bottom:1px solid var(--border);">${v}</td>`);
    outVals.forEach(v=> html += `<td style="padding:0.25rem; border-bottom:1px solid var(--border);">${v}</td>`);
    html += '</tr>';
  }
  html += '</table>';
  container.innerHTML = html;
}

function evaluateOnClone(inputValues, inputOrder){
  const clone = JSON.parse(JSON.stringify(components));
  clone.forEach(c=>{
    if(c.type==='gate'){
      const def = moduleComponents.find(m=>m.name===c.baseName);
      c.func = def ? def.func : null;
    }
  });
  inputOrder.forEach((id, i)=>{
    const cc = clone.find(x=>x.id===id);
    if(cc){ cc.value = inputValues[i]; if(cc.outputs && cc.outputs[0]) cc.outputs[0].value = inputValues[i]; }
  });

  let changed = true, iter = 0, maxIter = 50;
  while(changed && iter<maxIter){
    changed = false; iter++;
    clone.filter(c=>c.type==='input').forEach(i=>{ i.outputs[0].value = i.value; });
    clone.filter(c=>c.type==='gate').forEach(g=>{
      const inputs = g.inputs.map(inp=>{
        if(inp.connectedTo){
          const s = clone.find(x=>x.id===inp.connectedTo.componentId);
          return s ? s.outputs[inp.connectedTo.outputIndex].value : 0;
        }
        return 0;
      });
      const out = (g.func ? g.func(...inputs) : 0) | 0;
      if(g.outputs[0].value !== out){ g.outputs[0].value = out; changed = true; }
    });
    clone.filter(c=>c.type==='output').forEach(o=>{
      let val = 0;
      if(o.inputs[0] && o.inputs[0].connectedTo){
        const s = clone.find(x=>x.id===o.inputs[0].connectedTo.componentId);
        val = s ? s.outputs[o.inputs[0].connectedTo.outputIndex].value : 0;
      }
      if(o.inputs[0]) o.inputs[0].value = val;
    });
  }

  const outputs = components.filter(c=>c.type==='output');
  return outputs.map(o=>{
    const oc = clone.find(x=>x.id===o.id);
    if(!oc || !oc.inputs || !oc.inputs[0]) return 0;
    let val = 0;
    if (oc.inputs[0].connectedTo) {
      const s = clone.find(x=>x.id===oc.inputs[0].connectedTo.componentId);
      val = s ? s.outputs[oc.inputs[0].connectedTo.outputIndex].value : 0;
    }
    return val;
  });
}

// --- Toggle circuit input ---
function toggleCircuitInput(id){
  const comp = components.find(c=>c.id===id);
  if(!comp) return;
  comp.value = comp.value?0:1;
  const btn = document.getElementById(`${id}-switch`);
  if(btn){
    btn.textContent = comp.value;
    btn.style.backgroundColor = comp.value? '#10b981':'#dc2626';
  }
  runSimulation();
}

// --- Selection & properties ---
function select(id){
  document.querySelectorAll('.dropped-item').forEach(el=>el.classList.remove('selected'));
  const model = components.find(c=>c.id===id);
  if(!model) return;
  const el = document.getElementById(id);
  if(el){
    el.classList.add('selected');
    el.style.borderColor = 'var(--accent)';
  }
  updateProperties(model);
}

function updateProperties(m){
  const p = document.getElementById('properties-content');
  const label = m.probeName ? ` [${m.probeName}]` : '';
  let html = `<div><strong>${m.name}${label}</strong><br/><span style="font-size:0.75rem;color:var(--muted);">${m.type}</span></div>`;
  if(m.type==='input'){
    html += `<div style="margin-top:0.5rem;">Current: <strong>${m.value}</strong></div><button class="btn btn-ghost btn-sm" onclick="toggleCircuitInput('${m.id}')" style="width:100%;margin-top:0.5rem;font-size:0.75rem;">Toggle</button>`;
  }
  if(m.type==='gate'){
    html += `<div style="margin-top:0.5rem;">Output: <strong>${m.outputs[0].value}</strong></div><ul style="font-size:0.75rem;margin:0.5rem 0;">`;
    m.inputs.forEach((inp,i)=>{ html+=`<li>A${i+1}: ${inp.connectedTo? 'Connected' : 'Unconnected (0)'} </li>` });
    html+='</ul>';
  }
  if(m.type==='output'){
    html += `<div style="margin-top:0.5rem;">Value: <strong>${m.inputs[0] ? m.inputs[0].value : 0}</strong></div>`;
  }
  html += `<button class="btn btn-ghost btn-sm" onclick="deleteComponent('${m.id}')" style="width:100%;margin-top:0.75rem;font-size:0.75rem;color:var(--danger);">Delete</button>`;
  p.innerHTML = html;
}

function deleteComponent(id){
  const el = document.getElementById(id);
  if(el) el.remove();
  components.forEach(c=>{
    c.inputs && c.inputs.forEach(inp=>{ if(inp.connectedTo && inp.connectedTo.componentId===id) inp.connectedTo=null });
    c.outputs && c.outputs.forEach(out=>{ out.connectedTo = out.connectedTo.filter(x=>x.componentId!==id) });
  });
  components = components.filter(c=>c.id!==id);
  document.getElementById('properties-content').innerHTML = '<div style="color:var(--muted);text-align:center;padding:1rem;">Select a component to view properties</div>';
  drawWires();
  runSimulation();
  if(components.length===0) document.getElementById('empty-state').style.display='flex';
  assignProbeNames();
}

// --- Toolbar ---
function setTool(t){
  tool=t;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tool-btn').forEach(b=>{
    if(b.textContent.toLowerCase().includes(t)) {
      b.classList.add('active');
      b.style.background = 'var(--accent)';
      b.style.color = '#fff';
    } else {
      b.style.background = '';
      b.style.color = '';
    }
  });
  clearPending();
}

function clearCircuit(){
  if(confirm('Clear entire canvas?')){
    document.getElementById('canvas').innerHTML = '';
    const emptyState = document.createElement('div');
    emptyState.id = 'empty-state';
    emptyState.style.display = 'flex';
    emptyState.style.flexDirection = 'column';
    emptyState.style.alignItems = 'center';
    emptyState.style.justifyContent = 'center';
    emptyState.style.height = '100%';
    emptyState.style.color = 'var(--muted)';
    emptyState.innerHTML = `<div style="font-size:3rem;opacity:0.3;margin-bottom:1rem;">📦</div><p style="text-align:center;">Drag components here to start building</p>`;
    document.getElementById('canvas').appendChild(emptyState);

    components = [];
    wires = [];
    idCounter=0;
    lastExport=null;
    document.getElementById('properties-content').innerHTML = '<div style="color:var(--muted);text-align:center;padding:1rem;">Select a component to view properties</div>';
    document.getElementById('truth-table').innerHTML = '';
    document.getElementById('circuit-warnings').innerHTML = '';
  }
}

// --- Export ---
function exportCircuitToClipboard(){
  const payload = JSON.stringify(components);
  lastExport = payload;
  navigator.clipboard.writeText(payload).then(()=> alert('Circuit JSON copied to clipboard.'));
}

// --- Probe naming ---
function assignProbeNames(){
  const letters = (n)=>Array.from({length:n},(_,i)=>String.fromCharCode(65 + i));
  const inputs = components.filter(c=>c.type==='input');
  const gates = components.filter(c=>c.type==='gate');
  const outputs = components.filter(c=>c.type==='output');
  inputs.forEach((c,i)=> c.probeName = letters(inputs.length)[i]);
  gates.forEach((c,i)=> c.probeName = letters(gates.length)[i]);
  outputs.forEach((c,i)=> c.probeName = letters(outputs.length)[i]);
}


// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function drawGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(0,229,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
  for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
}

function drawAxes(ctx, w, h) {
  ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
}

function highlightCpp(code) {
  return code
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#4b5563">$1</span>')
    .replace(/\b(int|float|void|return|while|for|if|else|true|false|include|define|using|namespace)\b/g, '<span style="color:#a78bfa">$1</span>')
    .replace(/\b(std|cout|endl|abs|round|max|min|cos|sin|sqrt|pow|gluOrtho2D|glVertex2f|glBegin|glEnd|glFlush|GL_LINE_STRIP|GL_LINE_LOOP|glutMainLoop|glutDisplayFunc|glutInit|glutInitWindowSize|glutCreateWindow|glClear|GL_COLOR_BUFFER_BIT|putpixel|line|rectangle|initgraph|closegraph|getch|glColor3f|glPushMatrix|glPopMatrix|glTranslatef|glRotatef|glScalef|glutWireCube|glLoadIdentity|glEnable|GL_DEPTH_TEST|glutSwapBuffers)\b/g, '<span style="color:#00e5ff">$1</span>')
    .replace(/\b(\d+\.?\d*f?)\b/g, '<span style="color:#f59e0b">$1</span>');
}

function copyCG(id) {
  const el = document.getElementById(id + 'CppCode') || document.getElementById(id + 'Code') || document.getElementById('code' + id);
  if (el) navigator.clipboard.writeText(el.textContent).then(() => { alert('Copied!'); });
}

function copyModal() {
  navigator.clipboard.writeText(document.getElementById('modalCode').textContent).then(() => alert('Copied!'));
}

function downloadCGCode(id) {
  const codes = {
    dda: () => document.getElementById('ddaCppCode')?.textContent,
    br: () => document.getElementById('brCppCode')?.textContent,
    mc: () => document.getElementById('mcCppCode')?.textContent,
    t2d: () => document.getElementById('t2dCode')?.textContent,
    '3d': () => document.getElementById('code3d')?.textContent,
    clip: () => document.getElementById('clipCode')?.textContent,
    bezier: () => document.getElementById('bezierCode')?.textContent,
  };
  const fn = codes[id];
  if (!fn) return;
  const content = fn();
  if (!content) return;
  const blob = new Blob([content], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `virtulab_${id}.cpp`;
  a.click();
}

function downloadGateCode() {
  const content = generateGateCpp(currentGate);
  const blob = new Blob([content], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `gate_${currentGate}.cpp`;
  a.click();
  
  trackActivity('generated', `${currentGate} Gate C++ Code`, 'DELD');
}

function generateGateCpp(gate) {
  return `// ${gate} Gate Truth Table Generator
// VirtuLab — Digital Electronics Module
#include <iostream>
using namespace std;

int ${gate}Gate(int a${gate!=='NOT'&&gate!=='BUFFER'?', int b':''}) {
    ${gate==='AND'?'return a & b;':gate==='OR'?'return a | b;':gate==='NOT'||gate==='BUFFER'?'return a'+(gate==='NOT'?'^1':'')+';':gate==='NAND'?'return !(a & b);':gate==='NOR'?'return !(a | b);':gate==='XOR'?'return a ^ b;':'return !(a ^ b);'}
}

int main() {
    cout << "${gate} Gate Truth Table" << endl;
    ${gate==='NOT'||gate==='BUFFER'?`
    cout << "A | OUT" << endl;
    for (int a = 0; a <= 1; a++)
        cout << a << " | " << ${gate}Gate(a) << endl;`:`
    cout << "A | B | OUT" << endl;
    for (int a = 0; a <= 1; a++)
        for (int b = 0; b <= 1; b++)
            cout << a << " | " << b << " | " << ${gate}Gate(a, b) << endl;`}
    return 0;
}`;
}

function exportTruth() { alert('Truth table export as PDF/CSV (feature uses jsPDF in production).'); }

function showCppCode(type) {
  const codes = {
    halfAdder: `// Half Adder Implementation
// VirtuLab — DELD Module
#include <iostream>
using namespace std;

void halfAdder(int a, int b, int &sum, int &carry) {
    sum   = a ^ b;  // XOR gate
    carry = a & b;  // AND gate
}

int main() {
    int sum, carry;
    cout << "Half Adder Truth Table" << endl;
    cout << "A | B | SUM | CARRY" << endl;
    for (int a = 0; a <= 1; a++)
        for (int b = 0; b <= 1; b++) {
            halfAdder(a, b, sum, carry);
            cout << a << " | " << b << " |  " << sum << "  |   " << carry << endl;
        }
    return 0;
}`,
    srFF: `// SR Flip-Flop Simulation
// VirtuLab — DELD Module
#include <iostream>
using namespace std;

int Q = 0, Qn = 1; // Initial state

void SR_FF(int S, int R) {
    if (S == 0 && R == 0) {
        // No change
        cout << "No Change: Q=" << Q << endl;
    } else if (S == 0 && R == 1) {
        Q = 0; Qn = 1;
        cout << "RESET: Q=" << Q << endl;
    } else if (S == 1 && R == 0) {
        Q = 1; Qn = 0;
        cout << "SET: Q=" << Q << endl;
    } else {
        cout << "INVALID STATE (S=R=1)!" << endl;
    }
}

int main() {
    cout << "SR Flip-Flop" << endl;
    SR_FF(0, 0); // Hold
    SR_FF(1, 0); // Set
    SR_FF(0, 1); // Reset
    SR_FF(1, 1); // Invalid
    return 0;
}`,
    jkFF: `// JK Flip-Flop Simulation
// VirtuLab — DELD Module
#include <iostream>
using namespace std;

int Q = 0;

void JK_FF(int J, int K) {
    if      (J==0 && K==0) { /* No change */ }
    else if (J==0 && K==1) { Q = 0; }
    else if (J==1 && K==0) { Q = 1; }
    else                   { Q = Q ^ 1; } // Toggle
    cout << "J=" << J << " K=" << K << " → Q=" << Q << endl;
}

int main() {
    cout << "JK Flip-Flop" << endl;
    JK_FF(0,0); JK_FF(0,1);
    JK_FF(1,0); JK_FF(1,1);
    return 0;
}`,
  };

  const titleMap = { halfAdder: 'Half Adder', srFF: 'SR Flip-Flop', jkFF: 'JK Flip-Flop' };
  document.getElementById('modalTitle').textContent = titleMap[type] || type;
  document.getElementById('modalCode').innerHTML = highlightCpp(codes[type] || '// Code not available');
  activeModal = type;
  document.getElementById('cppModal').style.display = 'flex';
  
  trackActivity('generated', `${titleMap[type] || type} C++ Code`, 'DELD');
}

function closeModal() { document.getElementById('cppModal').style.display = 'none'; }
function downloadModal() {
  const content = document.getElementById('modalCode').textContent;
  const blob = new Blob([content], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); 
  a.download = `virtulab_${activeModal}.cpp`; 
  a.click();
  
  trackActivity('generated', `Downloaded ${activeModal} Code`, 'DELD');
}

// Close modal on backdrop click
document.getElementById('cppModal').addEventListener('click', e => { if (e.target === document.getElementById('cppModal')) closeModal(); });

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.section) {
    const navItem = findNavItemBySection(e.state.section);
    showSection(e.state.section, navItem);
  }
});

// Init on load
window.onload = () => {
  const savedUser = localStorage.getItem('currentUser');
  const token = localStorage.getItem('virtulab_token');
  if (savedUser && token) {
    try {
      currentUser = JSON.parse(savedUser);
      launchApp();
      
      const params = new URLSearchParams(window.location.search);
      const module = params.get('module');
      if (module) {
        setTimeout(() => {
          const navItem = findNavItemBySection(module);
          if (navItem) showSection(module, navItem);
        }, 100);
      }
      return;
    } catch (e) {
      console.error('Error restoring session:', e);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('virtulab_token');
    }
  }

  showLogin();
};
// ── AR Simulation ──────────────────────────────────────────────
const AR_GATE_META = {
  AND:  { icon: '⊓', color: '#00cc96', desc: 'Output is HIGH only when ALL inputs are HIGH.', unity: 'AND_Gate_AR' },
  OR:   { icon: '⊔', color: '#0099ff', desc: 'Output is HIGH when ANY input is HIGH.', unity: 'OR_Gate_AR' },
  NOT:  { icon: '¬', color: '#a855f7', desc: 'Inverts the input — turns HIGH to LOW and vice versa.', unity: 'NOT_Gate_AR' },
  NAND: { icon: '⊼', color: '#f59e0b', desc: 'Inverted AND gate. Universal gate — can build any circuit.', unity: 'NAND_Gate_AR' },
  NOR:  { icon: '⊽', color: '#ef4444', desc: 'Inverted OR gate. Universal gate — can build any circuit.', unity: 'NOR_Gate_AR' },
  XOR:  { icon: '⊕', color: '#06b6d4', desc: 'Output HIGH when inputs are DIFFERENT (odd number of HIGHs).', unity: 'XOR_Gate_AR' },
  // ── Flip-Flops ──
  DFF:  { icon: 'D',  color: '#8b5cf6', desc: 'Data flip-flop — captures D on the rising clock edge. Used in registers and memory.', unity: 'D_FlipFlop_AR' },
  SRFF: { icon: 'SR', color: '#f43f5e', desc: 'Set-Reset flip-flop — S=1 sets Q=1, R=1 resets Q=0. S=R=1 is forbidden.', unity: 'SR_FlipFlop_AR' },
  JKFF: { icon: 'JK', color: '#10b981', desc: 'JK flip-flop — universal; J=K=1 toggles output. Eliminates the SR forbidden state.', unity: 'JK_FlipFlop_AR' },
  TFF:  { icon: 'T',  color: '#f97316', desc: 'Toggle flip-flop — T=1 flips output on each clock edge. Used in counters.', unity: 'T_FlipFlop_AR' },
};

function launchAR(gate) {
  const meta = AR_GATE_META[gate];
  if (!meta) return;

  // Remove any existing modal
  const existing = document.getElementById('arModalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'ar-modal-overlay';
  overlay.id = 'arModalOverlay';
  overlay.innerHTML = `
    <div class="ar-modal">
      <span class="ar-modal-icon" style="font-family:var(--mono,monospace);font-size:${meta.icon.length > 1 ? '2rem' : '2.5rem'};">${meta.icon}</span>
      <div class="ar-modal-title">${gate.replace('FF',' Flip-Flop')} AR</div>
      <div class="ar-modal-subtitle">${meta.desc}</div>
      <div class="ar-modal-badge">🥽 Unity AR Scene — ${meta.unity}</div>
      <button class="ar-modal-btn" onclick="confirmLaunchAR('${gate}')">
        ▶ Launch AR Simulation
      </button>
      <button class="ar-modal-btn ar-modal-close" onclick="closeARModal()">
        Cancel
      </button>
    </div>`;

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeARModal();
  });

  document.body.appendChild(overlay);
}

function confirmLaunchAR(gate) {
  closeARModal();

  const buildPaths = {
    AND:  'GATES/AND GATE/index.html',
    OR:   'GATES/OR GATE/index.html',
    NOT:  'GATES/NOT GATE/index.html',
    NAND: 'GATES/NAND GATE/index.html',
    NOR:  'GATES/NOR GATE/index.html',
    XOR:  'GATES/X-OR GATE/index.html',
    // ── Flip-Flops ──
    DFF:  'flip flops/D-Flipflop/index.html',
    SRFF: 'flip flops/SR-Flipflop/index.html',
    JKFF: 'flip flops/JK-Flipflop-3D/index.html',
    TFF:  'flip flops/T-Flipflop/index.html',
  };

  const path = buildPaths[gate];
  if (path) {
    window.open(path, '_blank');
  } else {
    alert(`AR build for ${gate} gate is not available yet.`);
  }

  showARToast(gate);
}

function closeARModal() {
  const overlay = document.getElementById('arModalOverlay');
  if (overlay) overlay.remove();
}

function showARToast(gate) {
  const existing = document.getElementById('arToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'arToast';
  toast.style.cssText = `
    position:fixed; bottom:1.5rem; right:1.5rem; z-index:3000;
    background:var(--surface); border:1px solid rgba(0,204,150,0.4);
    border-radius:10px; padding:0.75rem 1.25rem;
    display:flex; align-items:center; gap:0.6rem;
    box-shadow:0 8px 24px rgba(0,0,0,0.3);
    animation:modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
    font-size:0.85rem; color:var(--text);`;
  toast.innerHTML = `<span style="color:#00cc96;font-size:1.1rem;">🥽</span> Launching <strong>${gate.includes('FF') ? gate.replace('FF',' Flip-Flop') : gate + ' Gate'}</strong> AR simulation…`;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}
// ── End AR Simulation ──────────────────────────────────────────