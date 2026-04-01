/* ========================================
   TypeTrack Pro — Core Application Engine
   ======================================== */

const WORD_BANKS = {
  easy: ["the","be","to","of","and","a","in","that","have","I","it","for","not","on","with",
    "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
    "she","or","an","will","my","one","all","would","there","their","what","so","up",
    "out","if","about","who","get","which","go","me","when","make","can","like","time",
    "no","just","him","know","take","people","into","year","your","good","some","could",
    "them","see","other","than","then","now","look","only","come","its","over","think",
    "also","back","after","use","two","how","our","work","first","well","way","even",
    "new","want","because","any","these","give","day","most","us","great","big","high",
    "small","large","next","early","long","run","game","set","put","end","play","home",
    "read","hand","part","show","kind","name","move","try","old","lot","ask","own",
    "turn","keep","help","start","line","city","live","story","few","left","last","too"],
  medium: [
    "The quick brown fox jumps over the lazy dog near the river bank",
    "She sells seashells by the seashore every morning in the summer",
    "A journey of a thousand miles begins with a single step forward",
    "To be or not to be that is the question we must all face someday",
    "All that glitters is not gold but it certainly catches the eye",
    "The early bird catches the worm but the second mouse gets cheese",
    "Practice makes perfect so keep typing and improving each session",
    "Technology is evolving at an incredible pace in this modern world",
    "Good communication skills are essential for success in any career",
    "The weather forecast predicts sunny skies for the entire weekend",
    "Reading books expands your vocabulary and improves your writing",
    "Music has the power to change your mood in just a few seconds",
    "Learning to type faster can significantly boost your productivity",
    "The internet has transformed how we communicate and share ideas",
    "Creative thinking leads to innovative solutions for complex tasks",
    "Regular exercise and healthy eating contribute to overall wellness",
    "Time management is a crucial skill for personal and professional life",
    "Digital literacy is becoming increasingly important in every field",
    "Consistency is more important than intensity when building new habits",
    "The best way to predict the future is to create it with your actions"
  ],
  hard: [
    "Quantum computing leverages the principles of superposition and entanglement to process information exponentially faster than classical computers, potentially revolutionizing cryptography, drug discovery, and artificial intelligence within the coming decades.",
    "The proliferation of machine learning algorithms across industries has necessitated a comprehensive re-evaluation of ethical frameworks, particularly concerning data privacy, algorithmic bias, and the socioeconomic implications of widespread automation.",
    "Photosynthesis is a complex biochemical process whereby chlorophyll-containing organisms convert electromagnetic radiation, carbon dioxide, and water into glucose and molecular oxygen through a series of light-dependent and light-independent reactions.",
    "The archaeological excavation unearthed a magnificent collection of Byzantine-era artifacts, including ornate mosaics, intricately carved ivory panels, and extraordinarily well-preserved manuscripts dating back to the seventh century.",
    "Contemporary neuroscience research demonstrates that neuroplasticity — the brain's remarkable ability to reorganize synaptic connections — persists throughout adulthood, challenging previously established paradigms about cognitive development.",
    "The implementation of microservices architecture requires sophisticated orchestration mechanisms, including containerization platforms, service mesh configurations, and distributed tracing systems for comprehensive observability.",
    "Sustainable urban development encompasses multifaceted considerations: renewable energy infrastructure, efficient public transportation networks, equitable housing policies, and resilient waste management systems.",
    "The philosopher's epistemological framework distinguished between a priori knowledge — understood through pure reasoning — and a posteriori knowledge, which necessitates empirical observation and experiential verification."
  ]
};

const GAME_WORDS = {
  easy: ["cat","dog","run","big","hot","sun","red","cup","top","map","hat","pen","box","fly","key",
    "ice","jam","log","net","owl","pig","rug","van","web","zip","arm","bed","car","day","egg"],
  medium: ["apple","brain","cloud","dance","eagle","flame","ghost","heart","ivory","jumbo",
    "karma","lemon","magic","night","ocean","piano","queen","river","storm","tiger",
    "ultra","vivid","whale","xenon","yield","zebra","alpha","brave","crown","dream"],
  hard: ["abstract","boundary","catalyst","dispatch","eloquent","fragment","gradient","harmonic",
    "implicit","junction","keyboard","luminous","magnetic","notation","opponent","paradigm",
    "quotient","resonant","spectrum","terminal","ultimate","velocity","workshop","xenolith"]
};

