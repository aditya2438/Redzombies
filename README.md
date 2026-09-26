# 🧟 RedZombies — 3×3 Grid Survival Game

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Realtime%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Synthesizer-06b6d4?style=for-the-badge)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A high-octane, glassmorphic 3×3 browser survival game built using **HTML5, CSS3, Vanilla JavaScript (ES6+), and Supabase Realtime PostgreSQL**. 

Zero heavy frameworks, with procedural retro sound synthesis powered by the native **Web Audio API** and instant **Global Real-Time Leaderboard sync** across players worldwide.

---

## 🌐 Live Demo & Deployment

- **Vercel Production (Live)**: [https://redzombies.vercel.app](https://redzombies.vercel.app)
- **GitHub Repository**: [https://github.com/aditya2438/Redzombies](https://github.com/aditya2438/Redzombies)

---

## 🎮 Game Overview & Lore

A hostile orbital defense grid sweeps across a compact 3×3 arena with lethal red laser beams. As the survivor, you must read the charging visual warnings, predict the attack vector, and either:
1. **Evade the targeted line** before the beam fires (1.0s reflex window!), OR
2. **Take cover behind temporary shield barricades** deployed within the strike zone.

Survive consecutive waves to increase your score, unlock streak multiplier bonuses, and climb the **Global Real-Time Top 10 Leaderboard**!

---

## ⚡ Key Features

- 🏆 **Global Real-Time Top 10 Leaderboard (Supabase)**:
  - Powered by Supabase PostgreSQL and Realtime WebSockets (`postgres_changes`).
  - Instant live sync: whenever any player worldwide submits a high score, rankings update and animate live on every connected screen without page refresh.
  - Metallic Rank Badges: Gold (#1), Silver (#2), Bronze (#3), and standard (#4–#10).
  - Highlighted row for the active player with `(YOU)` tag.
  - Skeleton shimmer animations while fetching data.
  - Graceful offline fallback if cloud credentials are not yet configured.
- 👤 **Gamer Profile & Avatar System**:
  - Choose from 6 inline gamer avatar icons (`💀` Reaper, `⚡` Volt, `🛡️` Aegis, `☣️` Hazard, `🎯` Deadeye, `🚀` Titan).
  - Alphanumeric callsign validation (3–15 characters, letters, numbers, underscores).
  - Persistent browser `user_id` (UUID) stored in `localStorage`.
  - Quick-edit profile button in the top HUD.
- 🎨 **Custom Web App Icon (Favicon)**:
  - Vector SVG icon (`favicon.svg`) designed specifically for browser URL bars, tabs, bookmarks, and mobile home screens.
- 💎 **Apple-Glass Aesthetic**: Sleek dark UI with radial space gradients, hairline borders, frosted glass (`backdrop-filter: blur(20px)`), and fallback support.
- 📱 **Multi-Device Responsive**: Dynamic fluid layout with CSS `clamp()`, `min()`, and `100dvh` viewport containment (zero page scrollbars). Looks pristine on:
  - Small Mobile (iPhone SE / 340px)
  - Flagship Smartphones (iPhone 16 Pro Max, Samsung Galaxy S24 Ultra / 412px)
  - Tablets (iPad / 768px)
  - Laptops & Desktops (1024px – 1920px)
  - Curved Ultrawide & 4K Smart TVs
- 🖥️ **Interactive Viewport Tester**: Header toggle allows instant previewing and testing of Mobile Small, Mobile Large, Tablet, Laptop, and TV views right on your computer.
- 🔊 **Procedural Web Audio Synthesizer**: 11 unique real-time sound effects generated via native `AudioContext`, `OscillatorNode`, and `GainNode` envelopes (no external MP3 files needed).
- 🔮 **Oracle Protocol (Lifeline Emergency)**: When reduced to 2 lifelines for the first time, an emergency protocol halts the grid clock and prompts you to predict the next strike vector (North, South, East, West). Guess correctly to restore a shield!

---

## 🕹️ Controls

| Control | Desktop / Laptop Keyboard | Mobile & Tablet Touch |
| :--- | :--- | :--- |
| **Move Up / Down / Left / Right** | `W`/`S`/`A`/`D` or Arrow Keys | Glass D-pad, **Direct Cell Tap**, or **Swipe** |
| **Direct Cell Jump** | Click any grid cell | Tap any grid cell directly |
| **Swipe Evasion** | Click and drag | Swipe Up / Down / Left / Right |
| **Global Leaderboard** | Click 🏆 Trophy Icon in header | Tap 🏆 Trophy Icon in header |
| **Pause / Resume** | `P` or `Escape` | Tap `⏸` header button |
| **Mute / Unmute** | Click Sound Icon | Tap `🔊` header button |

---

## ☁️ How to Set Up the Free Supabase Realtime Database

You can host the PostgreSQL database and Realtime WebSockets for **100% free** using Supabase:

1. **Create Free Account**:
   - Go to [https://supabase.com](https://supabase.com) and click **"Start your project"** (Sign in with GitHub).
   - Create a new project (e.g., Name: `RedZombies`, Region: pick the closest region to you, Free tier).
2. **Run the Database Setup Script**:
   - In your Supabase project dashboard, click **"SQL Editor"** from the left navigation menu.
   - Click **"New query"**.
   - Open [`supabase_setup.sql`](file:///d:/game/supabase_setup.sql) in this repository, copy all the SQL code, paste it into the editor, and click **"Run"**.
   - This creates the `leaderboard` table, indexes, Row-Level Security (RLS) policies, and enables real-time WebSocket broadcasting.
3. **Connect Your Game**:
   - In Supabase, go to **Project Settings** (gear icon) -> **API**.
   - Copy your **Project URL** (e.g. `https://xyzcompany.supabase.co`).
   - Copy your **anon public** API Key.
   - Open [`supabase_config.js`](file:///d:/game/supabase_config.js) in this project and paste them:
     ```javascript
     const SUPABASE_CONFIG = {
       url: 'https://YOUR_PROJECT_ID.supabase.co',
       anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
     };
     ```
4. **Deploy**:
   - Push your code to GitHub or Vercel, and your Global Real-Time Leaderboard will be live across the world!

---

## 📂 Project Structure

```
Redzombies/
├── favicon.svg          # Crisp vector SVG web app icon for URL bar & tab
├── index.html           # Semantic HTML5 markup, HUD layout, 3x3 arena, and modal dialogs
├── style.css            # Glassmorphic CSS styling, leaderboard theme, responsive queries
├── script.js            # Game engine, Web Audio synth, Supabase Realtime WebSocket client
├── supabase_config.js   # Supabase cloud credentials and connection checker
├── supabase_setup.sql   # PostgreSQL table, index, RLS, and realtime publication script
├── vercel.json          # Clean URL configuration for Vercel deployment
├── .gitignore           # Git ignore rules for OS and editor cache files
└── README.md            # Comprehensive project documentation
```

---

## 👤 Author

**Aditya Chouhan**
- GitHub: [@aditya2438](https://github.com/aditya2438)
- Email: aditya9993454129@gmail.com

---

## 📄 License

This project is licensed under the MIT License - feel free to play, fork, and learn!

