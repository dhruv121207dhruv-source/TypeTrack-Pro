/* ========================================
   TypeTrack Pro — Games Engine
   ======================================== */

// ─── Game Hub ──────────────────────────────────────────────
function initGameHub() {
  const hub = $('#game-hub');
  if (hub) hub.style.display = '';
  $$('.game-arena').forEach(a => a.style.display = 'none');
  $('#game-over-modal').classList.remove('active');
}

// Game level selector
$$('#game-level-options .pill').forEach(btn => btn.addEventListener('click', () => {
  $$('#game-level-options .pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.gameLevel = btn.dataset.level;
}));

// Game card click handlers
$$('.game-select-card').forEach(card => {
  card.addEventListener('click', () => {
    const game = card.dataset.game;
    $('#game-hub').style.display = 'none';
    if (game === 'leaderboard') { 
      switchView('leaderboard'); 
      // Switch categories if needed
      $('#lb-cat-games').click();
      return; 
    }
    $(`#game-${game}`).style.display = '';
    sound.init();
    if (game === 'balloon') startBalloonGame();
    else if (game === 'stack') startStackGame();
    else if (game === 'shooter') startShooterGame();
    else if (game === 'timeattack') startTimeAttack();
    else if (game === 'survival') startSurvivalGame();
  });
});

// Back buttons
['balloon','stack','shooter','timeattack','survival'].forEach(id => {
  const btn = $(`#${id}-back`);
  if (btn) btn.addEventListener('click', () => {
    stopAllGames();
    initGameHub();
  });
});

let activeGameLoop = null;
function stopAllGames() {
  if (activeGameLoop) { cancelAnimationFrame(activeGameLoop); activeGameLoop = null; }
  if (window._gameTimer) { clearInterval(window._gameTimer); window._gameTimer = null; }
  if (window._gameSpawn) { clearInterval(window._gameSpawn); window._gameSpawn = null; }
}

function showGameOver(game, emoji, stats) {
  stopAllGames();
  $('#go-title').textContent = 'Game Over!';
  $('#go-emoji').textContent = emoji;
  const statsHtml = Object.entries(stats).map(([k, v]) =>
    `<div class="result-item"><div class="result-value">${v}</div><div class="result-label">${k}</div></div>`
  ).join('');
  $('#go-stats').innerHTML = statsHtml;
  $('#game-over-modal').classList.add('active');

  const score = stats.Score || stats.Words || stats.Height || 0;
  saveGameScore(game, parseInt(score), state.gameLevel);

  $('#go-retry').onclick = () => {
    $('#game-over-modal').classList.remove('active');
    if (game === 'balloon') startBalloonGame();
    else if (game === 'stack') startStackGame();
    else if (game === 'shooter') startShooterGame();
    else if (game === 'timeattack') startTimeAttack();
    else if (game === 'survival') startSurvivalGame();
  };
  $('#go-hub').onclick = () => {
    $('#game-over-modal').classList.remove('active');
    initGameHub();
  };
  $('#go-leaderboard').onclick = () => {
    $('#game-over-modal').classList.remove('active');
    switchView('leaderboard');
    $(`#lb-cat-games`).click();
    $(`[data-lbgame="${game}"]`).click();
  };
}

// ─── BALLOON POP GAME ──────────────────────────────────────
function startBalloonGame() {
  stopAllGames();
  const canvas = $('#balloon-canvas');
  const ctx = canvas.getContext('2d');
  const input = $('#balloon-input');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight || 450;
  input.value = '';
  input.focus();

  let score = 0, lives = 5, level = 1, balloons = [], spawnRate = 2000;
  const colors = ['#f43f5e','#6366f1','#06b6d4','#10b981','#f59e0b','#ec4899','#8b5cf6'];
  const update = () => { $('#balloon-score').textContent = score; $('#balloon-lives').textContent = lives; $('#balloon-level').textContent = level; };
  update();

  function spawnBalloon() {
    const word = getRandomWord();
    balloons.push({
      word, x: 40 + Math.random() * (canvas.width - 80), y: canvas.height + 30,
      speed: 0.4 + level * 0.15 + Math.random() * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 30 + word.length * 4, popped: false, popFrame: 0
    });
  }

  window._gameSpawn = setInterval(spawnBalloon, spawnRate);
  spawnBalloon();

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    for (let i = 0; i < balloons.length; i++) {
      if (!balloons[i].popped && balloons[i].word.toLowerCase() === val) {
        balloons[i].popped = true; balloons[i].popFrame = 1;
        score += 10 * level; input.value = '';
        sound.play('pop');
        if (score > 0 && score % 50 === 0) {
          level++; clearInterval(window._gameSpawn);
          spawnRate = Math.max(600, spawnRate - 200);
          window._gameSpawn = setInterval(spawnBalloon, spawnRate);
        }
        update(); break;
      }
    }
  };

  function draw() {
    const isDark = state.theme === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      if (b.popped) {
        b.popFrame++;
        ctx.globalAlpha = Math.max(0, 1 - b.popFrame / 10);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + b.popFrame * 3, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (b.popFrame > 10) balloons.splice(i, 1);
        continue;
      }
      b.y -= b.speed;
      if (b.y < -b.radius) {
        lives--; balloons.splice(i, 1); update();
        if (lives <= 0) { showGameOver('balloon', '🎈', { Score: score, Level: level, Popped: Math.floor(score / 10) }); return; }
        continue;
      }
      // Draw balloon
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color + 'cc';
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // String
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.radius);
      ctx.lineTo(b.x, b.y + b.radius + 20);
      ctx.strokeStyle = isDark ? '#555' : '#999';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Word
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, 16 - b.word.length * 0.5)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.word, b.x, b.y);
    }
    activeGameLoop = requestAnimationFrame(draw);
  }
  activeGameLoop = requestAnimationFrame(draw);
}