// ─── State ─────────────────────────────────────────────────
const state = {
  timeLimit: 60, difficulty: 'easy', soundEnabled: true, theme: 'dark',
  text: '', chars: [], currentIndex: 0, errors: 0, correctChars: 0,
  totalTyped: 0, isActive: false, isFinished: false, startTime: null,
  timerInterval: null, timeRemaining: 60, wpmSnapshots: [], snapshotInterval: null,
  sessions: JSON.parse(localStorage.getItem('typetrack_sessions') || '[]'),
  gameScores: JSON.parse(localStorage.getItem('typetrack_game_scores') || '[]'),
  gameLevel: 'easy',
  profile: JSON.parse(localStorage.getItem('typetrack_profile') || '{"name":"","joined":""}'),
  token: localStorage.getItem('typetrack_token'),
  user: JSON.parse(localStorage.getItem('typetrack_user') || 'null'),
  isLoggedIn: !!localStorage.getItem('typetrack_token'),
};

const API_URL = 'http://localhost:5000/api';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const dom = {
  splash: $('#splash-loader'),
  textDisplay: $('#text-display'),
  typingInput: $('#typing-input'),
  timerDisplay: $('#timer-display'),
  wpmDisplay: $('#wpm-display'),
  accuracyDisplay: $('#accuracy-display'),
  errorsDisplay: $('#errors-display'),
  restartBtn: $('#restart-btn'),
  themeToggle: $('#theme-toggle'),
  soundToggle: $('#sound-toggle'),
  resultsModal: $('#results-modal'),
  resultWpm: $('#result-wpm'),
  resultAccuracy: $('#result-accuracy'),
  resultChars: $('#result-chars'),
  resultErrors: $('#result-errors'),
  resultTime: $('#result-time'),
  resultRaw: $('#result-raw'),
  resultChart: $('#result-chart'),
  modalRestart: $('#modal-restart'),
  modalDashboard: $('#modal-dashboard'),
  dashBestWpm: $('#dash-best-wpm'),
  dashAvgWpm: $('#dash-avg-wpm'),
  dashAvgAcc: $('#dash-avg-acc'),
  dashTotalTime: $('#dash-total-time'),
  dashSessions: $('#dash-sessions'),
  chartWpm: $('#chart-wpm'),
  chartAccuracy: $('#chart-accuracy'),
  recentTbody: $('#recent-tbody'),
  dashEmpty: $('#dash-empty'),
  historyList: $('#history-list'),
  historyEmpty: $('#history-empty'),
  clearHistoryBtn: $('#clear-history-btn'),
  authNavBtn: $('#auth-nav-btn'),
  userDisplay: $('#user-display'),
  userNameLabel: $('#user-name-label'),
  logoutBtn: $('#logout-btn'),
  loginForm: $('#login-form'),
  registerForm: $('#register-form'),
  loginError: $('#login-error'),
  registerError: $('#reg-error'),
};

// ─── Sound Engine ──────────────────────────────────────────
class SoundEngine {
  constructor() { this.ctx = null; this.initialized = false; }
  init() {
    if (this.initialized) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.initialized = true; }
    catch(e) { console.warn('Web Audio API not available'); }
  }
  play(type) {
    if (!state.soundEnabled || !this.initialized || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    if (type === 'key') {
      osc.type='sine'; osc.frequency.setValueAtTime(600+Math.random()*200,now);
      gain.gain.setValueAtTime(0.03,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.08);
      osc.start(now); osc.stop(now+0.08);
    } else if (type === 'error') {
      osc.type='square'; osc.frequency.setValueAtTime(200,now);
      gain.gain.setValueAtTime(0.05,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.12);
      osc.start(now); osc.stop(now+0.12);
    } else if (type === 'complete') {
      osc.type='sine'; osc.frequency.setValueAtTime(523,now);
      gain.gain.setValueAtTime(0.08,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.4);
      osc.start(now); osc.stop(now+0.4);
      const o2=this.ctx.createOscillator(),g2=this.ctx.createGain();
      o2.connect(g2);g2.connect(this.ctx.destination);o2.type='sine';
      o2.frequency.setValueAtTime(659,now+0.15);g2.gain.setValueAtTime(0.08,now+0.15);
      g2.gain.exponentialRampToValueAtTime(0.001,now+0.55);o2.start(now+0.15);o2.stop(now+0.55);
    } else if (type === 'pop') {
      osc.type='sine'; osc.frequency.setValueAtTime(800+Math.random()*400,now);
      gain.gain.setValueAtTime(0.06,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.1);
      osc.start(now); osc.stop(now+0.1);
    } else if (type === 'space') {
      osc.type='sine'; osc.frequency.setValueAtTime(440,now);
      gain.gain.setValueAtTime(0.02,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.05);
      osc.start(now); osc.stop(now+0.05);
    }
  }
}
const sound = new SoundEngine();

