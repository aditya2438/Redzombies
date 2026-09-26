/**
 * RedZombies — 3x3 Grid Survival Game
 * Author: Final Year Project
 * 
 * Main Game Engine:
 * - Single-clock requestAnimationFrame loop (avoids setTimeout race conditions)
 * - Procedural Web Audio API sound synthesizer (no external audio files needed)
 * - 2D Canvas particle rendering for blocks and win confetti
 * - Deterministic collision detection with barrier shields
 * - LocalStorage persistence with multi-profile and local leaderboard
 * - Responsive screen previewer for testing mobile/tablet/TV layouts
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. PROCEDURAL SOUND SYNTHESIZER (Web Audio API)
     Generates all sound effects programmatically so no external MP3s are needed.
     ========================================================================== */
  class SoundManager {
    constructor() {
      this.audioCtx = null;
      this.muted = false;
    }

    // AudioContext must be initiated or resumed after user interaction (browser policy)
    ensureContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    // Helper to play a single synth tone with an exponential decay volume envelope
    playTone(frequency, waveType, durationSec, volume = 0.15, endFrequency = null) {
      if (this.muted) return;
      this.ensureContext();
      if (!this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(frequency, now);

        if (endFrequency !== null) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFrequency), now + durationSec);
        }

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + durationSec + 0.05);
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    }

    // Quick sine blip when player steps to an adjacent cell
    playMoveSound() {
      this.playTone(600, 'sine', 0.07, 0.12);
    }

    // Ticking audio cue while warning pulses accelerate
    playWarningTick() {
      this.playTone(420, 'triangle', 0.05, 0.08, 320);
    }

    // Rising sine sweep when barrier shields materialize
    playBarrierSpawn() {
      this.playTone(220, 'sine', 0.15, 0.15, 520);
    }

    // Low sub-bass thud when a strike beam passes safely
    playStrikeSafe() {
      this.playTone(110, 'sine', 0.18, 0.12, 50);
    }

    // Impact crunch when player takes damage (white noise + low bass thud)
    playHitSound() {
      if (this.muted) return;
      this.ensureContext();
      if (!this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;

        // Sub bass component
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.36);

        // White noise burst
        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(noiseGain);
        noiseGain.connect(this.audioCtx.destination);
        noise.start(now);
      } catch (err) {}
    }

    // High crystalline double-chime when shield absorbs a laser
    playBarrierBlock() {
      this.playTone(784, 'sine', 0.12, 0.2, 1046);
      setTimeout(() => this.playTone(1046, 'sine', 0.22, 0.22), 80);
    }

    // Descending minor interval when losing a lifeline
    playLifelineLost() {
      this.playTone(659.25, 'sine', 0.14, 0.2); // E5
      setTimeout(() => this.playTone(554.37, 'sine', 0.24, 0.2), 120); // C#5
    }

    // Ascending major arpeggio when successfully predicting in Oracle mode
    playLifelineGained() {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 'sine', 0.15, 0.2), i * 80);
      });
    }

    // 5-note sparkle celebration for surviving 5 consecutive waves
    playStreakBonus() {
      const notes = [587.33, 739.99, 880.00, 1174.66, 1479.98];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 'sine', 0.16, 0.18), i * 60);
      });
    }

    // Melancholy descending cadence on game over
    playGameOver() {
      const notes = [440, 392, 349.23, 293.66];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.2, freq * 0.9), i * 180);
      });
    }

    // Triumphant 4-note fanfare when beating personal best
    playHighScoreFanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.22), i * 100);
      });
    }
  }

  /* ==========================================================================
     2. 2D CANVAS PARTICLE SYSTEM (Sparks & Confetti)
     ========================================================================== */
  class ParticleManager {
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.particles = [];
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }

    // Spark burst when laser strikes a shield
    spawnShieldSparks(x, y, count = 14, color = '#22c55e') {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: Math.random() * 0.04 + 0.02,
          radius: Math.random() * 3 + 2,
          color: color
        });
      }
    }

    // Confetti shower on new high score
    spawnHighScoreConfetti() {
      const palette = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 4 + 3,
          life: 1.0,
          decay: Math.random() * 0.012 + 0.008,
          radius: Math.random() * 5 + 4,
          color: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    }

    // Update particle positions and draw to canvas each frame
    render() {
      if (this.particles.length === 0) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  /* ==========================================================================
     3. LOCAL STORAGE DATA PERSISTENCE
     Safely handles save games with an in-memory fallback for private mode.
     ========================================================================== */
  const SAVE_KEY = 'pulsegrid.save.v1';
  let gameSaveData = {
    schemaVersion: 1,
    lastActiveProfile: 'Survivor',
    muted: false,
    profiles: {
      'Survivor': {
        highScore: 0,
        gamesPlayed: 0,
        totalWavesSurvived: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString()
      }
    }
  };

  function loadSavedData() {
    try {
      const stored = localStorage.getItem(SAVE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.profiles) {
          gameSaveData = parsed;
        }
      }
    } catch (err) {
      console.warn('LocalStorage not accessible, running session storage only.');
    }
  }

  function commitSavedData() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameSaveData));
    } catch (err) {}
  }

  /* ==========================================================================
     4. GAME ENGINE STATE MACHINE & CONSTANTS
     ========================================================================== */
  const GamePhase = {
    PROFILE_SELECT: 'PROFILE_SELECT',
    SPAWN: 'SPAWN',
    WARNING: 'WARNING',
    STRIKE: 'STRIKE',
    COOLDOWN: 'COOLDOWN',
    FREEZE_GUESS: 'FREEZE_GUESS',
    GAME_OVER: 'GAME_OVER'
  };

  const sound = new SoundManager();
  let particles = null;

  // Primary reactive state object
  const gameState = {
    phase: GamePhase.PROFILE_SELECT,
    phaseElapsed: 0,
    paused: false,
    round: 1,
    score: 0,
    personalBest: 0,
    lifelines: 5,
    streak: 0,
    maxStreakThisRun: 0,
    guessEventUsed: false,
    justReachedTwoLives: false,
    wasHitThisWave: false,
    
    // Player coordinate: x is column (0=left, 1=center, 2=right), y is row (0=top, 1=center, 2=bottom)
    player: { x: 1, y: 1 },
    barriers: [], // Array of {x, y} coordinate objects
    currentPattern: null, // { axis: 'row'|'col', index: 0..2, direction: 'North'|'South'|'East'|'West' }
    preRolledPattern: null,
    activeProfile: 'Survivor',

    // Oracle Guess countdown timer
    oracleRemainingMs: 10000,
    oracleAnswered: false,

    // Audio rhythm tracking
    lastWarningTickTime: 0
  };

  let lastFrameTimestamp = null;
  let rafLoopId = null;

  /* ==========================================================================
     5. CACHED DOM REFERENCES
     ========================================================================== */
  const dom = {
    shell: document.getElementById('device-shell'),
    deviceViewBtn: document.getElementById('btn-device-view'),
    deviceViewLabel: document.getElementById('device-view-label'),
    soundToggleBtn: document.getElementById('btn-sound-toggle'),
    iconSoundOn: document.getElementById('icon-sound-on'),
    iconSoundOff: document.getElementById('icon-sound-off'),
    pauseBtn: document.getElementById('btn-pause'),
    helpBtn: document.getElementById('btn-help'),
    hudProfileBtn: document.getElementById('btn-profile-switch'),
    hudAvatar: document.getElementById('hud-avatar'),
    hudProfileName: document.getElementById('hud-profile-name'),
    hudRound: document.getElementById('hud-round'),
    hudScore: document.getElementById('hud-score'),
    hudBest: document.getElementById('hud-best'),
    capsules: document.querySelectorAll('.capsule'),
    streakBadge: document.getElementById('streak-badge'),
    streakCount: document.getElementById('streak-count'),
    grid3x3: document.getElementById('grid-3x3'),
    gridCells: document.querySelectorAll('.grid-cell'),
    playerToken: document.getElementById('player-token'),
    playerDisc: document.getElementById('player-disc'),
    playerAura: document.getElementById('player-aura'),
    beamH: document.getElementById('beam-h'),
    beamV: document.getElementById('beam-v'),
    arrowN: document.getElementById('arrow-n'),
    arrowS: document.getElementById('arrow-s'),
    arrowW: document.getElementById('arrow-w'),
    arrowE: document.getElementById('arrow-e'),
    hitVignette: document.getElementById('hit-vignette'),
    canvas: document.getElementById('fx-canvas'),
    // Modals
    modalOracle: document.getElementById('modal-oracle'),
    oracleBar: document.getElementById('oracle-timer-bar'),
    modalGameOver: document.getElementById('modal-gameover'),
    gameoverScore: document.getElementById('gameover-score'),
    gameoverBest: document.getElementById('gameover-best'),
    gameoverRounds: document.getElementById('gameover-rounds'),
    gameoverStreak: document.getElementById('gameover-streak'),
    gameoverNewBest: document.getElementById('gameover-newbest'),
    btnRestart: document.getElementById('btn-restart'),
    btnSwitchUser: document.getElementById('btn-switch-user'),
    modalProfile: document.getElementById('modal-profile'),
    profileDropdown: document.getElementById('profile-select-dropdown'),
    profileNewName: document.getElementById('profile-new-name'),
    btnProfileCreate: document.getElementById('btn-profile-create'),
    btnProfileStart: document.getElementById('btn-profile-start'),
    leaderboardTable: document.getElementById('leaderboard-table'),
    modalHelp: document.getElementById('modal-help'),
    btnHelpClose: document.getElementById('btn-help-close'),
    modalPause: document.getElementById('modal-pause'),
    btnResume: document.getElementById('btn-resume'),
    btnPauseRestart: document.getElementById('btn-pause-restart')
  };

  particles = new ParticleManager(dom.canvas);

  /* ==========================================================================
     6. GAME DIFFICULTY & TIMING FORMULAS
     ========================================================================== */
  function calculatePhaseDuration(phase, roundNumber) {
    switch (phase) {
      case GamePhase.SPAWN:
        return 500; // 0.5s spawn delay
      case GamePhase.WARNING:
        // Speeds up from 3.0s down to 1.2s floor as rounds progress
        return Math.max(1200, 3000 - (roundNumber - 1) * 120);
      case GamePhase.STRIKE:
        // Speeds up from 0.6s down to 0.35s floor
        return Math.max(350, 600 - (roundNumber - 1) * 15);
      case GamePhase.COOLDOWN:
        return 500; // 0.5s cooldown
      default:
        return 1000;
    }
  }

  function calculateBarrierCount(roundNumber) {
    if (roundNumber <= 5) return Math.floor(Math.random() * 2) + 2; // 2 or 3 shields
    if (roundNumber <= 10) return Math.floor(Math.random() * 2) + 1; // 1 or 2 shields
    return 1; // 1 shield in late rounds
  }

  // Rolls 1 of 12 equally probable attack vector patterns
  function generateRandomAttackVector() {
    const isRowStrike = Math.random() < 0.5;
    const index = Math.floor(Math.random() * 3); // 0, 1, or 2
    let direction;
    if (isRowStrike) {
      direction = Math.random() < 0.5 ? 'East' : 'West';
    } else {
      direction = Math.random() < 0.5 ? 'North' : 'South';
    }
    return {
      axis: isRowStrike ? 'row' : 'col',
      index: index,
      direction: direction
    };
  }

  /* ==========================================================================
     7. PLAYER INPUT & MOVEMENT HANDLING
     ========================================================================== */
  function isMovementPermitted() {
    // Movement is permitted during SPAWN, WARNING, and COOLDOWN phases
    // Strictly locked during STRIKE and while modals are active
    return (
      (gameState.phase === GamePhase.SPAWN || gameState.phase === GamePhase.WARNING || gameState.phase === GamePhase.COOLDOWN) &&
      !gameState.paused &&
      gameState.phase !== GamePhase.FREEZE_GUESS &&
      gameState.phase !== GamePhase.GAME_OVER &&
      gameState.phase !== GamePhase.PROFILE_SELECT
    );
  }

  function movePlayer(deltaX, deltaY) {
    if (!isMovementPermitted()) return;

    // Clamp coordinates to the 3x3 grid [0, 2]
    const nextX = Math.max(0, Math.min(2, gameState.player.x + deltaX));
    const nextY = Math.max(0, Math.min(2, gameState.player.y + deltaY));

    if (nextX !== gameState.player.x || nextY !== gameState.player.y) {
      gameState.player.x = nextX;
      gameState.player.y = nextY;
      sound.playMoveSound();
      updatePlayerVisuals(true);
    }
  }

  function handleKeyboardInput(evt) {
    const key = evt.key;
    // Prevent browser window from scrolling on arrow keys and spacebar
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' '].includes(key)) {
      evt.preventDefault();
    }
    if (evt.repeat) return; // Ignore key repeat to prevent move queueing

    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        movePlayer(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        movePlayer(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePlayer(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePlayer(1, 0);
        break;
      case 'Escape':
      case 'p':
      case 'P':
        togglePauseState();
        break;
    }
  }

  // Setup virtual D-Pad touch events using Pointer Events
  function attachTouchControls() {
    const bindDpadButton = (elementId, deltaX, deltaY) => {
      const btn = document.getElementById(elementId);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        movePlayer(deltaX, deltaY);
      });
      const releaseButton = () => btn.classList.remove('pressed');
      btn.addEventListener('pointerup', releaseButton);
      btn.addEventListener('pointercancel', releaseButton);
      btn.addEventListener('pointerleave', releaseButton);
    };

    bindDpadButton('dpad-up', 0, -1);
    bindDpadButton('dpad-down', 0, 1);
    bindDpadButton('dpad-left', -1, 0);
    bindDpadButton('dpad-right', 1, 0);
  }

  /* ==========================================================================
     8. UI RENDERING & VISUAL FEEDBACK
     ========================================================================== */
  function updatePlayerVisuals(isMoving = false) {
    const targetCell = document.getElementById(`cell-${gameState.player.x}-${gameState.player.y}`);
    if (!targetCell) return;

    // Use GPU translated coordinates matching the target grid cell
    const cellLeft = targetCell.offsetLeft;
    const cellTop = targetCell.offsetTop;
    dom.playerToken.style.transform = `translate3d(${cellLeft}px, ${cellTop}px, 0)`;

    if (isMoving) {
      // Squash and stretch micro-interaction on step
      dom.playerDisc.style.transform = 'scaleX(1.08) scaleY(0.92)';
      setTimeout(() => {
        dom.playerDisc.style.transform = 'scale(1)';
      }, 150);
    }
  }

  function updateHUD() {
    dom.hudRound.textContent = gameState.round;
    dom.hudScore.textContent = gameState.score;
    dom.hudBest.textContent = gameState.personalBest;
    dom.hudProfileName.textContent = gameState.activeProfile;
    dom.hudAvatar.textContent = gameState.activeProfile.charAt(0).toUpperCase();

    // Lifeline capsules visual state
    dom.capsules.forEach((capsule, index) => {
      if (index < gameState.lifelines) {
        capsule.classList.remove('lost');
      } else {
        capsule.classList.add('lost');
      }
    });

    // Streak badge indicator
    if (gameState.streak >= 2) {
      dom.streakBadge.classList.add('active');
      dom.streakCount.textContent = `${gameState.streak} STREAK`;
    } else {
      dom.streakBadge.classList.remove('active');
    }

    // Emerald aura around player for 5+ streak
    if (gameState.streak >= 5) {
      dom.playerAura.classList.add('active');
    } else {
      dom.playerAura.classList.remove('active');
    }
  }

  function resetGridEffects() {
    dom.gridCells.forEach(cell => {
      cell.classList.remove('warning-wash');
      cell.style.removeProperty('--pulse-speed');
    });
    document.querySelectorAll('.barrier-shield').forEach(node => node.remove());

    dom.beamH.classList.remove('active', 'strike-sweep-west', 'strike-sweep-east');
    dom.beamV.classList.remove('active', 'strike-sweep-north', 'strike-sweep-south');

    dom.arrowN.classList.remove('active');
    dom.arrowS.classList.remove('active');
    dom.arrowW.classList.remove('active');
    dom.arrowE.classList.remove('active');
  }

  function renderBarrierShields() {
    document.querySelectorAll('.barrier-shield').forEach(node => node.remove());
    gameState.barriers.forEach(barrier => {
      const cell = document.getElementById(`cell-${barrier.x}-${barrier.y}`);
      if (cell) {
        const shieldEl = document.createElement('div');
        shieldEl.className = 'barrier-shield';
        shieldEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
        cell.appendChild(shieldEl);
      }
    });
  }

  function renderWarningHighlight(pattern, progressFraction) {
    // Pulse accelerates as warning approaches strike
    const pulsePeriod = Math.max(0.35, 1.2 - progressFraction * 0.85);

    // Highlight row or column
    for (let i = 0; i < 3; i++) {
      const cellId = pattern.axis === 'row' ? `cell-${i}-${pattern.index}` : `cell-${pattern.index}-${i}`;
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.classList.add('warning-wash');
        cell.style.setProperty('--pulse-speed', `${pulsePeriod.toFixed(2)}s`);
      }
    }

    // Position warning arrow at outer boundary pointing inward
    if (pattern.axis === 'col') {
      const targetColCell = document.getElementById(`cell-${pattern.index}-0`);
      const centerOffsetX = targetColCell.offsetLeft + targetColCell.offsetWidth / 2;
      if (pattern.direction === 'North') {
        dom.arrowN.style.left = `${centerOffsetX}px`;
        dom.arrowN.classList.add('active');
      } else {
        dom.arrowS.style.left = `${centerOffsetX}px`;
        dom.arrowS.classList.add('active');
      }
    } else {
      const targetRowCell = document.getElementById(`cell-0-${pattern.index}`);
      const centerOffsetY = targetRowCell.offsetTop + targetRowCell.offsetHeight / 2;
      if (pattern.direction === 'West') {
        dom.arrowW.style.top = `${centerOffsetY}px`;
        dom.arrowW.classList.add('active');
      } else {
        dom.arrowE.style.top = `${centerOffsetY}px`;
        dom.arrowE.classList.add('active');
      }
    }
  }

  function showDamageFeedback() {
    sound.playHitSound();
    sound.playLifelineLost();
    dom.shell.classList.add('shaking');
    dom.playerDisc.classList.add('hit');
    dom.hitVignette.classList.add('active');

    // Haptic vibration feedback on supported mobile devices
    if (navigator.vibrate) {
      try { navigator.vibrate(120); } catch (e) {}
    }

    setTimeout(() => {
      dom.shell.classList.remove('shaking');
      dom.playerDisc.classList.remove('hit');
      dom.hitVignette.classList.remove('active');
    }, 220);
  }

  function showShieldBlockFeedback(cellX, cellY) {
    sound.playBarrierBlock();
    const cell = document.getElementById(`cell-${cellX}-${cellY}`);
    if (cell) {
      const cellRect = cell.getBoundingClientRect();
      const canvasRect = dom.canvas.getBoundingClientRect();
      const posX = cellRect.left - canvasRect.left + cellRect.width / 2;
      const posY = cellRect.top - canvasRect.top + cellRect.height / 2;
      particles.spawnShieldSparks(posX, posY, 14, '#10b981');
    }
  }

  /* ==========================================================================
     9. PHASE STATE TRANSITIONS
     ========================================================================== */
  function startNewGame() {
    gameState.round = 1;
    gameState.score = 0;
    gameState.lifelines = 5;
    gameState.streak = 0;
    gameState.maxStreakThisRun = 0;
    gameState.guessEventUsed = false;
    gameState.justReachedTwoLives = false;
    gameState.wasHitThisWave = false;
    gameState.player = { x: 1, y: 1 };
    gameState.barriers = [];
    gameState.currentPattern = null;
    gameState.preRolledPattern = null;
    gameState.paused = false;

    dismissAllModals();
    resetGridEffects();
    updatePlayerVisuals();
    updateHUD();

    switchPhaseTo(GamePhase.SPAWN);
  }

  function switchPhaseTo(newPhase) {
    gameState.phase = newPhase;
    gameState.phaseElapsed = 0;
    gameState.lastWarningTickTime = 0;

    switch (newPhase) {
      case GamePhase.SPAWN:
        onEnterSpawnPhase();
        break;
      case GamePhase.WARNING:
        onEnterWarningPhase();
        break;
      case GamePhase.STRIKE:
        onEnterStrikePhase();
        break;
      case GamePhase.COOLDOWN:
        onEnterCooldownPhase();
        break;
      case GamePhase.FREEZE_GUESS:
        onEnterOracleGuessPhase();
        break;
      case GamePhase.GAME_OVER:
        onEnterGameOverPhase();
        break;
    }
  }

  function onEnterSpawnPhase() {
    resetGridEffects();
    gameState.wasHitThisWave = false;
    gameState.justReachedTwoLives = false;

    // Pick 1 to 3 distinct barrier locations
    const barrierCount = calculateBarrierCount(gameState.round);
    const availableCells = [];
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) {
        availableCells.push({ x: col, y: row });
      }
    }
    // Shuffle available cells
    availableCells.sort(() => Math.random() - 0.5);
    gameState.barriers = availableCells.slice(0, barrierCount);

    sound.playBarrierSpawn();
    renderBarrierShields();

    // Occasional subtle grid shimmer animation
    if (Math.random() < 0.3) {
      const randomCell = dom.gridCells[Math.floor(Math.random() * dom.gridCells.length)];
      randomCell.classList.add('shimmer');
      setTimeout(() => randomCell.classList.remove('shimmer'), 1500);
    }
  }

  function onEnterWarningPhase() {
    // If Oracle Guess pre-rolled a pattern, we must honor it exactly
    if (gameState.preRolledPattern) {
      gameState.currentPattern = gameState.preRolledPattern;
      gameState.preRolledPattern = null;
    } else {
      gameState.currentPattern = generateRandomAttackVector();
    }
    renderWarningHighlight(gameState.currentPattern, 0);
  }

  function onEnterStrikePhase() {
    // Snapshot player position at the exact instant STRIKE begins (deterministic check)
    const playerSnapshot = { x: gameState.player.x, y: gameState.player.y };
    const pattern = gameState.currentPattern;

    let isInDangerLine = false;
    if (pattern.axis === 'row' && playerSnapshot.y === pattern.index) isInDangerLine = true;
    if (pattern.axis === 'col' && playerSnapshot.x === pattern.index) isInDangerLine = true;

    const hasShieldBarrier = gameState.barriers.some(b => b.x === playerSnapshot.x && b.y === playerSnapshot.y);

    // Trigger directional strike beam animation
    if (pattern.axis === 'row') {
      const targetCell = document.getElementById(`cell-0-${pattern.index}`);
      dom.beamH.style.top = `${targetCell.offsetTop}px`;
      dom.beamH.classList.add('active');
      if (pattern.direction === 'West') {
        dom.beamH.classList.add('strike-sweep-west');
      } else {
        dom.beamH.classList.add('strike-sweep-east');
      }
    } else {
      const targetCell = document.getElementById(`cell-${pattern.index}-0`);
      dom.beamV.style.left = `${targetCell.offsetLeft}px`;
      dom.beamV.classList.add('active');
      if (pattern.direction === 'North') {
        dom.beamV.classList.add('strike-sweep-north');
      } else {
        dom.beamV.classList.add('strike-sweep-south');
      }
    }

    // Evaluate collision outcome
    if (isInDangerLine) {
      if (hasShieldBarrier) {
        showShieldBlockFeedback(playerSnapshot.x, playerSnapshot.y);
      } else {
        // Player was struck by beam
        gameState.wasHitThisWave = true;
        gameState.lifelines--;
        gameState.streak = 0; // Streak resets on hit

        // Check if lifelines just transitioned to 2 (qualifies for Oracle Guess)
        if (gameState.lifelines === 2 && !gameState.guessEventUsed) {
          gameState.justReachedTwoLives = true;
        }

        showDamageFeedback();
        updateHUD();
      }
    } else {
      sound.playStrikeSafe();
    }
  }

  function onEnterCooldownPhase() {
    resetGridEffects();

    // Reward player only if they survived without damage
    if (!gameState.wasHitThisWave) {
      gameState.score++;
      gameState.streak++;
      if (gameState.streak > gameState.maxStreakThisRun) {
        gameState.maxStreakThisRun = gameState.streak;
      }

      // +3 bonus points every 5 consecutive waves
      if (gameState.streak > 0 && gameState.streak % 5 === 0) {
        gameState.score += 3;
        sound.playStreakBonus();
        dom.playerAura.classList.add('active');
      }

      // Update personal best on the fly
      if (gameState.score > gameState.personalBest) {
        gameState.personalBest = gameState.score;
      }
    }

    updateHUD();
  }

  function advanceGamePhase() {
    if (gameState.phase === GamePhase.COOLDOWN) {
      // 1. Check for Game Over
      if (gameState.lifelines <= 0) {
        switchPhaseTo(GamePhase.GAME_OVER);
        return;
      }

      // 2. Check for Oracle Guess Event (First time health drops to 2)
      if (gameState.justReachedTwoLives && !gameState.guessEventUsed) {
        gameState.justReachedTwoLives = false;
        switchPhaseTo(GamePhase.FREEZE_GUESS);
        return;
      }

      // 3. Otherwise proceed to the next round
      gameState.round++;
      switchPhaseTo(GamePhase.SPAWN);
      return;
    }

    if (gameState.phase === GamePhase.SPAWN) {
      switchPhaseTo(GamePhase.WARNING);
      return;
    }

    if (gameState.phase === GamePhase.WARNING) {
      switchPhaseTo(GamePhase.STRIKE);
      return;
    }

    if (gameState.phase === GamePhase.STRIKE) {
      switchPhaseTo(GamePhase.COOLDOWN);
      return;
    }
  }

  /* ==========================================================================
     10. ORACLE GUESS EVENT
     ========================================================================== */
  function onEnterOracleGuessPhase() {
    // Pre-roll the pattern BEFORE showing the modal so guess is verified against it
    gameState.preRolledPattern = generateRandomAttackVector();
    gameState.oracleRemainingMs = 10000; // 10s countdown
    gameState.oracleAnswered = false;
    gameState.paused = true; // Pause state machine clock

    dom.oracleBar.style.width = '100%';
    dom.oracleBar.style.backgroundColor = 'var(--accent-emerald)';
    dom.modalOracle.classList.add('open');
  }

  function submitOracleVectorGuess(selectedDirection) {
    if (gameState.oracleAnswered) return;
    gameState.oracleAnswered = true;
    gameState.guessEventUsed = true;

    const isMatch = selectedDirection === gameState.preRolledPattern.direction;

    if (isMatch) {
      gameState.lifelines = 3; // Restore from 2 back to 3
      sound.playLifelineGained();
      const modalRect = dom.modalOracle.getBoundingClientRect();
      particles.spawnShieldSparks(modalRect.width / 2, modalRect.height / 2, 22, '#10b981');
    } else {
      sound.playWarningTick();
    }

    updateHUD();

    setTimeout(() => {
      dom.modalOracle.classList.remove('open');
      gameState.paused = false;
      // Continue to next wave with pre-rolled pattern
      gameState.round++;
      switchPhaseTo(GamePhase.SPAWN);
    }, 500);
  }

  /* ==========================================================================
     11. GAME OVER & LEADERBOARD PERSISTENCE
     ========================================================================== */
  function onEnterGameOverPhase() {
    sound.playGameOver();
    const currentProfile = gameSaveData.profiles[gameState.activeProfile];
    const isNewRecord = gameState.score > currentProfile.highScore;

    if (isNewRecord) {
      currentProfile.highScore = gameState.score;
      sound.playHighScoreFanfare();
      setTimeout(() => particles.spawnHighScoreConfetti(), 300);
    }

    currentProfile.gamesPlayed++;
    currentProfile.totalWavesSurvived += (gameState.round - 1);
    if (gameState.maxStreakThisRun > currentProfile.longestStreak) {
      currentProfile.longestStreak = gameState.maxStreakThisRun;
    }
    commitSavedData();

    // Populate game over dialog
    dom.gameoverScore.textContent = gameState.score;
    dom.gameoverBest.textContent = currentProfile.highScore;
    dom.gameoverRounds.textContent = gameState.round - 1;
    dom.gameoverStreak.textContent = gameState.maxStreakThisRun;
    dom.gameoverNewBest.style.display = isNewRecord ? 'block' : 'none';

    dom.modalGameOver.classList.add('open');
  }

  /* ==========================================================================
     12. MAIN SINGLE-CLOCK RAF LOOP
     ========================================================================== */
  function mainGameLoop(currentTimestamp) {
    rafLoopId = requestAnimationFrame(mainGameLoop);

    if (lastFrameTimestamp === null) lastFrameTimestamp = currentTimestamp;
    const deltaTime = currentTimestamp - lastFrameTimestamp;
    lastFrameTimestamp = currentTimestamp;

    // Render particles
    particles.render();

    // Handle pause state
    if (gameState.paused) {
      // In Oracle mode, animate the drain bar
      if (gameState.phase === GamePhase.FREEZE_GUESS && !gameState.oracleAnswered) {
        gameState.oracleRemainingMs -= deltaTime;
        const progressFraction = Math.max(0, gameState.oracleRemainingMs / 10000);
        dom.oracleBar.style.width = `${(progressFraction * 100).toFixed(1)}%`;

        // Color shift in final seconds
        if (gameState.oracleRemainingMs <= 3000) {
          dom.oracleBar.style.backgroundColor = 'var(--hazard-crimson)';
        } else if (gameState.oracleRemainingMs <= 6000) {
          dom.oracleBar.style.backgroundColor = 'var(--hazard-orange)';
        }

        if (gameState.oracleRemainingMs <= 0) {
          submitOracleVectorGuess('TIMEOUT');
        }
      }
      return;
    }

    if (gameState.phase === GamePhase.PROFILE_SELECT || gameState.phase === GamePhase.GAME_OVER) {
      return;
    }

    gameState.phaseElapsed += deltaTime;

    // Audio cue ticks during warning
    if (gameState.phase === GamePhase.WARNING) {
      const totalWarningDuration = calculatePhaseDuration(GamePhase.WARNING, gameState.round);
      const fraction = Math.min(1, gameState.phaseElapsed / totalWarningDuration);
      renderWarningHighlight(gameState.currentPattern, fraction);

      // Warning ticks accelerate as time runs out
      const tickCadence = Math.max(250, 800 - fraction * 550);
      if (currentTimestamp - gameState.lastWarningTickTime >= tickCadence) {
        sound.playWarningTick();
        gameState.lastWarningTickTime = currentTimestamp;
      }
    }

    const currentDuration = calculatePhaseDuration(gameState.phase, gameState.round);
    if (gameState.phaseElapsed >= currentDuration) {
      advanceGamePhase();
    }
  }

  /* ==========================================================================
     13. PROFILE & LEADERBOARD MANAGEMENT
     ========================================================================== */
  function populateProfileDropdown() {
    dom.profileDropdown.innerHTML = '';
    Object.keys(gameSaveData.profiles).forEach(profileName => {
      const option = document.createElement('option');
      option.value = profileName;
      option.textContent = `${profileName} (Best: ${gameSaveData.profiles[profileName].highScore})`;
      if (profileName === gameState.activeProfile) option.selected = true;
      dom.profileDropdown.appendChild(option);
    });

    // Populate Top 5 Leaderboard
    const sortedProfiles = Object.entries(gameSaveData.profiles)
      .sort((a, b) => b[1].highScore - a[1].highScore)
      .slice(0, 5);

    dom.leaderboardTable.innerHTML = '';
    sortedProfiles.forEach(([name, stats], index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>#${index + 1} ${name}</td><td>${stats.highScore} pts</td>`;
      dom.leaderboardTable.appendChild(row);
    });
  }

  function setActiveProfile(profileName) {
    if (!gameSaveData.profiles[profileName]) return;
    gameState.activeProfile = profileName;
    gameSaveData.lastActiveProfile = profileName;
    gameState.personalBest = gameSaveData.profiles[profileName].highScore;
    commitSavedData();
    updateHUD();
  }

  function createNewProfile(rawName) {
    const cleanedName = rawName.trim().slice(0, 16);
    if (!cleanedName) return;

    if (!gameSaveData.profiles[cleanedName]) {
      gameSaveData.profiles[cleanedName] = {
        highScore: 0,
        gamesPlayed: 0,
        totalWavesSurvived: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString()
      };
    }
    setActiveProfile(cleanedName);
    populateProfileDropdown();
    dom.profileNewName.value = '';
  }

  /* ==========================================================================
     14. DEVICE SIMULATOR & CONTROLS BINDING
     ========================================================================== */
  function dismissAllModals() {
    dom.modalOracle.classList.remove('open');
    dom.modalGameOver.classList.remove('open');
    dom.modalProfile.classList.remove('open');
    dom.modalHelp.classList.remove('open');
    dom.modalPause.classList.remove('open');
  }

  function togglePauseState() {
    if (gameState.phase === GamePhase.PROFILE_SELECT || gameState.phase === GamePhase.GAME_OVER || gameState.phase === GamePhase.FREEZE_GUESS) return;
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
      dom.modalPause.classList.add('open');
    } else {
      dom.modalPause.classList.remove('open');
    }
  }

  // Device simulation modes for instant testing of all screen sizes
  const simulationModes = ['mode-auto', 'mode-mobile-small', 'mode-mobile-large', 'mode-tablet', 'mode-laptop', 'mode-tv'];
  const simulationLabels = ['Auto', 'Mobile (Sm)', 'Mobile (Lg)', 'Tablet', 'Laptop', 'TV (4K)'];
  let currentDeviceIndex = 0;

  function cycleDevicePreviewMode() {
    currentDeviceIndex = (currentDeviceIndex + 1) % simulationModes.length;
    simulationModes.forEach(cls => dom.shell.classList.remove(cls));
    dom.shell.classList.add(simulationModes[currentDeviceIndex]);
    dom.deviceViewLabel.textContent = simulationLabels[currentDeviceIndex];

    setTimeout(() => {
      particles.resizeCanvas();
      updatePlayerVisuals();
    }, 320);
  }

  /* ==========================================================================
     15. INITIALIZATION & SETUP
     ========================================================================== */
  function initializeGame() {
    loadSavedData();

    // Restore last profile
    if (gameSaveData.lastActiveProfile && gameSaveData.profiles[gameSaveData.lastActiveProfile]) {
      gameState.activeProfile = gameSaveData.lastActiveProfile;
    } else {
      gameState.activeProfile = Object.keys(gameSaveData.profiles)[0] || 'Survivor';
    }
    gameState.personalBest = gameSaveData.profiles[gameState.activeProfile]?.highScore || 0;

    // Restore audio mute preference
    sound.muted = !!gameSaveData.muted;
    dom.iconSoundOn.style.display = sound.muted ? 'none' : 'block';
    dom.iconSoundOff.style.display = sound.muted ? 'block' : 'none';

    // Attach keyboard listener
    window.addEventListener('keydown', handleKeyboardInput);

    // Page Visibility API auto-pause when user changes tabs
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !gameState.paused && gameState.phase !== GamePhase.PROFILE_SELECT && gameState.phase !== GamePhase.GAME_OVER) {
        gameState.paused = true;
        dom.modalPause.classList.add('open');
      }
    });

    // Handle window resize events
    window.addEventListener('resize', () => {
      updatePlayerVisuals();
      particles.resizeCanvas();
    });

    // Attach virtual touch buttons
    attachTouchControls();

    // Sound toggle button
    dom.soundToggleBtn.addEventListener('click', () => {
      sound.ensureContext();
      sound.muted = !sound.muted;
      gameSaveData.muted = sound.muted;
      commitSavedData();
      dom.iconSoundOn.style.display = sound.muted ? 'none' : 'block';
      dom.iconSoundOff.style.display = sound.muted ? 'block' : 'none';
    });

    // Device Viewport preview switcher button
    dom.deviceViewBtn.addEventListener('click', cycleDevicePreviewMode);

    // Pause / Resume buttons
    dom.pauseBtn.addEventListener('click', togglePauseState);
    dom.btnResume.addEventListener('click', togglePauseState);
    dom.btnPauseRestart.addEventListener('click', () => {
      dismissAllModals();
      startNewGame();
    });

    // Help dialog
    dom.helpBtn.addEventListener('click', () => {
      gameState.paused = true;
      dom.modalHelp.classList.add('open');
    });
    dom.btnHelpClose.addEventListener('click', () => {
      dom.modalHelp.classList.remove('open');
      gameState.paused = false;
    });

    // Profile switcher dialog
    dom.hudProfileBtn.addEventListener('click', () => {
      gameState.paused = true;
      populateProfileDropdown();
      dom.modalProfile.classList.add('open');
    });
    dom.profileDropdown.addEventListener('change', (e) => {
      setActiveProfile(e.target.value);
    });
    dom.btnProfileCreate.addEventListener('click', () => {
      createNewProfile(dom.profileNewName.value);
    });
    dom.btnProfileStart.addEventListener('click', () => {
      sound.ensureContext();
      dismissAllModals();
      startNewGame();
    });

    // Restart buttons
    dom.btnRestart.addEventListener('click', () => {
      sound.ensureContext();
      startNewGame();
    });
    dom.btnSwitchUser.addEventListener('click', () => {
      dismissAllModals();
      populateProfileDropdown();
      dom.modalProfile.classList.add('open');
    });

    // Oracle vector selection buttons
    document.querySelectorAll('.vector-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.ensureContext();
        const vectorChoice = btn.getAttribute('data-vector');
        submitOracleVectorGuess(vectorChoice);
      });
    });

    // Initial render
    populateProfileDropdown();
    updateHUD();
    updatePlayerVisuals();

    // Show profile modal on start
    dom.modalProfile.classList.add('open');

    // Kick off sole RAF game loop
    rafLoopId = requestAnimationFrame(mainGameLoop);
  }

  // Launch when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
  } else {
    initializeGame();
  }
})();