// ─── STACK TYPING GAME ─────────────────────────────────────
function startStackGame() {
  stopAllGames();
  const canvas = $('#stack-canvas');
  const ctx = canvas.getContext('2d');
  const input = $('#stack-input');
  const wordDisplay = $('#stack-word-display');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight || 450;
  input.value = '';
  input.focus();

  let score = 0, height = 0, combo = 0, blocks = [], currentWord = '';
  const blockH = 35, maxBlocks = Math.floor(canvas.height / blockH) - 1;
  const blockColors = ['#6366f1','#8b5cf6','#06b6d4','#3b82f6','#10b981','#f59e0b','#ec4899'];
  const update = () => { $('#stack-score').textContent = score; $('#stack-height').textContent = height; $('#stack-combo').textContent = combo; };

  function nextWord() {
    currentWord = getRandomWord();
    wordDisplay.textContent = currentWord;
    wordDisplay.style.color = 'var(--accent)';
    input.value = '';
  }
  nextWord(); update();

  input.oninput = () => {
    const val = input.value.trim();
    if (val.toLowerCase() === currentWord.toLowerCase()) {
      // Correct - stack block
      combo++; score += 10 + combo * 2; height++;
      const color = blockColors[height % blockColors.length];
      const w = 60 + Math.random() * (canvas.width - 120);
      blocks.push({ x: canvas.width / 2 - w / 2, width: w, color, word: currentWord, y: 0, targetY: canvas.height - height * blockH });
      sound.play('pop');
      update();
      if (height >= maxBlocks) {
        showGameOver('stack', '🧱', { Score: score, Height: height, 'Best Combo': combo });
        return;
      }
      nextWord();
    } else if (val.length >= currentWord.length) {
      // Wrong - penalize
      combo = 0;
      wordDisplay.style.color = 'var(--incorrect)';
      input.value = '';
      sound.play('error');
      if (blocks.length > 0) {
        blocks.pop(); height = Math.max(0, height - 1);
      }
      update();
      setTimeout(() => { wordDisplay.style.color = 'var(--accent)'; }, 300);
    }
  };

  function draw() {
    const isDark = state.theme === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ground line
    ctx.strokeStyle = isDark ? '#333' : '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 2);
    ctx.lineTo(canvas.width, canvas.height - 2);
    ctx.stroke();

    blocks.forEach((b, i) => {
      // Animate falling
      if (b.y < b.targetY) b.y = Math.min(b.targetY, b.y + 8);
      const bx = b.x, by = b.y, bw = b.width, bh = blockH - 2;
      // Block
      ctx.fillStyle = b.color + 'dd';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Word on block
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.word, bx + bw / 2, by + bh / 2);
    });
    activeGameLoop = requestAnimationFrame(draw);
  }
  activeGameLoop = requestAnimationFrame(draw);
}