// ─── Text Generation & Rendering ───────────────────────────
function generateText() {
  const d = state.difficulty;
  if (d === 'easy') {
    const words=[], bank=WORD_BANKS.easy, count=state.timeLimit<=30?60:state.timeLimit<=60?120:300;
    for(let i=0;i<count;i++) words.push(bank[Math.floor(Math.random()*bank.length)]);
    return words.join(' ');
  } else if (d === 'medium') {
    const bank=WORD_BANKS.medium, sentences=[], count=state.timeLimit<=30?3:state.timeLimit<=60?6:15;
    for(let i=0;i<count;i++) sentences.push(bank[Math.floor(Math.random()*bank.length)]);
    return sentences.join('. ')+'.';
  } else {
    const bank=WORD_BANKS.hard, paragraphs=[], count=state.timeLimit<=30?1:state.timeLimit<=60?2:5;
    for(let i=0;i<count;i++) paragraphs.push(bank[Math.floor(Math.random()*bank.length)]);
    return paragraphs.join(' ');
  }
}

function renderText() {
  const text=state.text; state.chars=text.split(''); let html='';
  const words=text.split(' '); let charIdx=0;
  words.forEach((word,wIdx)=>{
    const wordEnd=charIdx+word.length;
    html+=`<span class="word" data-word="${wIdx}">`;
    for(let i=charIdx;i<wordEnd;i++) html+=`<span class="char" data-index="${i}">${escapeHtml(text[i])}</span>`;
    html+='</span>';
    if(wIdx<words.length-1){html+=`<span class="char" data-index="${wordEnd}">&nbsp;</span>`;charIdx=wordEnd+1;}
    else charIdx=wordEnd;
  });
  dom.textDisplay.innerHTML=html; updateCursor();
}

function escapeHtml(c){if(c==='<')return'&lt;';if(c==='>')return'&gt;';if(c==='&')return'&amp;';if(c===' ')return'&nbsp;';return c;}

function updateCursor() {
  const old=dom.textDisplay.querySelector('.char.current');
  if(old) old.classList.remove('current');
  const next=dom.textDisplay.querySelector(`.char[data-index="${state.currentIndex}"]`);
  if(next){next.classList.add('current');next.scrollIntoView({block:'nearest',behavior:'smooth'});}
  $$('.word.current-word').forEach(w=>w.classList.remove('current-word'));
  if(next){const word=next.closest('.word');if(word)word.classList.add('current-word');}
}

// ─── Timer & Stats ─────────────────────────────────────────
function startTimer() {
  state.startTime=Date.now(); state.timeRemaining=state.timeLimit;
  dom.timerDisplay.textContent=state.timeRemaining;
  state.timerInterval=setInterval(()=>{
    const elapsed=Math.floor((Date.now()-state.startTime)/1000);
    state.timeRemaining=Math.max(0,state.timeLimit-elapsed);
    dom.timerDisplay.textContent=state.timeRemaining;
    const tc=$('#stat-timer');
    if(state.timeRemaining<=10)tc.classList.add('timer-urgent');else tc.classList.remove('timer-urgent');
    updateLiveStats();
    if(state.timeRemaining<=0)finishSession();
  },200);
  state.wpmSnapshots=[];
  state.snapshotInterval=setInterval(()=>{
    const e=(Date.now()-state.startTime)/1000/60;
    if(e>0)state.wpmSnapshots.push(Math.round((state.correctChars/5)/e));
  },2000);
}

function updateLiveStats() {
  if(!state.startTime)return;
  const e=(Date.now()-state.startTime)/1000/60;
  const wpm=e>0?Math.round((state.correctChars/5)/e):0;
  const acc=state.totalTyped>0?Math.round((state.correctChars/state.totalTyped)*100):100;
  dom.wpmDisplay.textContent=wpm;
  dom.accuracyDisplay.textContent=acc+'%';
  dom.errorsDisplay.textContent=state.errors;
}

