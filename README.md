# ⚡ CyberFort 3D (Proto)

> **High-Octane Cyberpunk Tactical 3D Multiplayer Arena Shooter**  
> Powered by Three.js, Cannon.js Physics, PeerJS P2P Mesh Networking, Real-Time RTX Ray Tracing, and AMD FidelityFX™ Super Resolution (FSR).

[![Live Demo](https://img.shields.io/badge/PLAY_LIVE-Vercel-00f3ff?style=for-the-badge&logo=vercel)](https://cyber-fort3-d-proto.vercel.app/)
[![Engine](https://img.shields.io/badge/3D_Engine-Three.js_r128-ff0055?style=for-the-badge)](https://threejs.org/)
[![Physics](https://img.shields.io/badge/Physics-Cannon.js-00ffaa?style=for-the-badge)](https://github.com/schteppe/cannon.js)
[![Networking](https://img.shields.io/badge/P2P_Mesh-PeerJS-ffff00?style=for-the-badge)](https://peerjs.com/)

---

## 🎮 Play Live
- **Official Web Deployment:** [https://cyber-fort3-d-proto.vercel.app/](https://cyber-fort3-d-proto.vercel.app/)
- **Offline / Standalone Single-File Bundle:** Open [`FortniteLite_Standalone.html`](file:///j:/Cyberfortx3d-proto/FortniteLite_Standalone.html) directly in any modern browser — zero installation, zero server required!

---

## 🌟 Key Highlights & Engineering Features

### 💎 Next-Gen RTX Post-Processing & Ray Tracing Pipeline
- **Real-Time RTX Screen-Space Raymarching & Monte Carlo Path Tracing:**
  - Upward-directed raymarching casts reflections of neon spires, avatars, lasers, and skyboxes onto undulating water planes and mirror monoliths.
  - Multi-tier ray tracing presets: **Path Tracing (Full GI)**, **Quality (16 Steps + Binary Search)**, **Medium (8 Steps)**, **Performance (5 Steps)**, and **Off (Pure Raster)**.
- **Silky 16-Bit Half-Float Bloom (`THREE.HalfFloatType`):**
  - Upgraded `EffectComposer` render target from 8-bit RGBA to 16-bit floating-point precision, eliminating 8-bit banding, quantization noise, and dirty pixelated graininess.
  - Natural, silky smooth glow curve calibrated with clean thresholding (`0.70`) and configurable intensity (`0.35` default).
- **Zero-Bleach Luminance-Preserving Filmic HDR Tone Mapping:**
  - Eliminates the washed-out / chalky bleach look caused by legacy per-channel ACES compression.
  - Maps scalar luminance $Y = 0.2126R + 0.7152G + 0.0722B$ through a filmic curve and rescales RGB by $(Y_{\text{mapped}} / Y)$, preserving 100% of vibrant cyberpunk hue and deep inky contrast.
  - Selectable tone mapping engines: **Vibrant Filmic (Recommended)**, **Khronos PBR Neutral**, **ACES Classic**, and **Raw HDR**.
- **AMD FidelityFX™ Super Resolution (FSR 1.0) & RCAS Filter:**
  - Renders the scene at optimized fractional resolution (Ultra Quality 77%, Quality 67%, Balanced 59%, Performance 50%) and upscales with Robust Contrast-Adaptive Sharpening (RCAS), delivering up to **2x-3x frame rate boosts** on laptops and integrated GPUs.
- **Hardware Detection & Auto-Optimization:**
  - Automatically identifies user hardware (dGPU vs. 4th-Gen Intel HD 4600 / i5-4590).
  - One-click presets for dedicated gaming GPUs (Quality RT + FSR Quality) and vintage 4th-gen Intel hardware (60 FPS locked, optimized raster).

---

## 🗺️ 18 Dedicated Gamemode Maps (RT Water & Reflections)

Every gamemode features **3 distinct, handcrafted cybernetic arenas** showcasing undulating water bodies, high-gloss mirror monoliths (`metalness: 0.96, roughness: 0.04`), and translucent glass walkways (`opacity: 0.45`):

```
┌─────────────────┬──────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Gamemode        │ Map Name (ID)            │ Atmospheric & Architectural Theme                           │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Free For All    │ Neon Spire Basin         │ Titan skyscraper surrounded by reflective water moats       │
│                 │ Cyber Atlantis           │ Flooded city with submerged high-tech ruins & mirror decks  │
│                 │ Mirrored Canyon          │ Sinuous river canyon with chrome rock walls & sky bridges   │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Team Deathmatch │ Twin Canals              │ Dual team fortresses split by a 260m reflective river       │
│                 │ Hydro Reservoir          │ Multi-tiered hydroelectric dam with vast water basin        │
│                 │ Cyber Haven              │ Futuristic maritime cargo port with reflecting ocean slips  │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Capture Flag    │ Lagoon Outpost           │ Fortresses across a shimmering lagoon with glass highways   │
│                 │ Mirror Archipelago       │ Ocean map with connected cyber islands & shallow shoals     │
│                 │ Canal Bastion            │ Grand fortress bisected by cross canals & mirror towers     │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ King of Hill    │ Sunken Citadel           │ Capture dais centered in an expansive reflective neon lake  │
│                 │ Mirrored Oasis           │ Step-pyramid hill with cascading water terraces & pads      │
│                 │ Aqua Spire               │ Glass capture pavilion hovering 21m above deep water moat   │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Gun Game        │ Hydro Docks              │ Intersecting water channels, mirror crates & glass ramps    │
│                 │ Glass Matrix             │ 3 vertically stacked glass arenas over an endless ocean     │
│                 │ Neon Marina              │ Reflective yacht basin with mirror berths & tight alleys    │
├─────────────────┼──────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Zombies         │ Toxic Swamp              │ Eerie marsh with glowing bio-water & narrow boardwalks      │
│                 │ Flooded Facility         │ Submerged research lab with knee-deep water & red alarms    │
│                 │ Drowned Temple           │ Ancient cyber sanctuary with reflective water & altar ring  │
└─────────────────┴──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 🌊 Interactive Physics & Combat Systems

- **Dynamic Undulating Water Waves:**
  - Water planes animate sinusoidal undulating vertices in real-time (`geo.computeVertexNormals()`), creating dynamic liquid ripples that refract and mirror the world.
- **Fluid Wading Drag & Splash Physics:**
  - Players wading through water experience slight realistic hydrodynamic drag (`velocity * 0.94`) and trigger procedural expanding splash rings and particles.
- **Interactive Concentric Jump Pads:**
  - Stepping onto high-poly jump pads instantly propels players skyward (`velocity.y = 38`), playing dual-tone cyber synth audio and granting aerial maneuverability.
- **Full Tactical Hold-F Grapple Hook:**
  - Press and hold `F` to fire a glowing cyber-tether to any world surface and reel directly to the target point with momentum preservation.
- **Wall-Running & Wall-Climbing:**
  - Hold `W + R` against any vertical structure to wall-run horizontally or scale sheer surfaces.
- **Jump Physics Mode Switcher (`J`):**
  - Press `J` anytime to toggle between **Normal E-Sports Jump** (instant, crisp, gravity-grounded) and **Floaty Anti-Gravity Jump** (extended lunar hang-time).
- **KOTH Combat Balance:**
  - King of the Hill exclusive loadout: **Knockback Rifle** (zero damage, controlled kinetic displacement) and **Knock Stick** (devastating melee launch stick to knock enemies into the water).
  - Out-of-barrier boundary check prevents players from being flung into the void.

---

## 🕹️ Controls & Keybinds

| Key / Control | Action |
|:---:|:---|
| **W, A, S, D** | Walk / Strafe Movement |
| **Shift** | Tactical Sprint |
| **Space** | Jump (Double Jump supported) |
| **Ctrl / C** | Slide / Crouch |
| **W + R** | Wall-Run / Wall-Climb |
| **Hold F** | Grapple Hook (Hold to fully pull to point) |
| **J** | Toggle Jump Physics Mode (**Normal** vs **Floaty**) |
| **Left Click** | Fire Weapon / Swing Melee |
| **Right Click** | Aim Down Sights (ADS Scope) |
| **1 - 5 / Scroll** | Hotbar Weapon Slots |
| **Q / E** | Tactical Ability Cast |
| **V** | Toggle 1st Person / 3rd Person Camera |
| **Tab** | Match Scoreboard & Team Standings |
| **Esc / P** | Pause Menu / Calibration Settings |
| **F2 / ~** | Tactical Admin / VIP Dashboard |

---

## 🌐 Multiplayer & Offline Bots Architecture

- **P2P Serverless Networking (PeerJS / WebRTC):**
  - Fully decentralized star-mesh peer topology.
  - Built-in global lobby matchmaking browser with auto-refreshing public rooms.
  - Seamless host migration if the original room host disconnects.
- **Autonomous Tactical AI Bots:**
  - Full offline single-player support across all 18 maps and 6 gamemodes.
  - Multi-tier AI behaviors: **Rookie**, **Soldier**, and **Cyborg**.
  - Bots employ full 3D gravity physics, pathfinding, weapon cycling, and team balancing.

---

## 🛠️ Development & Standalone Build

### Local Development Server
```powershell
# Install Node dependencies (if applicable)
npm install

# Start local static server
npx serve public -l 3000
```
Open `http://localhost:3000` in your browser.

### Compiling Standalone Single-File Bundle
```powershell
node build.js
```
This automatically bundles `public/index.html`, `public/css/style.css`, and `public/js/game.js` into a standalone, portable HTML file: **`FortniteLite_Standalone.html`**.

---

## 📜 License & Credits
Developed with ❤️ by **Suboycode1234** & the CyberFort Community.  
Built using Three.js, Cannon.js, PeerJS, and modern WebGL2 technologies.
