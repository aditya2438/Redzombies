# 🧟 RedZombies — 3×3 Grid Survival Game

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Synthesizer-06b6d4?style=for-the-badge)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A high-octane, glassmorphic 3×3 browser survival game built entirely using **pure HTML5, CSS3, and modern Vanilla JavaScript (ES6+)**. 

Zero external runtime dependencies, zero backend or framework bloat, with procedural real-time retro sound synthesis powered by the native **Web Audio API**.

---

## 🌐 Live Demo

Play directly in your browser:  
👉 **[https://aditya2438.github.io/Redzombies/](https://aditya2438.github.io/Redzombies/)**

---

## 🎮 Game Overview & Lore

A hostile orbital defense grid sweeps across a compact 3×3 arena with lethal red laser beams. As the survivor, you must read the charging visual warnings, predict the attack vector, and either:
1. **Evade the targeted line** before the beam fires, OR
2. **Take cover behind temporary shield barricades** deployed within the strike zone.

Survive consecutive waves to increase your score, unlock streak multiplier bonuses, and climb the local leaderboard!

---

## ⚡ Key Features

- 💎 **Apple-Glass Aesthetic**: Sleek dark UI with radial space gradients, hairline borders, frosted glass (`backdrop-filter: blur(20px)`), and fallback support.
- 📱 **Multi-Device Responsive**: Dynamic fluid layout with CSS `clamp()`, `min()`, and `100dvh` viewport containment (zero page scrollbars). Looks pristine on:
  - Small Mobile (iPhone SE / 340px)
  - Flagship Smartphones (iPhone 16 Pro Max, Samsung Galaxy S24 Ultra / 412px)
  - Tablets (iPad / 768px)
  - Laptops & Desktops (1024px – 1920px)
  - Curved Ultrawide & 4K Smart TVs
- 🖥️ **Interactive Viewport Tester**: Header toggle allows instant previewing and testing of Mobile Small, Mobile Large, Tablet, Laptop, and TV views right on your computer.
- 🔊 **Procedural Web Audio Synthesizer**: 11 unique real-time sound effects generated via native `AudioContext`, `OscillatorNode`, and `GainNode` envelopes (no MP3 files to download):
  - Movement blips (600Hz sine)
  - Accelerating warning pulse ticks
  - Shield spawn sweeps
  - Sub-bass safe impact thuds
  - Dual-layer damage crunch (white noise + 90Hz thud)
  - Crystal shield block chimes
  - Lifeline lost/gained arpeggios
  - 5-Wave streak celebration sparkle
  - Game over & high score fanfares
- 🔮 **Oracle Protocol (Lifeline Emergency)**: When reduced to 2 lifelines for the first time, an emergency protocol halts the grid clock and prompts you to predict the next strike vector (North, South, East, West). Guess correctly to restore a shield!
- ⏱️ **Single-Clock RAF Game Loop**: One deterministic `requestAnimationFrame` loop with delta timing that structurally eliminates `setTimeout` race conditions and memory leaks.
- 💥 **Canvas Particle FX**: 2D HTML5 canvas particle system rendering emerald spark bursts on shield blocks and multi-colored confetti showers on new high scores.
- 💾 **Safe Local Persistence**: `localStorage` saving with try/catch memory fallback for private browsing, tracking multiple user profiles, games played, lifetime waves survived, and top-5 local high scores.

---

## 🕹️ Controls

| Control | Desktop / Laptop Keyboard | Mobile & Tablet Touch |
| :--- | :--- | :--- |
| **Move Up / Down / Left / Right** | `W`/`S`/`A`/`D` or Arrow Keys | Glass D-pad, **Direct Cell Tap**, or **Swipe** |
| **Direct Cell Jump** | Click any grid cell | Tap any grid cell directly |
| **Swipe Evasion** | Click and drag | Swipe Up / Down / Left / Right |
| **Pause / Resume** | `P` or `Escape` | Tap `⏸` header button |
| **Mute / Unmute** | Click Sound Icon | Tap `🔊` header button |

---

## 📂 Project Structure

```
Redzombies/
├── index.html       # Semantic HTML5 markup, HUD layout, 3x3 arena, and modal dialogs
├── style.css        # Glassmorphic CSS styling, responsive media queries, animations
├── script.js        # Pure Vanilla JS game engine, Web Audio synth, state machine, particles
├── .gitignore       # Git ignore rules for OS and editor cache files
└── README.md        # Comprehensive project documentation
```

---

## 🚀 Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/aditya2438/Redzombies.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Redzombies
   ```
3. Open `index.html` directly in your browser:
   - On Windows: Double-click `index.html` or run `start index.html` in PowerShell.
   - Or use the VS Code extension **Live Server**.

---

## ⚙️ How It Works (Technical Highlights)

- **Deterministic Collision Snapshot**: At the exact start of the `STRIKE` phase, the player's position is snapshotted:
  $$\text{Hit} = (Player \in \text{DangerLine}) \land (\text{Cell has no barrier})$$
  Movement is gated at the input handler level during `STRIKE`, making the collision resolution unexploitable.
- **Fast-Paced Twitch Difficulty Ramping**:
  - Hazard warning time is capped at **1.0 second (1000ms)** in Wave 1 and scales down to an intense **450ms** floor: $\max(450\text{ms}, 1000\text{ms} - (\text{round} - 1) \times 55\text{ms})$.
  - Strike laser discharge snaps between $280\text{ms}$ and $200\text{ms}$.
  - Shield barriers scale down from 2–3 in early rounds to 1 in later rounds.

---

## 👤 Author

**Aditya Chouhan**
- GitHub: [@aditya2438](https://github.com/aditya2438)
- Email: aditya9993454129@gmail.com

---

## 📄 License

This project is licensed under the MIT License - feel free to play, fork, and learn!