// ─── Session Management ────────────────────────────────────
function resetSession() {
  clearInterval(state.timerInterval); clearInterval(state.snapshotInterval);
  Object.assign(state,{currentIndex:0,errors:0,correctChars:0,totalTyped:0,
    isActive:false,isFinished:false,startTime:null,timeRemaining:state.timeLimit,wpmSnapshots:[]});
  dom.typingInput.value=''; dom.typingInput.disabled=false;
  dom.timerDisplay.textContent=state.timeLimit;
  dom.wpmDisplay.textContent='0'; dom.accuracyDisplay.textContent='100%'; dom.errorsDisplay.textContent='0';
  dom.resultsModal.classList.remove('active'); $('#stat-timer').classList.remove('timer-urgent');
  state.text=generateText(); renderText(); dom.typingInput.focus();
}

function finishSession() {
  clearInterval(state.timerInterval); clearInterval(state.snapshotInterval);
  state.isFinished=true; state.isActive=false; dom.typingInput.disabled=true;
  sound.play('complete');
  const elapsed=(Date.now()-state.startTime)/1000, elapsedMin=elapsed/60;
  const wpm=elapsedMin>0?Math.round((state.correctChars/5)/elapsedMin):0;
  const rawWpm=elapsedMin>0?Math.round((state.totalTyped/5)/elapsedMin):0;
  const accuracy=state.totalTyped>0?Math.round((state.correctChars/state.totalTyped)*100):100;
  const session={id:Date.now(),date:new Date().toISOString(),duration:Math.round(elapsed),
    wpm,rawWpm,accuracy,errors:state.errors,characters:state.totalTyped,
    difficulty:state.difficulty,timeLimit:state.timeLimit};
  state.sessions.unshift(session);
  localStorage.setItem('typetrack_sessions',JSON.stringify(state.sessions));
  
  if (state.isLoggedIn) {
    syncSessionWithBackend(session);
  }
  
  showResults(session);
}

async function syncSessionWithBackend(session) {
  if (!state.isLoggedIn || !window.fb || !state.user) return;
  try {
    await window.fb.addDoc(window.fb.collection(window.fb.db, 'sessions'), {
      ...session,
      uid: state.user.uid
    });
  } catch (err) {
    console.error('Error syncing session:', err);
  }
}

function showResults(session) {
  dom.resultWpm.textContent=session.wpm;
  dom.resultAccuracy.textContent=session.accuracy+'%';
  dom.resultChars.textContent=session.characters;
  dom.resultErrors.textContent=session.errors;
  dom.resultTime.textContent=formatDuration(session.duration);
  dom.resultRaw.textContent=session.rawWpm;
  dom.resultsModal.classList.add('active');
  drawResultChart();
}

function drawResultChart() {
  const ctx=dom.resultChart.getContext('2d');
  if(window.resultChartInstance)window.resultChartInstance.destroy();
  const labels=state.wpmSnapshots.map((_,i)=>(i+1)*2+'s');
  const isDark=state.theme==='dark';
  window.resultChartInstance=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:'WPM',data:state.wpmSnapshots,
    borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',fill:true,tension:0.4,
    pointRadius:3,pointBackgroundColor:'#6366f1',borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
    scales:{x:{grid:{color:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)'},
    ticks:{color:isDark?'#606078':'#9595aa',font:{size:10}}},
    y:{grid:{color:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.04)'},
    ticks:{color:isDark?'#606078':'#9595aa',font:{size:10}},beginAtZero:true}}}});
}

// ─── Input Handling ────────────────────────────────────────
dom.typingInput.addEventListener('input',(e)=>{
  if(state.isFinished)return;
  sound.init();
  if(!state.isActive){state.isActive=true;startTimer();}
  const inputVal=dom.typingInput.value;
  if(inputVal.length>0&&state.currentIndex<state.chars.length){
    const typedChar=inputVal[inputVal.length-1];
    const expectedChar=state.chars[state.currentIndex];
    const charEl=dom.textDisplay.querySelector(`.char[data-index="${state.currentIndex}"]`);
    state.totalTyped++;
    if(typedChar===expectedChar){
      state.correctChars++;
      if(charEl){charEl.classList.add('correct');charEl.classList.remove('incorrect');}
      sound.play(typedChar===' '?'space':'key');
    }else{
      state.errors++;
      if(charEl){charEl.classList.add('incorrect');charEl.classList.remove('correct');}
      sound.play('error');
    }
    state.currentIndex++; dom.typingInput.value='';
    updateCursor(); updateLiveStats();
    if(state.currentIndex>=state.chars.length)finishSession();
  }
});

