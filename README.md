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
- **Pristine Visual Clarity & Elimination of Temporal / FSR Noise:**
  - Strictly gated AMD FidelityFX™ RCAS sharpening to only execute when FSR spatial upsampling is actively engaged (`gameSettings.fsrMode !== 'off'`). When running at native resolution, sharpening is bypassed entirely, eliminating all high-frequency pixel grain, noise speckling, and edge halo artifacts.
  - Zero smearing, zero inverted viewport ghosting over weapons and avatars, and zero pixel crawling on silhouette borders.
- **Reinhard-Jodie HDR Tone Mapping (Zero Bleaching & Vibrant Chrominance):**
  - Upgraded to the **Reinhard-Jodie** tone mapping operator, which calculates luminance-weighted color blending to preserve full chrominance and saturation in highlights.
  - Completely eliminates the chalky, washed-out bleached appearance under bright sunlight that previously afflicted Khronos PBR Neutral and ACES highlights.
  - Calibrated directional sunlight and ambient illumination for rich, deep contrast, lush foliage greens, and crystalline water glints.
- **High-Threshold Silky 16-Bit Half-Float Bloom (`threshold: 0.92`):**
  - Precision 16-bit floating-point bloom buffer (`THREE.HalfFloatType`) with an elevated `0.92` threshold and subtle `0.22` strength.
  - Ordinary diffuse geometry (grey concrete towers, green foliage leaves, player skins, sky) remains 100% pin-sharp and clean without muddy halos. Only intense laser bolts, neon signage, muzzle flashes, and emissive cores produce an ethereal optical glow.
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

### 🌲 Procedural High-Poly Environmental Assets, Fortifications & Secret Sanctuaries
- **Hollow Walkable Monolith & Cyber Towers (`addHollowTower` / `addGreyTower`):**
  - **Walkable Multi-Story Interiors & Open Rooftop Hatchways:** Both Verdant Landscape brutalist monoliths and Classic Cyber towers feature open, walkable hollow interiors spanning 4 full levels. Wide 30-degree interior ramps with anti-slip treads connect every floor. The rooftop deck features an open stairwell hatchway with safety railings, ensuring players can freely run straight out onto the top roof parapet without any ceiling obstruction.
  - **Central Ground Floor Express Core Lift:** Stepping onto the central ground pad instantly catapults players straight through the tower's core up to the rooftop battlement in seconds.
  - **High Sniper Roost & Eagle's Nest Pinnacle:** Rooftop elevator jump-pads launch players onto the elevated **Eagle's Nest** (`y = height + 14`) with a panoramic 360° view, defensive blast canopy, and flashing beacon needle.
  - **Tactical Shoot Holes & Murder Slits:** Defensive perimeter walls on every floor feature recessed tactical embrasures and narrow murder slits at chest height, providing superior firing angles onto moats and courtyards while protecting occupants from enemy fire.
  - **Concealed Secret Entrance to Isolated Ghost Sniper Sanctuary:**
    - Hidden behind hanging ivy vines or reinforced cyber alcoves lies a secret infiltration portal.
    - Stepping into the portal warps the player into a completely **Isolated Ghost Sniper Sanctuary** suspended high in the clouds (`y = towerHeight + 28`, offset by 48m).
    - **Completely Unreachable from Outside:** No ground ladders, ramps, or exterior stairs connect to it; only the player who finds the secret portal can access it.
    - Equipped with **360-degree murder slits**, a transparent glass observation floor, an exclusive **Ghost Sniper Arsenal** (+150 coins), and a return conduit back to the arena floor.

- **Physical Dug-Out Water Moats & Reflective Crystal Waterways (`addMoat` & `addMoatWater`):**
  - **Excavated Physical Trenches & Lake Dugouts:** Authentic physical moats excavated 6 to 12 units below ground level. Features solid underwater bed collision (`y = -depth`), perimeter retaining embankment walls, and stone bridges for tactical crossing.
  - **Reflective Sparkling Water with Zero Grid Lines:** Eliminating artificial crosshatch grid lines, the water utilizes organic circular caustics, star glints, and dynamic procedural normal maps (`roughness: 0.08`, `metalness: 0.52`, `opacity: 0.65`). The surface dynamically mirrors sunlight, neon beams, and towering structures.

- **🏆 Riddled with Easter Eggs & Secret Spots across All 12 Maps:**
  - Every single map is loaded with secret collectibles, hidden portals, and easter eggs:
    - **Legendary Golden Ducks (500 Coins):** Perched at extreme apexes (Spire needles, Clocktower peaks, Skybridge crowns, and Hill pinnacles).
    - **Overclocked Matrix Glitch Nodes (250-350 Coins):** Floating wireframe nodes tucked under ramps, inside granite boulder clusters, and throughout hedge mazes.
    - **Luminous Cyber Crystals (250-400 Coins):** Submerged deep within riverbeds and subterranean coolant trenches — dive down to collect!
    - **Ancient Prototype Relics (300-500 Coins):** Stashed inside Isolated Sniper Sanctuaries, bastion vaults, and mountain overlooks.
  - Features real-time distance collection checks, celebratory 4-tone synth arpeggio fanfares, automatic profile persistence, and server broadcast logs.
  - Hidden warp conduits linking riverbeds directly to skybridges, flanks, and rooftops!

---

## 🌊 Interactive Physics, 3D Swimming & Combat Systems

- **True 3D Pitch-Directed Deep-Water Swimming Mechanics:**
  - **Submersion Detection & Fluid Buoyancy:** When entering water moats or deep lakes, the physics engine dynamically applies an upward buoyant force (`playerBody.mass * 62.0`) to balance gravity, keeping swimmers naturally buoyant near the surface.
  - **Pitch-Directed 3D Swimming:** Pitch your camera up or down while pressing **W** to swim in 3D space (`look3D`) — look down to dive toward underwater grottos and relics; look up to surface effortlessly.
  - **Vertical Swim & Surface Breach Vaulting:** Press **Space** to swim rapidly upward (`+1.4` impulse). When reaching the surface, pressing **Space** triggers an explosive surface breach leap (`velocity.y = 22.0`, forward boost `12.0`), allowing players to vault straight out of moats and onto retaining walls without getting trapped.
  - **Dive Controls:** Press **C** or **Shift** to dive rapidly downward toward sunken secrets.
  - **Hydrodynamic Drag & Underwater VFX:** Fluid damping smooths horizontal velocity while procedural rising air bubbles, expanding splash rings, and an on-screen **"🏊 SWIMMING"** HUD badge activate automatically.
- **Dynamic Undulating Water Waves:**
  - Water planes animate sinusoidal undulating vertices in real-time (`geo.computeVertexNormals()`), creating dynamic liquid ripples that refract and mirror the world.
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
  - Dynamic map boundary and barrier sizing prevents players and bots from being flung into the void.

---

## 🕹️ Controls & Keybinds

| Key / Control | Action |
|:---:|:---|
| **W, A, S, D** | Walk / Strafe Movement |
| **Shift** | Tactical Sprint |
| **Space** | Jump (Double Jump supported) / **Surface (Swim Up)** |
| **Ctrl / C** | Slide / Crouch / **Dive (Swim Down)** |
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
