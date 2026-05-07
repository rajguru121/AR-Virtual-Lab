// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let currentUser = null;
let users = [];

// Progress tracking: maps user email to module completion data
let userProgress = {};

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
  try {
    const saved = localStorage.getItem('virtulab_users');
    if (saved) {
      users = JSON.parse(saved);
    } else {
      // Initialize with default user
      users = [
        { name:'Rahul Sharma', roll:'CS2024001', email:'rahul@college.edu', pass:'password', dept:'Computer Science', year:'4th Year' }
      ];
      saveUsers();
    }
  } catch (e) {
    console.warn('Could not load users', e);
    users = [
      { name:'Rahul Sharma', roll:'CS2024001', email:'rahul@college.edu', pass:'password', dept:'Computer Science', year:'4th Year' }
    ];
  }
}

function saveUsers() {
  try {
    localStorage.setItem('virtulab_users', JSON.stringify(users));
  } catch (e) {
    console.warn('Could not save users', e);
  }
}

// Restore session from localStorage if user was previously logged in
function restoreSession() {
  try {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      currentUser = JSON.parse(saved);
      launchApp();
      return true;
    }
  } catch (e) {
    console.warn('Could not restore session', e);
    localStorage.removeItem('currentUser');
  }
  return false;
}

// Initialize progress for all registered users (starts at 0)
function initializeUserProgress() {
  users.forEach(user => {
    if (!userProgress[user.email]) {
      userProgress[user.email] = {
        deld: { title: 'Digital Electronics & Logic Design', completed: 0, total: 100 },
        cg: { title: 'Computer Graphics Laboratory', completed: 0, total: 100 },
        experimentsDone: 0,
        totalExperiments: 24,
        labTime: 0, // hours
        labTimeGoal: 40 // hours per semester
      };
    }
  });
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

function doLogin() {
  const id = document.getElementById('loginId').value;
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  
  if (!id || !pass) {
    err.textContent = 'Please enter email/roll and password.';
    return;
  }
  
  const user = users.find(u => u.email === id || u.roll === id);
  if (!user) {
    err.textContent = 'User not found. Please sign up or check your email/roll.';
    return;
  }
  
  if (pass !== user.pass) {
    err.textContent = 'Incorrect password.';
    return;
  }
  
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  launchApp();
}

function adminLogin() {
  const adminUser = users.find(u => u.roll === 'ADMIN');
  if (adminUser) {
    currentUser = adminUser;
  } else {
    currentUser = { name: 'Dr. Admin', roll: 'ADMIN', email: 'admin@college.edu', pass: 'admin123', dept: 'Administration', year: 'Staff' };
  }
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  launchApp();
  setTimeout(() => showSection('admin', document.querySelector('.nav-item:last-child')), 100);
}

function doSignup() {
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
  
  if (pass.length < 6) { 
    msg.style.color = 'var(--danger)'; 
    msg.textContent = 'Password must be at least 6 characters.'; 
    return; 
  }
  
  // Check if email or roll already exists
  if (users.some(u => u.email === email || u.roll === roll)) {
    msg.style.color = 'var(--danger)'; 
    msg.textContent = 'Email or Roll number already registered.'; 
    return;
  }

  const newUser = { 
    name, 
    roll, 
    email, 
    pass, 
    dept: document.getElementById('regDept').value, 
    year: document.getElementById('regYear').value 
  };
  
  users.push(newUser);
  saveUsers();
  
  // Initialize user progress in localStorage
  try {
    const userProgress = {
      deld: { title: 'Digital Electronics & Logic Design', completed: 0, total: 100 },
      cg: { title: 'Computer Graphics Laboratory', completed: 0, total: 100 },
      experimentsDone: 0,
      totalExperiments: 24,
      labTime: 0,
      labTimeGoal: 40
    };
    localStorage.setItem('userProgress_' + email, JSON.stringify(userProgress));
  } catch (e) {
    console.warn('Could not save initial progress', e);
  }
  
  msg.style.color = 'var(--accent3)';
  msg.textContent = '✓ Account created! Signing you in...';
  
  currentUser = newUser;
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  setTimeout(() => launchApp(), 800);
}

function launchApp() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('appPage').classList.remove('hidden');
  document.getElementById('sideUser').textContent = currentUser.name;
  document.getElementById('sideRoll').textContent = currentUser.roll;
  document.getElementById('sideAvatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
  
  // Initialize back button state
  updateBackButton();
  
  // Ensure known users have progress initialized
  initializeUserProgress();

  // Load saved per-user progress from localStorage (if any)
  try {
    const savedProgress = localStorage.getItem('userProgress_' + currentUser.email);
    if (savedProgress) {
      userProgress[currentUser.email] = JSON.parse(savedProgress);
    } else if (!userProgress[currentUser.email]) {
      // Initialize new user/demo user progress starting from 0
      userProgress[currentUser.email] = {
        deld: { title: 'Digital Electronics & Logic Design', completed: 0, total: 100 },
        cg: { title: 'Computer Graphics Laboratory', completed: 0, total: 100 },
        experimentsDone: 0,
        totalExperiments: 24,
        labTime: 0,
        labTimeGoal: 40
      };
      // persist initial progress
      localStorage.setItem('userProgress_' + currentUser.email, JSON.stringify(userProgress[currentUser.email]));
    }
  } catch (e) { console.warn('Error loading saved progress', e); }
  
  updateProgressDisplay();
  if(typeof initActivityChart === 'function') initActivityChart();
  if(typeof initSRWaveform === 'function') initSRWaveform();
}

function doLogout() {
  currentUser = null;
  // Clear session from localStorage
  localStorage.removeItem('currentUser');
  document.getElementById('appPage').classList.add('hidden');
  document.getElementById('authPage').classList.remove('hidden');
  showLogin();
  // Clear form
  document.getElementById('loginId').value = '';
  document.getElementById('loginPass').value = '';
}

// ════════════════════════════════════════
//  PROGRESS TRACKING
// ════════════════════════════════════════
function updateProgressDisplay() {
  if (!currentUser || !userProgress[currentUser.email]) return;
  
  const progress = userProgress[currentUser.email];
  
  // Update DELD progress
  const deldFill = document.getElementById('deld-progress');
  const deldText = document.getElementById('deld-text');
  if (deldFill) {
    deldFill.style.width = progress.deld.completed + '%';
    if (deldText) deldText.textContent = progress.deld.completed + '% complete';
  }
  
  // Update CG progress
  const cgFill = document.getElementById('cg-progress');
  const cgText = document.getElementById('cg-text');
  if (cgFill) {
    cgFill.style.width = progress.cg.completed + '%';
    if (cgText) cgText.textContent = progress.cg.completed + '% complete';
  }

  // Update top dashboard stats (experiments done and lab time)
  const cards = document.querySelectorAll('#sec-dashboard .stats-grid .card');
  if (cards && cards.length >= 4) {
    // Experiments Done (card 0)
    try {
      const expDone = progress.experimentsDone || 0;
      const totalExp = progress.totalExperiments || 24;
      const statVal = cards[0].querySelector('.stat-val');
      const statLabel = cards[0].querySelector('.stat-label');
      const fill = cards[0].querySelector('.progress-fill');
      if (statVal) statVal.textContent = expDone;
      if (statLabel) statLabel.textContent = `of ${totalExp} total`;
      if (fill) fill.style.width = ((totalExp>0)?Math.round((expDone/totalExp)*100):0) + '%';
    } catch (e) { console.warn('Error updating experiments done UI', e); }

    // Lab Time (card 3)
    try {
      const labTime = progress.labTime || 0;
      const labGoal = progress.labTimeGoal || 40;
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
      if (statVal) statVal.textContent = (progress.deld.completed || 0) + '%';
      if (fill) fill.style.width = (progress.deld.completed || 0) + '%';
    }
    if (cgCard) {
      const statVal = cgCard.querySelector('.stat-val');
      const fill = cgCard.querySelector('.progress-fill');
      if (statVal) statVal.textContent = (progress.cg.completed || 0) + '%';
      if (fill) fill.style.width = (progress.cg.completed || 0) + '%';
    }
  } catch (e) { console.warn('Error updating DELD/CG top cards', e); }
}

function updateModuleProgress(module, increment) {
  if (!currentUser || !userProgress[currentUser.email]) return;
  
  const progress = userProgress[currentUser.email][module];
  if (progress.completed < progress.total) {
    progress.completed = Math.min(progress.completed + increment, progress.total);
    updateProgressDisplay();
    
    // Save progress (in production, this would be a server call)
    try { localStorage.setItem('userProgress_' + currentUser.email, JSON.stringify(userProgress[currentUser.email])); } catch (e) { console.warn('Could not persist progress', e); }
  }
}

// Set module progress to a specific percentage (0-100)
function setModuleProgress(module, percentage) {
  if (!currentUser || !userProgress[currentUser.email]) return;
  
  const progress = userProgress[currentUser.email][module];
  const maxValue = progress.total;
  progress.completed = Math.round((percentage / 100) * maxValue);
  updateProgressDisplay();
  
  // Save progress (in production, this would be a server call)
  try { localStorage.setItem('userProgress_' + currentUser.email, JSON.stringify(userProgress[currentUser.email])); } catch (e) { console.warn('Could not persist progress', e); }
}

function getModuleProgress(module) {
  if (!currentUser || !userProgress[currentUser.email]) return 0;
  return userProgress[currentUser.email][module].completed;
}

function completeTask(module, taskName) {
  if (!currentUser || !userProgress[currentUser.email]) return;
  
  // Track specific task completion
  const currentTime = new Date().toLocaleTimeString();
  updateModuleProgress(module, 5);
  
  // Log activity (in production, this would be sent to server)
  console.log(`✓ Task completed: ${taskName} (${currentTime})`);
}

// Real-time activity tracking system
function trackActivity(type, description, module) {
  if (!currentUser) return;
  
  // Initialize activity log if not exists
  if (!window.activityLog) window.activityLog = [];
  
  const activity = {
    type: type, // 'completed', 'started', 'explored', 'generated'
    description: description,
    module: module,
    timestamp: new Date(),
    user: currentUser.email
  };
  
  window.activityLog.unshift(activity);
  
  // Keep only last 10 activities in log
  if (window.activityLog.length > 10) window.activityLog.pop();
  
  // Update recent activity display if dashboard is visible
  updateRecentActivityDisplay();
}

function updateRecentActivityDisplay() {
  const activityContainer = document.querySelector('#sec-dashboard .card:last-child div:last-child');
  if (!activityContainer || !window.activityLog) return;
  
  let html = '';
  for (let i = 0; i < Math.min(5, window.activityLog.length); i++) {
    const activity = window.activityLog[i];
    const iconMap = { 'completed': '✅', 'started': '▶', 'explored': '🔍', 'generated': '📝' };
    const icon = iconMap[activity.type] || '•';
    const time = activity.timestamp.toLocaleTimeString();
    html += `<div>${icon} <span style="color:var(--muted);">${activity.description}</span> <span style="color:var(--muted2);font-size:0.75rem;">${time}</span></div>`;
  }
  
  if (html) activityContainer.innerHTML = html;
}

// Reset current user's progress to zero
function resetMyProgress() {
  if (!currentUser) return alert('No user session found.');
  const ok = confirm('Reset all your module progress to 0%? This action cannot be undone.');
  if (!ok) return;

  userProgress[currentUser.email] = {
    deld: { title: 'Digital Electronics & Logic Design', completed: 0, total: 100 },
    cg: { title: 'Computer Graphics Laboratory', completed: 0, total: 100 }
  };
  try { localStorage.setItem('userProgress_' + currentUser.email, JSON.stringify(userProgress[currentUser.email])); } catch (e) { console.warn('Could not persist reset progress', e); }
  updateProgressDisplay();
  trackActivity('completed', 'Reset progress to 0%', 'GENERAL');
  // provide visual feedback
  const btn = document.getElementById('resetProgressBtn');
  if (btn) {
    btn.textContent = 'Progress reset';
    setTimeout(() => btn.textContent = 'Reset my progress', 1600);
  }
  // Clear per-topic done markers (check-circles and topic-item classes)
  document.querySelectorAll('.check-circle.done').forEach(el => { el.classList.remove('done'); el.textContent = ''; });
  document.querySelectorAll('.topic-item.done').forEach(el => el.classList.remove('done'));
  // Convert green "Done" tags back to warning/not-started
  document.querySelectorAll('.tag.tag-green').forEach(el => {
    el.classList.remove('tag-green');
    el.classList.add('tag-warn');
    if (/done/i.test(el.textContent)) el.textContent = 'Not started';
  });
  // Clear recent activity log and UI
  if (window.activityLog) window.activityLog = [];
  const activityContainer = document.querySelector('#sec-dashboard .card:last-child div:last-child');
  if (activityContainer) activityContainer.innerHTML = '';
  // Reset weekly activity chart to zeros
  try {
    initActivityChart([0,0,0,0,0,0,0]);
  } catch (e) { console.warn('Could not reset activity chart', e); }
  // Reset experimentsDone and labTime in stored progress
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
  const sec = document.getElementById('sec-' + id);
  sec.classList.remove('hidden');
  setTimeout(() => sec.classList.add('fade-in'), 10);

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
  if (id.startsWith('cg-')) { setTimeout(() => cgInitSection(id), 50); }
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
  shear: false
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
  
  // Update module progress based on this module's sections
  if (moduleName === 'deld') {
    updateDELDProgress();
  } else {
    updateCGProgress();
  }
}

function updateDELDProgress() {
  // Calculate progress based on:
  // 1. Gate completion (8 gates)
  // 2. All DELD section completions
  
  const gates = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];
  const gateCompleted = gates.filter(g => gateCompletion[g]).length;
  
  const deldSections = Object.values(deldCompletion);
  const sectionsCompleted = deldSections.filter(s => s === true).length;
  
  // Total items to track: 8 gates + 12 sections = 20
  const totalItems = gates.length + deldSections.length;
  const completedItems = gateCompleted + sectionsCompleted;
  
  const percentage = Math.round((completedItems / totalItems) * 100);
  setModuleProgress('deld', percentage);
}

