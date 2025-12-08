import { updatePhysics } from './physics.js';
import { TIME_STEP } from './constants.js';
import { drawGacha, cancelGachaItem } from './gacha.js';

// --- State ---
const state = {
  status: 'IDLE', // IDLE, FLYING, FINISHED
  params: {
    power: 15,
    loft: 30, // Launch Angle in degrees
    wind: 5,
  },
  genreId: null, 
  quizScore: 0, 
  isSpam: false, // NEW: Flag for spam detection
  physics: {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    bounces: 0,
    isStopped: true,
    history: [],
  },
  particles: [],
  score: 0,
  highScore: 0, 
  lastGachaItem: null 
};

let requestID = null;
let skipTimeoutID = null;
let els = {}; 
let onRestartCallback = null; 

// Speed multiplier
const STEPS_PER_FRAME = 3;

// --- Logic ---

function setStatus(newStatus) {
  state.status = newStatus;
  
  const isFlying = newStatus === 'FLYING';
  const isFinished = newStatus === 'FINISHED';

  if (!els.btnLaunch) return; 

  if (isFlying || isFinished) {
    els.btnLaunch.disabled = true;
    els.btnLaunch.classList.add('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.innerHTML = isFlying ? 'Launching... 🚀' : 'Finish';
  } else {
    els.btnLaunch.disabled = false;
    els.btnLaunch.classList.remove('scale-90', 'opacity-50', 'grayscale', 'cursor-not-allowed');
    els.btnLaunch.innerHTML = 'THROW! 🚀';
  }

  if (isFlying) {
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden'); 
  } else if (isFinished) {
    els.msgFinished.classList.remove('hidden'); 
    els.btnSkip.classList.add('hidden');
  } else {
    els.msgFinished.classList.add('hidden');
    els.btnSkip.classList.add('hidden');
  }
}

function handleLaunch() {
  const vTotal = state.params.power * 1.5;
  const deg = 15 + (state.params.loft * 0.6); 
  const rad = deg * (Math.PI / 180);

  const vx = vTotal * Math.cos(rad);
  const vy = vTotal * Math.sin(rad);

  const startX = 0.5;
  const startY = 0.15;

  state.physics = {
    position: { x: startX, y: startY },
    velocity: { x: vx, y: vy },
    bounces: 0,
    isStopped: false,
    history: [{ x: startX, y: startY }],
  };
  state.particles = [];
  
  setStatus('FLYING');
  state.score = 0;
  
  if (skipTimeoutID) clearTimeout(skipTimeoutID);
  skipTimeoutID = setTimeout(() => {
    if (state.status === 'FLYING') {
      els.btnSkip.classList.remove('hidden');
    }
  }, 1000);

  loop();
}

function handleSkip() {
  if (state.status !== 'FLYING') return;
  cancelAnimationFrame(requestID);
  let safetyCounter = 0;
  while (!state.physics.isStopped && safetyCounter < 5000) {
    state.physics = updatePhysics(state.physics, state.params);
    safetyCounter++;
  }
  renderGame();
  handleFinish(state.physics.position.x);
}

function handleRestart() {
  if (onRestartCallback) {
    resetGame();
    onRestartCallback();
  } else {
    window.location.reload();
  }
}

function handleGacha() {
  const result = drawGacha(state.score, state.quizScore, state.genreId, false, state.isSpam);
  updateGachaUI(result, false);
}

function handleReroll() {
    if (state.lastGachaItem) {
        cancelGachaItem(state.lastGachaItem.id);
    }
    
    // Draw gacha again with isReroll=true. Keep isSpam (if spamming, you just get duplicates anyway)
    const result = drawGacha(state.score, state.quizScore, state.genreId, true, state.isSpam);
    
    // Reset Card Animation for re-reveal
    const card = document.getElementById('gacha-card');
    card.classList.remove('card-flip');
    
    setTimeout(() => {
       updateGachaUI(result, true);
    }, 200);
}

function updateGachaUI(result, isReroll) {
  state.lastGachaItem = result.item;
  
  document.getElementById('view-result-score').classList.add('hidden');
  const viewGacha = document.getElementById('view-gacha-result');
  viewGacha.classList.remove('hidden');
  viewGacha.classList.add('flex'); 
  
  const card = document.getElementById('gacha-card');
  const cardBack = document.getElementById('gacha-card-back');
  const msgNew = document.getElementById('gacha-msg-new');
  const effectContainer = document.getElementById('gacha-effect');
  const btnReroll = document.getElementById('btn-reroll');
  
  cardBack.className = `card-back rounded-xl border-4 flex flex-col items-center justify-center p-2 text-slate-800 rarity-${result.item.rarity}`;
  cardBack.innerHTML = `
    <div class="text-4xl mb-2">${result.item.icon}</div>
    <div class="font-bold text-sm leading-tight mb-1">${result.item.name}</div>
    <div class="text-[10px] opacity-80 leading-snug px-2">${result.item.desc}</div>
    <div class="mt-2 text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 rounded-full">
      ${result.item.rarity === 3 ? 'ULTRA RARE' : result.item.rarity === 2 ? 'RARE' : 'COMMON'}
    </div>
  `;
  
  if (result.isNew) {
    msgNew.classList.remove('hidden');
  } else {
    msgNew.classList.add('hidden');
  }

  // Visual Effects
  effectContainer.className = 'absolute inset-0 pointer-events-none z-0'; 
  if (result.item.rarity >= 2) {
      effectContainer.classList.add('gacha-rays');
      if (result.item.rarity === 3) {
          effectContainer.classList.add('gacha-rainbow');
      }
  }

  // Show Reroll Button if: Rare+ AND Duplicate AND Not a Reroll attempt already
  if (result.item.rarity >= 2 && !result.isNew && !isReroll) {
      btnReroll.classList.remove('hidden');
  } else {
      btnReroll.classList.add('hidden');
  }

  // Animate Flip
  setTimeout(() => {
     card.classList.add('card-flip');
  }, 100);
}

export function resetGame() {
  setStatus('IDLE'); 
  
  document.getElementById('view-result-score').classList.remove('hidden');
  const viewGacha = document.getElementById('view-gacha-result');
  viewGacha.classList.add('hidden');
  viewGacha.classList.remove('flex');
  document.getElementById('gacha-card').classList.remove('card-flip');
  document.getElementById('gacha-effect').className = 'absolute inset-0 pointer-events-none z-0'; 
  document.getElementById('btn-reroll').classList.add('hidden'); 

  state.physics.isStopped = true;
  state.physics.position = {x: 0.5, y: 0.15};
  state.physics.history = [];
  state.particles = [];
  
  renderGame();
}

export function resetSessionBest() {
  state.highScore = 0;
  updateUI();
}

export function launchBall() {
  handleLaunch();
}

export function getLastGachaItem() {
    return state.lastGachaItem;
}

function loop() {
  if (state.status !== 'FLYING') return;
  
  const oldBounces = state.physics.bounces;

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    state.physics = updatePhysics(state.physics, state.params);
    if (state.physics.isStopped) break;
  }
  
  if (state.physics.bounces > oldBounces) {
     spawnParticles(state.physics.position.x, 0, 8); 
  }
  
  updateParticles();

  renderGame();
  if (state.physics.isStopped) {
    handleFinish(state.physics.position.x);
  } else {
    requestID = requestAnimationFrame(loop);
  }
}