dom.typingInput.addEventListener('keydown',(e)=>{
  if(e.key==='Backspace'&&state.currentIndex>0&&!state.isFinished){
    e.preventDefault(); state.currentIndex--;
    const charEl=dom.textDisplay.querySelector(`.char[data-index="${state.currentIndex}"]`);
    if(charEl)charEl.classList.remove('correct','incorrect');
    dom.typingInput.value=''; updateCursor();
  }
  if(e.key==='Tab'){e.preventDefault();dom.restartBtn.focus();}
  if(e.key==='Enter'&&document.activeElement===dom.restartBtn){e.preventDefault();resetSession();}
});

$('.text-display-wrapper').addEventListener('click',()=>dom.typingInput.focus());

// ─── Settings ──────────────────────────────────────────────
$$('#time-options .pill').forEach(btn=>btn.addEventListener('click',()=>{
  $$('#time-options .pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); state.timeLimit=parseInt(btn.dataset.time); resetSession();
}));
$$('#difficulty-options .pill').forEach(btn=>btn.addEventListener('click',()=>{
  $$('#difficulty-options .pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); state.difficulty=btn.dataset.difficulty; resetSession();
}));
dom.restartBtn.addEventListener('click',()=>resetSession());
dom.modalRestart.addEventListener('click',()=>resetSession());
dom.modalDashboard.addEventListener('click',()=>{dom.resultsModal.classList.remove('active');switchView('dashboard');});

// ─── Theme & Sound ─────────────────────────────────────────
function setTheme(theme) {
  state.theme=theme; document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('typetrack_theme',theme);
  const dk=dom.themeToggle.querySelector('.theme-dark'), lt=dom.themeToggle.querySelector('.theme-light');
  if(theme==='dark'){dk.classList.remove('hidden');lt.classList.add('hidden');}
  else{dk.classList.add('hidden');lt.classList.remove('hidden');}
  if($('#view-dashboard').classList.contains('active'))buildDashboard();
}
dom.themeToggle.addEventListener('click',()=>setTheme(state.theme==='dark'?'light':'dark'));

dom.soundToggle.addEventListener('click',()=>{
  state.soundEnabled=!state.soundEnabled;
  localStorage.setItem('typetrack_sound',state.soundEnabled?'1':'0');
  const on=dom.soundToggle.querySelector('.sound-on'),off=dom.soundToggle.querySelector('.sound-off');
  if(state.soundEnabled){on.classList.remove('hidden');off.classList.add('hidden');}
  else{on.classList.add('hidden');off.classList.remove('hidden');}
});

// ─── View Switching ────────────────────────────────────────
function switchView(viewName) {
  $$('.view').forEach(v=>v.classList.remove('active'));
  $$('.nav-link').forEach(n=>n.classList.remove('active'));
  $(`#view-${viewName}`).classList.add('active');
  const navBtn=$(`[data-view="${viewName}"]`);
  if(navBtn)navBtn.classList.add('active');
  if(viewName==='dashboard')buildDashboard();
  if(viewName==='history')buildHistory();
  if(viewName==='practice')dom.typingInput.focus();
  if(viewName==='games'&&typeof initGameHub==='function')initGameHub();
  if(viewName==='auth') initAuthView();
}

function initAuthView() {
  dom.loginForm.classList.remove('hidden');
  dom.registerForm.classList.add('hidden');
  $$('.auth-tab').forEach(t => t.classList.remove('active'));
  $('[data-tab="login"]').classList.add('active');
}

// ─── Authentication Logic ──────────────────────────────────
async function handleGoogleLogin(e) {
  e.preventDefault();
  dom.loginError.classList.remove('active');
  try {
    await window.fb.signInWithPopup(window.fb.auth, window.fb.provider);
    // loginUser is handled by onAuthStateChanged
  } catch (err) {
    dom.loginError.textContent = err.message || 'Google Sign-In failed';
    dom.loginError.classList.add('active');
  }
}

async function handleGoogleRegister(e) {
  e.preventDefault();
  dom.registerError.classList.remove('active');
  try {
    await window.fb.signInWithPopup(window.fb.auth, window.fb.provider);
    // onAuthStateChanged will trigger
  } catch (err) {
    dom.registerError.textContent = err.message || 'Google Sign-Up failed';
    dom.registerError.classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#login-email').value;
  const password = $('#login-password').value;
  dom.loginError.classList.remove('active');

  try {
    await window.fb.signInWithEmailAndPassword(window.fb.auth, email, password);
  } catch (err) {
    dom.loginError.textContent = err.message || 'Login failed';
    dom.loginError.classList.add('active');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = $('#reg-email').value;
  const password = $('#reg-password').value;
  dom.registerError.classList.remove('active');

  try {
    const userCredential = await window.fb.createUserWithEmailAndPassword(window.fb.auth, email, password);
    const username = email.split('@')[0];
    await window.fb.updateProfile(userCredential.user, { displayName: username });
  } catch (err) {
    dom.registerError.textContent = err.message || 'Registration failed';
    dom.registerError.classList.add('active');
  }
}

function loginUser(firebaseUser) {
  state.user = { 
    uid: firebaseUser.uid, 
    username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
    email: firebaseUser.email
  };
  state.isLoggedIn = true;
  localStorage.setItem('typetrack_user', JSON.stringify(state.user));
  updateAuthUI();
  fetchUserData();
  if ($('#view-auth').classList.contains('active')) {
    switchView('practice');
  }
}

async function logoutUser() {
  if (!window.fb) return;
  await window.fb.signOut(window.fb.auth);
  state.user = null;
  state.isLoggedIn = false;
  localStorage.removeItem('typetrack_user');
  updateAuthUI();
  switchView('practice');
}

function updateAuthUI() {
  if (state.isLoggedIn && state.user) {
    dom.authNavBtn.classList.add('hidden');
    dom.userDisplay.classList.remove('hidden');
    dom.userNameLabel.textContent = state.user.username;
  } else {
    dom.authNavBtn.classList.remove('hidden');
    dom.userDisplay.classList.add('hidden');
  }
}

async function fetchUserData() {
  if (!state.isLoggedIn || !window.fb || !state.user) return;
  try {
    const q = window.fb.query(window.fb.collection(window.fb.db, 'sessions'), window.fb.where('uid', '==', state.user.uid));
    const querySnapshot = await window.fb.getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push(doc.data());
    });
    
    sessions.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if (sessions.length > 0) {
      state.sessions = sessions;
      localStorage.setItem('typetrack_sessions', JSON.stringify(state.sessions));
      if ($('#view-dashboard').classList.contains('active')) buildDashboard();
      if ($('#view-history').classList.contains('active')) buildHistory();
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
  }
}

dom.loginForm.addEventListener('submit', handleLogin);
dom.registerForm.addEventListener('submit', handleRegister);
dom.logoutBtn.addEventListener('click', logoutUser);
dom.authNavBtn.addEventListener('click', () => switchView('auth'));

const googleLoginBtn = $('#google-login-btn');
if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleLogin);
const googleRegisterBtn = $('#google-register-btn');
if (googleRegisterBtn) googleRegisterBtn.addEventListener('click', handleGoogleRegister);

// Setup Auth State Listener when window.fb is ready
const checkFb = setInterval(() => {
  if (window.fb && window.fb.auth) {
    clearInterval(checkFb);
    window.fb.onAuthStateChanged(window.fb.auth, (user) => {
      if (user) {
        loginUser(user);
      } else {
        state.user = null;
        state.isLoggedIn = false;
        localStorage.removeItem('typetrack_user');
        updateAuthUI();
      }
    });
  }
}, 100);

$$('.auth-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.auth-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  const type = tab.dataset.tab;
  if (type === 'login') {
    dom.loginForm.classList.remove('hidden');
    dom.registerForm.classList.add('hidden');
  } else {
    dom.loginForm.classList.add('hidden');
    dom.registerForm.classList.remove('hidden');
  }
}));
$$('.nav-link').forEach(link=>link.addEventListener('click',()=>switchView(link.dataset.view)));

