# RedZombies — 3×3 Grid Survival Game

A fast-paced, glassmorphic 3×3 browser survival game built with pure **HTML5, CSS3, and modern JavaScript (ES6+)**. 

Zero external dependencies, zero backend required, with real-time procedural sound synthesis via the **Web Audio API**.

---

## 🎮 Gameplay & Rules

An orbital hazard grid sweeps across a 3×3 arena with lethal light beams:
1. **Evade Strikes**: Move your survivor across the grid using **Arrow Keys / WASD** (or the on-screen glass D-pad on mobile).
2. **Warning Indicator**: When a row or column pulses red, an attack is charging. The outer directional arrow reveals which side the beam fires from.
3. **Take Cover**: Step behind grey shield barricades or move completely out of the targeted line before the beam discharges.
4. **Oracle Protocol**: When down to 2 lifelines, predict the next attack vector (North, South, East, West) to recharge a lost shield.
5. **Streak Multiplier**: Every 5 consecutive waves survived without taking damage grants +3 bonus score and an emerald aura.

---

## 🕹️ Controls

| Action | Desktop Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Up** | `W` or `ArrowUp` | Tap `⬆` button |
| **Move Down** | `S` or `ArrowDown` | Tap `⬇` button |
| **Move Left** | `A` or `ArrowLeft` | Tap `⬅` button |
| **Move Right** | `D` or `ArrowRight` | Tap `➡` button |
| **Pause / Resume** | `P` or `Escape` | Tap `⏸` header button |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Semantic HTML5, CSS3 Glassmorphism (`backdrop-filter: blur(20px)`), Vanilla JavaScript (ES6+).
- **Audio Engine**: Native **Web Audio API** procedural sound synthesizer (OscillatorNode, GainNode, noise buffer) — no external MP3s needed.
- **Game Loop**: Deterministic `requestAnimationFrame` single-clock loop with delta timing.
- **Particle System**: 2D Canvas rendering for shield spark bursts and victory confetti.
- **Persistence**: Safe `localStorage` schema supporting multiple player profiles and local top-5 leaderboards.
- **Device Adaptivity**: Fluid CSS units (`clamp()`, `min()`, `100dvh`) with an interactive viewport tester for iPhone, iPad, Laptop, and 4K TV views.

---

## 🚀 How to Run Locally

1. Clone or download this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/redzombies.git
   ```
2. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari) or use VS Code Live Server.

---

## 🌐 Deploy to GitHub Pages (Free Hosting)

1. Go to your repository settings on GitHub (`Settings` > `Pages`).
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose the `main` branch and `/ (root)` folder, then click **Save**.
4. Your game will be live on the web at `https://YOUR_USERNAME.github.io/redzombies/`!
