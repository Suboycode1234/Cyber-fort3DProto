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

### 💎 Next-Gen Post-Processing & Visual Clarity Overhaul
- **Pristine Visual Clarity & Elimination of Temporal Noise:**
  - Completely eliminated unaccumulated screen-space Monte Carlo noise jitter and fake Sobel edge-darkening filters, restoring razor-sharp geometry silhouettes, crisp character models, and clean competitive visibility.
  - Zero smearing, zero inverted viewport ghosting over weapons and avatars, and zero pixel crawling on silhouette borders.
- **Official Khronos PBR Neutral HDR Tone Mapping (Zero Bleaching):**
  - Upgraded to the official 3D Commerce Khronos PBR Neutral tone mapper, ensuring 100% true color saturation, accurate hue angles, and natural highlight roll-off.
  - Completely eliminates the chalky, washed-out bleached look caused by legacy per-channel ACES clipping.
  - Selectable tone mapping engines: **Khronos PBR Neutral (Recommended)**, **Vibrant Filmic**, **ACES Classic**, and **Off (Raw HDR)**.
- **High-Threshold Silky 16-Bit Half-Float Bloom (`threshold: 0.92`):**
  - Precision 16-bit floating-point bloom buffer (`THREE.HalfFloatType`) with an elevated `0.92` threshold and subtle `0.22` strength.
  - Ordinary diffuse geometry (grey concrete towers, green foliage leaves, player skins, sky) remains 100% pin-sharp and clean without muddy halos. Only intense laser bolts, neon signage, muzzle flashes, and emissive cores produce an ethereal optical glow.
- **AMD FidelityFX™ Super Resolution (FSR 1.0) & RCAS Sharpening:**
  - Robust Contrast-Adaptive Sharpening (RCAS) delivers pin-sharp textures and foliage leaves without ringing or halo artifacts.
  - Optional EASU spatial upsampling provides up to **2x-3x frame rate boosts** on integrated GPUs and laptops.
- **Hardware Detection & Auto-Optimization Profiles:**
  - Auto-detects dedicated gaming GPUs vs. integrated 4th-Gen Intel HD 4600 / i5-4590 hardware.
  - Auto-migrates legacy settings to the **Cinematic Clarity** profile for instant 60 FPS competitive play with zero visual degradation.

---

## 🗺️ 2 Maps Per Gamemode (Original Classic vs. Verdant Landscape)

Every gamemode in CyberFort features **exactly 2 dedicated, handcrafted maps** selectable by hosts and offline bot matches:
- **Map 1: Original (Classic Arena):** The beloved classic arena layout designed for pure competitive speed, vertical jump pads, and laser gunplay.
- **Map 2: Verdant Landscape (Grey Towers & Greenery):** A showcase natural landscape featuring architectural brutalist monolithic grey towers, multi-cluster high-poly 3D trees, lush foliage bushes, weathered granite boulders, and reflective animated water rivers & lakes.

```
┌─────────────────┬──────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Gamemode        │ Map Option                               │ Architectural & Environmental Features                      │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Free For All    │ Map 1: Classic Arena (Original)          │ Neon spire, ascending spiral platforms & corner pylons      │
│                 │ Map 2: Verdant Citadel (Landscape)       │ Central island citadel tower, river gorge, bridges & forest │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Team Deathmatch │ Map 1: Classic Outpost (Original)        │ Red & Blue industrial battle stations across central spire  │
│                 │ Map 2: Verdant Divide (Landscape)        │ Titan Red & Blue Grey Monoliths, canyon river & skybridge   │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Capture Flag    │ Map 1: Classic Bastion (Original)        │ Symmetrical fortress bases with elevated flag daises        │
│                 │ Map 2: Verdant Fortress (Landscape)      │ Red & Blue Monolith bases, multi-lane forest & river flanks │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ King of Hill    │ Map 1: Classic Hill (Original)           │ Elevated temple dais with 4 yellow access ramps             │
│                 │ Map 2: Verdant Sanctuary (Landscape)     │ Raised stone & glass hill dais in a reflecting crystal lake │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Gun Game        │ Map 1: Classic Docks (Original)          │ Fast-paced neon arena with 30 tactical cover blocks         │
│                 │ Map 2: Verdant Terraces (Landscape)      │ Stepped botanical garden terraces, hedge mazes & clocktower │
├─────────────────┼──────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Zombies         │ Map 1: Classic Asylum (Original)         │ Central defensive asylum structure & perimeter ruins        │
│                 │ Map 2: Overgrown Citadel (Landscape)     │ Misty pine forest, abandoned grey bunker & survivor catwalks│
└─────────────────┴──────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

### 🌲 Procedural High-Poly Environmental Assets
- **Architectural Grey Monolith Towers (`addGreyTower`):** Brutalist concrete & titanium construction with open ground breezeways, wraparound cantilevered sniper balconies with metallic railings, access ramps, rooftop parapets with crenellations, communications spires with blinking warning beacons, and creeping green ivy vines.
- **High-Poly 3D Trees (`addTree`):** Bark cylinder trunks with root flares, solid Cannon.js physics cover collision, and multi-cluster organic canopies (`IcosahedronGeometry` / `DodecahedronGeometry`):
  - *Deciduous Oaks:* 6 interconnected high-poly foliage domes in rich emerald, forest green, and olive hues.
  - *Alpine Pines:* 4-tier layered conifer skirts with deep pine needle tones.
  - *Weeping Willows:* Drooping graceful foliage masses lining the riverbanks and lake shores.
- **Granite Boulders & Foliage Bushes (`addRock` & `addBush`):** Natural faceted stone outcroppings providing tactical shooting cover and lush hedge clusters.
- **Animated Water Reflections (`addWater`):** Real-time animated wave vertex displacement and procedural ripple normal maps reflecting towers and sky.

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