// ─── Dashboard ─────────────────────────────────────────────
let wpmChartInstance=null, accChartInstance=null;

function buildDashboard() {
  const period=$('.period-selector .pill.active')?.dataset.period||'all';
  const filtered=filterByPeriod(state.sessions,period);
  if(filtered.length===0){
    dom.dashBestWpm.textContent='—';dom.dashAvgWpm.textContent='—';dom.dashAvgAcc.textContent='—';
    dom.dashTotalTime.textContent='0m';dom.dashSessions.textContent='0';dom.dashEmpty.style.display='';
    dom.recentTbody.innerHTML='';
    if(wpmChartInstance){wpmChartInstance.destroy();wpmChartInstance=null;}
    if(accChartInstance){accChartInstance.destroy();accChartInstance=null;}
    return;
  }
  dom.dashEmpty.style.display='none';
  const bestWpm=Math.max(...filtered.map(s=>s.wpm));
  const avgWpm=Math.round(filtered.reduce((a,s)=>a+s.wpm,0)/filtered.length);
  const avgAcc=Math.round(filtered.reduce((a,s)=>a+s.accuracy,0)/filtered.length);
  const totalTime=filtered.reduce((a,s)=>a+s.duration,0);
  dom.dashBestWpm.textContent=bestWpm; dom.dashAvgWpm.textContent=avgWpm;
  dom.dashAvgAcc.textContent=avgAcc+'%'; dom.dashTotalTime.textContent=formatTotalTime(totalTime);
  dom.dashSessions.textContent=filtered.length;
  drawDashCharts(filtered);
  const recent=filtered.slice(0,10);
  dom.recentTbody.innerHTML=recent.map(s=>{
    const date=new Date(s.date);
    const dateStr=date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const timeStr=date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const accClass=s.accuracy>=95?'acc-high':s.accuracy>=80?'acc-mid':'acc-low';
    return `<tr><td>${dateStr} <span style="color:var(--text-muted);font-size:0.75rem">${timeStr}</span></td>
      <td>${formatDuration(s.duration)}</td><td class="td-wpm">${s.wpm}</td>
      <td class="td-acc ${accClass}">${s.accuracy}%</td><td>${s.errors}</td>
      <td><span class="diff-badge diff-${s.difficulty}">${s.difficulty}</span></td></tr>`;
  }).join('');
}