// ─── WORD SHOOTER GAME ─────────────────────────────────────
function startShooterGame() {
  stopAllGames();
  const canvas = $('#shooter-canvas');
  const ctx = canvas.getContext('2d');
  const input = $('#shooter-input');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight || 450;
  input.value = '';
  input.focus();

  let score = 0, lives = 5, streak = 0, words = [], spawnRate = 2200, particles = [];
  const update = () => { $('#shooter-score').textContent = score; $('#shooter-lives').textContent = lives; $('#shooter-streak').textContent = streak; };
  update();

  function spawnWord() {
    const word = getRandomWord();
    const fromLeft = Math.random() > 0.5;
    words.push({
      word, x: fromLeft ? -10 : canvas.width + 10,
      y: 30 + Math.random() * (canvas.height - 80),
      speed: (0.5 + score * 0.02 + Math.random() * 0.5) * (fromLeft ? 1 : -1),
      hit: false, hitFrame: 0
    });
  }

  window._gameSpawn = setInterval(spawnWord, spawnRate);
  spawnWord();

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    for (let i = 0; i < words.length; i++) {
      if (!words[i].hit && words[i].word.toLowerCase() === val) {
        words[i].hit = true; words[i].hitFrame = 1;
        score += 10; streak++;
        input.value = '';
        sound.play('pop');
        // spawn particles
        for (let p = 0; p < 6; p++) {
          particles.push({
            x: words[i].x, y: words[i].y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            life: 20, color: ['#f43f5e','#6366f1','#fbbf24','#10b981'][Math.floor(Math.random() * 4)]
          });
        }
        if (score % 50 === 0) {
          clearInterval(window._gameSpawn);
          spawnRate = Math.max(500, spawnRate - 200);
          window._gameSpawn = setInterval(spawnWord, spawnRate);
        }
        update(); break;
      }
    }
  };

  function draw() {
    const isDark = state.theme === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw crosshair at center
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (w.hit) {
        w.hitFrame++;
        if (w.hitFrame > 8) { words.splice(i, 1); }
        continue;
      }
      w.x += w.speed;
      if ((w.speed > 0 && w.x > canvas.width + 50) || (w.speed < 0 && w.x < -50)) {
        lives--; streak = 0; words.splice(i, 1); update();
        if (lives <= 0) { showGameOver('shooter', '🔫', { Score: score, Streak: streak, Destroyed: Math.floor(score / 10) }); return; }
        continue;
      }
      // Draw word with bg
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      const tm = ctx.measureText(w.word);
      const pw = tm.width + 24, ph = 32;
      ctx.fillStyle = isDark ? 'rgba(30,30,42,0.9)' : 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.roundRect(w.x - pw / 2, w.y - ph / 2, pw, ph, 8); ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = isDark ? '#e0e0f0' : '#1a1a2e';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(w.word, w.x, w.y);
    }
    activeGameLoop = requestAnimationFrame(draw);
  }
  activeGameLoop = requestAnimationFrame(draw);
}