function spawnParticles(x, y, count) {
  for(let i=0; i<count; i++) {
    state.particles.push({
      x: x,
      y: y + 0.1, // Lift slightly above ground
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * 8 + 3,
      life: 1.0,
      color: Math.random() > 0.5 ? '#fbbf24' : '#fcd34d' // Amber dust
    });
  }
}

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * TIME_STEP;
    p.y += p.vy * TIME_STEP;
    p.vy -= 9.8 * TIME_STEP; // Gravity
    p.life -= 0.03;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function handleFinish(distance) {
  state.score = distance;
  
  if (distance > state.highScore) {
    state.highScore = distance;
  }

  if (state.genreId) {
    const key = `golf_stats_${state.genreId}`;
    const stored = localStorage.getItem(key);
    let stats = stored ? JSON.parse(stored) : { maxCorrect: 0, maxDistance: 0 };
    
    if (distance > stats.maxDistance) {
      stats.maxDistance = distance;
      localStorage.setItem(key, JSON.stringify(stats));
    }
  }

  updateUI();
  
  els.valFinalScore.textContent = state.score.toFixed(2);
  
  setStatus('FINISHED');
  cancelAnimationFrame(requestID);
}

// --- Rendering ---

function updateUI() {
  if (!els.lblPower) return;
  
  els.lblPower.textContent = state.params.power;
  const displayDeg = Math.round(15 + (state.params.loft * 0.6));
  els.lblLoft.textContent = `${displayDeg}°`;
  els.lblWind.textContent = state.params.wind;
  
  const maxPower = 40; 
  const maxLoft = 100;
  const maxWind = 20;

  if (els.barPower) els.barPower.style.width = `${Math.min(100, (state.params.power / maxPower) * 100)}%`;
  if (els.barLoft) els.barLoft.style.width = `${Math.min(100, (state.params.loft / maxLoft) * 100)}%`;
  if (els.barWind) els.barWind.style.width = `${Math.min(100, (state.params.wind / maxWind) * 100)}%`;

  els.valHighScore.textContent = state.highScore.toFixed(1);
}