function updateCGProgress() {
  // Calculate progress based on CG section completions
  const cgSections = Object.values(cgCompletion);
  const completedItems = cgSections.filter(s => s === true).length;
  const totalItems = cgSections.length;
  
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  setModuleProgress('cg', percentage);
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
  
  updateDELDProgress();
}

function updateGatesCompletion() {
  const gates = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'];
  const completed = gates.filter(g => gateCompletion[g]).length;
  const percentage = Math.round((completed / gates.length) * 100);
  
  updateModuleProgress('deld', percentage);
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
  setupComponentsPanel();
  setTool('select');
}

// --- Components panel ---
function setupComponentsPanel(){
  const list = document.getElementById('components-list');
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
//  DDA ALGORITHM
// ════════════════════════════════════════
function drawDDA() {
  const canvas = document.getElementById('ddaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const x1 = parseInt(document.getElementById('ddaX1').value);
  const y1 = parseInt(document.getElementById('ddaY1').value);
  const x2 = parseInt(document.getElementById('ddaX2').value);
  const y2 = parseInt(document.getElementById('ddaY2').value);
  const color = document.getElementById('ddaColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  ctx.drawImage; // axes
  drawAxes(ctx, canvas.width, canvas.height);

  // DDA
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const xInc = dx / steps, yInc = dy / steps;
  let x = x1, y = y1;
  const pts = [];

  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i++) {
    const px = Math.round(x), py = Math.round(y);
    ctx.fillRect(px - 1, py - 1, 2, 2);
    pts.push({ x: px, y: py, xInc: xInc.toFixed(3), yInc: yInc.toFixed(3) });
    x += xInc; y += yInc;
  }

  // Endpoint markers
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x2, y2, 4, 0, Math.PI*2); ctx.stroke();

  const stepsWrap = document.getElementById('ddaSteps');
  stepsWrap.innerHTML = pts.slice(0, 12).map((p, i) => 
    `<div style="color:var(--text)">Step ${i}: x=${p.x}, y=${p.y} <span style="color:var(--muted)">(Δx=${p.xInc}, Δy=${p.yInc})</span></div>`
  ).join('') + (pts.length > 12 ? `<div style="color:var(--muted)">...${pts.length - 12} more steps</div>` : '');

  const code = generateDDACode(x1, y1, x2, y2);
  document.getElementById('ddaCppCode').innerHTML = highlightCpp(code);
}

function generateDDACode(x1, y1, x2, y2) {
  return `// DDA Line Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Generated for: (${x1},${y1}) → (${x2},${y2})

#include <graphics.h>
#include <cmath>
#include <iostream>
using namespace std;

void DDA(int x1, int y1, int x2, int y2) {
    int dx = x2 - x1;
    int dy = y2 - y1;
    int steps = max(abs(dx), abs(dy));
    
    float xInc = (float)dx / steps;
    float yInc = (float)dy / steps;
    
    float x = x1, y = y1;
    
    for (int i = 0; i <= steps; i++) {
        putpixel(round(x), round(y), WHITE);
        x += xInc;
        y += yInc;
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    
    DDA(${x1}, ${y1}, ${x2}, ${y2});
    
    getch();
    closegraph();
    return 0;
}`;
}

// ════════════════════════════════════════
//  BRESENHAM
// ════════════════════════════════════════
function drawBresenham() {
  const canvas = document.getElementById('brCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let x1 = parseInt(document.getElementById('brX1').value);
  let y1 = parseInt(document.getElementById('brY1').value);
  let x2 = parseInt(document.getElementById('brX2').value);
  let y2 = parseInt(document.getElementById('brY2').value);
  const color = document.getElementById('brColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  drawAxes(ctx, canvas.width, canvas.height);

  let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  let sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  const pts = [], steps = [];
  let x = x1, y = y1;

  ctx.fillStyle = color;
  for (let i = 0; i < 1000; i++) {
    ctx.fillRect(x - 1, y - 1, 2, 2);
    pts.push([x, y]);
    const e2 = 2 * err;
    const step = { x, y, err, e2 };
    steps.push(step);
    if (x === x2 && y === y2) break;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }

  document.getElementById('brSteps').innerHTML = steps.slice(0, 10).map((s, i) =>
    `<div>Step ${i}: (${s.x},${s.y}) err=${s.err} 2e=${s.e2}</div>`
  ).join('');

  const code = generateBresenhamCode(x1, y1, x2, y2);
  document.getElementById('brCppCode').innerHTML = highlightCpp(code);
}

function generateBresenhamCode(x1, y1, x2, y2) {
  return `// Bresenham Line Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Generated for: (${x1},${y1}) → (${x2},${y2})

#include <graphics.h>
#include <cmath>
using namespace std;

void Bresenham(int x1, int y1, int x2, int y2) {
    int dx = abs(x2 - x1);
    int dy = abs(y2 - y1);
    int sx = (x1 < x2) ? 1 : -1;
    int sy = (y1 < y2) ? 1 : -1;
    int err = dx - dy;
    
    while (true) {
        putpixel(x1, y1, WHITE);
        if (x1 == x2 && y1 == y2) break;
        
        int e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 <  dx) { err += dx; y1 += sy; }
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    
    Bresenham(${x1}, ${y1}, ${x2}, ${y2});
    
    getch();
    closegraph();
    return 0;
}`;
}

// ════════════════════════════════════════
//  MIDPOINT CIRCLE
// ════════════════════════════════════════
function drawCircle() {
  const canvas = document.getElementById('mcCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = parseInt(document.getElementById('mcX').value);
  const cy = parseInt(document.getElementById('mcY').value);
  const r = parseInt(document.getElementById('mcR').value);
  const color = document.getElementById('mcColor').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  drawAxes(ctx, canvas.width, canvas.height);

  // Midpoint circle algorithm
  let x = 0, y = r, d = 1 - r;
  ctx.fillStyle = color;

  function plot8(cx, cy, x, y) {
    [[cx+x,cy+y],[cx-x,cy+y],[cx+x,cy-y],[cx-x,cy-y],
     [cx+y,cy+x],[cx-y,cy+x],[cx+y,cy-x],[cx-y,cy-x]].forEach(([px,py]) => {
      ctx.fillRect(px-1, py-1, 2, 2);
    });
  }

  while (x <= y) {
    plot8(cx, cy, x, y);
    if (d < 0) d += 2*x + 3;
    else { d += 2*(x-y) + 5; y--; }
    x++;
  }

  // Center mark
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.stroke();

  const code = generateCircleCode(cx, cy, r);
  document.getElementById('mcCppCode').innerHTML = highlightCpp(code);
}

function generateCircleCode(cx, cy, r) {
  return `// Midpoint Circle Drawing Algorithm
// VirtuLab — Computer Graphics Module
// Center: (${cx},${cy}), Radius: ${r}

#include <graphics.h>
using namespace std;

void plotCirclePoints(int cx, int cy, int x, int y) {
    putpixel(cx+x, cy+y, WHITE);
    putpixel(cx-x, cy+y, WHITE);
    putpixel(cx+x, cy-y, WHITE);
    putpixel(cx-x, cy-y, WHITE);
    putpixel(cx+y, cy+x, WHITE);
    putpixel(cx-y, cy+x, WHITE);
    putpixel(cx+y, cy-x, WHITE);
    putpixel(cx-y, cy-x, WHITE);
}

void MidpointCircle(int cx, int cy, int r) {
    int x = 0, y = r;
    int d = 1 - r;
    
    while (x <= y) {
        plotCirclePoints(cx, cy, x, y);
        if (d < 0) {
            d += 2*x + 3;
        } else {
            d += 2*(x - y) + 5;
            y--;
        }
        x++;
    }
}

int main() {
    int gd = DETECT, gm;
    initgraph(&gd, &gm, "");
    MidpointCircle(${cx}, ${cy}, ${r});
    getch(); closegraph();
    return 0;
}`;
}

// ════════════════════════════════════════
//  2D TRANSFORMS
// ════════════════════════════════════════
let t2dParams = { tx:50, ty:30, angle:45, sx:1.5, sy:1.5, axis:'x', shx:0.5, shy:0 };
let current2DMode = 'translate';

const SHAPE_PTS = [[50,30],[150,30],[150,130],[50,130]]; // square

function init2DTransform(mode) {
  current2DMode = mode;
  const ctrl = document.getElementById('t2dControls');
  const configs = {
    translate: `<div class="ctrl-group"><span class="ctrl-label">Tx</span><input type="range" id="t2d_tx" min="-150" max="150" value="50" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Ty</span><input type="range" id="t2d_ty" min="-150" max="150" value="30" oninput="update2D()"></div>`,
    rotate:    `<div class="ctrl-group"><span class="ctrl-label">Angle</span><input type="range" id="t2d_angle" min="0" max="360" value="45" oninput="update2D()"></div>`,
    scale:     `<div class="ctrl-group"><span class="ctrl-label">Sx</span><input type="range" id="t2d_sx" min="10" max="300" value="150" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Sy</span><input type="range" id="t2d_sy" min="10" max="300" value="150" oninput="update2D()"></div>`,
    reflect:   `<div class="ctrl-group"><span class="ctrl-label">Axis</span><select id="t2d_axis" onchange="update2D()" style="width:auto;padding:0.3rem;"><option value="x">X-axis</option><option value="y">Y-axis</option><option value="o">Origin</option></select></div>`,
    shear:     `<div class="ctrl-group"><span class="ctrl-label">Shx</span><input type="range" id="t2d_shx" min="-200" max="200" value="50" oninput="update2D()"></div>
                <div class="ctrl-group"><span class="ctrl-label">Shy</span><input type="range" id="t2d_shy" min="-200" max="200" value="0" oninput="update2D()"></div>`,
  };
  ctrl.innerHTML = configs[mode] || '';
  setTimeout(() => update2D(), 10);
}

function update2D() {
  const canvas = document.getElementById('t2dCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);
  
  const W = canvas.width, H = canvas.height;
  const originX = W/2, originY = H/2;

  // Draw axes
  ctx.strokeStyle = '#1e2330'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();

  // Original shape (centered at origin)
  const orig = [[-70,-50],[70,-50],[70,50],[-70,50]];
  
  // Draw original
  ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = 1.5;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  orig.forEach((p, i) => {
    const x = originX + p[0], y = originY + p[1];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);

  // Apply transform
  let transformed = orig.map(([x, y]) => {
    const mode = current2DMode;
    if (mode === 'translate') {
      const tx = parseFloat(document.getElementById('t2d_tx')?.value || 50);
      const ty = parseFloat(document.getElementById('t2d_ty')?.value || 30);
      return [x + tx, y + ty];
    } else if (mode === 'rotate') {
      const a = (parseFloat(document.getElementById('t2d_angle')?.value || 45)) * Math.PI / 180;
      return [x*Math.cos(a) - y*Math.sin(a), x*Math.sin(a) + y*Math.cos(a)];
    } else if (mode === 'scale') {
      const sx = (parseFloat(document.getElementById('t2d_sx')?.value || 150)) / 100;
      const sy = (parseFloat(document.getElementById('t2d_sy')?.value || 150)) / 100;
      return [x * sx, y * sy];
    } else if (mode === 'reflect') {
      const axis = document.getElementById('t2d_axis')?.value || 'x';
      if (axis === 'x') return [x, -y];
      if (axis === 'y') return [-x, y];
      return [-x, -y];
    } else if (mode === 'shear') {
      const shx = (parseFloat(document.getElementById('t2d_shx')?.value || 50)) / 100;
      const shy = (parseFloat(document.getElementById('t2d_shy')?.value || 0)) / 100;
      return [x + shx*y, y + shy*x];
    }
    return [x, y];
  });

  ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2;
  ctx.beginPath();
  transformed.forEach((p, i) => {
    const x = originX + p[0], y = originY + p[1];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath(); ctx.stroke();

  // Fill
  ctx.fillStyle = 'rgba(0,229,255,0.06)';
  ctx.fill();

  // Matrix display
  updateMatrixDisplay(current2DMode);
  generate2DCode(current2DMode);
}

function updateMatrixDisplay(mode) {
  const el = document.getElementById('t2dMatrix');
  const matrices = {
    translate: (tx, ty) => `[1  0  ${tx}]\n[0  1  ${ty}]\n[0  0   1 ]`,
    rotate: (a) => { const r = a*Math.PI/180; return `[${c(Math.cos(r))}  ${c(-Math.sin(r))}  0]\n[${c(Math.sin(r))}  ${c(Math.cos(r))}  0]\n[0       0      1]`; },
    scale: (sx, sy) => `[${sx}  0   0]\n[0   ${sy}  0]\n[0   0   1]`,
  };
  function c(v) { return v.toFixed(2).padStart(5); }
  
  if (mode === 'translate') {
    const tx = document.getElementById('t2d_tx')?.value || 0;
    const ty = document.getElementById('t2d_ty')?.value || 0;
    el.innerHTML = `<div style="white-space:pre;color:var(--accent);">${matrices.translate(tx, ty)}</div>`;
  } else if (mode === 'rotate') {
    const a = document.getElementById('t2d_angle')?.value || 0;
    el.innerHTML = `<div style="white-space:pre;color:var(--accent);">${matrices.rotate(parseFloat(a))}</div><div style="color:var(--muted);font-size:0.75rem;margin-top:0.5rem;">θ = ${a}°</div>`;
  } else {
    el.innerHTML = `<div style="color:var(--muted);font-size:0.85rem;">See generated code →</div>`;
  }
}

function generate2DCode(mode) {
  const codes = {
    translate: () => {
      const tx = document.getElementById('t2d_tx')?.value || 0;
      const ty = document.getElementById('t2d_ty')?.value || 0;
      return `// 2D Translation
// VirtuLab CG Module | Tx=${tx}, Ty=${ty}
#include <GL/glut.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    
    // Original shape (dashed)
    glColor3f(0.4, 0.4, 0.5);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50);
        glVertex2f( 70, -50);
        glVertex2f( 70,  50);
        glVertex2f(-70,  50);
    glEnd();
    
    // Translation Matrix: [1 0 Tx; 0 1 Ty; 0 0 1]
    glPushMatrix();
    glTranslatef(${tx}, ${ty}, 0);
    
    glColor3f(0, 0.9, 1);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50);
        glVertex2f( 70, -50);
        glVertex2f( 70,  50);
        glVertex2f(-70,  50);
    glEnd();
    glPopMatrix();
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("2D Translation");
    gluOrtho2D(-250, 250, -200, 200);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
    },
    rotate: () => {
      const a = document.getElementById('t2d_angle')?.value || 0;
      return `// 2D Rotation
// VirtuLab CG Module | Angle=${a}°
#include <GL/glut.h>

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    
    glColor3f(0.4, 0.4, 0.5);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50); glVertex2f(70, -50);
        glVertex2f(70, 50);   glVertex2f(-70, 50);
    glEnd();
    
    // Rotation Matrix: [cosθ -sinθ; sinθ cosθ]
    glPushMatrix();
    glRotatef(${a}, 0, 0, 1); // Rotate ${a}° around Z-axis
    
    glColor3f(0, 0.9, 1);
    glBegin(GL_LINE_LOOP);
        glVertex2f(-70, -50); glVertex2f(70, -50);
        glVertex2f(70, 50);   glVertex2f(-70, 50);
    glEnd();
    glPopMatrix();
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("2D Rotation");
    gluOrtho2D(-250, 250, -200, 200);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
    },
  };
  const fn = codes[mode] || codes['translate'];
  document.getElementById('t2dCode').innerHTML = highlightCpp(fn());
}

// ════════════════════════════════════════
//  3D TRANSFORMS
// ════════════════════════════════════════
function draw3D() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rx = parseFloat(document.getElementById('rx').value) * Math.PI / 180;
  const ry = parseFloat(document.getElementById('ry').value) * Math.PI / 180;
  const scale = parseFloat(document.getElementById('rs').value);
  const proj = document.getElementById('projType').value;

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  // Cube vertices
  const verts = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1]
  ];

  // Rotation matrices
  const rotX = v => [v[0], v[1]*Math.cos(rx)-v[2]*Math.sin(rx), v[1]*Math.sin(rx)+v[2]*Math.cos(rx)];
  const rotY = v => [v[0]*Math.cos(ry)+v[2]*Math.sin(ry), v[1], -v[0]*Math.sin(ry)+v[2]*Math.cos(ry)];

  const projected = verts.map(v => {
    let p = rotX(v);
    p = rotY(p);
    let px, py;
    if (proj === 'ortho') {
      px = p[0] * scale + canvas.width/2;
      py = -p[1] * scale + canvas.height/2;
    } else {
      const d = 4;
      const z = p[2] + d;
      px = (p[0] / z) * scale * 2 + canvas.width/2;
      py = -(p[1] / z) * scale * 2 + canvas.height/2;
    }
    return [px, py, p[2]];
  });

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  edges.forEach(([a, b]) => {
    const za = projected[a][2], zb = projected[b][2];
    const alpha = Math.min(1, Math.max(0.3, (za + zb + 2) / 4));
    ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  });

  projected.forEach(([x, y]) => {
    ctx.fillStyle = 'var(--accent)';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });

  const rxD = document.getElementById('rx').value;
  const ryD = document.getElementById('ry').value;
  const sc = document.getElementById('rs').value;
  const code = `// 3D Rotation (OpenGL)
// VirtuLab CG Module | Rx=${rxD}° Ry=${ryD}° Scale=${sc}
#include <GL/glut.h>
#include <cmath>

float rotX = ${rxD}, rotY = ${ryD};

// Rotation matrix X-axis
void rotateX(float v[3], float angle) {
    float r = angle * M_PI / 180.0f;
    float y = v[1]*cos(r) - v[2]*sin(r);
    float z = v[1]*sin(r) + v[2]*cos(r);
    v[1] = y; v[2] = z;
}

// Rotation matrix Y-axis
void rotateY(float v[3], float angle) {
    float r = angle * M_PI / 180.0f;
    float x =  v[0]*cos(r) + v[2]*sin(r);
    float z = -v[0]*sin(r) + v[2]*cos(r);
    v[0] = x; v[2] = z;
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glLoadIdentity();
    
    // Apply ${proj === 'persp' ? 'Perspective' : 'Orthographic'} projection
    glRotatef(rotX, 1, 0, 0);
    glRotatef(rotY, 0, 1, 0);
    glScalef(${(sc/80).toFixed(2)}, ${(sc/80).toFixed(2)}, ${(sc/80).toFixed(2)});
    
    glColor3f(0.0f, 0.9f, 1.0f);
    glutWireCube(2.0);
    
    glutSwapBuffers();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_DEPTH);
    glutInitWindowSize(500, 400);
    glutCreateWindow("3D Cube — ${proj}");
    glEnable(GL_DEPTH_TEST);
    ${proj === 'persp' ? 'gluPerspective(45, 1.25, 0.1, 100);\nglTranslatef(0, 0, -5);' : 'gluOrtho2D(-3, 3, -3, 3);'}
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
  document.getElementById('code3d').innerHTML = highlightCpp(code);
}

// ════════════════════════════════════════
//  COHEN-SUTHERLAND CLIPPING
// ════════════════════════════════════════
const LINES = [
  {x1:20,y1:20,x2:390,y2:260},{x1:50,y1:130,x2:380,y2:50},
  {x1:10,y1:260,x2:250,y2:10},{x1:180,y1:10,x2:380,y2:270}
];

function computeCode(x, y, xmin, ymin, xmax, ymax) {
  let c = 0;
  if (x < xmin) c |= 1;
  if (x > xmax) c |= 2;
  if (y < ymin) c |= 4;
  if (y > ymax) c |= 8;
  return c;
}

function cohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  let c1 = computeCode(x1,y1,xmin,ymin,xmax,ymax);
  let c2 = computeCode(x2,y2,xmin,ymin,xmax,ymax);
  while (true) {
    if (!(c1|c2)) return {x1,y1,x2,y2,accept:true};
    if (c1&c2) return {accept:false};
    const c = c1 ? c1 : c2;
    let x, y;
    if (c&8) { x = x1+(x2-x1)*(ymax-y1)/(y2-y1); y = ymax; }
    else if (c&4) { x = x1+(x2-x1)*(ymin-y1)/(y2-y1); y = ymin; }
    else if (c&2) { y = y1+(y2-y1)*(xmax-x1)/(x2-x1); x = xmax; }
    else { y = y1+(y2-y1)*(xmin-x1)/(x2-x1); x = xmin; }
    if (c === c1) { x1=x; y1=y; c1=computeCode(x1,y1,xmin,ymin,xmax,ymax); }
    else { x2=x; y2=y; c2=computeCode(x2,y2,xmin,ymin,xmax,ymax); }
  }
}

function drawClipping() {
  const canvas = document.getElementById('clipCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const xmin = parseInt(document.getElementById('cxmin').value);
  const xmax = parseInt(document.getElementById('cxmax').value);
  const ymin = parseInt(document.getElementById('cymin').value);
  const ymax = parseInt(document.getElementById('cymax').value);

  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  // Clipping window
  ctx.strokeStyle = 'var(--warn)'; ctx.lineWidth = 2; ctx.setLineDash([]);
  ctx.strokeRect(xmin, ymin, xmax-xmin, ymax-ymin);
  ctx.fillStyle = 'rgba(245,158,11,0.05)';
  ctx.fillRect(xmin, ymin, xmax-xmin, ymax-ymin);

  let results = [];
  LINES.forEach(l => {
    // Draw original (dimmed)
    ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.setLineDash([]);

    const clipped = cohenSutherland(l.x1, l.y1, l.x2, l.y2, xmin, ymin, xmax, ymax);
    if (clipped.accept) {
      ctx.strokeStyle = 'var(--accent)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(clipped.x1, clipped.y1); ctx.lineTo(clipped.x2, clipped.y2); ctx.stroke();
      results.push('✓ Accepted');
    } else {
      results.push('✗ Rejected');
    }
  });

  document.getElementById('clipResult').textContent = 'Lines: ' + results.join(' | ');

  const code = `// Cohen-Sutherland Line Clipping
// VirtuLab CG Module | Window: (${xmin},${ymin})-(${xmax},${ymax})

#include <graphics.h>
#define LEFT 1
#define RIGHT 2
#define BOTTOM 4
#define TOP 8

int computeCode(float x, float y) {
    int code = 0;
    if (x < ${xmin}) code |= LEFT;
    if (x > ${xmax}) code |= RIGHT;
    if (y < ${ymin}) code |= BOTTOM;
    if (y > ${ymax}) code |= TOP;
    return code;
}

void cohenSutherland(float x1,float y1,float x2,float y2) {
    int c1 = computeCode(x1,y1);
    int c2 = computeCode(x2,y2);
    
    while (true) {
        if (!(c1|c2)) {
            // Completely inside - accept
            line(x1,y1,x2,y2);
            return;
        }
        if (c1&c2) return; // Completely outside
        
        int c = c1 ? c1 : c2;
        float x, y;
        
        if (c & TOP)         { x = x1+(x2-x1)*(${ymax}-y1)/(y2-y1); y=${ymax}; }
        else if (c & BOTTOM) { x = x1+(x2-x1)*(${ymin}-y1)/(y2-y1); y=${ymin}; }
        else if (c & RIGHT)  { y = y1+(y2-y1)*(${xmax}-x1)/(x2-x1); x=${xmax}; }
        else                 { y = y1+(y2-y1)*(${xmin}-x1)/(x2-x1); x=${xmin}; }
        
        if (c == c1) { x1=x; y1=y; c1=computeCode(x1,y1); }
        else         { x2=x; y2=y; c2=computeCode(x2,y2); }
    }
}

int main() {
    int gd=DETECT, gm;
    initgraph(&gd,&gm,"");
    rectangle(${xmin},${ymin},${xmax},${ymax});
    cohenSutherland(20,20,390,260);
    getch(); closegraph(); return 0;
}`;
  document.getElementById('clipCode').innerHTML = highlightCpp(code);
}

// ════════════════════════════════════════
//  BEZIER CURVES
// ════════════════════════════════════════
let bezierPts = [{x:60,y:240},{x:120,y:60},{x:280,y:60},{x:360,y:240}];
let dragIdx = -1;

function initBezier() {
  const canvas = document.getElementById('bezierCanvas');
  if (!canvas) return;
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); bezierMM({clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}); });
}

function bezierMD(e) {
  const canvas = document.getElementById('bezierCanvas');
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  dragIdx = bezierPts.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 16);
}

function bezierMM(e) {
  if (dragIdx < 0) return;
  const canvas = document.getElementById('bezierCanvas');
  const rect = canvas.getBoundingClientRect();
  bezierPts[dragIdx].x = (e.clientX - rect.left) * (canvas.width / rect.width);
  bezierPts[dragIdx].y = (e.clientY - rect.top) * (canvas.height / rect.height);
  drawBezier();
  updateBezierCode();
}

function bezierMU() { dragIdx = -1; }

function drawBezier() {
  const canvas = document.getElementById('bezierCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050709'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, canvas.width, canvas.height);

  // Control polygon
  ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath();
  bezierPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.stroke(); ctx.setLineDash([]);

  // Bezier curve
  ctx.strokeStyle = 'var(--accent2)'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(bezierPts[0].x, bezierPts[0].y);
  ctx.bezierCurveTo(
    bezierPts[1].x, bezierPts[1].y,
    bezierPts[2].x, bezierPts[2].y,
    bezierPts[3].x, bezierPts[3].y
  );
  ctx.stroke();

  // Points
  const ptColors = ['var(--accent3)', 'var(--warn)', 'var(--warn)', 'var(--accent3)'];
  bezierPts.forEach((p, i) => {
    ctx.fillStyle = ptColors[i]; ctx.strokeStyle = '#050709'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0c10';
    ctx.font = '9px Space Mono'; ctx.textAlign = 'center';
    ctx.fillText('P'+i, p.x, p.y+3);
  });
}

function updateBezierCode() {
  const p = bezierPts;
  const code = `// Cubic Bezier Curve (OpenGL)
// VirtuLab CG Module
// Control Points:
//   P0=(${Math.round(p[0].x)},${Math.round(p[0].y)})  P1=(${Math.round(p[1].x)},${Math.round(p[1].y)})
//   P2=(${Math.round(p[2].x)},${Math.round(p[2].y)})  P3=(${Math.round(p[3].x)},${Math.round(p[3].y)})

#include <GL/glut.h>
#include <cmath>

// Bernstein basis polynomials
float B0(float t) { return (1-t)*(1-t)*(1-t); }
float B1(float t) { return 3*t*(1-t)*(1-t); }
float B2(float t) { return 3*t*t*(1-t); }
float B3(float t) { return t*t*t; }

// Control points
float px[4] = {${p.map(pt => Math.round(pt.x)).join(', ')}};
float py[4] = {${p.map(pt => Math.round(pt.y)).join(', ')}};

void drawBezier() {
    glColor3f(0.49f, 0.23f, 0.93f); // Purple
    glBegin(GL_LINE_STRIP);
    
    int N = 200; // Number of segments
    for (int i = 0; i <= N; i++) {
        float t = (float)i / N;
        
        // Cubic Bezier formula:
        // B(t) = B0(t)*P0 + B1(t)*P1 + B2(t)*P2 + B3(t)*P3
        float x = B0(t)*px[0] + B1(t)*px[1] + B2(t)*px[2] + B3(t)*px[3];
        float y = B0(t)*py[0] + B1(t)*py[1] + B2(t)*py[2] + B3(t)*py[3];
        
        glVertex2f(x, y);
    }
    glEnd();
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT);
    drawBezier();
    
    // Draw control polygon
    glColor3f(0.3f, 0.3f, 0.3f);
    glEnable(GL_LINE_STIPPLE);
    glLineStipple(2, 0xAAAA);
    glBegin(GL_LINE_STRIP);
    for (int i = 0; i < 4; i++) glVertex2f(px[i], py[i]);
    glEnd();
    glDisable(GL_LINE_STIPPLE);
    
    glFlush();
}

int main(int argc, char** argv) {
    glutInit(&argc, argv);
    glutInitWindowSize(500, 400);
    glutCreateWindow("Bezier Curve");
    gluOrtho2D(0, 420, 300, 0);
    glutDisplayFunc(display);
    glutMainLoop();
    return 0;
}`;
  document.getElementById('bezierCode').innerHTML = highlightCpp(code);
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
  // Load users from storage
  loadUsers();

  // Initialize progress for known users
  initializeUserProgress();

  // Check if user has active session in localStorage
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Verify user still exists in users list
      const stillExists = users.find(u => u.email === currentUser.email);
      if (stillExists) {
        // Automatically restore session and launch app
        launchApp();
        
        // Restore section from URL if available
        const params = new URLSearchParams(window.location.search);
        const module = params.get('module');
        if (module) {
          setTimeout(() => {
            const navItem = findNavItemBySection(module);
            if (navItem) showSection(module, navItem);
          }, 100);
        }
        return;
      } else {
        // Session user was deleted, clear session
        localStorage.removeItem('currentUser');
      }
    } catch (e) {
      console.error('Error restoring session:', e);
      localStorage.removeItem('currentUser');
    }
  }

  // Show login page if no active session
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