// ─── TIME ATTACK ───────────────────────────────────────────
function startTimeAttack() {
  stopAllGames();
  const input = $('#ta-input');
  const wordEl = $('#ta-current-word');
  const queueEl = $('#ta-queue');

  let score = 0, timeLeft = 60, started = false, words = [];
  const update = () => { $('#ta-score').textContent = score; $('#ta-timer').textContent = timeLeft; };

  function genQueue() {
    words = [];
    for (let i = 0; i < 5; i++) words.push(getRandomWord());
    wordEl.textContent = words[0];
    queueEl.innerHTML = words.slice(1).map(w => `<span>${w}</span>`).join('');
  }
  genQueue(); update();
  input.value = ''; input.focus();
  wordEl.textContent = words[0];

  input.oninput = () => {
    if (!started) {
      started = true;
      window._gameTimer = setInterval(() => {
        timeLeft--;
        const elapsed = 60 - timeLeft;
        const wpm = elapsed > 0 ? Math.round((score / (elapsed / 60)) * (60 / 60)) : 0;
        // Simple WPM: words typed / minutes elapsed
        $('#ta-wpm').textContent = elapsed > 0 ? Math.round(score / (elapsed / 60)) : 0;
        update();
        if (timeLeft <= 0) {
          clearInterval(window._gameTimer);
          const finalWpm = Math.round(score / 1); // 1 minute
          showGameOver('timeattack', '⏱️', { Words: score, WPM: finalWpm, Level: state.gameLevel });
        }
      }, 1000);
    }

    const val = input.value.trim();
    if (val.toLowerCase() === words[0].toLowerCase()) {
      score++;
      sound.play('pop');
      wordEl.classList.add('correct-flash');
      setTimeout(() => wordEl.classList.remove('correct-flash'), 200);
      words.shift();
      words.push(getRandomWord());
      wordEl.textContent = words[0];
      queueEl.innerHTML = words.slice(1).map(w => `<span>${w}</span>`).join('');
      input.value = '';
      update();
    }
  };

  input.addEventListener('keydown', function onTaKey(e) {
    if (e.key === 'Escape') {
      input.removeEventListener('keydown', onTaKey);
      stopAllGames(); initGameHub();
    }
  });
}

// ─── SURVIVAL MODE ─────────────────────────────────────────
function startSurvivalGame() {
  stopAllGames();
  const canvas = $('#survival-canvas');
  const ctx = canvas.getContext('2d');
  const input = $('#survival-input');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight || 450;
  input.value = '';
  input.focus();

  let score = 0, lives = 3, speed = 1.0, startTime = Date.now();
  let words = [], spawnRate = 2500, particles = [];
  const update = () => {
    $('#sv-score').textContent = score;
    $('#sv-lives').textContent = lives;
    $('#sv-speed').textContent = speed.toFixed(1) + 'x';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    $('#sv-time').textContent = Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
  };
  update();

  function spawnWord() {
    const word = getRandomWord();
    words.push({
      word, x: canvas.width + 10,
      y: 30 + Math.random() * (canvas.height - 60),
      speed: (0.5 + speed * 0.4) * (0.8 + Math.random() * 0.4),
      hit: false
    });
  }

  window._gameSpawn = setInterval(spawnWord, spawnRate);
  window._gameTimer = setInterval(() => {
    update();
    // Increase difficulty every 15 seconds
    const elapsed = (Date.now() - startTime) / 1000;
    const newSpeed = 1 + Math.floor(elapsed / 15) * 0.2;
    if (newSpeed !== speed) {
      speed = newSpeed;
      clearInterval(window._gameSpawn);
      spawnRate = Math.max(400, 2500 - Math.floor(elapsed / 15) * 300);
      window._gameSpawn = setInterval(spawnWord, spawnRate);
    }
  }, 500);
  spawnWord();

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    for (let i = 0; i < words.length; i++) {
      if (!words[i].hit && words[i].word.toLowerCase() === val) {
        words[i].hit = true;
        score += Math.round(10 * speed);
        input.value = '';
        sound.play('pop');
        for (let p = 0; p < 5; p++) {
          particles.push({
            x: words[i].x, y: words[i].y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            life: 15, color: '#34d399'
          });
        }
        update(); break;
      }
    }
  };

  function draw() {
    const isDark = state.theme === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Danger zone
    ctx.fillStyle = 'rgba(248,113,113,0.05)';
    ctx.fillRect(0, 0, 40, canvas.height);
    ctx.strokeStyle = 'rgba(248,113,113,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(40, canvas.height); ctx.stroke();

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life--;
      ctx.globalAlpha = p.life / 15;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (w.hit) { words.splice(i, 1); continue; }
      w.x -= w.speed;
      if (w.x < -30) {
        lives--; words.splice(i, 1); update();
        sound.play('error');
        if (lives <= 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const timeStr = Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
          showGameOver('survival', '💀', { Score: score, Survived: timeStr, 'Top Speed': speed.toFixed(1) + 'x' });
          return;
        }
        continue;
      }
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      const tm = ctx.measureText(w.word);
      const pw = tm.width + 20, ph = 30;
      // Color based on proximity
      const danger = Math.max(0, 1 - w.x / canvas.width);
      const r = Math.round(30 + danger * 200);
      ctx.fillStyle = isDark ? `rgba(${r},30,42,0.9)` : `rgba(255,${255 - r},${255 - r},0.9)`;
      ctx.beginPath(); ctx.roundRect(w.x - pw / 2, w.y - ph / 2, pw, ph, 6); ctx.fill();
      ctx.strokeStyle = danger > 0.7 ? 'rgba(248,113,113,0.6)' : isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)';
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = isDark ? '#e0e0f0' : '#1a1a2e';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(w.word, w.x, w.y);
    }
    activeGameLoop = requestAnimationFrame(draw);
  }
  activeGameLoop = requestAnimationFrame(draw);
}