function drawDashCharts(data) {
  const isDark=state.theme==='dark';
  const gridColor=isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.06)';
  const tickColor=isDark?'#606078':'#9595aa';
  const sorted=[...data].reverse();
  const labels=sorted.map(s=>{const d=new Date(s.date);return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});});
  const opts=(min,max)=>({responsive:true,maintainAspectRatio:true,interaction:{intersect:false,mode:'index'},
    plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(0,0,0,0.8)',padding:12,cornerRadius:8}},
    scales:{x:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:11},maxRotation:45}},
    y:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:11}},suggestedMin:min,suggestedMax:max}}});
  function grad(canvas,color){const ctx=canvas.getContext('2d'),g=ctx.createLinearGradient(0,0,0,canvas.height||300);
    g.addColorStop(0,color+'33');g.addColorStop(1,color+'05');return g;}
  if(wpmChartInstance)wpmChartInstance.destroy();
  wpmChartInstance=new Chart(dom.chartWpm.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'WPM',
    data:sorted.map(s=>s.wpm),borderColor:'#6366f1',backgroundColor:grad(dom.chartWpm,'#6366f1'),fill:true,
    tension:0.4,pointRadius:4,pointBackgroundColor:'#6366f1',borderWidth:2.5}]},options:opts()});
  if(accChartInstance)accChartInstance.destroy();
  accChartInstance=new Chart(dom.chartAccuracy.getContext('2d'),{type:'line',data:{labels,datasets:[{label:'Accuracy',
    data:sorted.map(s=>s.accuracy),borderColor:'#10b981',backgroundColor:grad(dom.chartAccuracy,'#10b981'),fill:true,
    tension:0.4,pointRadius:4,pointBackgroundColor:'#10b981',borderWidth:2.5}]},options:opts(0,100)});
}

$$('.period-selector .pill').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.period-selector .pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); buildDashboard();
}));

// ─── History ───────────────────────────────────────────────
function buildHistory() {
  let data=[...state.sessions];
  const dateFilter=$('#history-date-filter').value;
  data=filterByPeriod(data,dateFilter==='today'?'daily':dateFilter==='week'?'weekly':dateFilter==='month'?'monthly':'all');
  const diffFilter=$('#history-diff-filter').value;
  if(diffFilter!=='all')data=data.filter(s=>s.difficulty===diffFilter);
  const sort=$('#history-sort').value;
  switch(sort){
    case'date-desc':data.sort((a,b)=>new Date(b.date)-new Date(a.date));break;
    case'date-asc':data.sort((a,b)=>new Date(a.date)-new Date(b.date));break;
    case'wpm-desc':data.sort((a,b)=>b.wpm-a.wpm);break;
    case'wpm-asc':data.sort((a,b)=>a.wpm-b.wpm);break;
    case'acc-desc':data.sort((a,b)=>b.accuracy-a.accuracy);break;
  }
  if(data.length===0){dom.historyList.innerHTML='';dom.historyEmpty.style.display='';return;}
  dom.historyEmpty.style.display='none';
  dom.historyList.innerHTML=data.map((s,i)=>{
    const d=new Date(s.date);
    const dateStr=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
    const timeStr=d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const accClass=s.accuracy>=95?'acc-high':s.accuracy>=80?'acc-mid':'acc-low';
    return `<div class="history-card anim-in" style="animation-delay:${i*40}ms">
      <div class="history-card-left"><div class="history-date">${dateStr} at ${timeStr}</div>
      <div class="history-meta"><div class="history-meta-item"><span class="${accClass}"><strong>${s.accuracy}%</strong></span> accuracy</div>
      <div class="history-meta-item"><strong>${s.errors}</strong> errors</div>
      <div class="history-meta-item"><strong>${formatDuration(s.duration)}</strong></div>
      <span class="diff-badge diff-${s.difficulty}">${s.difficulty}</span></div></div>
      <div class="history-card-right"><div class="history-wpm">${s.wpm}</div>
      <div class="history-wpm-label">WPM</div></div></div>`;
  }).join('');
}