function renderGame() {
  const { position, history } = state.physics;
  if (els.valDistance) els.valDistance.textContent = position.x.toFixed(1);
  if (els.valHeight) els.valHeight.textContent = position.y.toFixed(1);

  const viewWidth = 80;
  const viewHeight = 40;
  const cameraX = Math.max(0, position.x - viewWidth * 0.3);
  
  if (els.svg) {
    els.svg.setAttribute('viewBox', `${cameraX} -35 ${viewWidth} ${viewHeight}`);
  }

  if (els.ball) {
    els.ball.setAttribute('cx', position.x);
    els.ball.setAttribute('cy', -position.y);
  }

  if (els.trail) {
    const points = history.map(p => `${p.x},${-p.y}`).join(' ');
    els.trail.setAttribute('points', points);
  }
  
  renderParticles(cameraX, viewWidth);
  renderMarkers(cameraX, viewWidth);
}

// --- Initialization ---

export function updateParams(newParams, genreId = null, quizScore = null, isSpam = false) {
  if (newParams) {
    state.params = { ...state.params, ...newParams };
  }
  if (genreId) {
    state.genreId = genreId;
  }
  if (quizScore !== null) {
    state.quizScore = quizScore;
  }
  state.isSpam = isSpam;
  
  updateUI();
}

export function setRestartCallback(callback) {
  onRestartCallback = callback;
}

export function initGame() {
  els = {
    svg: document.getElementById('game-svg'),
    ball: document.getElementById('elm-ball'),
    trail: document.getElementById('elm-trail'),
    groundMarkers: document.getElementById('grp-markers'),
    grpParticles: document.getElementById('grp-particles'),
    
    lblPower: document.getElementById('lbl-power'),
    barPower: document.getElementById('bar-power'),
    
    lblLoft: document.getElementById('lbl-loft'),
    barLoft: document.getElementById('bar-loft'),
    
    lblWind: document.getElementById('lbl-wind'),
    barWind: document.getElementById('bar-wind'),
    
    btnLaunch: document.getElementById('btn-launch'),
    btnSkip: document.getElementById('btn-skip'),
    btnRestart: document.getElementById('btn-restart'),
    btnGachaDraw: document.getElementById('btn-gacha-draw'),
    
    valDistance: document.getElementById('val-distance'),     
    valHeight: document.getElementById('val-height'),
    valHighScore: document.getElementById('val-highscore'),
    
    msgFinished: document.getElementById('msg-finished'),
    valFinalScore: document.getElementById('val-final-score'),
  };

  if (!els.btnLaunch || !els.svg) {
    console.log("Game elements not fully ready, but initGame called.");
  }

  els.btnLaunch?.addEventListener('click', handleLaunch);
  els.btnSkip?.addEventListener('click', handleSkip);
  els.btnRestart?.addEventListener('click', handleRestart);
  els.btnGachaDraw?.addEventListener('click', handleGacha);
  
  // Setup Reroll Button
  const btnReroll = document.getElementById('btn-reroll');
  if(btnReroll) btnReroll.addEventListener('click', handleReroll);

  state.highScore = 0;
  updateUI();
  if(els.svg) renderGame();
}