function saveGameScore(game, score, level) {
  const entry = { game, score, level, date: new Date().toISOString(), id: Date.now() };
  state.gameScores.unshift(entry);
  localStorage.setItem('typetrack_game_scores', JSON.stringify(state.gameScores));
  if (state.isLoggedIn) {
    syncScoreWithBackend(entry);
  }
}

async function syncScoreWithBackend(scoreData) {
  if (!state.isLoggedIn || !window.fb || !state.user) return;
  try {
    await window.fb.addDoc(window.fb.collection(window.fb.db, 'scores'), {
      ...scoreData,
      uid: state.user.uid,
      username: state.user.username
    });
  } catch (err) {
    console.error('Error syncing score:', err);
  }
}

function getRandomWord(level) { const bank = GAME_WORDS[level || state.gameLevel]; return bank[Math.floor(Math.random() * bank.length)]; }

// ─── LEADERBOARD REFACTOR ──────────────────────────────────
async function buildGameLeaderboard(scope, filter) {
  let data = [];
  const gameNames = { balloon: 'Balloon Pop', stack: 'Stack Typing', shooter: 'Word Shooter', timeattack: 'Time Attack', survival: 'Survival Mode' };
  
  $('#lb-current-filter').textContent = filter === 'all' ? 'All Games' : gameNames[filter] || filter;

  // Header
  dom.lbThead.innerHTML = `<tr><th>Rank</th><th>User</th><th>Score</th><th>Mode</th><th>Date</th></tr>`;

  if (scope === 'global' && window.fb) {
    try {
      let q;
      const scoresRef = window.fb.collection(window.fb.db, 'scores');
      if (filter === 'all') {
        q = window.fb.query(scoresRef, window.fb.orderBy('score', 'desc'), window.fb.limit(50));
      } else {
        q = window.fb.query(scoresRef, window.fb.where('game', '==', filter), window.fb.orderBy('score', 'desc'), window.fb.limit(50));
      }
      
      const querySnapshot = await window.fb.getDocs(q);
      querySnapshot.forEach(doc => {
        const d = doc.data();
        data.push({
          username: d.username || 'Anon',
          score: d.score,
          level: d.level,
          date: d.date,
          game: d.game,
          uid: d.uid
        });
      });
    } catch (err) {
      console.error('Error fetching global game leaderboard:', err);
    }
  } else {
    // Local fallback
    data = [...state.gameScores];
    if (filter !== 'all') data = data.filter(s => s.game === filter);
    data.sort((a, b) => b.score - a.score);
    data = data.slice(0, 50).map(s => ({
      username: state.profile.name || 'You',
      score: s.score,
      level: s.level,
      date: s.date,
      isLocal: true
    }));
  }

  if (typeof renderToMainLB === 'function') {
    renderToMainLB(data);
  }
}