$('#history-date-filter').addEventListener('change',buildHistory);
$('#history-diff-filter').addEventListener('change',buildHistory);
$('#history-sort').addEventListener('change',buildHistory);

dom.clearHistoryBtn.addEventListener('click',()=>{
  if(confirm('Are you sure you want to delete all session history? This cannot be undone.')){
    state.sessions=[];localStorage.setItem('typetrack_sessions',JSON.stringify(state.sessions));
    buildHistory();buildDashboard();
  }
});

// ─── Profile ───────────────────────────────────────────────
$('#profile-btn').addEventListener('click',()=>{
  const m=$('#profile-modal');
  $('#profile-name-input').value=state.profile.name||'';
  const s=state.sessions;
  $('#p-total-sessions').textContent=s.length;
  $('#p-best-wpm').textContent=s.length?Math.max(...s.map(x=>x.wpm)):0;
  const avgAcc=s.length?Math.round(s.reduce((a,x)=>a+x.accuracy,0)/s.length)+'%':'—';
  $('#p-avg-acc').textContent=avgAcc;
  $('#p-total-time').textContent=formatTotalTime(s.reduce((a,x)=>a+x.duration,0));
  $('#p-joined').textContent=state.profile.joined||new Date().toLocaleDateString();
  m.classList.add('active');
});
$('#profile-close').addEventListener('click',()=>$('#profile-modal').classList.remove('active'));
$('#profile-save').addEventListener('click',()=>{
  state.profile.name=$('#profile-name-input').value;
  if(!state.profile.joined)state.profile.joined=new Date().toLocaleDateString();
  localStorage.setItem('typetrack_profile',JSON.stringify(state.profile));
  $('#profile-modal').classList.remove('active');
});

// ─── Utilities ─────────────────────────────────────────────
function filterByPeriod(sessions,period) {
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  switch(period){
    case'daily':return sessions.filter(s=>new Date(s.date)>=today);
    case'weekly':{const w=new Date(today);w.setDate(w.getDate()-7);return sessions.filter(s=>new Date(s.date)>=w);}
    case'monthly':{const m=new Date(today);m.setMonth(m.getMonth()-1);return sessions.filter(s=>new Date(s.date)>=m);}
    default:return sessions;
  }
}
function formatDuration(s){if(s<60)return s+'s';const m=Math.floor(s/60),r=s%60;return r>0?`${m}m ${r}s`:`${m}m`;}
function formatTotalTime(s){if(s<60)return s+'s';if(s<3600)return Math.round(s/60)+'m';
  return`${Math.floor(s/3600)}h ${Math.round((s%3600)/60)}m`;}
function saveGameScore(game,score,level){
  const entry={game,score,level,date:new Date().toISOString(),id:Date.now()};
  state.gameScores.unshift(entry);
  localStorage.setItem('typetrack_game_scores',JSON.stringify(state.gameScores));
}
function getRandomWord(level){const bank=GAME_WORDS[level||state.gameLevel];return bank[Math.floor(Math.random()*bank.length)];}

// ─── Init ──────────────────────────────────────────────────
function init() {
  const savedTheme=localStorage.getItem('typetrack_theme')||'dark'; setTheme(savedTheme);
  const savedSound=localStorage.getItem('typetrack_sound');
  if(savedSound==='0'){state.soundEnabled=false;
    dom.soundToggle.querySelector('.sound-on').classList.add('hidden');
    dom.soundToggle.querySelector('.sound-off').classList.remove('hidden');}
  if(!state.profile.joined){state.profile.joined=new Date().toLocaleDateString();
    localStorage.setItem('typetrack_profile',JSON.stringify(state.profile));}
  state.text=generateText(); renderText();
  setTimeout(()=>{dom.splash.classList.add('fade-out');
    setTimeout(()=>{dom.splash.style.display='none';dom.typingInput.focus();},500);},1400);
}
init();
