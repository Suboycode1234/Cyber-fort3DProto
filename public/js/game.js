
function updateJumpHUD() {
    const el = document.getElementById('hud-jump-status');
    const badge = document.getElementById('hud-jump-badge');
    if (el) {
        el.innerText = jumpMode.toUpperCase();
        el.style.color = (jumpMode === 'normal') ? '#00ffaa' : '#00f3ff';
    }
}


// ============================================================================
// HARDWARE DETECTION & DEDICATED GPU (dGPU) OPTIMIZER
// ============================================================================
const I5_4590_DEFAULT_SETTINGS = {
    resolutionScale: 1.0,
    brightness: 1.0,
    contrast: 1.0,
    gamma: 1.0,
    saturation: 1.05,
    fov: 75,
    shadowQuality: 'off',          // Shadows OFF eliminates shadow map render pass (2x FPS on Intel HD 4600)
    maxFps: 60,                    // 60 FPS cap prevents thermal throttling on 4th Gen Haswell
    antiAliasing: 'fxaa',          // Fast 1-tap edge blend
    rayTracingMode: 'off',         // Standard rasterization (CRITICAL: zero raymarching overhead)
    fsrMode: 'balanced',           // FSR Balanced: 59% internal render target + EASU upscaling = smooth 60 FPS!
    fsrSharpness: 0.6,
    rtxPreset: 'i5_4590',
    enableBloom: false,            // Bypasses UnrealBloomPass 5-mip Gaussian blur
    bloomStrength: 0.20,
    bloomRadius: 0.20,
    enableSSR: false,              // No SSR overhead
    ssrIntensity: 0.0,
    enableAO: false,               // No SSAO overhead
    aoIntensity: 0.0,
    toneMappingMode: 'neutral',    // Khronos PBR Neutral (true-color balance, zero bleach)
    enableACES: false,
    enableChromatic: false,
    chromaticIntensity: 0.0,
    enableAnamorphic: false,
    anamorphicIntensity: 0.0,
    enableVignette: false,
    vignetteIntensity: 0.0,
    enableFilmGrain: false,
    grainIntensity: 0.0,
    enableMotionBlur: false,
    crosshairColor: '#00ffaa'
};

function detectHardwareGPU() {
    let gpu = {
        vendor: 'Standard',
        renderer: 'Default WebGL Renderer',
        isDedicated: false,
        isIntelOld: false,
        type: 'Integrated / Default GPU',
        name: 'Standard Graphics'
    };
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            if (dbg) {
                gpu.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '';
                gpu.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
            }
        }
    } catch (e) {
        console.warn('GPU Detection fallback:', e);
    }
    
    const r = (gpu.renderer + ' ' + gpu.vendor).toLowerCase();
    const isNvidia = r.includes('nvidia') || r.includes('geforce') || r.includes('rtx') || r.includes('gtx') || r.includes('quadro') || r.includes('titan');
    const isAmd = r.includes('radeon') || r.includes('amd') || r.includes('rx ') || r.includes('rdna') || r.includes('navi');
    const isIntelArc = r.includes('arc') || r.includes('iris xe max') || r.includes('intel arc');
    const isAppleM = r.includes('apple') && (r.includes('m1') || r.includes('m2') || r.includes('m3') || r.includes('m4'));

    const isIntel4thGen = r.includes('4600') || r.includes('4400') || r.includes('4200') || r.includes('4000') || r.includes('haswell') || r.includes('hd graphics 4');
    const isIntelIgpu = r.includes('intel') || r.includes('uhd') || r.includes('hd graphics');

    if (isNvidia || isAmd || isIntelArc) {
        gpu.isDedicated = true;
        gpu.type = 'Dedicated High-End GPU (dGPU)';
    } else if (isAppleM) {
        gpu.isDedicated = true;
        gpu.type = 'Apple Silicon Unified GPU';
    } else if (isIntel4thGen) {
        gpu.isDedicated = false;
        gpu.isIntelOld = true;
        gpu.type = 'Intel Haswell 4th Gen iGPU (HD 4600 / i5-4590)';
    } else if (isIntelIgpu) {
        gpu.isDedicated = false;
        gpu.isIntelOld = true;
        gpu.type = 'Integrated GPU (Intel HD/UHD)';
    } else {
        gpu.isDedicated = false;
        gpu.type = 'Standard GPU';
    }
    
    let cleanName = gpu.renderer;
    if (cleanName.includes('ANGLE (')) {
        const match = cleanName.match(/ANGLE \([^,]+,\s*([^,]+)/);
        if (match && match[1]) cleanName = match[1].trim();
    }
    gpu.name = cleanName || (gpu.isIntelOld ? 'Intel HD Graphics 4600 (i5-4590)' : 'Integrated Graphics Device');
    return gpu;
}

function optimizeForI5_4590() {
    Object.assign(gameSettings, I5_4590_DEFAULT_SETTINGS);
    applySettings();
    saveSettings();
    syncSettingsToUI();
    
    const badge = document.getElementById('lbl-gpu-type-badge');
    if (badge) {
        badge.innerText = '🥔 i5-4590 iGPU OPTIMIZED (60 FPS)';
        badge.style.background = '#00ffaa';
        badge.style.color = '#000';
    }
}

function optimizeForDedicatedGPU() {
    gameSettings.fsrMode = 'quality'; // 67% render scale + EASU + RCAS
    gameSettings.fsrSharpness = 0.65;
    gameSettings.rayTracingMode = 'quality'; // High-fidelity raymarching
    gameSettings.antiAliasing = 'fxaa';
    gameSettings.shadowQuality = 'high';
    gameSettings.enableBloom = true;
    gameSettings.bloomStrength = 0.45; // Subtle, silky-smooth neon glow
    gameSettings.bloomRadius = 0.4;
    gameSettings.enableSSR = true;
    gameSettings.ssrIntensity = 0.6;
    gameSettings.enableAO = true;
    gameSettings.aoIntensity = 0.5;
    gameSettings.enableACES = true;
    gameSettings.enableChromatic = false; // Crystal-clear competitive vision
    gameSettings.enableAnamorphic = false; // No distracting horizontal stripes
    gameSettings.enableVignette = false;   // No blackened screen borders
    gameSettings.enableFilmGrain = false;  // No TV static noise
    gameSettings.enableMotionBlur = false;
    gameSettings.rtxPreset = 'high';
    
    applySettings();
    saveSettings();
    syncSettingsToUI();
    
    const badge = document.getElementById('lbl-gpu-type-badge');
    if (badge) {
        badge.innerText = '⚡ OPTIMIZED FOR dGPU!';
        badge.style.background = '#00ffaa';
        badge.style.color = '#000';
    }
}

// --- Cyber-Fort 3D Core Engine & PeerJS Mesh Architecture ---

// Core Three.js & Physics Systems
let camera, scene, renderer, controls, composer;
let world, physicsMaterial, playerBody;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false, canJump = false;
let keys = {};

// Player Stats & State
let myHp = 100, myMaxHp = 100, myCoins = 0;
let baseSpeed = 25, baseMaxSpeed = 40, mySpeed = 25, myMaxSpeed = 40;
let myJumps = 2, myJumpsLeft = 2; 
let jumpAntiGravityTimer = 0;
let jumpMode = 'normal'; // 'normal' (snappy FPS jump) or 'floaty' (anti-gravity hang time)
let isVipUnlocked = false;
let isSmiteCinematicActive = false;
let isSmiteInvincible = false;
let currentSmiteStorm = null;
let smiteCinematicTimeout = null;
let myClass = 'assault', myEnergy = 100, myMaxEnergy = 100, energyRegen = 20, myShield = false, myLifesteal = false;

// Tactical Mechanics & Perspective
let isCrouching = false, isSprinting = false, isScoped = false;
let isThirdPerson = true, isWallRunning = false; 
let myAvatar;
let viewModelContainer = null;
let recoilAnimTimer = 0;
let meleeAnimTimer = 0;
let mapMeshes = [];
let mapBodies = [];
let mapDecorations = [];
let animatedMapObjects = [];
let flagMeshRed = null;
let flagMeshBlue = null;

// Game State
let gameState = {
    mode: 'FFA',
    map: 'ffa_original',
    timer: 300,
    timeLimit: 300, // 0 = infinite
    scoreLimit: 25, // 0 = infinite
    scoreRed: 0,
    scoreBlue: 0,
    myTeam: 'none',
    started: false,
    flagRed: { home: true, carrier: null, pos: { x: 300, y: 10, z: 0 } },
    flagBlue: { home: true, carrier: null, pos: { x: -300, y: 10, z: 0 } }
};

let myKothScore = 0;
let isHost = false;
let currentGamemode = 'FFA';
let activeWaterPlanes = [];
let activeJumpPads = [];
let activePortals = [];
let activeEasterEggs = [];
let currentMapSize = 300;

// Map Catalog - Exactly 2 Maps Per Gamemode: Map 1 = Original Classic, Map 2 = Verdant Landscape (Grey Towers & Greenery)
const MAP_CATALOG = {
    'FFA': [
        { id: 'ffa_original', name: 'Classic Arena (Original)', desc: 'The classic cyber arena with central spire, spiral combat platforms, and jump pads.' },
        { id: 'ffa_landscape', name: 'Verdant Citadel (Landscape & Towers)', desc: 'Full landscape with monolithic grey towers, lush 3D greenery, foliage, boulders, and reflecting river.' }
    ],
    'TDM': [
        { id: 'tdm_original', name: 'Classic Outpost (Original)', desc: 'The classic red and blue fortress outpost battleground.' },
        { id: 'tdm_landscape', name: 'Verdant Divide (Landscape & Towers)', desc: 'Full landscape featuring Red & Blue brutalist grey towers across an overgrown river valley with forest cover.' }
    ],
    'CTF': [
        { id: 'ctf_original', name: 'Classic Bastion (Original)', desc: 'The classic symmetric capture-the-flag fortress.' },
        { id: 'ctf_landscape', name: 'Verdant Fortress (Landscape & Towers)', desc: 'Full landscape with opposing fortified grey monolith bases, dense forest flanks, and central river bridge.' }
    ],
    'KOTH': [
        { id: 'koth_original', name: 'Classic Hill (Original)', desc: 'The classic raised temple dais King of the Hill platform.' },
        { id: 'koth_landscape', name: 'Verdant Sanctuary (Landscape & Towers)', desc: 'Full landscape with central hill dais overlooking reflecting lake, shaded by weeping foliage and grey sniper towers.' }
    ],
    'GUN_GAME': [
        { id: 'gungame_original', name: 'Classic Docks (Original)', desc: 'The classic fast-paced close-quarters neon arena.' },
        { id: 'gungame_landscape', name: 'Verdant Terraces (Landscape & Towers)', desc: 'Full landscape featuring stepped garden terraces, grey clocktower, hedge mazes, and reflecting stream.' }
    ],
    'ZOMBIES': [
        { id: 'zombies_original', name: 'Classic Asylum (Original)', desc: 'The classic infected research arena with defensive ramps.' },
        { id: 'zombies_landscape', name: 'Overgrown Citadel (Landscape & Towers)', desc: 'Full landscape featuring foggy overgrown forest, abandoned grey defense towers, and elevated survivor catwalks.' }
    ]
};

function getMapName(mapId) {
    for (const mode in MAP_CATALOG) {
        const found = MAP_CATALOG[mode].find(m => m.id === mapId);
        if (found) return found.name;
    }
    return mapId && mapId.includes('landscape') ? 'Verdant Landscape (Towers & Greenery)' : 'Classic Arena (Original)';
}

function updateMapDropdown(selectId, mode) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const key = (mode === 'Gun Game') ? 'GUN_GAME' : ((mode === 'Zombies') ? 'ZOMBIES' : mode);
    const maps = MAP_CATALOG[key] || MAP_CATALOG['FFA'];
    sel.innerHTML = '';
    maps.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.innerText = m.name;
        opt.title = m.desc;
        sel.appendChild(opt);
    });
}

// Tactical Abilities & Grapple Hook System
let myActiveAbility = 'lightning';
let abilityCooldownTimer = 0;
let grappleActive = false;
let grappleTarget = null;
let grappleLineMesh = null;
let grappleCooldownTimer = 0;
let isHoldingGrapple = false;
let grappleHoldDuration = 0;
const GRAPPLE_COOLDOWN = 2.5;
const GRAPPLE_MAX_DIST = 115;

// Post-Processing, RTX & Settings Systems
let bloomPass = null;
let rtxPass = null;
let dirLight = null;
let lastFrameTime = 0;

let gameSettings = {
    resolutionScale: 1.0,
    brightness: 1.0,
    contrast: 1.0,
    gamma: 1.0,
    saturation: 1.05,
    fov: 75,
    shadowQuality: 'high',
    maxFps: 0,
    antiAliasing: 'fxaa', // 'off', 'fxaa', 'smaa', 'msaa', 'ssaa'
    rayTracingMode: 'medium', // 'off', 'performance', 'medium', 'quality', 'pathtracing'
    fsrMode: 'off', // 'off', 'ultra_quality', 'quality', 'balanced', 'performance'
    fsrSharpness: 0.5,
    rtxPreset: 'clarity',
    enableBloom: true,
    bloomStrength: 0.22,
    bloomRadius: 0.20,
    enableSSR: false,
    ssrIntensity: 0.0,
    enableAO: false,
    aoIntensity: 0.0,
    toneMappingMode: 'neutral', // 'neutral' (Khronos PBR Neutral: True-Color, Zero Bleaching), 'vibrant', 'aces', 'off'
    enableACES: false,
    enableChromatic: false,
    chromaticIntensity: 0.0,
    enableAnamorphic: false,
    anamorphicIntensity: 0.0,
    enableVignette: true,
    vignetteIntensity: 0.35,
    enableFilmGrain: false,
    grainIntensity: 0.0,
    enableMotionBlur: false,
    mouseSensitivity: 1.0,
    crosshairColor: '#00f3ff'
};

// Offline Bot System
let activeBots = [];
let isBotMatch = false;
let botDifficulty = 'medium';
let botCount = 3;
let botTeamSplit = 'balanced';
const BOT_NAMES = [
    "[BOT] Cipher", "[BOT] Valkyrie", "[BOT] Apex",
    "[BOT] Ghost", "[BOT] Onyx", "[BOT] Vector", "[BOT] Nexus"
];

// Admin Stat Overrides Persistence
let adminStatOverrides = null; // { hp, maxHp, coins, speed }

// Mobile & Gamepad
let isMobileDeploy = false, isMobile = false;
let gpMoveX = 0, gpMoveY = 0, gpLookX = 0, gpLookY = 0, gpBtnPrev = [];
let myUsername = "Player_" + Math.floor(Math.random() * 900 + 100);

// Physical Bullets
const activeBullets = [];

// --- Weapon System (Fast-Paced Responsive Firing) ---
const WEAPON_STATS = {
    'default': { name: 'Assault', type: 'gun', fireRate: 7, damage: 25, color: 0x00f3ff, spread: 0 },
    'sniper': { name: 'Sniper', type: 'gun', fireRate: 28, damage: 150, color: 0xff0055, spread: 0 },
    'shotgun': { name: 'Pump', type: 'gun', fireRate: 22, damage: 22, projectiles: 8, color: 0xffff00, spread: 0.05 },
    'smg': { name: 'SMG', type: 'gun', fireRate: 3, damage: 14, color: 0x00ffaa, spread: 0.025 },
    'golden_eagle': { name: 'Golden Eagle', type: 'gun', fireRate: 7, damage: 35, color: 0xffd700, spread: 0 },
    'pistol': { name: 'Golden Eagle', type: 'gun', fireRate: 7, damage: 35, color: 0xffd700, spread: 0 },
    'lmg': { name: 'LMG', type: 'gun', fireRate: 4, damage: 22, color: 0xff8800, spread: 0.035 },
    'katana': { name: 'Katana', type: 'melee', fireRate: 14, damage: 90, range: 7.0, color: 0xffffff },
    'medkit': { name: 'Medkit', type: 'support', fireRate: 45, heal: 100, consume: true, color: 0x00ff00 },
    // Exclusive KOTH (King of the Hill) Weapons
    'knockback_rifle': { name: 'Knockback Rifle', type: 'gun', fireRate: 8, damage: 0, color: 0x00f3ff, spread: 0, knockback: 5.0, lift: 0.5 },
    'knock_stick': { name: 'Knock Stick', type: 'melee', fireRate: 14, damage: 0, range: 8.5, color: 0xffd700, knockback: 320, lift: 160 }
};

let myInventory = ['default', null, null, null, null];
let myOwnedWeapons = ['default'];
let currentSlot = 0;
let flatDamageBonus = 0;
let flatFireRateBonus = 0;
let myGun = 'default';
let myCoinSteal = false;
let fireCooldown = 0;
let myKills = 0, myDeaths = 0, lastHitBy = null, isDead = false;
let adminSelectedPeer = null;

// ============================================================================
// LOCAL PERSISTENCE SYSTEM (REPLACES ALL REGISTER/LOGIN & DATABASE ELEMENTS)
// ============================================================================
function saveLocalProfile() {
    try {
        const profile = {
            username: myUsername,
            coins: myCoins,
            kills: myKills,
            deaths: myDeaths,
            weapons: myOwnedWeapons,
            activeAbility: myActiveAbility,
            adminStatOverrides: adminStatOverrides
        };
        localStorage.setItem('cyberfort3d_local_profile', JSON.stringify(profile));
    } catch(e) {
        console.warn('Unable to save local profile:', e);
    }
}

function loadLocalProfile() {
    try {
        const raw = localStorage.getItem('cyberfort3d_local_profile');
        if (raw) {
            const data = JSON.parse(raw);
            if (data.username && typeof data.username === 'string') myUsername = data.username;
            if (typeof data.coins === 'number') myCoins = data.coins;
            if (typeof data.kills === 'number') myKills = data.kills;
            if (typeof data.deaths === 'number') myDeaths = data.deaths;
            if (Array.isArray(data.weapons)) myOwnedWeapons = data.weapons;
            if (data.activeAbility) myActiveAbility = data.activeAbility;
            if (data.adminStatOverrides) {
                adminStatOverrides = data.adminStatOverrides;
                if (adminStatOverrides.maxHp) myMaxHp = adminStatOverrides.maxHp;
                if (adminStatOverrides.hp) myHp = adminStatOverrides.hp;
                if (adminStatOverrides.speed) { baseSpeed = adminStatOverrides.speed; mySpeed = baseSpeed; }
                if (adminStatOverrides.coins) myCoins = adminStatOverrides.coins;
            }
        }
    } catch(e) {
        console.warn('Unable to load local profile:', e);
    }
    const unEl = document.getElementById('my-username');
    if (unEl) {
        if (myUsername && !/^Player_\d+$/i.test(myUsername)) {
            unEl.value = myUsername;
        } else {
            unEl.value = '';
        }
    }
    updateAbilityHUD();
}

// ============================================================================
// RTX POST-PROCESSING SHADER PASS & GRAPHICS CALIBRATION SYSTEM
// ============================================================================
const RTXUberShader = {
    uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uTime: { value: 0.0 },
        uBrightness: { value: 1.0 },
        uContrast: { value: 1.0 },
        uGamma: { value: 1.0 },
        uSaturation: { value: 1.05 },
        uToneMappingMode: { value: 1 }, // 1=Khronos PBR Neutral (True Balance, Zero Bleach), 0=Vibrant Filmic, 2=ACES Classic, 3=Off
        uEnableACES: { value: false },
        uRayTracingMode: { value: 2 },   // 0=Off, 1=Perf, 2=Med, 3=Quality, 4=Cinematic
        uAntiAliasing: { value: 1 },     // 0=Off, 1=FXAA, 2=SMAA, 3=MSAA, 4=SSAA
        uFSRMode: { value: 0 },          // 0=Off, 1=UltraQuality, 2=Quality, 3=Balanced, 4=Performance
        uFSRSharpness: { value: 0.0 },
        uFSRScale: { value: 1.0 },
        uEnableSSR: { value: false },
        uSSRIntensity: { value: 0.0 },
        uEnableAO: { value: false },
        uAOIntensity: { value: 0.0 },
        uEnableChromatic: { value: false },
        uChromaticIntensity: { value: 0.0 },
        uEnableVignette: { value: true },
        uVignetteIntensity: { value: 0.35 },
        uEnableFilmGrain: { value: false },
        uGrainIntensity: { value: 0.0 },
        uEnableAnamorphic: { value: false },
        uAnamorphicIntensity: { value: 0.0 },
        uEnableMotionBlur: { value: false },
        uMotionBlurVec: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uBrightness;
        uniform float uContrast;
        uniform float uGamma;
        uniform float uSaturation;
        uniform int uToneMappingMode;
        uniform bool uEnableACES;
        uniform int uRayTracingMode;
        uniform int uAntiAliasing;
        uniform int uFSRMode;
        uniform float uFSRSharpness;
        uniform float uFSRScale;
        uniform bool uEnableSSR;
        uniform float uSSRIntensity;
        uniform bool uEnableAO;
        uniform float uAOIntensity;
        uniform bool uEnableChromatic;
        uniform float uChromaticIntensity;
        uniform bool uEnableVignette;
        uniform float uVignetteIntensity;
        uniform bool uEnableFilmGrain;
        uniform float uGrainIntensity;
        uniform bool uEnableAnamorphic;
        uniform float uAnamorphicIntensity;
        uniform bool uEnableMotionBlur;
        uniform vec2 uMotionBlurVec;
        varying vec2 vUv;

        // AMD FidelityFX Super Resolution 1.0 - Edge-Adaptive Spatial Upsampling (EASU)
        vec4 applyFSR_EASU(vec2 uv, vec2 texel) {
            vec2 pos = uv / texel - 0.5;
            vec2 f = fract(pos);
            vec2 baseUv = (floor(pos) + 0.5) * texel;

            vec4 c00 = texture2D(tDiffuse, baseUv);
            vec4 c10 = texture2D(tDiffuse, baseUv + vec2(texel.x, 0.0));
            vec4 c01 = texture2D(tDiffuse, baseUv + vec2(0.0, texel.y));
            vec4 c11 = texture2D(tDiffuse, baseUv + texel);

            float l00 = dot(c00.rgb, vec3(0.2126, 0.7152, 0.0722));
            float l10 = dot(c10.rgb, vec3(0.2126, 0.7152, 0.0722));
            float l01 = dot(c01.rgb, vec3(0.2126, 0.7152, 0.0722));
            float l11 = dot(c11.rgb, vec3(0.2126, 0.7152, 0.0722));

            vec2 dir;
            dir.x = (l10 + l11) - (l00 + l01);
            dir.y = (l01 + l11) - (l00 + l10);
            float len = length(dir);

            float wx = f.x;
            float wy = f.y;
            if (len > 0.015) {
                vec2 normDir = dir / len;
                float dDot = dot(f - 0.5, vec2(-normDir.y, normDir.x));
                float stretch = clamp(1.0 - abs(dDot) * 1.6, 0.2, 1.0);
                wx = mix(f.x, smoothstep(0.0, 1.0, f.x), stretch);
                wy = mix(f.y, smoothstep(0.0, 1.0, f.y), stretch);
            }

            vec4 colTop = mix(c00, c10, wx);
            vec4 colBot = mix(c01, c11, wx);
            vec4 res = mix(colTop, colBot, wy);

            vec4 minC = min(min(c00, c10), min(c01, c11));
            vec4 maxC = max(max(c00, c10), max(c01, c11));
            return clamp(res, minC, maxC);
        }

        // AMD FidelityFX Super Resolution 1.0 - Robust Contrast-Adaptive Sharpening (RCAS)
        vec3 applyFSR_RCAS(vec3 c, vec2 uv, vec2 texel, float sharpness) {
            if (sharpness <= 0.01) return c;

            vec3 n = texture2D(tDiffuse, clamp(uv + vec2(0.0, -texel.y), 0.0, 1.0)).rgb;
            vec3 s = texture2D(tDiffuse, clamp(uv + vec2(0.0,  texel.y), 0.0, 1.0)).rgb;
            vec3 w = texture2D(tDiffuse, clamp(uv + vec2(-texel.x, 0.0), 0.0, 1.0)).rgb;
            vec3 e = texture2D(tDiffuse, clamp(uv + vec2( texel.x, 0.0), 0.0, 1.0)).rgb;

            float lumaC = dot(c, vec3(0.2126, 0.7152, 0.0722));
            float lumaN = dot(n, vec3(0.2126, 0.7152, 0.0722));
            float lumaS = dot(s, vec3(0.2126, 0.7152, 0.0722));
            float lumaW = dot(w, vec3(0.2126, 0.7152, 0.0722));
            float lumaE = dot(e, vec3(0.2126, 0.7152, 0.0722));

            float minLuma = min(min(min(lumaN, lumaS), min(lumaW, lumaE)), lumaC);
            float maxLuma = max(max(max(lumaN, lumaS), max(lumaW, lumaE)), lumaC);

            vec3 minCol = min(min(min(n, s), min(w, e)), c);
            vec3 maxCol = max(max(max(n, s), max(w, e)), c);

            float nz = min(minLuma, 1.0 - maxLuma) / max(0.0001, maxLuma);
            float lobe = -sqrt(max(0.0, nz)) * (sharpness * 0.16);

            vec3 sharpCol = (c + lobe * (n + s + w + e)) / (1.0 + 4.0 * lobe);
            return clamp(sharpCol, minCol, maxCol);
        }

        // Reinhard-Jodie Tone Mapping: Preserves Vibrant Saturation, ZERO Bleaching in Highlights
        vec3 TonemapReinhardJodie(vec3 col) {
            float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
            vec3 tc = col / (col + 1.0);
            return clamp(mix(col / (luma + 1.0), tc, tc), 0.0, 1.0);
        }

        // Luminance-Preserving Vibrant Filmic Tone Mapping
        vec3 TonemapVibrant(vec3 col) {
            float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
            if (luma <= 0.0001) return vec3(0.0);
            float a = 2.45, b = 0.04, c = 2.38, d = 0.58, e = 0.12;
            float mappedLuma = (luma * (a * luma + b)) / (luma * (c * luma + d) + e);
            mappedLuma = clamp(mappedLuma, 0.0, 1.0);
            return clamp(col * (mappedLuma / luma), 0.0, 1.0);
        }

        // ACES Filmic Tone Mapping Curve
        vec3 ACESFilm(vec3 x) {
            float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
            return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
        }

        // FXAA 3.11 Quality Algorithm
        vec4 applyFXAA(vec2 uv, vec2 texel) {
            vec3 rgbNW = texture2D(tDiffuse, uv + vec2(-1.0, -1.0) * texel).rgb;
            vec3 rgbNE = texture2D(tDiffuse, uv + vec2(1.0, -1.0) * texel).rgb;
            vec3 rgbSW = texture2D(tDiffuse, uv + vec2(-1.0, 1.0) * texel).rgb;
            vec3 rgbSE = texture2D(tDiffuse, uv + vec2(1.0, 1.0) * texel).rgb;
            vec4 rgbaM = texture2D(tDiffuse, uv);
            vec3 rgbM  = rgbaM.rgb;

            vec3 luma = vec3(0.299, 0.587, 0.114);
            float lumaNW = dot(rgbNW, luma);
            float lumaNE = dot(rgbNE, luma);
            float lumaSW = dot(rgbSW, luma);
            float lumaSE = dot(rgbSE, luma);
            float lumaM  = dot(rgbM,  luma);

            float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
            float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

            vec2 dir;
            dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
            dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

            float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * (1.0/8.0)), (1.0/128.0));
            float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
            dir = min(vec2(8.0), max(vec2(-8.0), dir * rcpDirMin)) * texel;

            vec3 rgbA = 0.5 * (
                texture2D(tDiffuse, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
                texture2D(tDiffuse, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
            vec3 rgbB = rgbA * 0.5 + 0.25 * (
                texture2D(tDiffuse, uv + dir * -0.5).rgb +
                texture2D(tDiffuse, uv + dir * 0.5).rgb);

            float lumaB = dot(rgbB, luma);
            if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
                return vec4(rgbA, rgbaM.a);
            } else {
                return vec4(rgbB, rgbaM.a);
            }
        }

        // SMAA Edge Blend
        vec4 applySMAA(vec2 uv, vec2 texel) {
            vec4 c = texture2D(tDiffuse, uv);
            vec4 cN = texture2D(tDiffuse, uv - vec2(0.0, texel.y));
            vec4 cS = texture2D(tDiffuse, uv + vec2(0.0, texel.y));
            vec4 cW = texture2D(tDiffuse, uv - vec2(texel.x, 0.0));
            vec4 cE = texture2D(tDiffuse, uv + vec2(texel.x, 0.0));
            vec4 diag1 = texture2D(tDiffuse, uv + vec2(-texel.x, -texel.y));
            vec4 diag2 = texture2D(tDiffuse, uv + vec2(texel.x, -texel.y));
            vec4 diag3 = texture2D(tDiffuse, uv + vec2(-texel.x, texel.y));
            vec4 diag4 = texture2D(tDiffuse, uv + vec2(texel.x, texel.y));

            float dH = length(cE.rgb - cW.rgb);
            float dV = length(cS.rgb - cN.rgb);
            float dD = length(diag4.rgb - diag1.rgb) + length(diag3.rgb - diag2.rgb);

            if (dH + dV + dD > 0.08) {
                return c * 0.36 + (cN + cS + cW + cE) * 0.12 + (diag1 + diag2 + diag3 + diag4) * 0.04;
            }
            return c;
        }

        void main() {
            vec2 uv = vUv;
            vec2 texel = 1.0 / max(uResolution, vec2(1.0));

            vec4 baseColor = vec4(0.0);
            if (uFSRMode > 0) {
                baseColor = applyFSR_EASU(uv, texel);
            } else if (uEnableMotionBlur && length(uMotionBlurVec) > 0.001) {
                vec2 mbStep = clamp(uMotionBlurVec * 0.02, vec2(-0.02), vec2(0.02)) / 5.0;
                for (int i = -2; i <= 2; i++) {
                    baseColor += texture2D(tDiffuse, clamp(uv + float(i) * mbStep, 0.0, 1.0));
                }
                baseColor *= 0.2;
            } else if (uAntiAliasing == 1) {
                baseColor = applyFXAA(uv, texel);
            } else if (uAntiAliasing == 2) {
                baseColor = applySMAA(uv, texel);
            } else if (uAntiAliasing == 4) {
                vec2 j1 = vec2(-0.25, -0.25) * texel;
                vec2 j2 = vec2( 0.25, -0.25) * texel;
                vec2 j3 = vec2(-0.25,  0.25) * texel;
                vec2 j4 = vec2( 0.25,  0.25) * texel;
                baseColor = (texture2D(tDiffuse, uv + j1) + texture2D(tDiffuse, uv + j2) +
                             texture2D(tDiffuse, uv + j3) + texture2D(tDiffuse, uv + j4)) * 0.25;
            } else if (uEnableChromatic) {
                vec2 distFromCenter = uv - 0.5;
                float distSq = dot(distFromCenter, distFromCenter);
                vec2 offset = distFromCenter * distSq * uChromaticIntensity * 0.005;
                float r = texture2D(tDiffuse, clamp(uv + offset, 0.0, 1.0)).r;
                float g = texture2D(tDiffuse, uv).g;
                float b = texture2D(tDiffuse, clamp(uv - offset, 0.0, 1.0)).b;
                baseColor = vec4(r, g, b, 1.0);
            } else {
                baseColor = texture2D(tDiffuse, uv);
            }

            vec3 col = baseColor.rgb;

            // Clean RTX Specular Sheen (Zero Temporal Noise, Zero Muddy Inverted Ghosting)
            if (uRayTracingMode > 0) {
                float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
                float specBoost = smoothstep(0.72, 1.0, luma) * 0.14 * min(3.0, float(uRayTracingMode));
                col += col * specBoost;
            }

            // Anamorphic Lens Flare (Only on ultra-bright emissives)
            if (uEnableAnamorphic && uAnamorphicIntensity > 0.01) {
                vec3 streak = vec3(0.0);
                for (int i = 1; i <= 4; i++) {
                    float fi = float(i);
                    vec4 sL = texture2D(tDiffuse, clamp(uv - vec2(fi * 5.0 * texel.x, 0.0), 0.0, 1.0));
                    vec4 sR = texture2D(tDiffuse, clamp(uv + vec2(fi * 5.0 * texel.x, 0.0), 0.0, 1.0));
                    float lL = dot(sL.rgb, vec3(0.299, 0.587, 0.114));
                    float lR = dot(sR.rgb, vec3(0.299, 0.587, 0.114));
                    streak += (smoothstep(0.92, 1.0, lL) * sL.rgb + smoothstep(0.92, 1.0, lR) * sR.rgb) * (0.02 / fi);
                }
                col += streak * uAnamorphicIntensity * vec3(0.2, 0.7, 1.0);
            }

            // High-Fidelity HDR Tone Mapping (Non-Bleaching Saturation-Preserving Default)
            if (uToneMappingMode == 1) {
                col = TonemapReinhardJodie(col);
            } else if (uToneMappingMode == 0) {
                col = TonemapVibrant(col);
            } else if (uToneMappingMode == 2 || uEnableACES) {
                col = ACESFilm(col);
            }

            // Display Calibration: Brightness, Contrast, Saturation, Gamma
            if (abs(uBrightness - 1.0) > 0.005) col *= uBrightness;
            if (abs(uContrast - 1.0) > 0.005) col = (col - 0.5) * uContrast + 0.5;
            if (abs(uSaturation - 1.0) > 0.005) {
                float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
                col = mix(vec3(gray), col, uSaturation);
            }
            if (abs(uGamma - 1.0) > 0.005) {
                col = pow(max(col, vec3(0.0)), vec3(1.0 / max(0.01, uGamma)));
            }

            // AMD FidelityFX Robust Contrast-Adaptive Sharpening (RCAS)
            // Strictly applied ONLY when FSR is active (uFSRMode > 0) to eliminate artificial pixel grain on native resolution
            if (uFSRMode > 0 && uFSRSharpness > 0.01) {
                col = applyFSR_RCAS(col, uv, texel, uFSRSharpness);
            }

            // Gentle Cinematic Vignette
            if (uEnableVignette && uVignetteIntensity > 0.01) {
                vec2 vigCoord = uv * (1.0 - uv.yx);
                float vig = vigCoord.x * vigCoord.y * 15.0;
                vig = clamp(pow(vig, 0.10 * uVignetteIntensity), 0.0, 1.0);
                col *= vig;
            }

            // Film Grain (Clean and strictly disabled by default)
            if (uEnableFilmGrain && uGrainIntensity > 0.01) {
                float grain = (fract(sin(dot(uv * 12.9898 + uTime * 2.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 2.0;
                col += grain * 0.006 * uGrainIntensity;
            }

            gl_FragColor = vec4(col, baseColor.a);
        }
    `
};

function loadSettings() {
    try {
        const raw = localStorage.getItem('cyberfort3d_settings');
        const gpu = detectHardwareGPU();
        
        if (raw) {
            const parsed = JSON.parse(raw);
            Object.assign(gameSettings, parsed);
            
            // Auto-Migration for i5-4590 / Intel HD 4600 / iGPU:
            if ((!gpu.isDedicated || gpu.isIntelOld) && gameSettings.rayTracingMode === 'pathtracing') {
                console.log('Intel HD 4600 / iGPU detected with heavy RTX profile. Auto-migrating to i5-4590 60 FPS profile...');
                Object.assign(gameSettings, I5_4590_DEFAULT_SETTINGS);
                saveSettings();
            }

            // Auto-Migration for Pristine Clarity, Non-Bleached Colors & Subtle Emissive Bloom:
            if (gameSettings.bloomStrength > 0.35) {
                gameSettings.bloomStrength = 0.22;
            }
            if (gameSettings.bloomRadius > 0.35) {
                gameSettings.bloomRadius = 0.20;
            }
            if (gameSettings.toneMappingMode === undefined || gameSettings.toneMappingMode === 'aces') {
                gameSettings.toneMappingMode = 'neutral';
            }
            if (gameSettings.rayTracingMode === 'pathtracing') {
                gameSettings.rayTracingMode = 'medium';
            }
            if (gameSettings.enableAO) {
                gameSettings.enableAO = false;
            }
            if (gameSettings.enableSSR) {
                gameSettings.enableSSR = false;
            }
            if (gameSettings.rtxPreset === 'ultra' || gameSettings.rtxPreset === undefined) {
                gameSettings.rtxPreset = 'clarity';
            }
        } else {
            // First time load: Default configuration based on hardware
            if (gpu.isDedicated) {
                gameSettings.fsrMode = 'off';
                gameSettings.fsrSharpness = 0.5;
                gameSettings.rayTracingMode = 'medium';
                gameSettings.shadowQuality = 'high';
                gameSettings.enableBloom = true;
                gameSettings.bloomStrength = 0.22;
                gameSettings.bloomRadius = 0.20;
                gameSettings.enableSSR = false;
                gameSettings.enableAO = false;
                gameSettings.enableACES = false;
                gameSettings.toneMappingMode = 'neutral';
                gameSettings.rtxPreset = 'clarity';
            } else {
                console.log('Detected i5-4590 / Integrated GPU: Loading default i5-4590 configuration.');
                Object.assign(gameSettings, I5_4590_DEFAULT_SETTINGS);
            }
            saveSettings();
        }
    } catch(e) {
        console.warn('Failed to load settings:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('cyberfort3d_settings', JSON.stringify(gameSettings));
    } catch(e) {}
}

function applyShadowQuality(quality) {
    if (!renderer) return;
    if (quality === 'off') {
        renderer.shadowMap.enabled = false;
        if (dirLight) dirLight.castShadow = false;
    } else {
        renderer.shadowMap.enabled = true;
        if (dirLight) {
            dirLight.castShadow = true;
            const size = (quality === 'ultra') ? 2048 : (quality === 'high' ? 1024 : 512);
            dirLight.shadow.mapSize.width = size;
            dirLight.shadow.mapSize.height = size;
            if (dirLight.shadow.map) {
                dirLight.shadow.map.dispose();
                dirLight.shadow.map = null;
            }
        }
    }
}

function applyFOV(fov) {
    if (camera && !isScoped) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
    }
}

function applyCrosshairColor(color) {
    document.querySelectorAll('.ch-line').forEach(el => {
        el.style.backgroundColor = color;
        el.style.boxShadow = '0 0 8px ' + color;
    });
}

function applySettings() {
    let fsrScale = 1.0;
    if (gameSettings.fsrMode === 'ultra_quality') fsrScale = 0.77;
    else if (gameSettings.fsrMode === 'quality') fsrScale = 0.67;
    else if (gameSettings.fsrMode === 'balanced') fsrScale = 0.59;
    else if (gameSettings.fsrMode === 'performance') fsrScale = 0.50;

    let baseDpr = Math.min(2.0, window.devicePixelRatio || 1) * gameSettings.resolutionScale;
    let dpr = baseDpr * fsrScale;
    if (gameSettings.antiAliasing === 'ssaa') {
        dpr = Math.min(2.5, dpr * 1.25);
    }
    if (renderer) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (composer) {
        composer.setSize(window.innerWidth, window.innerHeight);
    }

    if (bloomPass) {
        bloomPass.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
        bloomPass.threshold = 0.92; // High threshold: strictly high-intensity lasers & emissive lights bloom
        bloomPass.enabled = gameSettings.enableBloom;
        bloomPass.strength = gameSettings.bloomStrength;
        bloomPass.radius = gameSettings.bloomRadius;
    }

    if (rtxPass) {
        rtxPass.uniforms.uResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
        rtxPass.uniforms.uBrightness.value = gameSettings.brightness;
        rtxPass.uniforms.uContrast.value = gameSettings.contrast;
        rtxPass.uniforms.uGamma.value = gameSettings.gamma;
        rtxPass.uniforms.uSaturation.value = gameSettings.saturation;
        
        const tmMap = { 'neutral': 1, 'vibrant': 0, 'aces': 2, 'off': 3 };
        rtxPass.uniforms.uToneMappingMode.value = tmMap[gameSettings.toneMappingMode] !== undefined ? tmMap[gameSettings.toneMappingMode] : 1;
        rtxPass.uniforms.uEnableACES.value = (gameSettings.toneMappingMode === 'aces');
        
        const rtMap = { 'off': 0, 'performance': 1, 'medium': 2, 'quality': 3, 'pathtracing': 4 };
        rtxPass.uniforms.uRayTracingMode.value = rtMap[gameSettings.rayTracingMode] !== undefined ? rtMap[gameSettings.rayTracingMode] : 4;
        
        const aaMap = { 'off': 0, 'fxaa': 1, 'smaa': 2, 'msaa': 3, 'ssaa': 4 };
        rtxPass.uniforms.uAntiAliasing.value = aaMap[gameSettings.antiAliasing] !== undefined ? aaMap[gameSettings.antiAliasing] : 1;
        
        const fsrMap = { 'off': 0, 'ultra_quality': 1, 'quality': 2, 'balanced': 3, 'performance': 4 };
        const fsrVal = fsrMap[gameSettings.fsrMode] !== undefined ? fsrMap[gameSettings.fsrMode] : 0;
        rtxPass.uniforms.uFSRMode.value = fsrVal;
        rtxPass.uniforms.uFSRSharpness.value = (fsrVal > 0) ? (gameSettings.fsrSharpness !== undefined ? gameSettings.fsrSharpness : 0.5) : 0.0;
        rtxPass.uniforms.uFSRScale.value = fsrScale;
        
        rtxPass.uniforms.uEnableSSR.value = gameSettings.enableSSR;
        rtxPass.uniforms.uSSRIntensity.value = gameSettings.ssrIntensity;
        rtxPass.uniforms.uEnableAO.value = gameSettings.enableAO;
        rtxPass.uniforms.uAOIntensity.value = gameSettings.aoIntensity;
        rtxPass.uniforms.uEnableChromatic.value = gameSettings.enableChromatic;
        rtxPass.uniforms.uChromaticIntensity.value = gameSettings.chromaticIntensity;
        rtxPass.uniforms.uEnableAnamorphic.value = gameSettings.enableAnamorphic;
        rtxPass.uniforms.uAnamorphicIntensity.value = gameSettings.anamorphicIntensity;
        rtxPass.uniforms.uEnableVignette.value = gameSettings.enableVignette;
        rtxPass.uniforms.uVignetteIntensity.value = gameSettings.vignetteIntensity;
        rtxPass.uniforms.uEnableFilmGrain.value = gameSettings.enableFilmGrain;
        rtxPass.uniforms.uGrainIntensity.value = gameSettings.grainIntensity;
        rtxPass.uniforms.uEnableMotionBlur.value = gameSettings.enableMotionBlur;
    }

    applyShadowQuality(gameSettings.shadowQuality);
    applyFOV(gameSettings.fov);
    applyCrosshairColor(gameSettings.crosshairColor);
}

function openSettingsModal() {
    if (controls && controls.isLocked) {
        controls.unlock();
    }
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const gpu = detectHardwareGPU();
        const gpuBadge = document.getElementById('lbl-gpu-type-badge');
        const gpuName = document.getElementById('lbl-detected-gpu-name');
        if (gpuBadge) {
            if (gpu.isDedicated) {
                gpuBadge.innerText = '⚡ DEDICATED GPU (dGPU)';
                gpuBadge.style.background = '#00ffaa';
                gpuBadge.style.color = '#000';
            } else if (gpu.isIntelOld) {
                gpuBadge.innerText = '🥔 i5-4590 / INTEL HD 4600 DETECTED';
                gpuBadge.style.background = '#00ffaa';
                gpuBadge.style.color = '#000';
            } else {
                gpuBadge.innerText = '🔋 ' + gpu.type.toUpperCase();
                gpuBadge.style.background = '#ffaa00';
                gpuBadge.style.color = '#000';
            }
        }
        if (gpuName) {
            gpuName.innerText = gpu.name + (gpu.isDedicated ? ' — Dedicated Hardware Accelerated' : '');
        }
        syncSettingsToUI();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    if (myHp > 0 && !isMobileDeploy && gameState.started) {
        if (controls && !controls.isLocked) {
            controls.lock();
        }
    }
}

function resetSettingsToDefault() {
    const gpu = detectHardwareGPU();
    if (gpu.isIntelOld || !gpu.isDedicated) {
        Object.assign(gameSettings, I5_4590_DEFAULT_SETTINGS);
    } else {
        Object.assign(gameSettings, {
            resolutionScale: 1.0,
            brightness: 1.0,
            contrast: 1.0,
            gamma: 1.0,
            saturation: 1.1,
            fov: 75,
            shadowQuality: 'high',
            maxFps: 0,
            antiAliasing: 'fxaa',
            rayTracingMode: 'quality',
            fsrMode: 'quality',
            fsrSharpness: 0.8,
            rtxPreset: 'high',
            enableBloom: true,
            bloomStrength: 1.2,
            bloomRadius: 0.5,
            enableSSR: true,
            ssrIntensity: 0.8,
            enableAO: true,
            aoIntensity: 0.8,
            enableACES: true,
            enableChromatic: false,
            enableAnamorphic: false,
            enableVignette: true,
            enableFilmGrain: false,
            enableMotionBlur: false,
            crosshairColor: '#00ffaa'
        });
    }
    applySettings();
    saveSettings();
    syncSettingsToUI();
}

function syncSettingsToUI() {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    const setChecked = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!val;
    };
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setVal('setting-resolution', gameSettings.resolutionScale);
    setText('lbl-resolution', (gameSettings.resolutionScale * 100).toFixed(0) + "% " + (gameSettings.resolutionScale === 1.0 ? "(Native)" : ""));
    
    setVal('setting-fsr-mode', gameSettings.fsrMode || 'off');
    const fsrBadgeMap = {
        'off': 'OFF (NATIVE)',
        'ultra_quality': 'ULTRA QUALITY (1.3x)',
        'quality': 'QUALITY (1.5x - dGPU)',
        'balanced': 'BALANCED (1.7x)',
        'performance': 'PERFORMANCE (2.0x)'
    };
    setText('lbl-fsr-badge', fsrBadgeMap[gameSettings.fsrMode] || 'OFF');
    
    setVal('setting-fsr-sharpness', gameSettings.fsrSharpness !== undefined ? gameSettings.fsrSharpness : 0.8);
    setText('lbl-fsr-sharpness', ((gameSettings.fsrSharpness !== undefined ? gameSettings.fsrSharpness : 0.8) * 100).toFixed(0) + "%");

    let scaleFactor = 1.0;
    if (gameSettings.fsrMode === 'ultra_quality') scaleFactor = 0.77;
    else if (gameSettings.fsrMode === 'quality') scaleFactor = 0.67;
    else if (gameSettings.fsrMode === 'balanced') scaleFactor = 0.59;
    else if (gameSettings.fsrMode === 'performance') scaleFactor = 0.50;

    const nativeW = Math.round(window.innerWidth * (window.devicePixelRatio || 1) * gameSettings.resolutionScale);
    const nativeH = Math.round(window.innerHeight * (window.devicePixelRatio || 1) * gameSettings.resolutionScale);
    const renderW = Math.round(nativeW * scaleFactor);
    const renderH = Math.round(nativeH * scaleFactor);

    const renderResEl = document.getElementById('lbl-fsr-render-res');
    if (renderResEl) {
        if (gameSettings.fsrMode === 'off') {
            renderResEl.innerText = `Render Target: ${nativeW}x${nativeH} (100% Native)`;
        } else {
            renderResEl.innerText = `Render Target: ${renderW}x${renderH} (${(scaleFactor * 100).toFixed(0)}%) → FSR ${nativeW}x${nativeH}`;
        }
    }

    const hudFsrBadge = document.getElementById('hud-fsr-badge');
    const hudFsrStatus = document.getElementById('hud-fsr-status');
    if (hudFsrBadge && hudFsrStatus) {
        if (gameSettings.fsrMode && gameSettings.fsrMode !== 'off') {
            hudFsrBadge.style.display = 'flex';
            hudFsrStatus.innerText = fsrBadgeMap[gameSettings.fsrMode] || 'ACTIVE';
        } else {
            hudFsrBadge.style.display = 'none';
        }
    }
    
    setVal('setting-antialiasing', gameSettings.antiAliasing || 'fxaa');
    const aaLabelMap = { 'off': 'Off (Raw)', 'fxaa': 'FXAA (Smooth)', 'smaa': 'SMAA (HQ)', 'msaa': 'MSAA (Hardware)', 'ssaa': 'TAA / SSAA (1.5x)' };
    setText('lbl-antialiasing', aaLabelMap[gameSettings.antiAliasing] || 'FXAA');

    setVal('setting-raytracing', gameSettings.rayTracingMode || 'pathtracing');
    const rtBadgeMap = {
        'off': 'OFF',
        'performance': '⚡ PERFORMANCE',
        'medium': '⚙️ MEDIUM',
        'quality': '💎 QUALITY',
        'pathtracing': '🔥 PATH TRACING'
    };
    setText('lbl-raytracing-badge', rtBadgeMap[gameSettings.rayTracingMode] || '🔥 PATH TRACING');
    const rtDescMap = {
        'off': 'Ray tracing disabled. Pure standard rasterization.',
        'performance': 'Fast 4-step screen-space raymarching and contact ambient occlusion for high frame rates.',
        'medium': '8-step screen-space raymarching with binary search refinement and contact shadows.',
        'quality': '16-step high-fidelity screen-space raymarching with sub-texel binary search and glossy specular dispersion.',
        'pathtracing': 'Full Monte-Carlo path-traced Global Illumination: volumetric neon light bounces, emissive reflection rays, and progressive ambient shadowing.'
    };
    setText('lbl-raytracing-desc', rtDescMap[gameSettings.rayTracingMode] || '');
    
    setVal('setting-brightness', gameSettings.brightness);
    setText('lbl-brightness', (gameSettings.brightness * 100).toFixed(0) + "%");
    
    setVal('setting-contrast', gameSettings.contrast);
    setText('lbl-contrast', (gameSettings.contrast * 100).toFixed(0) + "%");
    
    setVal('setting-gamma', gameSettings.gamma);
    setText('lbl-gamma', gameSettings.gamma.toFixed(2));
    
    setVal('setting-saturation', gameSettings.saturation);
    setText('lbl-saturation', (gameSettings.saturation * 100).toFixed(0) + "%");
    
    setVal('setting-fov', gameSettings.fov);
    setText('lbl-fov', gameSettings.fov + "°");
    
    setVal('setting-shadows', gameSettings.shadowQuality);
    setVal('setting-fps', gameSettings.maxFps);
    setVal('setting-rtx-preset', gameSettings.rtxPreset);
    
    setChecked('setting-rtx-bloom', gameSettings.enableBloom);
    setVal('setting-bloom-strength', gameSettings.bloomStrength);
    
    setChecked('setting-rtx-ssr', gameSettings.enableSSR);
    setVal('setting-ssr-intensity', gameSettings.ssrIntensity);
    
    setChecked('setting-rtx-ao', gameSettings.enableAO);
    setVal('setting-ao-intensity', gameSettings.aoIntensity);
    
    setVal('setting-rtx-tonemapping', gameSettings.toneMappingMode || 'vibrant');
    const tmBadge = document.getElementById('lbl-tonemapping-badge');
    if (tmBadge) {
        const tmBadgeMap = {
            'vibrant': 'VIBRANT FILMIC (ZERO BLEACH)',
            'neutral': 'KHRONOS PBR NEUTRAL',
            'aces': 'ACES CLASSIC',
            'off': 'OFF (RAW HDR)'
        };
        tmBadge.innerText = tmBadgeMap[gameSettings.toneMappingMode] || 'VIBRANT FILMIC';
    }

    setChecked('setting-rtx-aces', gameSettings.enableACES);
    
    setChecked('setting-rtx-chromatic', gameSettings.enableChromatic);
    setVal('setting-chromatic-intensity', gameSettings.chromaticIntensity);
    
    setChecked('setting-rtx-anamorphic', gameSettings.enableAnamorphic);
    setVal('setting-anamorphic-intensity', gameSettings.anamorphicIntensity);
    
    setChecked('setting-rtx-vignette', gameSettings.enableVignette);
    setChecked('setting-rtx-grain', gameSettings.enableFilmGrain);
    setChecked('setting-rtx-motionblur', gameSettings.enableMotionBlur);
    setVal('setting-crosshair-color', gameSettings.crosshairColor);
}

function setupSettingsUI() {
    const bindInput = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', fn);
    };
    const bindChange = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', fn);
    };

    bindChange('setting-resolution', (e) => {
        gameSettings.resolutionScale = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-antialiasing', (e) => {
        gameSettings.antiAliasing = e.target.value;
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-raytracing', (e) => {
        gameSettings.rayTracingMode = e.target.value;
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-fsr-mode', (e) => {
        gameSettings.fsrMode = e.target.value;
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindInput('setting-fsr-sharpness', (e) => {
        gameSettings.fsrSharpness = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-fsr-sharpness');
        if (lbl) lbl.innerText = (gameSettings.fsrSharpness * 100).toFixed(0) + "%";
    });

    const btnDgpuOpt = document.getElementById('btn-dgpu-optimize');
    if (btnDgpuOpt) {
        btnDgpuOpt.addEventListener('click', () => {
            optimizeForDedicatedGPU();
        });
    }

    bindInput('setting-brightness', (e) => {
        gameSettings.brightness = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-brightness');
        if (lbl) lbl.innerText = (gameSettings.brightness * 100).toFixed(0) + "%";
    });

    bindInput('setting-contrast', (e) => {
        gameSettings.contrast = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-contrast');
        if (lbl) lbl.innerText = (gameSettings.contrast * 100).toFixed(0) + "%";
    });

    bindInput('setting-gamma', (e) => {
        gameSettings.gamma = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-gamma');
        if (lbl) lbl.innerText = gameSettings.gamma.toFixed(2);
    });

    bindInput('setting-saturation', (e) => {
        gameSettings.saturation = parseFloat(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-saturation');
        if (lbl) lbl.innerText = (gameSettings.saturation * 100).toFixed(0) + "%";
    });

    bindInput('setting-fov', (e) => {
        gameSettings.fov = parseInt(e.target.value);
        applySettings();
        saveSettings();
        const lbl = document.getElementById('lbl-fov');
        if (lbl) lbl.innerText = gameSettings.fov + "°";
    });

    bindChange('setting-shadows', (e) => {
        gameSettings.shadowQuality = e.target.value;
        applySettings();
        saveSettings();
    });

    bindChange('setting-fps', (e) => {
        gameSettings.maxFps = parseInt(e.target.value);
        applySettings();
        saveSettings();
    });

    const btnI5Opt = document.getElementById('btn-i5-optimize');
    if (btnI5Opt) {
        btnI5Opt.addEventListener('click', () => {
            optimizeForI5_4590();
        });
    }

    bindChange('setting-rtx-preset', (e) => {
        const preset = e.target.value;
        gameSettings.rtxPreset = preset;
        if (preset === 'i5_4590') {
            Object.assign(gameSettings, I5_4590_DEFAULT_SETTINGS);
        } else if (preset === 'off') {
            gameSettings.enableBloom = false;
            gameSettings.enableSSR = false;
            gameSettings.enableAO = false;
            gameSettings.enableACES = false;
            gameSettings.enableChromatic = false;
            gameSettings.enableAnamorphic = false;
            gameSettings.enableVignette = false;
            gameSettings.enableFilmGrain = false;
            gameSettings.enableMotionBlur = false;
            gameSettings.shadowQuality = 'off';
            gameSettings.rayTracingMode = 'off';
        } else if (preset === 'clarity') {
            // Cinematic Clarity (Clean, sharp, pristine, zero bleaching, subtle emissive glow)
            gameSettings.enableBloom = true;
            gameSettings.bloomStrength = 0.22;
            gameSettings.bloomRadius = 0.20;
            gameSettings.toneMappingMode = 'neutral';
            gameSettings.enableSSR = false;
            gameSettings.enableAO = false;
            gameSettings.enableACES = false;
            gameSettings.enableChromatic = false;
            gameSettings.enableAnamorphic = false;
            gameSettings.enableVignette = true;
            gameSettings.vignetteIntensity = 0.35;
            gameSettings.enableFilmGrain = false;
            gameSettings.enableMotionBlur = false;
            gameSettings.shadowQuality = 'high';
            gameSettings.rayTracingMode = 'medium';
            gameSettings.fsrSharpness = 0.5;
        } else if (preset === 'medium') {
            gameSettings.enableBloom = true;
            gameSettings.bloomStrength = 0.20;
            gameSettings.bloomRadius = 0.20;
            gameSettings.toneMappingMode = 'neutral';
            gameSettings.enableSSR = false;
            gameSettings.enableAO = false;
            gameSettings.enableACES = false;
            gameSettings.shadowQuality = 'medium';
            gameSettings.rayTracingMode = 'performance';
        } else if (preset === 'high') {
            gameSettings.enableBloom = true;
            gameSettings.bloomStrength = 0.24;
            gameSettings.bloomRadius = 0.22;
            gameSettings.toneMappingMode = 'neutral';
            gameSettings.enableSSR = false;
            gameSettings.enableAO = false;
            gameSettings.enableACES = false;
            gameSettings.shadowQuality = 'high';
            gameSettings.rayTracingMode = 'medium';
        } else if (preset === 'ultra') {
            gameSettings.enableBloom = true;
            gameSettings.bloomStrength = 0.28;
            gameSettings.bloomRadius = 0.24;
            gameSettings.toneMappingMode = 'neutral';
            gameSettings.enableSSR = false;
            gameSettings.enableAO = false;
            gameSettings.enableACES = false;
            gameSettings.shadowQuality = 'ultra';
            gameSettings.rayTracingMode = 'quality';
        }
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-rtx-bloom', (e) => {
        gameSettings.enableBloom = e.target.checked;
        applySettings();
        saveSettings();
    });
    bindInput('setting-bloom-strength', (e) => {
        gameSettings.bloomStrength = parseFloat(e.target.value);
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-ssr', (e) => {
        gameSettings.enableSSR = e.target.checked;
        applySettings();
        saveSettings();
    });
    bindInput('setting-ssr-intensity', (e) => {
        gameSettings.ssrIntensity = parseFloat(e.target.value);
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-ao', (e) => {
        gameSettings.enableAO = e.target.checked;
        applySettings();
        saveSettings();
    });
    bindInput('setting-ao-intensity', (e) => {
        gameSettings.aoIntensity = parseFloat(e.target.value);
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-tonemapping', (e) => {
        gameSettings.toneMappingMode = e.target.value;
        if (e.target.value === 'aces') gameSettings.enableACES = true;
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-rtx-aces', (e) => {
        gameSettings.enableACES = e.target.checked;
        if (e.target.checked && gameSettings.toneMappingMode === 'off') {
            gameSettings.toneMappingMode = 'vibrant';
        }
        applySettings();
        saveSettings();
        syncSettingsToUI();
    });

    bindChange('setting-rtx-chromatic', (e) => {
        gameSettings.enableChromatic = e.target.checked;
        applySettings();
        saveSettings();
    });
    bindInput('setting-chromatic-intensity', (e) => {
        gameSettings.chromaticIntensity = parseFloat(e.target.value);
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-anamorphic', (e) => {
        gameSettings.enableAnamorphic = e.target.checked;
        applySettings();
        saveSettings();
    });
    bindInput('setting-anamorphic-intensity', (e) => {
        gameSettings.anamorphicIntensity = parseFloat(e.target.value);
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-vignette', (e) => {
        gameSettings.enableVignette = e.target.checked;
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-grain', (e) => {
        gameSettings.enableFilmGrain = e.target.checked;
        gameSettings.grainIntensity = e.target.checked ? 0.35 : 0.0;
        applySettings();
        saveSettings();
    });

    bindChange('setting-rtx-motionblur', (e) => {
        gameSettings.enableMotionBlur = e.target.checked;
        applySettings();
        saveSettings();
    });

    bindChange('setting-crosshair-color', (e) => {
        gameSettings.crosshairColor = e.target.value;
        applySettings();
        saveSettings();
    });

    const btnClose = document.getElementById('btn-settings-close');
    if (btnClose) btnClose.addEventListener('click', closeSettingsModal);

    const btnReset = document.getElementById('btn-settings-reset');
    if (btnReset) btnReset.addEventListener('click', resetSettingsToDefault);

    const trig = document.getElementById('settings-trigger');
    if (trig) trig.addEventListener('click', openSettingsModal);

    const lobbyBtn = document.getElementById('btn-lobby-settings');
    if (lobbyBtn) lobbyBtn.addEventListener('click', openSettingsModal);

    const pauseBtn = document.getElementById('btn-pause-settings');
    if (pauseBtn) pauseBtn.addEventListener('click', openSettingsModal);
}


function ensureCustomNametag() {
    const unEl = document.getElementById('my-username');
    let val = unEl ? unEl.value.trim() : (myUsername ? myUsername.trim() : '');
    
    // Check if empty or still a default "Player_..." pattern
    if (!val || val.length < 2 || /^Player_\d+$/i.test(val)) {
        const entered = prompt("ENTER YOUR CUSTOM CALLSIGN / NAMETAG TO DEPLOY (Min 2 chars):", (val && !/^Player_\d+$/i.test(val)) ? val : "");
        if (entered && entered.trim().length >= 2) {
            val = entered.trim().substring(0, 14);
            if (unEl) unEl.value = val;
        } else {
            if (unEl) {
                unEl.focus();
                unEl.style.borderColor = '#ff0055';
                unEl.style.boxShadow = '0 0 15px rgba(255, 0, 85, 0.7)';
            }
            alert("A custom nametag is required to deploy! Please enter your custom callsign.");
            return false;
        }
    }
    
    myUsername = val;
    if (unEl) {
        unEl.value = val;
        unEl.style.borderColor = '#00f3ff';
        unEl.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.3)';
    }
    saveLocalProfile();
    updateMyNametag();
    return true;
}

function updateMyNametag() {
    if (!myAvatar) return;
    if (myAvatar.nametag) {
        myAvatar.group.remove(myAvatar.nametag);
    }
    myAvatar.nametag = createNametag(myUsername, gameState.myTeam || 'none', myHp, myMaxHp);
    myAvatar.nametag.position.y = 4.5;
    myAvatar.group.add(myAvatar.nametag);
}

// ============================================================================
// TACTICAL ABILITIES & GRAPPLE HOOK SYSTEM
// ============================================================================
const ABILITY_DEFINITIONS = {
    'lightning': {
        name: 'LIGHTNING STRIKE',
        icon: '⚡',
        desc: 'Call down orbital lightning dealing 85 direct damage + 35 AoE shock damage.',
        cost: 250,
        color: '#00f3ff',
        cooldown: 7.0
    },
    'meteor': {
        name: 'METEOR BLAST',
        icon: '🔥',
        desc: 'Launch a high-explosive fireball dealing 80 AoE splash damage with knockback.',
        cost: 220,
        color: '#ff5500',
        cooldown: 8.0
    },
    'frost_nova': {
        name: 'FROST NOVA',
        icon: '❄️',
        desc: 'Cryogenic blast: 45 damage and slows all targets by 60% for 3.5s.',
        cost: 200,
        color: '#00ffff',
        cooldown: 6.0
    },
    'phase_blink': {
        name: 'PHASE BLINK',
        icon: '🌀',
        desc: 'Teleport 22 units forward and gain 1.5s invulnerability shield.',
        cost: 180,
        color: '#aa00ff',
        cooldown: 5.0
    },
    'vampiric_drain': {
        name: 'VAMPIRIC DRAIN',
        icon: '🩸',
        desc: 'Siphon 50 HP from aimed target and heal yourself immediately.',
        cost: 280,
        color: '#ff0055',
        cooldown: 9.0
    },
    'overcharge': {
        name: 'OVERCHARGE',
        icon: '⚡',
        desc: 'Plasma surge: +100% weapon fire rate and +35% damage for 5 seconds.',
        cost: 240,
        color: '#ffd700',
        cooldown: 12.0
    },
    'nanite_regen': {
        name: 'NANITE REPAIR',
        icon: '💚',
        desc: 'Restores 50 HP immediately and regenerates 10 HP/s for 5 seconds.',
        cost: 150,
        color: '#00ffaa',
        cooldown: 8.0
    },
    'smite': {
        name: 'DIVINE SMITE',
        icon: '⚡☠️',
        desc: 'ADMIN VIP EXCLUSIVE: Instant 1-hit execution. Triggers exclusive cinematic on caster & victim.',
        cost: 0,
        color: '#ffd700',
        cooldown: 5.0,
        vipLocked: true
    }
};

function updateAbilityHUD() {
    const ab = ABILITY_DEFINITIONS[myActiveAbility] || ABILITY_DEFINITIONS['lightning'];
    const nameEl = document.getElementById('hud-ability-name');
    const iconEl = document.getElementById('hud-ability-icon');
    const statusEl = document.getElementById('hud-ability-status');
    const badgeEl = document.getElementById('hud-ability-badge');
    
    if (nameEl) nameEl.innerText = ab.name;
    if (iconEl) iconEl.innerText = ab.icon;
    
    if (statusEl) {
        if (abilityCooldownTimer > 0) {
            statusEl.innerText = abilityCooldownTimer.toFixed(1) + "s";
            statusEl.style.color = "#ff0055";
            if (badgeEl) badgeEl.classList.add('cooldown');
        } else {
            statusEl.innerText = "READY";
            statusEl.style.color = "#00ffaa";
            if (badgeEl) badgeEl.classList.remove('cooldown');
        }
    }
}

function castActiveAbility() {
    if (abilityCooldownTimer > 0 || myHp <= 0) return;
    const ab = ABILITY_DEFINITIONS[myActiveAbility] || ABILITY_DEFINITIONS['lightning'];
    
    if (myActiveAbility === 'lightning') {
        castLightning();
    } else if (myActiveAbility === 'meteor') {
        castMeteor();
    } else if (myActiveAbility === 'frost_nova') {
        castFrostNova();
    } else if (myActiveAbility === 'phase_blink') {
        castPhaseBlink();
    } else if (myActiveAbility === 'vampiric_drain') {
        castVampiricDrain();
    } else if (myActiveAbility === 'overcharge') {
        castOvercharge();
    } else if (myActiveAbility === 'nanite_regen') {
        castNaniteRegen();
    } else if (myActiveAbility === 'smite') {
        castSmite();
    }
    
    abilityCooldownTimer = ab.cooldown;
    updateAbilityHUD();
}


// ============================================================================
// DIVINE SMITE EXECUTION SYSTEM & CINEMATIC CONTROLLER
// ============================================================================
let smiteAudioCtx = null;
function getSmiteAudio() {
    try {
        if (!smiteAudioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) smiteAudioCtx = new AudioContextClass();
        }
        if (smiteAudioCtx && smiteAudioCtx.state === 'suspended') {
            smiteAudioCtx.resume().catch(() => {});
        }
        return smiteAudioCtx;
    } catch(e) {
        return null;
    }
}

function playTone(freq = 440, type = 'sine', duration = 0.2, volume = 0.3) {
    const ctx = getSmiteAudio();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    } catch(e) {}
}

function playSmiteStrikeSound() {
    const ctx = getSmiteAudio();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260 + Math.random() * 120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.11);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    } catch(e) {}
}

function playSmiteDetonationSound() {
    const ctx = getSmiteAudio();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        // Deep sub-bass boom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        
        // Thunder crack
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.exponentialRampToValueAtTime(38, now + 0.35);
        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.35);
    } catch(e) {}
}

function playKnockSound(isSuperLaunch = false) {
    const ctx = getSmiteAudio();
    if (!ctx) return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isSuperLaunch ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isSuperLaunch ? 320 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + (isSuperLaunch ? 0.35 : 0.15));
        gain.gain.setValueAtTime(isSuperLaunch ? 0.45 : 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isSuperLaunch ? 0.35 : 0.15));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + (isSuperLaunch ? 0.35 : 0.15));
    } catch(e) {}
}

function startContinuousSmiteLightning(targetPos, targetRef, targetType, targetId, durationSec = 5.5, onFinished = null) {
    stopContinuousSmiteLightning(false);

    const storm = {
        pos: targetPos.clone(),
        targetRef: targetRef,
        targetType: targetType,
        targetId: targetId,
        intervalId: null,
        cageMeshes: [],
        onFinished: onFinished
    };

    // 1. Divine Golden Plasma Cage holding victim in place
    const cageGeo = new THREE.SphereGeometry(2.4, 20, 20);
    const cageMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        wireframe: true,
        transparent: true,
        opacity: 0.85
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    cageMesh.position.copy(targetPos);
    cageMesh.position.y += 1.2;
    scene.add(cageMesh);
    storm.cageMeshes.push(cageMesh);

    const innerGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffea00,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.copy(cageMesh.position);
    scene.add(innerMesh);
    storm.cageMeshes.push(innerMesh);

    // Ground Golden Holy Seal Ring
    const sealGeo = new THREE.RingGeometry(1.5, 4.5, 32);
    sealGeo.rotateX(-Math.PI / 2);
    const sealMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.copy(targetPos);
    sealMesh.position.y += 0.08;
    scene.add(sealMesh);
    storm.cageMeshes.push(sealMesh);

    // Initial shockwave sound
    playSmiteStrikeSound();

    // 2. Interval: Golden Lightning continuously strikes down onto the victim
    storm.intervalId = setInterval(() => {
        let currentPos = storm.pos;
        if (storm.targetRef && storm.targetRef.position) {
            currentPos = storm.targetRef.position;
            storm.pos.copy(currentPos);
            cageMesh.position.copy(currentPos);
            cageMesh.position.y += 1.2;
            innerMesh.position.copy(cageMesh.position);
            sealMesh.position.set(currentPos.x, currentPos.y + 0.08, currentPos.z);
        }

        cageMesh.rotation.y += 0.08;
        cageMesh.rotation.x += 0.03;
        innerMesh.rotation.y -= 0.06;

        // Descending golden lightning bolt from sky
        const jx = (Math.random() - 0.5) * 1.5;
        const jz = (Math.random() - 0.5) * 1.5;
        const boltHeight = 180;
        const boltGeo = new THREE.CylinderGeometry(0.7 + Math.random()*0.5, 2.2 + Math.random()*0.8, boltHeight, 8);
        const boltMat = new THREE.MeshBasicMaterial({
            color: Math.random() < 0.25 ? 0xffffff : 0xffd700,
            transparent: true,
            opacity: 0.95
        });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(currentPos.x + jx, currentPos.y + (boltHeight / 2), currentPos.z + jz);
        scene.add(bolt);

        // Ground ripple ring
        const rGeo = new THREE.RingGeometry(0.5, 2.5 + Math.random() * 2.5, 20);
        rGeo.rotateX(-Math.PI / 2);
        const rMat = new THREE.MeshBasicMaterial({
            color: 0xffea00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.set(currentPos.x + jx, currentPos.y + 0.12, currentPos.z + jz);
        scene.add(rMesh);

        // Golden sparks
        createHitSpark(new THREE.Vector3(currentPos.x + jx, currentPos.y + 1.2, currentPos.z + jz), 0xffd700);

        // Audio
        playSmiteStrikeSound();

        // Subtle camera rumble if close
        if (camera) {
            const dist = camera.position.distanceTo(currentPos);
            if (dist < 55) {
                camera.position.x += (Math.random() - 0.5) * (0.28 * (1 - dist / 55));
                camera.position.y += (Math.random() - 0.5) * (0.28 * (1 - dist / 55));
            }
        }

        setTimeout(() => {
            scene.remove(bolt);
            scene.remove(rMesh);
            if (bolt.geometry) bolt.geometry.dispose();
            if (rGeo) rGeo.dispose();
        }, 75);
    }, 130);

    currentSmiteStorm = storm;
}

function stopContinuousSmiteLightning(triggerExplosion = true) {
    if (!currentSmiteStorm) return;
    const storm = currentSmiteStorm;
    currentSmiteStorm = null;

    if (storm.intervalId) {
        clearInterval(storm.intervalId);
        storm.intervalId = null;
    }

    // Remove plasma cage meshes
    storm.cageMeshes.forEach(m => {
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
    });

    if (triggerExplosion) {
        // Detonate Final Cataclysmic Golden Explosion
        playSmiteDetonationSound();
        const expPos = storm.pos.clone();

        // Massive flash sphere
        const expGeo = new THREE.SphereGeometry(3.5, 24, 24);
        const expMat = new THREE.MeshBasicMaterial({
            color: 0xffea00,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const expMesh = new THREE.Mesh(expGeo, expMat);
        expMesh.position.copy(expPos);
        expMesh.position.y += 1.5;
        scene.add(expMesh);

        // Expanding shockwave ring
        const shockGeo = new THREE.RingGeometry(2.0, 24.0, 32);
        shockGeo.rotateX(-Math.PI / 2);
        const shockMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });
        const shockMesh = new THREE.Mesh(shockGeo, shockMat);
        shockMesh.position.copy(expPos);
        shockMesh.position.y += 0.2;
        scene.add(shockMesh);

        // Sparks
        for (let i = 0; i < 4; i++) {
            createHitSpark(new THREE.Vector3(expPos.x + (Math.random()-0.5)*2, expPos.y + 1.5, expPos.z + (Math.random()-0.5)*2), 0xffd700);
        }

        // Camera shake
        if (camera) {
            const dist = camera.position.distanceTo(expPos);
            if (dist < 80) {
                camera.position.y += 0.6 * (1 - dist / 80);
            }
        }

        setTimeout(() => {
            scene.remove(expMesh);
            scene.remove(shockMesh);
            expGeo.dispose();
            shockGeo.dispose();
        }, 320);
    }

    if (storm.onFinished) {
        storm.onFinished();
    }
}

function playSmiteCinematic(isVictim = false, onCompleteCallback = null) {
    const container = document.getElementById('smite-cinematic-container');
    const video = document.getElementById('smite-cinematic-video');
    const skipBtn = document.getElementById('smite-cinematic-skip');
    if (!container || !video) return;

    isSmiteCinematicActive = true;
    isSmiteInvincible = true;

    // Suppress pointer lock and pause panel
    container.style.display = 'flex';
    container.style.pointerEvents = 'auto';
    video.currentTime = 0;
    video.muted = false;

    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.warn('Smite cinematic sound autoplay blocked, retrying muted:', err);
            video.muted = true;
            video.play().catch(e => console.error('Smite video play error:', e));
        });
    }

    let isClosed = false;
    const handleClose = () => {
        if (isClosed) return;
        isClosed = true;
        if (smiteCinematicTimeout) {
            clearTimeout(smiteCinematicTimeout);
            smiteCinematicTimeout = null;
        }
        closeSmiteCinematic();
        if (onCompleteCallback) onCompleteCallback();
    };

    video.onended = handleClose;
    if (skipBtn) {
        skipBtn.onclick = (e) => {
            e.stopPropagation();
            handleClose();
        };
    }
    container.onclick = handleClose;

    // Safety timeout: 7.5 seconds
    smiteCinematicTimeout = setTimeout(handleClose, 7500);
}

function closeSmiteCinematic() {
    const container = document.getElementById('smite-cinematic-container');
    const video = document.getElementById('smite-cinematic-video');
    if (video) {
        video.pause();
        video.onended = null;
    }
    if (container) {
        container.style.display = 'none';
        container.onclick = null;
    }

    isSmiteCinematicActive = false;

    // Ensure exit-panel is never stuck open
    const exitPanel = document.getElementById('exit-panel');
    if (exitPanel) {
        exitPanel.classList.add('hidden');
        exitPanel.style.display = 'none';
    }
    const hotbar = document.getElementById('hotbar');
    if (hotbar) hotbar.style.display = 'flex';

    // Safely re-engage pointer lock if player is alive and desktop
    if (myHp > 0 && !isMobileDeploy) {
        try {
            controls.lock();
        } catch(e) {
            console.warn('Pointer lock relock error:', e);
        }
    }
}

function castSmite() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const targets = [];
    mapMeshes.forEach(m => targets.push(m));
    Object.keys(remotePlayers).forEach(pid => { if (remotePlayers[pid]?.mesh) targets.push(remotePlayers[pid].mesh); });
    activeBots.forEach(b => { if (b?.mesh && b.hp > 0) targets.push(b.mesh); });

    const intersects = raycaster.intersectObjects(targets, true);
    const hitPoint = intersects.length > 0 ? intersects[0].point.clone() : new THREE.Vector3().copy(camera.position).add(raycaster.ray.direction.multiplyScalar(80));

    // Divine golden lightning pillar VFX
    const smiteGeo = new THREE.CylinderGeometry(1.6, 3.8, 220, 16);
    const smiteMat = new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.95 });
    const smitePillar = new THREE.Mesh(smiteGeo, smiteMat);
    smitePillar.position.set(hitPoint.x, hitPoint.y + 110, hitPoint.z);
    scene.add(smitePillar);

    const smiteRingGeo = new THREE.RingGeometry(2, 18, 32);
    smiteRingGeo.rotateX(-Math.PI / 2);
    const smiteRingMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const smiteRing = new THREE.Mesh(smiteRingGeo, smiteRingMat);
    smiteRing.position.copy(hitPoint);
    smiteRing.position.y += 0.25;
    scene.add(smiteRing);

    setTimeout(() => {
        scene.remove(smitePillar);
        scene.remove(smiteRing);
        smiteGeo.dispose();
        smiteRingGeo.dispose();
    }, 450);

    createHitSpark(hitPoint, 0xffd700);
    playSmiteStrikeSound();

    // Check victim hit
    if (intersects.length > 0) {
        let cur = intersects[0].object;
        let botId = null;
        let peerId = null;
        while (cur) {
            if (cur.userData?.botId) { botId = cur.userData.botId; break; }
            if (cur.userData?.peerId) { peerId = cur.userData.peerId; break; }
            cur = cur.parent;
        }

        if (botId) {
            const b = activeBots.find(x => x.id === botId);
            if (b && b.hp > 0) {
                b.isSmiteTrapped = true;
                const botPos = b.mesh.position.clone();

                // Broadcast sequence to peers (observers see 3D lightning)
                netBroadcast({
                    type: 'smite_strike_sequence',
                    casterId: myPeerId,
                    casterName: myUsername,
                    targetType: 'bot',
                    targetId: b.id,
                    targetName: b.name,
                    pos: { x: botPos.x, y: botPos.y, z: botPos.z },
                    duration: 5.5
                });

                // Start 3D continuous lightning storm on bot
                startContinuousSmiteLightning(botPos, b.mesh, 'bot', b.id, 5.5, () => {
                    b.isSmiteTrapped = false;
                    b.hp = 0;
                    b.deaths = (b.deaths || 0) + 1;
                    b.mesh.visible = false;
                    myKills++;
                    myCoins += 100;
                    updateUI();
                    saveLocalProfile();
                    adminLog(`⚡ [SMITE] Divine Execution on ${b.name}! (+100c)`);
                    isSmiteInvincible = false;
                    netBroadcast({
                        type: 'smite_sequence_end',
                        targetType: 'bot',
                        targetId: b.id
                    });
                });

                // Play cinematic for caster
                playSmiteCinematic(false, () => {
                    stopContinuousSmiteLightning(true);
                    isSmiteInvincible = false;
                });
            }
        } else if (peerId && remotePlayers[peerId]) {
            const remote = remotePlayers[peerId];
            const targetPos = remote.mesh ? remote.mesh.position.clone() : hitPoint.clone();

            // Broadcast smite sequence to ALL peers (observers see 3D lightning)
            netBroadcast({
                type: 'smite_strike_sequence',
                casterId: myPeerId,
                casterName: myUsername,
                targetType: 'peer',
                targetId: peerId,
                targetName: remote.username,
                pos: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
                duration: 5.5
            });

            // Tell victim specifically to start their cinematic overlay
            netSendTo(peerId, {
                type: 'smite_victim_start',
                caster: myUsername,
                victim: remote.username,
                duration: 5.5
            });

            // Start 3D continuous lightning storm on target in caster's scene
            startContinuousSmiteLightning(targetPos, remote.mesh, 'peer', peerId, 5.5, () => {
                netSendTo(peerId, {
                    type: 'hit',
                    damage: 99999,
                    shooter: myPeerId,
                    isSmite: true
                });
                netBroadcast({
                    type: 'smite_sequence_end',
                    targetType: 'peer',
                    targetId: peerId
                });
                myKills++;
                myCoins += 100;
                updateUI();
                saveLocalProfile();
                adminLog(`⚡ [SMITE] Divine Execution on ${remote.username}! (+100c)`);
                isSmiteInvincible = false;
            });

            // Play cinematic for caster
            playSmiteCinematic(false, () => {
                stopContinuousSmiteLightning(true);
                isSmiteInvincible = false;
            });
        }
    }
}

function castLightning() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const targets = [];
    mapMeshes.forEach(m => targets.push(m));
    Object.keys(remotePlayers).forEach(pid => { if (remotePlayers[pid]?.mesh) targets.push(remotePlayers[pid].mesh); });
    activeBots.forEach(b => { if (b?.mesh && b.hp > 0) targets.push(b.mesh); });
    
    const intersects = raycaster.intersectObjects(targets, true);
    const hitPoint = intersects.length > 0 ? intersects[0].point.clone() : new THREE.Vector3().copy(camera.position).add(raycaster.ray.direction.multiplyScalar(60));
    
    // Spawn huge lightning bolt from sky
    const boltGeo = new THREE.CylinderGeometry(0.5, 0.9, 140, 8);
    const boltMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.95 });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(hitPoint.x, hitPoint.y + 70, hitPoint.z);
    scene.add(bolt);
    
    // Shock ring
    const ringGeo = new THREE.RingGeometry(1, 9, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(hitPoint);
    ring.position.y += 0.1;
    scene.add(ring);
    
    setTimeout(() => {
        scene.remove(bolt);
        scene.remove(ring);
    }, 300);
    
    applyAoEDamage(hitPoint, 10, 85, 35, 'lightning');
    netBroadcast({ type: 'ability_fx', ability: 'lightning', target: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z } });
}

function castMeteor() {
    const dir = new THREE.Vector3().copy(camera.getWorldDirection(new THREE.Vector3()));
    const start = camera.position.clone().add(dir.clone().multiplyScalar(2));
    
    const fbGeo = new THREE.SphereGeometry(1.2, 12, 12);
    const fbMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    const fb = new THREE.Mesh(fbGeo, fbMat);
    fb.position.copy(start);
    scene.add(fb);
    
    const speed = 40;
    let traveled = 0;
    const interval = setInterval(() => {
        fb.position.add(dir.clone().multiplyScalar(speed * 0.03));
        traveled += speed * 0.03;
        
        const ray = new THREE.Raycaster(fb.position, dir, 0, 2.5);
        const hits = ray.intersectObjects(mapMeshes, true);
        if (hits.length > 0 || traveled > 120) {
            clearInterval(interval);
            const explodePos = fb.position.clone();
            scene.remove(fb);
            
            const expGeo = new THREE.SphereGeometry(4.5, 12, 12);
            const expMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.8 });
            const exp = new THREE.Mesh(expGeo, expMat);
            exp.position.copy(explodePos);
            scene.add(exp);
            setTimeout(() => { scene.remove(exp); }, 250);
            
            applyAoEDamage(explodePos, 14, 80, 80, 'meteor');
            netBroadcast({ type: 'ability_fx', ability: 'meteor', target: { x: explodePos.x, y: explodePos.y, z: explodePos.z } });
        }
    }, 30);
}

function castFrostNova() {
    const pPos = new THREE.Vector3(playerBody.position.x, playerBody.position.y - 1, playerBody.position.z);
    
    const fRingGeo = new THREE.RingGeometry(2, 16, 32);
    fRingGeo.rotateX(-Math.PI / 2);
    const fRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const fRing = new THREE.Mesh(fRingGeo, fRingMat);
    fRing.position.copy(pPos);
    fRing.position.y += 0.2;
    scene.add(fRing);
    setTimeout(() => { scene.remove(fRing); }, 400);
    
    applyAoEDamage(pPos, 16, 45, 45, 'frost');
    netBroadcast({ type: 'ability_fx', ability: 'frost', target: { x: pPos.x, y: pPos.y, z: pPos.z } });
}

function castPhaseBlink() {
    const dir = new THREE.Vector3().copy(camera.getWorldDirection(new THREE.Vector3()));
    dir.y = 0; dir.normalize();
    
    createHitSpark(camera.position, 0xaa00ff);
    playerBody.position.x += dir.x * 22;
    playerBody.position.z += dir.z * 22;
    createHitSpark(new THREE.Vector3(playerBody.position.x, playerBody.position.y, playerBody.position.z), 0xaa00ff);
    
    myShield = true;
    setTimeout(() => { myShield = false; }, 1500);
}

function castVampiricDrain() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const targets = [];
    Object.keys(remotePlayers).forEach(pid => { if (remotePlayers[pid]?.mesh) targets.push(remotePlayers[pid].mesh); });
    activeBots.forEach(b => { if (b?.mesh && b.hp > 0) targets.push(b.mesh); });
    
    const intersects = raycaster.intersectObjects(targets, true);
    if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        let hitId = null;
        let isBotHit = false;
        let cur = intersects[0].object;
        while(cur && !hitId) {
            if (cur.userData?.botId) { hitId = cur.userData.botId; isBotHit = true; }
            else if (cur.userData?.peerId) { hitId = cur.userData.peerId; isBotHit = false; }
            cur = cur.parent;
        }
        if (hitId) {
            if (isBotHit) damageBot(hitId, 50, false);
            else netSendTo(hitId, { type: 'hit', target: hitId, damage: 50 });
            
            myHp = Math.min(myMaxHp, myHp + 50);
            updateUI();
            updateMyNametag();
            createHitSpark(hitPoint, 0xff0055);
        }
    }
}

function castOvercharge() {
    flatFireRateBonus -= 3;
    flatDamageBonus += 25;
    createHitSpark(camera.position, 0xffd700);
    setTimeout(() => {
        flatFireRateBonus += 3;
        flatDamageBonus -= 25;
    }, 5000);
}

function castNaniteRegen() {
    myHp = Math.min(myMaxHp, myHp + 50);
    updateUI();
    updateMyNametag();
    createHitSpark(camera.position, 0x00ffaa);
    
    let ticks = 5;
    const interval = setInterval(() => {
        ticks--;
        myHp = Math.min(myMaxHp, myHp + 10);
        updateUI();
        updateMyNametag();
        if (ticks <= 0) clearInterval(interval);
    }, 1000);
}

function applyAoEDamage(center, radius, directDamage, aoeDamage, type) {
    Object.keys(remotePlayers).forEach(pid => {
        const r = remotePlayers[pid];
        if (r && r.mesh) {
            const d = r.mesh.position.distanceTo(center);
            if (d <= radius) {
                const dmg = d < 4 ? directDamage : Math.round(aoeDamage * (1 - d / radius));
                netSendTo(pid, { type: 'hit', target: pid, damage: dmg });
                createHitSpark(r.mesh.position, 0x00f3ff);
            }
        }
    });
    
    activeBots.forEach(b => {
        if (b && b.mesh && b.hp > 0) {
            const d = b.pos.distanceTo(center);
            if (d <= radius) {
                const dmg = d < 4 ? directDamage : Math.round(aoeDamage * (1 - d / radius));
                damageBot(b.id, dmg, false);
                createHitSpark(b.pos, 0x00f3ff);
            }
        }
    });
}

function fireGrapple() {
    isHoldingGrapple = true;
    if (!grappleActive && grappleCooldownTimer <= 0) {
        startGrapple();
    }
}

function startGrapple() {
    if (grappleCooldownTimer > 0 || myHp <= 0) return;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(mapMeshes, true);
    
    if (intersects.length > 0 && intersects[0].distance <= GRAPPLE_MAX_DIST) {
        grappleActive = true;
        grappleTarget = intersects[0].point.clone();
        grappleHoldDuration = 0;
        
        const pts = [camera.position.clone(), grappleTarget.clone()];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, linewidth: 4 });
        grappleLineMesh = new THREE.Line(lineGeo, lineMat);
        scene.add(grappleLineMesh);
        
        playerBody.velocity.y = Math.max(playerBody.velocity.y, 8);
        createHitSpark(grappleTarget, 0x00f3ff);
        updateGrappleHUD();
    }
}

function releaseGrapple() {
    if (grappleActive) {
        grappleCooldownTimer = GRAPPLE_COOLDOWN;
    }
    grappleActive = false;
    grappleTarget = null;
    grappleHoldDuration = 0;
    if (grappleLineMesh) {
        scene.remove(grappleLineMesh);
        grappleLineMesh = null;
    }
    updateGrappleHUD();
}

function updateGrappleHUD() {
    const statusEl = document.getElementById('hud-grapple-status');
    const badgeEl = document.getElementById('hud-grapple-badge');
    if (!statusEl) return;
    
    if (grappleCooldownTimer > 0) {
        statusEl.innerText = grappleCooldownTimer.toFixed(1) + "s";
        statusEl.style.color = "#ff0055";
        if (badgeEl) badgeEl.classList.add('cooldown');
    } else if (grappleActive) {
        statusEl.innerText = "PULLING...";
        statusEl.style.color = "#ffd700";
        if (badgeEl) badgeEl.classList.remove('cooldown');
    } else {
        statusEl.innerText = "READY";
        statusEl.style.color = "#00ffaa";
        if (badgeEl) badgeEl.classList.remove('cooldown');
    }
}

// ============================================================================
// OFFLINE BOT SYSTEM (OFFLINE PRACTICE & TACTICAL COMBAT)
// ============================================================================
function startBotMatch() {
    isBotMatch = true;
    isHost = true;
    
    const countEl = document.getElementById('bot-count');
    botCount = countEl ? parseInt(countEl.value) : 3;
    
    const diffEl = document.getElementById('bot-difficulty');
    botDifficulty = diffEl ? diffEl.value : 'medium';
    
    const splitEl = document.getElementById('bot-team-split');
    botTeamSplit = splitEl ? splitEl.value : 'balanced';
    
    const botModeEl = document.getElementById('bot-gamemode');
    currentGamemode = botModeEl ? botModeEl.value : (document.getElementById('host-gamemode') ? document.getElementById('host-gamemode').value : 'FFA');
    
    const botMapEl = document.getElementById('bot-map');
    const selectedMap = botMapEl && botMapEl.value ? botMapEl.value : (MAP_CATALOG[currentGamemode] ? MAP_CATALOG[currentGamemode][0].id : 'ffa_original');
    gameState.map = selectedMap;
    
    const tlEl = document.getElementById('host-timelimit');
    gameState.timeLimit = tlEl ? parseInt(tlEl.value) : 300;
    gameState.timer = gameState.timeLimit;
    
    const slEl = document.getElementById('host-scorelimit');
    gameState.scoreLimit = slEl ? parseInt(slEl.value) : 25;

    let pref = document.getElementById('team-select') ? document.getElementById('team-select').value : 'auto';
    if (currentGamemode === 'TDM' || currentGamemode === 'CTF') {
        gameState.myTeam = (pref === 'auto') ? 'red' : pref; 
    } else {
        gameState.myTeam = 'none';
    }

    applyClass(document.getElementById('player-class').value);

    // Ingame HUD
    const hudRoomEl = document.getElementById('ingame-room-hud');
    const hudCodeEl = document.getElementById('hud-room-code');
    if (hudRoomEl && hudCodeEl) {
        hudRoomEl.style.display = 'flex';
        hudCodeEl.innerText = "OFFLINE-BOTS";
    }

    if (isMobile) {
        isMobileDeploy = true;
        document.getElementById('blocker').style.display = 'none';
        document.getElementById('hotbar').style.display = 'flex';
        showMobileControls();
    } else {
        if (!controls.isLocked) controls.lock();
    }

    initGamemode(currentGamemode, true, gameState.map);
    spawnBots(botCount, botDifficulty, botTeamSplit, currentGamemode);
    setConnectionStatus(`Offline Match: ${botCount} Bots (${botDifficulty.toUpperCase()})`, true);
    adminLog(`Spawned ${botCount} autonomous combat bots on ${currentGamemode} mode.`);
}

function spawnBots(count, difficulty, split, gamemode) {
    activeBots.forEach(b => {
        if (b.mesh) scene.remove(b.mesh);
    });
    activeBots = [];

    const botGuns = (gamemode === 'KOTH') 
        ? ['knockback_rifle', 'knock_stick'] 
        : ['default', 'smg', 'golden_eagle', 'shotgun', 'sniper'];

    for (let i = 0; i < count; i++) {
        const botName = BOT_NAMES[i % BOT_NAMES.length];
        let botTeam = 'none';
        if (gamemode === 'TDM' || gamemode === 'CTF') {
            if (split === 'vs_all') {
                botTeam = (gameState.myTeam === 'red') ? 'blue' : 'red';
            } else {
                const redCount = activeBots.filter(b => b.team === 'red').length + (gameState.myTeam === 'red' ? 1 : 0);
                const blueCount = activeBots.filter(b => b.team === 'blue').length + (gameState.myTeam === 'blue' ? 1 : 0);
                botTeam = (redCount <= blueCount) ? 'red' : 'blue';
            }
        }

        const themeColor = botTeam === 'red' ? 0xff0055 : (botTeam === 'blue' ? 0x0055ff : 0x00ffaa);
        const humanoid = createHumanoid(themeColor);
        humanoid.group.userData.botId = 'bot_' + i;
        humanoid.group.userData.isBot = true;

        const nametag = createNametag(botName, botTeam, 100, 100);
        nametag.position.y = 4.5;
        humanoid.group.add(nametag);

        const assignedGun = botGuns[i % botGuns.length];
        if (humanoid.gunContainer) {
            humanoid.gunContainer.add(createGunMesh(assignedGun));
        }

        const spawnPos = getBotSpawnPoint(botTeam, gamemode);
        humanoid.group.position.copy(spawnPos);
        scene.add(humanoid.group);

        const botObj = {
            id: 'bot_' + i,
            name: botName,
            team: botTeam,
            mesh: humanoid.group,
            humanoid: humanoid,
            nametag: nametag,
            gun: assignedGun,
            hp: 100,
            maxHp: 100,
            pos: spawnPos.clone(),
            shootCooldown: 1.0 + Math.random() * 1.5,
            respawnTimer: 0,
            difficulty: difficulty,
            moveDir: new THREE.Vector3(),
            strafeTimer: 0,
            kills: 0,
            deaths: 0
        };

        activeBots.push(botObj);
    }
}

function getGroundHeightBelow(x, currentY, z) {
    if (!mapMeshes || mapMeshes.length === 0) return 0;
    const startY = (currentY !== null && typeof currentY === 'number') ? currentY + 1.2 : 60;
    const ray = new THREE.Raycaster(
        new THREE.Vector3(x, startY, z),
        new THREE.Vector3(0, -1, 0),
        0,
        80
    );
    const hits = ray.intersectObjects(mapMeshes, true);
    if (hits.length > 0) {
        for (let i = 0; i < hits.length; i++) {
            const h = hits[i];
            if (h.object && h.object.userData && (h.object.userData.noGroundRay || h.object.userData.isWater)) continue;
            if (h.face && h.face.normal.y > 0.35) {
                return h.point.y;
            }
        }
        for (let i = 0; i < hits.length; i++) {
            if (hits[i].object && hits[i].object.userData && (hits[i].object.userData.noGroundRay || hits[i].object.userData.isWater)) continue;
            return hits[i].point.y;
        }
    }
    return 0;
}

function getTerrainHeightAt(x, z) {
    return getGroundHeightBelow(x, 15, z);
}

function getBotSpawnPoint(team, gamemode) {
    let x = 0, y = 1.0, z = 0;
    if (gamemode === 'TDM' || gamemode === 'CTF') {
        if (team === 'red') {
            x = 450 + (Math.random() - 0.5) * 30;
            z = (Math.random() - 0.5) * 30;
        } else if (team === 'blue') {
            x = -450 + (Math.random() - 0.5) * 30;
            z = (Math.random() - 0.5) * 30;
        } else {
            x = (Math.random() - 0.5) * 70;
            z = (Math.random() - 0.5) * 70;
        }
    } else if (gamemode === 'KOTH') {
        const angle = Math.random() * Math.PI * 2;
        const radius = 35 + Math.random() * 25;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
    } else {
        x = (Math.random() - 0.5) * 100;
        z = (Math.random() - 0.5) * 100;
    }
    y = getGroundHeightBelow(x, 15, z);
    return new THREE.Vector3(x, y + 0.5, z);
}

function updateBots(dt) {
    const playerPos = playerBody ? new THREE.Vector3().copy(playerBody.position) : null;
    const nowSec = Date.now() / 1000;

    activeBots.forEach(bot => {
        if (!bot.mesh) return;

        if (bot.isSmiteTrapped) {
            if (bot.body) bot.body.velocity.set(0, 0, 0);
            return;
        }

        if (bot.hp <= 0) {
            bot.respawnTimer -= dt;
            if (bot.respawnTimer <= 0) {
                bot.hp = bot.maxHp;
                bot.mesh.visible = true;
                const sp = getBotSpawnPoint(bot.team, currentGamemode);
                bot.pos.copy(sp);
                bot.velX = 0;
                bot.velZ = 0;
                bot.velocityY = 0;
                bot.mesh.position.copy(sp);
                if (bot.nametag) {
                    bot.mesh.remove(bot.nametag);
                    bot.nametag = createNametag(bot.name, bot.team, bot.hp, bot.maxHp);
                    bot.nametag.position.y = 4.5;
                    bot.mesh.add(bot.nametag);
                }
            }
            return;
        }

        let bestTargetPos = null;
        let bestTargetDist = Infinity;
        let isTargetPlayer = false;
        let targetBot = null;

        if (playerPos && myHp > 0) {
            const isEnemy = (bot.team === 'none' || bot.team !== gameState.myTeam);
            if (isEnemy) {
                const dist = bot.pos.distanceTo(playerPos);
                bestTargetPos = playerPos;
                bestTargetDist = dist;
                isTargetPlayer = true;
            }
        }

        activeBots.forEach(other => {
            if (other.id !== bot.id && other.hp > 0) {
                const isEnemy = (bot.team === 'none' || bot.team !== other.team);
                if (isEnemy) {
                    const dist = bot.pos.distanceTo(other.pos);
                    if (dist < bestTargetDist) {
                        bestTargetDist = dist;
                        bestTargetPos = other.pos;
                        isTargetPlayer = false;
                        targetBot = other;
                    }
                }
            }
        });

        let moving = false;
        if (bestTargetPos) {
            bot.mesh.lookAt(bestTargetPos.x, bot.mesh.position.y, bestTargetPos.z);
            if (bot.humanoid?.head) {
                const headRelY = bestTargetPos.y - (bot.mesh.position.y + 2.0);
                bot.humanoid.head.rotation.x = -Math.atan2(headRelY, Math.max(1, bestTargetDist));
            }

            const speed = bot.difficulty === 'hard' ? 22 : (bot.difficulty === 'medium' ? 17 : 12);
            const toTarget = new THREE.Vector3().subVectors(bestTargetPos, bot.pos);
            toTarget.y = 0;
            const dist = toTarget.length();
            toTarget.normalize();

            bot.strafeTimer -= dt;
            if (bot.strafeTimer <= 0) {
                bot.strafeTimer = 1.0 + Math.random() * 2.0;
                bot.moveDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }

            let moveX = 0, moveZ = 0;
            const isBotMelee = (bot.gun === 'knock_stick' || bot.gun === 'katana');
            if (isBotMelee) {
                if (dist > 3.5) {
                    moveX = toTarget.x * speed * 1.1 * dt;
                    moveZ = toTarget.z * speed * 1.1 * dt;
                    moving = true;
                } else {
                    moveX = toTarget.x * speed * 0.3 * dt;
                    moveZ = toTarget.z * speed * 0.3 * dt;
                    moving = true;
                }
            } else if (dist > 18) {
                moveX = toTarget.x * speed * dt;
                moveZ = toTarget.z * speed * dt;
                moving = true;
            } else if (dist < 8) {
                moveX = -toTarget.x * speed * 0.7 * dt;
                moveZ = -toTarget.z * speed * 0.7 * dt;
                moving = true;
            } else {
                moveX = bot.moveDir.x * speed * 0.5 * dt;
                moveZ = bot.moveDir.z * speed * 0.5 * dt;
                moving = true;
            }

            // Step height check: prevent climbing vertical walls or teleporting onto roofs
            const targetX = bot.pos.x + moveX;
            const targetZ = bot.pos.z + moveZ;
            const targetFloor = getGroundHeightBelow(targetX, bot.pos.y, targetZ);
            const stepDiff = targetFloor - bot.pos.y;

            if (stepDiff <= 1.25) {
                bot.pos.x = targetX;
                bot.pos.z = targetZ;
            } else {
                const tryXFloor = getGroundHeightBelow(targetX, bot.pos.y, bot.pos.z);
                if (tryXFloor - bot.pos.y <= 1.25) {
                    bot.pos.x = targetX;
                } else {
                    const tryZFloor = getGroundHeightBelow(bot.pos.x, bot.pos.y, targetZ);
                    if (tryZFloor - bot.pos.y <= 1.25) {
                        bot.pos.z = targetZ;
                    } else {
                        bot.moveDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
                    }
                }
            }

            // Smooth physics momentum (knockback velocity)
            if (bot.velX || bot.velZ) {
                bot.pos.x += (bot.velX || 0) * dt;
                bot.pos.z += (bot.velZ || 0) * dt;
                bot.velX *= 0.94;
                bot.velZ *= 0.94;
                if (Math.abs(bot.velX) < 0.1) bot.velX = 0;
                if (Math.abs(bot.velZ) < 0.1) bot.velZ = 0;
            }

            // Gravity & Ground Snapping
            bot.velocityY = (bot.velocityY || 0) - 50 * dt;
            bot.pos.y += bot.velocityY * dt;

            const floorY = getGroundHeightBelow(bot.pos.x, bot.pos.y, bot.pos.z);
            if (bot.pos.y <= floorY) {
                bot.pos.y = floorY;
                bot.velocityY = 0;
            }

            // Barrier & Void check: bot knocked over or outside arena boundaries
            const mapSize = currentMapSize || ((currentGamemode === 'TDM' || currentGamemode === 'CTF' || gameState.mode === 'TDM' || gameState.mode === 'CTF') ? 1200 : 300);
            const horizBarrier = (mapSize / 2) + 6.0;
            const botOutOfBarrier = Math.abs(bot.pos.x) > horizBarrier || 
                                   Math.abs(bot.pos.z) > horizBarrier || 
                                   bot.pos.y < -35 || 
                                   bot.pos.y > 320;

            if (botOutOfBarrier) {
                bot.hp = 0;
                bot.deaths = (bot.deaths || 0) + 1;
                bot.respawnTimer = 2.0;
                bot.mesh.visible = false;
                adminLog(`${bot.name} was knocked out of the arena barrier!`);
                if (bot.lastHitBy === myPeerId) {
                    myKills++;
                    if (currentGamemode === 'KOTH' || gameState.mode === 'KOTH') myCoins += 100;
                    updateUI();
                    saveLocalProfile();
                }
                bot.lastHitBy = null;
            }

            bot.mesh.position.copy(bot.pos);

            bot.shootCooldown -= dt;
            if (bot.shootCooldown <= 0 && dist < 120) {
                const baseCd = bot.difficulty === 'hard' ? 0.45 : (bot.difficulty === 'medium' ? 0.9 : 1.6);
                bot.shootCooldown = baseCd + Math.random() * baseCd * 0.5;
                botShoot(bot, isTargetPlayer, bestTargetPos, targetBot);
            }
        }

        const walkTime = nowSec * 10;
        const swing = moving ? Math.sin(walkTime) * 0.5 : 0;
        if (bot.humanoid?.lLeg) bot.humanoid.lLeg.rotation.x = swing;
        if (bot.humanoid?.rLeg) bot.humanoid.rLeg.rotation.x = -swing;
        if (bot.humanoid?.lArm) bot.humanoid.lArm.rotation.x = -swing;
        if (bot.nametag) bot.nametag.quaternion.copy(camera.quaternion);
    });
}

function botShoot(bot, isTargetPlayer, targetPos, targetBot) {
    if (!bot || bot.hp <= 0) return;

    const isMelee = (bot.gun === 'knock_stick' || bot.gun === 'katana');
    if (isMelee) {
        const meleeRange = 8.5;
        if (isTargetPlayer && myHp > 0 && playerBody) {
            const dist = bot.pos.distanceTo(playerBody.position);
            if (dist <= meleeRange) {
                if (bot.humanoid?.rArm) {
                    bot.humanoid.rArm.rotation.x -= Math.PI / 2;
                    setTimeout(() => { if (bot.humanoid?.rArm) bot.humanoid.rArm.rotation.x += Math.PI / 2; }, 150);
                }
                playKnockSound(true);
                createHitSpark(camera.position, 0xffd700);
                const launchDir = new THREE.Vector3().subVectors(playerBody.position, bot.pos).normalize();
                launchDir.y = 0.42;
                launchDir.normalize();
                playerBody.velocity.x += launchDir.x * 320;
                playerBody.velocity.y = Math.max(playerBody.velocity.y, 160);
                playerBody.velocity.z += launchDir.z * 320;
                lastHitBy = bot.id;
            }
        } else if (targetBot && targetBot.hp > 0) {
            const dist = bot.pos.distanceTo(targetBot.pos);
            if (dist <= meleeRange) {
                if (bot.humanoid?.rArm) {
                    bot.humanoid.rArm.rotation.x -= Math.PI / 2;
                    setTimeout(() => { if (bot.humanoid?.rArm) bot.humanoid.rArm.rotation.x += Math.PI / 2; }, 150);
                }
                playKnockSound(true);
                createHitSpark(targetBot.pos, 0xffd700);
                const launchDir = new THREE.Vector3().subVectors(targetBot.pos, bot.pos).normalize();
                launchDir.y = 0.42;
                launchDir.normalize();
                targetBot.velX = (targetBot.velX || 0) + launchDir.x * 320;
                targetBot.velZ = (targetBot.velZ || 0) + launchDir.z * 320;
                targetBot.velocityY = Math.max(targetBot.velocityY || 0, 160);
                targetBot.lastHitBy = bot.id;
            }
        }
        return;
    }

    const startPos = bot.pos.clone();
    startPos.y += 2.0;

    const spread = bot.difficulty === 'hard' ? 0.03 : (bot.difficulty === 'medium' ? 0.08 : 0.16);
    const aimVec = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    aimVec.x += (Math.random() - 0.5) * spread;
    aimVec.y += (Math.random() - 0.5) * spread;
    aimVec.z += (Math.random() - 0.5) * spread;
    aimVec.normalize();

    const endPos = startPos.clone().add(aimVec.multiplyScalar(80));

    const bColor = bot.team === 'red' ? 0xff0055 : (bot.team === 'blue' ? 0x0055ff : 0x00ffaa);
    const bMat = new THREE.MeshBasicMaterial({ color: bColor });
    const tracer = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.0, 6), bMat);
    tracer.geometry.rotateX(Math.PI / 2);
    tracer.position.copy(startPos);
    tracer.lookAt(endPos);
    scene.add(tracer);

    activeBullets.push({
        mesh: tracer,
        start: startPos.clone(),
        end: endPos.clone(),
        progress: 0,
        speed: 35
    });

    const isKoth = (currentGamemode === 'KOTH' || gameState.mode === 'KOTH');

    if (isTargetPlayer && myHp > 0 && playerBody) {
        const toPlayer = new THREE.Vector3().subVectors(playerBody.position, startPos);
        const dot = toPlayer.normalize().dot(aimVec);
        if (dot > 0.985) {
            if (isKoth) {
                // In KOTH, rifle applies gentle shove knockback to player, zero damage!
                playerBody.velocity.x += aimVec.x * 5.0;
                playerBody.velocity.y = Math.max(playerBody.velocity.y, 0.5);
                playerBody.velocity.z += aimVec.z * 5.0;
                lastHitBy = bot.id;
            }
            const dmg = isKoth ? 0 : (bot.difficulty === 'hard' ? 22 : (bot.difficulty === 'medium' ? 15 : 10));
            if (dmg > 0 && !myShield && !isSmiteInvincible) {
                myHp -= dmg;
                lastHitBy = bot.id;
                updateUI();
                updateMyNametag();
                createHitSpark(camera.position, bColor);
                if (myHp <= 0) die();
            }
        }
    } else if (targetBot && targetBot.hp > 0) {
        const toBot = new THREE.Vector3().subVectors(targetBot.pos, startPos);
        const dot = toBot.normalize().dot(aimVec);
        if (dot > 0.985) {
            if (isKoth) {
                // In KOTH, rifle shoves target bot gently, zero damage!
                targetBot.velX = (targetBot.velX || 0) + aimVec.x * 5.0;
                targetBot.velZ = (targetBot.velZ || 0) + aimVec.z * 5.0;
                targetBot.velocityY = Math.max(targetBot.velocityY || 0, 0.5);
                targetBot.lastHitBy = bot.id;
            } else {
                const dmg = bot.difficulty === 'hard' ? 24 : 16;
                damageBot(targetBot.id, dmg, false);
            }
            createHitSpark(targetBot.pos, bColor);
        }
    }
}

function damageBot(botId, damage, isHeadshot = false) {
    const bot = activeBots.find(b => b.id === botId);
    if (!bot || bot.hp <= 0 || bot.isSmiteTrapped) return;

    bot.hp -= damage;
    if (bot.nametag) {
        bot.mesh.remove(bot.nametag);
        bot.nametag = createNametag(bot.name, bot.team, Math.max(0, bot.hp), bot.maxHp);
        bot.nametag.position.y = 4.5;
        bot.mesh.add(bot.nametag);
    }

    if (bot.hp <= 0) {
        botDie(bot);
    }
}

function botDie(bot) {
    bot.deaths++;
    bot.hp = 0;
    bot.respawnTimer = 3.5;
    bot.mesh.visible = false;
    createHitSpark(bot.pos, 0xff0055);

    myKills++;
    myCoins += 100;
    updateUI();
    saveLocalProfile();
    adminLog(`Eliminated ${bot.name}! (+100c)`);

    if (currentGamemode === 'TDM') {
        if (bot.team === 'red') gameState.scoreBlue++;
        else if (bot.team === 'blue') gameState.scoreRed++;
        updateMatchHUD();
    } else if (currentGamemode === 'GUN_GAME') {
        const prog = ['default', 'golden_eagle', 'smg', 'shotgun', 'lmg', 'sniper', 'katana'];
        let idx = prog.indexOf(myGun) + 1;
        if (idx < prog.length) {
            myInventory[0] = prog[idx];
            window.equipSlot(0);
            updateUI();
            adminLog(`Gun Game Level Up: ${prog[idx]}`);
        } else {
            alert("GUN GAME VICTORY: You won against the bots!");
        }
    }
}

// ============================================================================
// PEERJS P2P MULTIPLAYER SYSTEM (UP TO 8 PLAYERS + HOST MIGRATION + FALLBACKS)
// ============================================================================
const MAX_PLAYERS = 8;
const ROOM_PREFIX = "cf3d-rm-";

let myPeerId = "";
let peer = null;
let remotePlayers = {}; // peerId -> { mesh, head, torso, rArm, gunContainer, nametag, etc. }
let peerConnections = {}; // peerId -> DataConnection
let roomPeerIds = []; // Sorted list of peer IDs in current match. Index 0 is the authoritative host.
let hostPeerId = "";
let currentRoomCode = "";
let lastNetTime = 0;
let lastHeartbeatTime = {};
let reconnectRetryCounts = {};
let isConnecting = false;
let heartbeatTimer = null;

// STUN ICE Servers for NAT traversal & network redundancy
const PEER_CONFIG = {
    debug: 1,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    }
};

let isPublicRoom = true;
let lobbyPingTimer = null;
let isFetchingLobbies = false;

function escapeHtml(str) {
    if (!str) return 'Player';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

async function fetchLobbies() {
    const sl = document.getElementById('server-list');
    if (!sl || isFetchingLobbies) return;
    isFetchingLobbies = true;

    const lobbiesMap = new Map();
    let hasOnlineSource = false;

    function mergeLobby(l) {
        if (!l || !l.roomCode) return;
        const code = String(l.roomCode).replace(/^cf3d-rm-/i, '').toUpperCase();
        if (code.length < 3) return;
        
        // Don't show our own hosted room in our own browser
        if (isHost && currentRoomCode && formatRoomCode(currentRoomCode) === code) return;

        let pingTime = l.lastPing || (l.time ? l.time : Date.now());
        if (pingTime < 1e11) pingTime *= 1000; // Convert seconds to ms if needed
        // Ignore dead / stale lobbies older than 30 seconds
        if (Math.abs(Date.now() - pingTime) > 30000) return;

        const existing = lobbiesMap.get(code);
        if (!existing || pingTime > (existing.lastPing || 0)) {
            lobbiesMap.set(code, {
                roomCode: code,
                hostPeerId: l.hostPeerId || (ROOM_PREFIX + code.toLowerCase()),
                hostName: (l.hostName || 'Host').substring(0, 14),
                gamemode: l.gamemode || 'FFA',
                players: Math.min(8, Math.max(1, parseInt(l.players) || 1)),
                maxPlayers: l.maxPlayers || 8,
                lastPing: pingTime
            });
        }
    }

    const fetchPromises = [];

    // Source 1: Local HTTP API (if running via http: or https:)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        fetchPromises.push(
            fetch('/api/lobbies', { signal: AbortSignal.timeout(3000) })
                .then(r => r.ok ? r.json() : [])
                .then(list => {
                    if (Array.isArray(list)) {
                        hasOnlineSource = true;
                        list.forEach(mergeLobby);
                    }
                })
                .catch(() => {})
        );
    }

    // Source 2: Global Vercel Cloud Server (if not already on Vercel)
    if (!window.location.hostname.includes('vercel.app')) {
        fetchPromises.push(
            fetch('https://cyber-fort3-d-proto.vercel.app/api/lobbies', { signal: AbortSignal.timeout(4500) })
                .then(r => r.ok ? r.json() : [])
                .then(list => {
                    if (Array.isArray(list)) {
                        hasOnlineSource = true;
                        list.forEach(mergeLobby);
                    }
                })
                .catch(() => {})
        );
    }

    // Source 3: Universal Public Pub-Sub Relay (ntfy.sh) - works 100% on file:///, Vercel, localhost
    fetchPromises.push(
        fetch('https://ntfy.sh/cyberfort_p2p_lobbies_v1/json?poll=1&since=25s', { signal: AbortSignal.timeout(4500) })
            .then(r => r.ok ? r.text() : '')
            .then(text => {
                if (!text) return;
                hasOnlineSource = true;
                const lines = text.trim().split('\n');
                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const evt = JSON.parse(line);
                        if (evt.event === 'message' && evt.message) {
                            const payload = JSON.parse(evt.message);
                            mergeLobby(payload);
                        }
                    } catch(e) {}
                }
            })
            .catch(() => {})
    );

    try {
        await Promise.all(fetchPromises);
    } catch(e) {}

    isFetchingLobbies = false;

    // Render list
    const lobbies = Array.from(lobbiesMap.values());
    if (lobbies.length === 0) {
        if (!hasOnlineSource) {
            sl.innerHTML = '<p style="color:#888; font-size:12px; text-align:center; margin:auto;">Server browser offline.</p>';
        } else {
            sl.innerHTML = '<p style="color:#aaa; font-size:12px; text-align:center; margin:auto;">No public servers online.</p>';
        }
        return;
    }

    sl.innerHTML = '';
    lobbies.forEach(l => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '6px 10px';
        div.style.marginBottom = '4px';
        div.style.background = 'rgba(0, 243, 255, 0.08)';
        div.style.border = '1px solid rgba(0, 243, 255, 0.4)';
        div.style.borderRadius = '4px';
        div.style.cursor = 'pointer';
        div.style.transition = 'all 0.15s ease';

        div.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:2px;">
                <span style="font-size:12px; color:#fff;"><strong style="color:#00f3ff;">[${escapeHtml(l.gamemode)}]</strong> ${escapeHtml(l.hostName)}</span>
                <span style="font-size:10px; color:#888; font-family:monospace;">CODE: ${escapeHtml(l.roomCode)}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="color:#00ffaa; font-weight:bold; font-size:11px;">${l.players}/${l.maxPlayers || 8}</span>
                <span style="background:rgba(0,243,255,0.2); border:1px solid #00f3ff; color:#00f3ff; padding:2px 8px; border-radius:3px; font-size:10px; font-weight:bold;">JOIN</span>
            </div>
        `;

        div.onmouseenter = () => {
            div.style.background = 'rgba(0, 243, 255, 0.25)';
            div.style.borderColor = '#00f3ff';
            div.style.boxShadow = '0 0 8px rgba(0, 243, 255, 0.4)';
        };
        div.onmouseleave = () => {
            div.style.background = 'rgba(0, 243, 255, 0.08)';
            div.style.borderColor = 'rgba(0, 243, 255, 0.4)';
            div.style.boxShadow = 'none';
        };

        div.onclick = (e) => {
            e.stopPropagation();
            if (!ensureCustomNametag()) return;
            joinMatch(l.roomCode || l.hostPeerId);
        };
        sl.appendChild(div);
    });
}

function registerPublicLobby() {
    if (!isPublicRoom || !isHost || !currentRoomCode) return;
    const cleanCode = formatRoomCode(currentRoomCode);
    const hostId = myPeerId || (ROOM_PREFIX + cleanCode.toLowerCase());
    const payload = {
        roomCode: cleanCode,
        hostPeerId: hostId,
        hostName: myUsername || 'Host',
        gamemode: currentGamemode || (document.getElementById('host-gamemode') ? document.getElementById('host-gamemode').value : 'FFA'),
        players: (roomPeerIds && roomPeerIds.length) ? roomPeerIds.length : 1,
        maxPlayers: 8,
        lastPing: Date.now()
    };

    // 1. Post to local API if running via http: or https:
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        fetch('/api/lobbies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    // 2. Post to Global Vercel Cloud Server (if not already browsing on Vercel)
    if (!window.location.hostname.includes('vercel.app')) {
        fetch('https://cyber-fort3-d-proto.vercel.app/api/lobbies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    // 3. Post to Universal Pub-Sub Relay (ntfy.sh) - works 100% on file:///, Vercel, localhost
    fetch('https://ntfy.sh/cyberfort_p2p_lobbies_v1', {
        method: 'POST',
        headers: { 'Title': 'lobby', 'Tags': 'lobby' },
        body: JSON.stringify(payload)
    }).catch(() => {});
}

function startPublicLobbyPings() {
    if (lobbyPingTimer) clearInterval(lobbyPingTimer);
    if (!isPublicRoom || !isHost) return;
    registerPublicLobby();
    lobbyPingTimer = setInterval(() => {
        if (isHost && isPublicRoom && currentRoomCode) {
            registerPublicLobby();
        } else {
            clearInterval(lobbyPingTimer);
        }
    }, 5000);
}

function unregisterPublicLobby() {
    if (lobbyPingTimer) clearInterval(lobbyPingTimer);
    if (!currentRoomCode) return;
    const cleanCode = formatRoomCode(currentRoomCode);

    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        fetch(`/api/lobbies/${cleanCode}`, { method: 'DELETE', keepalive: true }).catch(() => {});
    }
    if (!window.location.hostname.includes('vercel.app')) {
        fetch(`https://cyber-fort3-d-proto.vercel.app/api/lobbies/${cleanCode}`, { method: 'DELETE', keepalive: true }).catch(() => {});
    }
}

window.addEventListener('beforeunload', () => {
    if (isHost && isPublicRoom) unregisterPublicLobby();
});

function formatRoomCode(code) {
    return code.replace(ROOM_PREFIX, '').toUpperCase();
}

function generateRandomRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for(let i=0; i<6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function updateRoomHUD() {
    const countEl = document.getElementById('room-player-count');
    const boxEl = document.getElementById('room-info-box');
    const codeEl = document.getElementById('active-room-code');
    const totalCount = roomPeerIds.length || 1;
    
    if (countEl) countEl.innerText = totalCount;
    if (codeEl && currentRoomCode) {
        codeEl.innerText = (isPublicRoom ? "[PUBLIC] " : "[PRIVATE] ") + formatRoomCode(currentRoomCode);
    }
    if (boxEl) boxEl.style.display = currentRoomCode ? 'block' : 'none';
}

function setConnectionStatus(msg, isSuccess = false, isError = false) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    el.innerText = msg;
    el.style.color = isError ? '#ff0055' : (isSuccess ? '#00ffaa' : '#00f3ff');
}

function initPeer(customId = null, onReady = null) {
    if (peer && !peer.destroyed) {
        if (customId && peer.id !== customId) {
            console.log(`[PeerJS] Switching identity from ${peer.id} to ${customId}...`);
            peer.destroy();
            peer = null;
        } else {
            if (onReady) onReady(myPeerId || peer.id);
            return;
        }
    }

    setConnectionStatus("Initializing P2P Signaling...");
    peer = customId ? new Peer(customId, PEER_CONFIG) : new Peer(PEER_CONFIG);

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('[PeerJS] Connected to signaling server with ID:', id);
        document.getElementById('my-id-display').innerText = id.startsWith(ROOM_PREFIX) ? formatRoomCode(id) : id.substring(0, 10) + '...';
        setConnectionStatus("P2P Signaling Online", true);
        if (onReady) onReady(id);
    });

    peer.on('connection', (conn) => {
        setupDataConnection(conn);
    });

    peer.on('disconnected', () => {
        console.warn('[PeerJS] Signaling server disconnected. Attempting automatic reconnection...');
        setConnectionStatus("Signaling dropped. Reconnecting...", false, true);
        try {
            peer.reconnect();
        } catch(e) {
            console.error('[PeerJS] Reconnection error:', e);
        }
    });

    peer.on('error', (err) => {
        console.warn('[PeerJS] Error:', err);
        if (err.type === 'unavailable-id') {
            setConnectionStatus("Room ID collision. Regenerating room code...", false, true);
            peer.destroy();
            peer = null;
            setTimeout(() => {
                hostMatch(generateRandomRoomCode());
            }, 500);
        } else if (err.type === 'peer-unavailable') {
            setConnectionStatus("Target room not found or host offline.", false, true);
        } else {
            setConnectionStatus(`P2P Notice: ${err.type || 'Connection alert'}`, false);
        }
    });
}

function setupDataConnection(conn) {
    const remoteId = conn.peer;

    conn.on('open', () => {
        console.log(`[P2P Mesh] Direct data channel open with peer: ${remoteId}`);
        peerConnections[remoteId] = conn;
        reconnectRetryCounts[remoteId] = 0;
        lastHeartbeatTime[remoteId] = Date.now();

        if (!roomPeerIds.includes(remoteId)) {
            // Check 8-player cap
            if (roomPeerIds.length >= MAX_PLAYERS) {
                conn.send({ type: 'room_full', message: 'Room has reached the maximum of 8 players.' });
                setTimeout(() => conn.close(), 500);
                return;
            }
            roomPeerIds.push(remoteId);
            updateRoomHUD();
            if (isHost && isPublicRoom) registerPublicLobby();
        }

        // If we are Host, introduce new peer to everyone and sync state
        if (isHost) {
            conn.send({
                type: 'welcome',
                roomCode: currentRoomCode,
                hostId: myPeerId,
                peers: roomPeerIds,
                mode: currentGamemode,
                map: gameState.map,
                timer: gameState.timer,
                timeLimit: gameState.timeLimit,
                scoreLimit: gameState.scoreLimit,
                scoreRed: gameState.scoreRed,
                scoreBlue: gameState.scoreBlue,
                flagRed: gameState.flagRed,
                flagBlue: gameState.flagBlue
            });

            // Tell all existing peers about this new peer
            netBroadcast({
                type: 'peer_joined',
                newPeerId: remoteId,
                peers: roomPeerIds
            }, [remoteId]);
        }

        // Send our identity info
        conn.send({
            type: 'init',
            username: myUsername,
            teamPref: document.getElementById('team-select') ? document.getElementById('team-select').value : 'auto'
        });

        adminLog(`P2P channel established: ${remoteId.substring(0, 8)}...`);
    });

    conn.on('data', (data) => {
        handleIncomingPacket(remoteId, data);
    });

    conn.on('close', () => {
        console.warn(`[P2P Mesh] Connection closed with peer: ${remoteId}`);
        handlePeerDisconnection(remoteId);
    });

    conn.on('error', (err) => {
        console.warn(`[P2P Mesh] Connection error with peer ${remoteId}:`, err);
        handlePeerDisconnection(remoteId);
    });
}

function connectToPeer(targetId) {
    if (!peer || targetId === myPeerId || peerConnections[targetId]) return;
    try {
        const conn = peer.connect(targetId, { reliable: true });
        setupDataConnection(conn);
    } catch(e) {
        console.error(`Failed to connect to peer ${targetId}:`, e);
    }
}

function netBroadcast(data, excludeIds = []) {
    Object.keys(peerConnections).forEach(peerId => {
        if (!excludeIds.includes(peerId)) {
            const conn = peerConnections[peerId];
            if (conn && conn.open) {
                try {
                    conn.send(data);
                } catch(e) {
                    console.warn(`Error broadcasting to ${peerId}:`, e);
                }
            }
        }
    });
}

function netSendTo(targetId, data) {
    const conn = peerConnections[targetId];
    if (conn && conn.open) {
        try {
            conn.send(data);
            return;
        } catch(e) {}
    }
    // Fallback: relay through mesh
    netBroadcast({ ...data, _target: targetId });
}

// Host Migration & Disconnection Fallback
function handlePeerDisconnection(peerId) {
    if (peerConnections[peerId]) {
        delete peerConnections[peerId];
    }
    
    // Check if we should attempt reconnection retry
    const retries = reconnectRetryCounts[peerId] || 0;
    if (retries < 3 && roomPeerIds.includes(peerId) && gameState.started) {
        reconnectRetryCounts[peerId] = retries + 1;
        const delay = Math.pow(2, retries) * 1000;
        console.log(`[P2P Fallback] Attempting auto-reconnection to ${peerId} in ${delay}ms (Attempt ${retries+1}/3)...`);
        setTimeout(() => {
            if (!peerConnections[peerId] && roomPeerIds.includes(peerId)) {
                connectToPeer(peerId);
            }
        }, delay);
        return;
    }

    // Fully remove peer
    cleanupRemotePlayer(peerId);
    roomPeerIds = roomPeerIds.filter(id => id !== peerId);
    updateRoomHUD();
    if (isHost && isPublicRoom) registerPublicLobby();

    // Check Host Migration
    if (peerId === hostPeerId) {
        adminLog(`Host ${peerId.substring(0,8)} disconnected! Initiating Host Migration...`);
        executeHostMigration();
    }
}

function cleanupRemotePlayer(peerId) {
    if (remotePlayers[peerId]) {
        const rp = remotePlayers[peerId];
        if (rp.mesh && scene) {
            scene.remove(rp.mesh);
        }
        delete remotePlayers[peerId];
        adminLog(`Entity terminated: ${peerId.substring(0,8)}`);
    }
}

function executeHostMigration() {
    if (roomPeerIds.length === 0) return;
    
    // Deterministic new host: the first surviving peer in the ordered room list
    const newHostId = roomPeerIds[0];
    hostPeerId = newHostId;

    if (newHostId === myPeerId) {
        // WE ARE NOW THE AUTHORITATIVE HOST!
        isHost = true;
        adminLog("⚡ YOU HAVE BEEN DESIGNATED AS THE NEW MATCH HOST!");
        alert("Match Host Migrated: You are now hosting the room!");

        if (isPublicRoom) {
            startPublicLobbyPings();
        }

        // Broadcast host migration to all remaining peers with preserved game state
        netBroadcast({
            type: 'host_migrated',
            newHostId: myPeerId,
            mode: gameState.mode,
            timer: gameState.timer,
            scoreRed: gameState.scoreRed,
            scoreBlue: gameState.scoreBlue,
            flagRed: gameState.flagRed,
            flagBlue: gameState.flagBlue,
            isPublic: isPublicRoom
        });
    } else {
        isHost = false;
        const hostName = (remotePlayers[newHostId] && remotePlayers[newHostId].username) ? remotePlayers[newHostId].username : newHostId.substring(0, 8);
        adminLog(`⚡ Host migrated to peer: ${hostName}`);
    }
}

// Heartbeat & Redundant Connection Health Monitor
function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
        const now = Date.now();
        netBroadcast({ type: 'heartbeat', sender: myPeerId, time: now });

        // Check for silent / timed out peers (> 8 seconds)
        Object.keys(peerConnections).forEach(peerId => {
            const lastTime = lastHeartbeatTime[peerId] || now;
            if (now - lastTime > 8000) {
                console.warn(`[P2P Health] Peer ${peerId} timed out. Recovering...`);
                handlePeerDisconnection(peerId);
            }
        });
    }, 2500);
}

// Host Match Function
function hostMatch(customRoomCode = null) {
    const code = customRoomCode || generateRandomRoomCode();
    currentRoomCode = code;
    const fullHostId = ROOM_PREFIX + code.toLowerCase();
    const vis = document.getElementById('host-visibility') ? document.getElementById('host-visibility').value : 'public';
    isPublicRoom = (vis === 'public');

    const tlEl = document.getElementById('host-timelimit');
    gameState.timeLimit = tlEl ? parseInt(tlEl.value) : 300;
    gameState.timer = gameState.timeLimit;
    
    const slEl = document.getElementById('host-scorelimit');
    gameState.scoreLimit = slEl ? parseInt(slEl.value) : 25;

    const hudRoomEl = document.getElementById('ingame-room-hud');
    const hudCodeEl = document.getElementById('hud-room-code');
    if (hudRoomEl && hudCodeEl) {
        hudRoomEl.style.display = 'flex';
        hudCodeEl.innerText = (isPublicRoom ? "[PUB] " : "[PRI] ") + formatRoomCode(code);
    }

    if (!isPublicRoom) {
        try {
            navigator.clipboard.writeText(formatRoomCode(code));
        } catch(e) {}
        alert(`Private Room Created!\nRoom Code: ${formatRoomCode(code)}\n\nCode has been copied to your clipboard. Active in bottom-right corner.`);
    }

    setConnectionStatus(`Hosting ${isPublicRoom ? 'Public' : 'Private'} Room [${code}]...`);
    initPeer(fullHostId, (id) => {
        isHost = true;
        hostPeerId = myPeerId;
        roomPeerIds = [myPeerId];
        currentGamemode = document.getElementById('host-gamemode').value;
        const hostMapEl = document.getElementById('host-map');
        const selectedMap = hostMapEl && hostMapEl.value ? hostMapEl.value : (MAP_CATALOG[currentGamemode] ? MAP_CATALOG[currentGamemode][0].id : 'ffa_original');
        gameState.map = selectedMap;

        let pref = document.getElementById('team-select') ? document.getElementById('team-select').value : 'auto';
        if (currentGamemode === 'TDM' || currentGamemode === 'CTF') {
            gameState.myTeam = (pref === 'auto') ? 'red' : pref; 
        } else {
            gameState.myTeam = 'none';
        }

        applyClass(document.getElementById('player-class').value);

        if (isMobile) {
            isMobileDeploy = true;
            document.getElementById('blocker').style.display = 'none';
            document.getElementById('hotbar').style.display = 'flex';
            showMobileControls();
        } else {
            if (!controls.isLocked) controls.lock();
        }

        initGamemode(currentGamemode, true, gameState.map);
        startHeartbeat();
        if (isPublicRoom) {
            startPublicLobbyPings();
            setConnectionStatus(`Public Server [${code}] Online (1/8)`, true);
        } else {
            setConnectionStatus(`Private Room [${code}] Hosted - Share code to invite`, true);
        }
        updateRoomHUD();
        adminLog(`${isPublicRoom ? 'Public' : 'Private'} room ${code} created. Awaiting peer connections...`);
    });
}

// Join Match Function
function joinMatch(targetInput) {
    if (!targetInput || isConnecting) return;
    isConnecting = true;

    let targetId = targetInput.trim();
    if (!targetId.startsWith(ROOM_PREFIX)) {
        targetId = ROOM_PREFIX + targetId.toLowerCase();
    }
    const cleanCode = formatRoomCode(targetId);

    setConnectionStatus(`Connecting to room [${cleanCode}]...`);

    initPeer(null, (id) => {
        isHost = false;
        hostPeerId = targetId;
        currentRoomCode = targetId;

        const conn = peer.connect(targetId, { reliable: true });
        setupDataConnection(conn);

        conn.on('open', () => {
            isConnecting = false;
            applyClass(document.getElementById('player-class').value);

            const hudRoomEl = document.getElementById('ingame-room-hud');
            const hudCodeEl = document.getElementById('hud-room-code');
            if (hudRoomEl && hudCodeEl) {
                hudRoomEl.style.display = 'flex';
                hudCodeEl.innerText = cleanCode;
            }

            if (isMobile) {
                isMobileDeploy = true;
                document.getElementById('blocker').style.display = 'none';
                document.getElementById('hotbar').style.display = 'flex';
                showMobileControls();
            } else {
                if (!controls.isLocked) controls.lock();
            }

            startHeartbeat();
            setConnectionStatus(`Connected to room [${cleanCode}]`, true);
        });

        setTimeout(() => {
            if (isConnecting) {
                isConnecting = false;
                setConnectionStatus("Connection timed out. Check Room Code.", false, true);
            }
        }, 8000);
    });
}

// ============================================================================
// PACKET PROCESSING (REPLACES ALL RELAY_MESSAGE HANDLERS)
// ============================================================================
function handleIncomingPacket(senderId, data) {
    if (!data) return;
    lastHeartbeatTime[senderId] = Date.now();

    // Check targeted messages
    if (data._target && data._target !== myPeerId) return;

    let remote = remotePlayers[senderId];

    if (data.type === 'heartbeat') {
        return;
    }

    if (data.type === 'room_full') {
        alert(data.message || "Room is full (max 8 players).");
        window.location.reload();
        return;
    }

    if (data.type === 'welcome') {
        currentGamemode = data.mode;
        gameState.mode = data.mode;
        gameState.timer = data.timer;
        gameState.timeLimit = (data.timeLimit !== undefined) ? data.timeLimit : 300;
        gameState.scoreLimit = (data.scoreLimit !== undefined) ? data.scoreLimit : 25;
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        gameState.flagRed = data.flagRed || gameState.flagRed;
        gameState.flagBlue = data.flagBlue || gameState.flagBlue;
        hostPeerId = data.hostId;
        roomPeerIds = data.peers || [myPeerId];

        const hudRoomEl = document.getElementById('ingame-room-hud');
        const hudCodeEl = document.getElementById('hud-room-code');
        if (hudRoomEl && hudCodeEl && currentRoomCode) {
            hudRoomEl.style.display = 'flex';
            hudCodeEl.innerText = formatRoomCode(currentRoomCode);
        }

        // Connect to all other peers in room mesh
        if (Array.isArray(data.peers)) {
            data.peers.forEach(pid => {
                if (pid !== myPeerId && !peerConnections[pid]) {
                    connectToPeer(pid);
                }
            });
        }

        if (data.map) gameState.map = data.map;
        initGamemode(currentGamemode, false, gameState.map);
        gameState.started = true;
        updateRoomHUD();
        return;
    }

    if (data.type === 'peer_joined') {
        const newPid = data.newPeerId;
        if (!roomPeerIds.includes(newPid)) roomPeerIds.push(newPid);
        updateRoomHUD();

        // Connect to new peer if not already connected
        if (newPid !== myPeerId && !peerConnections[newPid]) {
            connectToPeer(newPid);
        }
        return;
    }

    if (data.type === 'host_migrated') {
        hostPeerId = data.newHostId;
        isHost = (myPeerId === hostPeerId);
        gameState.mode = data.mode || gameState.mode;
        gameState.timer = data.timer !== undefined ? data.timer : gameState.timer;
        gameState.scoreRed = data.scoreRed !== undefined ? data.scoreRed : gameState.scoreRed;
        gameState.scoreBlue = data.scoreBlue !== undefined ? data.scoreBlue : gameState.scoreBlue;
        if (data.flagRed) gameState.flagRed = data.flagRed;
        if (data.flagBlue) gameState.flagBlue = data.flagBlue;

        const name = (remotePlayers[hostPeerId] && remotePlayers[hostPeerId].username) ? remotePlayers[hostPeerId].username : hostPeerId.substring(0, 8);
        adminLog(`Host successfully migrated to ${name}`);
        updateMatchHUD();
        return;
    }

    // Lazy instantiate remote player avatar if not present
    if (!remote && (data.type === 'init' || data.type === 'pos')) {
        const humanoid = createHumanoid(); 
        const nametag = createNametag(data.username || "Player", 'none', data.hp || 100, 100); 
        nametag.position.y = 4.5; 
        humanoid.group.add(nametag);
        humanoid.group.userData.peerId = senderId;
        scene.add(humanoid.group); 

        remote = { 
            mesh: humanoid.group, 
            head: humanoid.head, 
            torso: humanoid.torso, 
            rArm: humanoid.rArm, 
            lArm: humanoid.lArm,
            lLeg: humanoid.lLeg,
            rLeg: humanoid.rLeg,
            gunContainer: humanoid.gunContainer, 
            currentGun: 'default', 
            nametag: nametag, 
            mat: humanoid.matTorso, 
            matPants: humanoid.matPants, 
            connectedAt: Date.now(), 
            kills: 0, 
            deaths: 0, 
            hp: data.hp || 100, 
            maxHp: 100, 
            coins: 0, 
            speed: 25, 
            team: 'none', 
            teamPref: 'auto', 
            kothScore: 0, 
            username: data.username || "Player" 
        };
        remotePlayers[senderId] = remote;
        adminLog(`Player entered field: ${remote.username} (${senderId.substring(0, 6)})`);
    }

    if (!remote) return;

    if (data.type === 'init') {
        remote.username = data.username || "Player";
        remote.teamPref = data.teamPref || 'auto';
        if (remote.nametag) remote.mesh.remove(remote.nametag);
        remote.nametag = createNametag(remote.username, remote.team || 'none', remote.hp || 100, remote.maxHp || 100); 
        remote.nametag.position.y = 4.5; 
        remote.mesh.add(remote.nametag);
        
        if (isHost) {
            let t = 'none';
            if (currentGamemode === 'TDM' || currentGamemode === 'CTF') {
                if (remote.teamPref === 'red' || remote.teamPref === 'blue') {
                    t = remote.teamPref;
                } else {
                    const reds = Object.values(remotePlayers).filter(r => r.team === 'red').length + (gameState.myTeam === 'red' ? 1 : 0);
                    const blues = Object.values(remotePlayers).filter(r => r.team === 'blue').length + (gameState.myTeam === 'blue' ? 1 : 0);
                    t = (reds <= blues) ? 'red' : 'blue';
                }
            }
            remote.team = t;
            netSendTo(senderId, {
                type: 'init_game',
                mode: currentGamemode,
                map: gameState.map,
                timer: gameState.timer,
                timeLimit: gameState.timeLimit,
                scoreLimit: gameState.scoreLimit,
                scoreRed: gameState.scoreRed,
                scoreBlue: gameState.scoreBlue,
                team: t,
                flagRed: gameState.flagRed,
                flagBlue: gameState.flagBlue
            });
        }
    }

    if (data.type === 'pos') {
        const oldPos = remote.mesh.position.clone();
        if (typeof data.hp === 'number' && remote.hp !== data.hp) {
            remote.hp = data.hp;
            if (remote.nametag) {
                remote.mesh.remove(remote.nametag);
                remote.nametag = createNametag(remote.username, remote.team || 'none', remote.hp, remote.maxHp || 100);
                remote.nametag.position.y = 4.5;
                remote.mesh.add(remote.nametag);
            }
        }
        remote.maxHp = data.maxHp; 
        remote.coins = data.coins; 
        remote.speed = data.speed;
        remote.kothScore = data.kothScore || 0;
        remote.mesh.position.copy(data.pos); 

        const q = new THREE.Quaternion(data.rot.x, data.rot.y, data.rot.z, data.rot.w); 
        const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
        
        remote.moving = oldPos.distanceTo(data.pos) > 0.05;
        remote.mesh.rotation.y = euler.y; 
        remote.head.rotation.x = euler.x; 
        remote.rArm.rotation.x = -Math.PI/3 + euler.x;

        if (data.isCrouching) { 
            remote.mesh.scale.y = 0.5; 
            remote.nametag.visible = false; 
        } else { 
            remote.mesh.scale.y = 1.0; 
            remote.nametag.visible = true; 
            remote.nametag.quaternion.copy(camera.quaternion); 
        }

        if (data.gun && remote.currentGun !== data.gun) { 
            updateWeaponVisuals(remote, data.gun); 
        }
    }

    if (data.type === 'gun') {
        updateWeaponVisuals(remote, data.gun);
    }

    if (data.type === 'init_game') {
        currentGamemode = data.mode;
        gameState.mode = data.mode;
        gameState.timer = data.timer;
        gameState.timeLimit = (data.timeLimit !== undefined) ? data.timeLimit : 300;
        gameState.scoreLimit = (data.scoreLimit !== undefined) ? data.scoreLimit : 25;
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        gameState.myTeam = data.team;
        if (data.flagRed) gameState.flagRed = data.flagRed;
        if (data.flagBlue) gameState.flagBlue = data.flagBlue;
        if (data.map) gameState.map = data.map;
        initGamemode(currentGamemode, false, gameState.map);
        gameState.started = true;
        updateMyNametag();
        updateMatchHUD();
        const hudRoomEl = document.getElementById('ingame-room-hud');
        const hudCodeEl = document.getElementById('hud-room-code');
        if (hudRoomEl && hudCodeEl && currentRoomCode) {
            hudRoomEl.style.display = 'flex';
            hudCodeEl.innerText = formatRoomCode(currentRoomCode);
        }
    }

    if (data.type === 'match_over') {
        gameState.started = false;
        alert("MATCH OVER!\nRED: " + gameState.scoreRed + " | BLUE: " + gameState.scoreBlue);
    }

    if (data.type === 'match_over_gungame') {
        gameState.started = false;
        alert("GUN GAME WINNER: " + data.winner);
    }

    if (data.type === 'match_over_koth') {
        gameState.started = false;
        alert("KOTH MATCH OVER! WINNER: " + data.winner + " with " + data.score + " points!");
    }

    if (data.type === 'sync_score') {
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        updateMatchHUD();
    }

    if (data.type === 'sync_ctf') {
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        gameState.flagRed = data.flagRed;
        gameState.flagBlue = data.flagBlue;
        updateMatchHUD();
    }

    if (data.type === 'respawn') {
        if (remote) {
            remote.hp = remote.maxHp || 100;
            if (remote.nametag) {
                remote.mesh.remove(remote.nametag);
                remote.nametag = createNametag(remote.username, remote.team || 'none', remote.hp, remote.maxHp || 100);
                remote.nametag.position.y = 4.5;
                remote.mesh.add(remote.nametag);
            }
        }
    }

    if (data.type === 'vip') {
        remote.mat.color.setHex(0xFFD700); 
        remote.mat.emissive.setHex(0x554400); 
        remote.matPants.color.setHex(0xFFD700); 
    }

    // Smite network synchronization (Victim & Observers)
    if (data.type === 'smite_victim_start' || (data.type === 'smite_strike_sequence' && data.targetType === 'peer' && data.targetId === myPeerId)) {
        isSmiteInvincible = true;
        isSmiteCinematicActive = true;
        if (playerBody) playerBody.velocity.set(0, 0, 0);

        const myPos = camera ? camera.position.clone() : new THREE.Vector3();
        startContinuousSmiteLightning(myPos, null, 'self', myPeerId, data.duration || 5.5);

        playSmiteCinematic(true, () => {
            stopContinuousSmiteLightning(true);
            isSmiteInvincible = false;
            myHp = 0;
            die();
        });
    }

    if (data.type === 'smite_strike_sequence') {
        if (data.targetId !== myPeerId && data.casterId !== myPeerId) {
            const pos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
            let targetRef = null;
            if (data.targetType === 'peer' && remotePlayers[data.targetId]) {
                targetRef = remotePlayers[data.targetId].mesh;
            } else if (data.targetType === 'bot') {
                const b = activeBots.find(x => x.id === data.targetId);
                if (b) {
                    b.isSmiteTrapped = true;
                    targetRef = b.mesh;
                }
            }

            adminLog(`⚡ [OBSERVER] Divine Smite raining upon ${data.targetName || 'target'}!`);
            startContinuousSmiteLightning(pos, targetRef, data.targetType, data.targetId, data.duration || 5.5, () => {
                if (data.targetType === 'bot') {
                    const b = activeBots.find(x => x.id === data.targetId);
                    if (b) {
                        b.isSmiteTrapped = false;
                        b.hp = 0;
                        if (b.mesh) b.mesh.visible = false;
                    }
                }
            });
        }
    }

    if (data.type === 'smite_sequence_end') {
        if (currentSmiteStorm && currentSmiteStorm.targetId === data.targetId) {
            stopContinuousSmiteLightning(true);
        }
        if (isSmiteCinematicActive && isSmiteInvincible) {
            closeSmiteCinematic();
            isSmiteInvincible = false;
        }
    }

    if (data.type === 'knockback') {
        if (playerBody) {
            playerBody.velocity.x += data.forceX || 0;
            playerBody.velocity.y = Math.max(playerBody.velocity.y, (data.forceY !== undefined ? data.forceY : 0.5));
            playerBody.velocity.z += data.forceZ || 0;
            if (data.attacker) lastHitBy = data.attacker;
        }
    }

    if (data.type === 'hit') {
        if (data.target === myPeerId) {
            if (myShield || isSmiteInvincible) return;
            if (gameState.mode === 'KOTH' || currentGamemode === 'KOTH') {
                data.damage = 0; // Zero damage in KOTH!
            }
            myHp -= data.damage || 0;
            lastHitBy = senderId;
            updateUI();
            updateMyNametag();
            if (myHp <= 0) die();
        }
    }

    if (data.type === 'killed') {
        if (data.victim === senderId && remote) remote.deaths++;
        if (data.killer === myPeerId) {
            myKills++;
            myCoins += 100;
            updateUI();
            saveLocalProfile();
            adminLog(`You eliminated ${remote.username}! (+100c)`);

            if (currentGamemode === 'Gun Game' || currentGamemode === 'GUN_GAME') {
                const prog = ['default', 'pistol', 'smg', 'shotgun', 'lmg', 'sniper', 'katana'];
                let idx = prog.indexOf(myGun) + 1;
                if (idx < prog.length) {
                    myInventory[0] = prog[idx];
                    window.equipSlot(0);
                    updateUI();
                    adminLog(`Gun Game Level Up: ${prog[idx]}`);
                } else {
                    gameState.started = false;
                    netBroadcast({ type: 'match_over_gungame', winner: myUsername });
                    alert("GUN GAME VICTORY: " + myUsername + "!");
                }
            }
        } else if (remotePlayers[data.killer]) {
            remotePlayers[data.killer].kills++;
            adminLog(`${remotePlayers[data.killer].username} eliminated ${remote.username}.`);
        }

        if (currentGamemode === 'TDM') {
            if (remote && remote.team === 'red') gameState.scoreBlue++;
            else if (remote && remote.team === 'blue') gameState.scoreRed++;
            else if (data.victim === myPeerId) {
                if (gameState.myTeam === 'red') gameState.scoreBlue++;
                else if (gameState.myTeam === 'blue') gameState.scoreRed++;
            }
            updateMatchHUD();
        }
    }

    if (data.type === 'admin_cmd') {
        if (data.action === 'kick') {
            alert("You have been terminated by the administrator.");
            window.location.reload();
        }
        if (data.action === 'give_vip') {
            alert("Admin elevated your privileges: VIP UNLOCKED!");
            opCards.forEach(c => c.apply());
            document.getElementById('vip-modal').classList.add('hidden');
            netBroadcast({ type: 'vip' });
            updateUI();
        }
        if (data.action === 'set_stats') {
            myHp = parseFloat(data.hp);
            myMaxHp = parseFloat(data.maxHp);
            myCoins = parseFloat(data.coins);
            baseSpeed = parseFloat(data.speed);
            mySpeed = baseSpeed;
            updateUI();
            saveLocalProfile();
        }
        if (data.action === 'give_weapon') {
            let slotIdx = myInventory.indexOf(null);
            if (slotIdx === -1) slotIdx = currentSlot;
            myInventory[slotIdx] = data.weapon;
            updateHotbarUI();
            window.equipSlot(slotIdx);
        }
        if (data.action === 'give_card') {
            const avail = availableCards.filter(c => c.rank === 'Epic');
            if (avail.length > 0) {
                const c = avail[Math.floor(Math.random() * avail.length)];
                c.apply();
                adminLog("Admin injected module: " + c.name);
            }
        }
    }
}

// ============================================================================
// MATCH RULES, RESPAWN, & HUD
// ============================================================================
function respawn() {
    let spawnX = 0, spawnY = 80, spawnZ = 0;
    const isKoth = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH');
    if (gameState.mode === 'TDM' || gameState.mode === 'CTF' || currentGamemode === 'TDM' || currentGamemode === 'CTF') {
        if (gameState.myTeam === 'red') { spawnX = 450; spawnY = 70; spawnZ = 0; }
        else if (gameState.myTeam === 'blue') { spawnX = -450; spawnY = 70; spawnZ = 0; }
        else { spawnX = (Math.random() < 0.5 ? 450 : -450); spawnY = 70; spawnZ = 0; }
    } else if (isKoth) {
        spawnX = (Math.random() < 0.5 ? 90 : -90); 
        spawnY = 20; 
        spawnZ = (Math.random() < 0.5 ? 90 : -90);
        myInventory = ['knockback_rifle', 'knock_stick', null, null, null];
        myOwnedWeapons = ['knockback_rifle', 'knock_stick'];
        updateHotbarUI();
    } else {
        spawnX = (Math.random() - 0.5) * 100; spawnY = 80; spawnZ = (Math.random() - 0.5) * 100;
    }
    
    if (playerBody) {
        playerBody.position.set(spawnX, spawnY, spawnZ);
        playerBody.velocity.set(0,0,0);
    }
    isDead = false;
    updateMyNametag();
}

function updateMatchHUD() {
    if (gameState.timeLimit === 0) {
        document.getElementById('match-timer').innerText = "∞";
    } else {
        const m = Math.floor(gameState.timer / 60);
        const s = gameState.timer % 60;
        document.getElementById('match-timer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
    document.getElementById('match-score-red').innerText = gameState.scoreRed;
    document.getElementById('match-score-blue').innerText = gameState.scoreBlue;
}

function matchTimerTick() {
    if (!gameState.started) return;
    
    const usesTimer = ['TDM', 'FFA', 'KOTH', 'ZOMBIES'].includes(gameState.mode);
    if (usesTimer && gameState.timeLimit > 0 && gameState.timer > 0 && isHost) {
        gameState.timer--;
        if (gameState.timer % 5 === 0) {
            netBroadcast({ type: 'sync_score', scoreRed: gameState.scoreRed, scoreBlue: gameState.scoreBlue });
        }
    }

    if (isHost && gameState.scoreLimit > 0 && (gameState.mode === 'TDM' || gameState.mode === 'FFA')) {
        if (gameState.scoreRed >= gameState.scoreLimit || gameState.scoreBlue >= gameState.scoreLimit) {
            gameState.started = false;
            netBroadcast({ type: 'match_over' });
            alert("MATCH OVER! TARGET SCORE REACHED!\nRED: " + gameState.scoreRed + " | BLUE: " + gameState.scoreBlue);
        }
    }
    
    const isKothMatch = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH');
    if (isKothMatch) {
        if (playerBody && Math.abs(playerBody.position.x) < 40 && Math.abs(playerBody.position.z) < 40 && playerBody.position.y > 5 && playerBody.position.y < 30) {
            myKothScore++;
        }
        activeBots.forEach(b => {
            if (b.hp > 0 && Math.abs(b.pos.x) < 40 && Math.abs(b.pos.z) < 40 && b.pos.y > 5 && b.pos.y < 30) {
                b.kothScore = (b.kothScore || 0) + 1;
            }
        });
        updateKothLeaderboard();
        
        if (isHost && gameState.timer <= 0) {
            gameState.started = false;
            let win = { name: myUsername, score: myKothScore };
            Object.values(remotePlayers).forEach(r => { 
                if ((r.kothScore || 0) > win.score) win = { name: r.username, score: (r.kothScore || 0) }; 
            });
            activeBots.forEach(b => {
                if ((b.kothScore || 0) > win.score) win = { name: b.name, score: (b.kothScore || 0) };
            });
            netBroadcast({ type: 'match_over_koth', winner: win.name, score: win.score });
            alert("KOTH MATCH OVER! WINNER: " + win.name + " with " + win.score + " points!");
        }
    }
    
    if (isHost && gameState.mode === 'CTF') {
        const checkFlag = (flag, flagName, basePos) => {
            if (!flag.carrier) {
                let pickedUpBy = null;
                if (gameState.myTeam !== flagName && playerBody.position.distanceTo(flag.pos) < 15 && myHp > 0) pickedUpBy = myPeerId;
                else {
                    Object.keys(remotePlayers).forEach(id => {
                        if (remotePlayers[id].team !== flagName && remotePlayers[id].mesh.position.distanceTo(flag.pos) < 15 && remotePlayers[id].hp > 0) pickedUpBy = id;
                    });
                }
                
                if (pickedUpBy) { 
                    flag.home = false; flag.carrier = pickedUpBy; 
                } else if (!flag.home) {
                    let returnedBy = null;
                    if (gameState.myTeam === flagName && playerBody.position.distanceTo(flag.pos) < 15 && myHp > 0) returnedBy = myPeerId;
                    else {
                         Object.keys(remotePlayers).forEach(id => {
                             if (remotePlayers[id].team === flagName && remotePlayers[id].mesh.position.distanceTo(flag.pos) < 15 && remotePlayers[id].hp > 0) returnedBy = id;
                         });
                    }
                    if (returnedBy) { flag.home = true; flag.pos = { x: basePos.x, y: basePos.y, z: basePos.z }; flag.carrier = null; }
                }
            } else {
                if (flag.carrier === myPeerId && myHp <= 0) flag.carrier = null;
                else if (flag.carrier !== myPeerId && remotePlayers[flag.carrier] && remotePlayers[flag.carrier].hp <= 0) flag.carrier = null;
                else if (flag.carrier === myPeerId) flag.pos = playerBody.position.clone();
                else if (remotePlayers[flag.carrier]) flag.pos = remotePlayers[flag.carrier].mesh.position.clone();
                else flag.carrier = null; 
                
                if (flag.carrier) {
                    let carrierTeam = flag.carrier === myPeerId ? gameState.myTeam : (remotePlayers[flag.carrier] ? remotePlayers[flag.carrier].team : 'none');
                    let carrierBasePos = carrierTeam === 'red' ? new THREE.Vector3(300, 10, 0) : new THREE.Vector3(-300, 10, 0);
                    if (flag.pos && typeof flag.pos.distanceTo === 'function' && flag.pos.distanceTo(carrierBasePos) < 25) {
                        if (carrierTeam === 'red') gameState.scoreRed++;
                        if (carrierTeam === 'blue') gameState.scoreBlue++;
                        flag.home = true; flag.carrier = null; flag.pos = { x: basePos.x, y: basePos.y, z: basePos.z };
                    }
                }
            }
        };
        
        checkFlag(gameState.flagRed, 'red', {x: 300, y: 10, z: 0});
        checkFlag(gameState.flagBlue, 'blue', {x: -300, y: 10, z: 0});
        
        netBroadcast({ 
            type: 'sync_ctf', 
            scoreRed: gameState.scoreRed, 
            scoreBlue: gameState.scoreBlue, 
            flagRed: gameState.flagRed, 
            flagBlue: gameState.flagBlue 
        });
        
        if (gameState.scoreRed >= 5 || gameState.scoreBlue >= 5) {
            gameState.started = false;
            netBroadcast({ type: 'match_over' });
            alert("CTF MATCH OVER! SCORES:\nRED: " + gameState.scoreRed + "\nBLUE: " + gameState.scoreBlue);
        }
    }
    
    updateMatchHUD();
    if (isHost && usesTimer && gameState.timer <= 0 && gameState.mode !== 'KOTH') {
        gameState.started = false;
        netBroadcast({ type: 'match_over' });
        alert("MATCH OVER! SCORES:\nRED: " + gameState.scoreRed + "\nBLUE: " + gameState.scoreBlue);
    }
}
setInterval(matchTimerTick, 1000);

function updateKothLeaderboard() {
    const isKoth = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH');
    if (!isKoth) { 
        document.getElementById('koth-leaderboard').style.display = 'none'; 
        return; 
    }
    document.getElementById('koth-leaderboard').style.display = 'flex';
    
    let scores = [];
    scores.push({ name: myUsername, score: myKothScore });
    Object.values(remotePlayers).forEach(r => scores.push({ name: r.username, score: r.kothScore || 0 }));
    activeBots.forEach(b => scores.push({ name: b.name, score: b.kothScore || 0 }));
    scores.sort((a,b) => b.score - a.score);
    
    const lines = document.getElementById('koth-lines');
    lines.innerHTML = '';
    scores.slice(0, 5).forEach((s, idx) => {
        lines.innerHTML += `<div style="display:flex; justify-content:space-between; color:${idx===0?'#00ff00':'#ccc'};"><span>${s.name.substring(0,10)}</span><span>${s.score}</span></div>`;
    });
}

function formatTime(ms) { 
    const s = Math.floor(ms/1000); 
    const m = Math.floor(s/60); 
    return `${m}m ${s%60}s`; 
}

function adminLog(msg) {
    const feed = document.getElementById('admin-live-feed');
    if (!feed) return;
    const item = document.createElement('div'); 
    item.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    feed.appendChild(item); 
    feed.scrollTop = feed.scrollHeight;
}

// ============================================================================
// ADMINEX OS v2.0 DASHBOARD CONTROLLER (CONNECTED VIA P2P MESH)
// ============================================================================
let lastAdminDashboardUpdate = 0;
function updateAdminDashboard() {
    const dash = document.getElementById('admin-dashboard');
    if (!dash || dash.classList.contains('hidden')) return;
    
    const now = Date.now();
    if (now - lastAdminDashboardUpdate < 1000 && !window.forceAdminUpdate) return;
    lastAdminDashboardUpdate = now;
    window.forceAdminUpdate = false;

    const list = document.getElementById('admin-player-list');
    
    Object.keys(remotePlayers).forEach(peerId => {
        const rp = remotePlayers[peerId];
        let btn = document.getElementById('admin-btn-' + peerId);
        if (!btn) {
            btn = document.createElement('div');
            btn.id = 'admin-btn-' + peerId;
            btn.style.padding = '5px'; 
            btn.style.border = '1px solid #00f3ff'; 
            btn.style.cursor = 'pointer';
            list.appendChild(btn);
        }
        btn.style.background = (adminSelectedPeer === peerId) ? 'rgba(0, 243, 255, 0.3)' : 'transparent';
        btn.innerHTML = `<b style="color:#fff;">${rp.username}</b> <span style="color:#aaa; font-size:12px;">(${peerId.substring(0,6)}...)</span><br><span style="color:#0f0;">Uptime: ${formatTime(now - rp.connectedAt)}</span><br><span style="color:#ffff00;">K: ${rp.kills} | D: ${rp.deaths}</span>`;
        btn.onclick = () => {
            adminSelectedPeer = peerId;
            document.getElementById('inspector-name').innerText = rp.username + " (" + peerId.substring(0,8) + ")";
            document.getElementById('admin-set-hp').value = Math.floor(rp.hp || 100);
            document.getElementById('admin-set-maxhp').value = Math.floor(rp.maxHp || 100);
            document.getElementById('admin-set-coins').value = Math.floor(rp.coins || 0);
            document.getElementById('admin-set-speed').value = Math.floor(rp.speed || 25);
            window.forceAdminUpdate = true;
            updateAdminDashboard();
        };
    });
    
    Array.from(list.children).forEach(child => {
        const id = child.id.replace('admin-btn-', '');
        if (!remotePlayers[id]) list.removeChild(child);
    });
    
    const chartType = document.getElementById('admin-chart-type').value;
    const container = document.getElementById('admin-chart-container');
    
    const allEntities = Object.keys(remotePlayers).map(peerId => {
        const r = remotePlayers[peerId];
        return { 
            id: peerId, 
            name: r.username || "Player", 
            val: (chartType === 'hp' ? r.hp : (chartType === 'kills' ? r.kills : (chartType === 'deaths' ? r.deaths : r.coins))) || 0 
        };
    });
    allEntities.push({ 
        id: 'my-self', 
        name: myUsername + " (You)", 
        val: (chartType === 'hp' ? myHp : (chartType === 'kills' ? myKills : (chartType === 'deaths' ? myDeaths : myCoins))) 
    });
    let maxVal = Math.max(1, ...allEntities.map(e => e.val));
    
    allEntities.forEach(e => {
        let barWraps = document.getElementById('admin-chart-' + e.id);
        let bar, valLbl, lbl;
        if (!barWraps) {
            barWraps = document.createElement('div');
            barWraps.id = 'admin-chart-' + e.id;
            barWraps.style.flex = "1"; 
            barWraps.style.display = "flex"; 
            barWraps.style.flexDirection = "column"; 
            barWraps.style.justifyContent = "flex-end"; 
            barWraps.style.alignItems = "center"; 
            barWraps.style.height = "100%";
            
            valLbl = document.createElement('span'); 
            valLbl.className = 'val-lbl'; 
            valLbl.style.fontSize = "10px"; 
            valLbl.style.color = "#fff"; 
            valLbl.style.marginBottom = "2px";
            
            bar = document.createElement('div'); 
            bar.className = 'bar';
            bar.style.width = "100%"; 
            bar.style.transition = "height 0.2s, background 0.2s";
            
            lbl = document.createElement('span'); 
            lbl.className = 'name-lbl'; 
            lbl.style.fontSize = "10px"; 
            lbl.style.color = "#fff"; 
            lbl.style.marginTop = "2px"; 
            lbl.style.overflow = "hidden"; 
            lbl.style.whiteSpace = "nowrap"; 
            lbl.style.textOverflow = "ellipsis"; 
            lbl.style.maxWidth = "100%";
            
            barWraps.appendChild(valLbl); 
            barWraps.appendChild(bar); 
            barWraps.appendChild(lbl);
            container.appendChild(barWraps);
        } else {
            valLbl = barWraps.querySelector('.val-lbl');
            bar = barWraps.querySelector('.bar');
            lbl = barWraps.querySelector('.name-lbl');
        }
        
        const hPct = Math.max(2, (e.val / maxVal)*100);
        bar.style.height = hPct + "%"; 
        bar.style.background = chartType === 'hp' ? '#0f0' : (chartType === 'deaths' ? '#f00' : '#ff0');
        lbl.innerText = e.name.substring(0,5);
        valLbl.innerText = Math.floor(e.val);
    });

    Array.from(container.children).forEach(child => {
        const id = child.id.replace('admin-chart-', '');
        if (id !== 'my-self' && !remotePlayers[id]) container.removeChild(child);
    });
}

// Mobile Controls
let joysticksInitialized = false;
function showMobileControls() {
    if (!isMobile) return;
    document.getElementById('mobile-buttons').style.display = 'flex'; 
    document.getElementById('touch-zones').style.display = 'block';
    if (!joysticksInitialized) {
        initJoysticks();
        joysticksInitialized = true;
    }
}
function hideMobileControls() {
    if (!isMobile) return;
    document.getElementById('mobile-buttons').style.display = 'none'; 
    document.getElementById('touch-zones').style.display = 'none';
}

function initGamemode(mode, isNewGame = true, mapId = null) {
    if (mapId) gameState.map = mapId;
    if (!gameState.map) {
        const key = (mode === 'Gun Game') ? 'GUN_GAME' : ((mode === 'Zombies') ? 'ZOMBIES' : mode);
        gameState.map = MAP_CATALOG[key] ? MAP_CATALOG[key][0].id : 'ffa_original';
    }
    console.log("[Gamemode Init]:", mode, "Map:", gameState.map);
    document.getElementById('match-hud').style.display = 'flex';
    document.getElementById('match-mode-text').innerText = `${mode} — ${getMapName(gameState.map)}`;
    gameState.mode = mode;
    currentGamemode = mode;
    
    if (isNewGame) {
        gameState.started = true;
        gameState.timer = 5 * 60;
        gameState.scoreRed = 0;
        gameState.scoreBlue = 0;
    }
    
    if (mode === 'Gun Game' || mode === 'GUN_GAME') {
        myInventory = ['default', null, null, null, null];
        currentSlot = 0;
        updateHotbarUI();
        if (typeof window.equipSlot === 'function') window.equipSlot(0);
    } else if (mode === 'KOTH') {
        // KOTH Exclusive: Only Knockback Rifle & Knock Stick are allowed
        myInventory = ['knockback_rifle', 'knock_stick', null, null, null];
        myOwnedWeapons = ['knockback_rifle', 'knock_stick'];
        currentSlot = 0;
        updateHotbarUI();
        if (typeof window.equipSlot === 'function') window.equipSlot(0);
    } else {
        updateHotbarUI();
        if (typeof window.equipSlot === 'function') window.equipSlot(currentSlot || 0);
    }
    
    for (const ob of mapMeshes) scene.remove(ob);
    for (const ob of mapBodies) world.removeBody(ob);
    for (const d of mapDecorations) scene.remove(d);
    mapMeshes = []; 
    mapBodies = [];
    mapDecorations = [];
    animatedMapObjects = [];
    activeWaterPlanes = [];
    activeJumpPads = [];
    activePortals = [];
    activeEasterEggs = [];
    buildMap(mode, gameState.map);
    respawn();
    updateMatchHUD();
}

// ============================================================================
// CORE INITIALIZATION & DOM EVENTS
// ============================================================================
function init() {
    loadLocalProfile();

    // Initialize Map Dropdowns for Host and Offline Bots
    const hostGamemodeEl = document.getElementById('host-gamemode');
    if (hostGamemodeEl) {
        updateMapDropdown('host-map', hostGamemodeEl.value);
        hostGamemodeEl.addEventListener('change', (e) => {
            updateMapDropdown('host-map', e.target.value);
        });
    }

    const botGamemodeEl = document.getElementById('bot-gamemode');
    if (botGamemodeEl) {
        updateMapDropdown('bot-map', botGamemodeEl.value);
        botGamemodeEl.addEventListener('change', (e) => {
            updateMapDropdown('bot-map', e.target.value);
        });
    }

    // Pre-initialize PeerJS to acquire peer ID immediately
    initPeer(null, (id) => {
        console.log("[PeerJS Ready] My Local Peer ID:", id);
    });

    // Server Browser Initial Load & Auto-Refresh
    fetchLobbies();
    setInterval(() => {
        const blocker = document.getElementById('blocker');
        if (blocker && blocker.style.display !== 'none') {
            fetchLobbies();
        }
    }, 4000);

    const refBtn = document.getElementById('btn-refresh-servers');
    if (refBtn) {
        refBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const originalText = refBtn.innerText;
            refBtn.innerText = '↻ ...';
            fetchLobbies().finally(() => {
                setTimeout(() => { refBtn.innerText = originalText; }, 500);
            });
        });
    }

    window.addEventListener('touchstart', () => { 
        if (!isMobile) { 
            isMobile = true; 
            document.body.classList.add('mobile-mode'); 
        } 
    }, { once: true });

    document.addEventListener('touchstart', (e) => {
        if (!isMobileDeploy || myHp <= 0) return;
        if (e.target.closest('#mobile-buttons') || e.target.closest('#touch-zones') || e.target.closest('.modal') || e.target.closest('#hotbar') || e.target.closest('#ui-triggers') || e.target.closest('.menu-bg')) return;
        shoot();
    });

    // Username Input Change
    const unInput = document.getElementById('my-username');
    if (unInput) {
        unInput.addEventListener('change', (e) => {
            const val = e.target.value.trim();
            if (val && val.length >= 2) {
                myUsername = val;
                unInput.style.borderColor = '#00f3ff';
                unInput.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.3)';
                saveLocalProfile();
                updateMyNametag();
            }
        });
    }

    // Host Button Click
    document.getElementById('btn-host').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!ensureCustomNametag()) return;
        hostMatch();
    });

    // Join Button Click
    document.getElementById('btn-join').addEventListener('click', (e) => { 
        e.stopPropagation(); 
        const targetId = document.getElementById('join-id').value.trim(); 
        if (!targetId) {
            alert("Please enter a Room Code or Host Peer ID.");
            return;
        }
        if (!ensureCustomNametag()) return;
        joinMatch(targetId);
    });

    // Solo Deploy Button Click
    document.getElementById('btn-solo').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!ensureCustomNametag()) return;
        deploySolo();
    });

    // Copy Peer ID button
    const btnCopyPeerId = document.getElementById('btn-copy-peer-id');
    if (btnCopyPeerId) {
        btnCopyPeerId.addEventListener('click', (e) => {
            e.stopPropagation();
            if (myPeerId) {
                navigator.clipboard.writeText(myPeerId).then(() => {
                    btnCopyPeerId.innerText = 'COPIED!';
                    setTimeout(() => { btnCopyPeerId.innerText = 'COPY'; }, 1500);
                }).catch(() => {
                    prompt("Copy your Peer ID:", myPeerId);
                });
            }
        });
    }

    // Ingame Room Code Copy button
    const btnHudCopy = document.getElementById('btn-hud-copy-code');
    if (btnHudCopy) {
        btnHudCopy.addEventListener('click', (e) => {
            e.stopPropagation();
            const codeToCopy = formatRoomCode(currentRoomCode || myPeerId);
            navigator.clipboard.writeText(codeToCopy).then(() => {
                btnHudCopy.innerText = 'COPIED!';
                setTimeout(() => { btnHudCopy.innerText = 'COPY'; }, 1500);
            }).catch(() => {
                prompt("Room Code:", codeToCopy);
            });
        });
    }

    // Deploy with Bots button
    const btnDeployBots = document.getElementById('btn-deploy-bots');
    if (btnDeployBots) {
        btnDeployBots.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!ensureCustomNametag()) return;
            startBotMatch();
        });
    }

    // Blocker Background Click (Dev Solo Deploy)
    document.getElementById('blocker').addEventListener('click', (e) => { 
        if (e.target.id === 'blocker') { 
            if (!ensureCustomNametag()) return;
            deploySolo();
        } 
    });

    document.body.oncontextmenu = () => false;

    // Three.js Scene Setup - High Fidelity Sci-Fi Atmosphere
    scene = new THREE.Scene(); 
    scene.background = new THREE.Color( 0x060814 ); 
    scene.fog = new THREE.FogExp2( 0x060814, 0.0022 );

    // Rich dual-tone cyberpunk hemisphere lighting (Cyan sky, Neon purple/magenta ground bounce)
    const light = new THREE.HemisphereLight( 0x00f3ff, 0x1d0533, 0.65 ); 
    light.position.set( 0, 150, 0 ); 
    scene.add( light );

    // Balanced high-fidelity main directional light with soft shadows (prevents highlight bleaching)
    dirLight = new THREE.DirectionalLight( 0xffffff, 0.95 ); 
    dirLight.position.set( 120, 240, 100 ); 
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 220; 
    dirLight.shadow.camera.bottom = -220; 
    dirLight.shadow.camera.left = -220; 
    dirLight.shadow.camera.right = 220; 
    dirLight.shadow.mapSize.width = 2048; 
    dirLight.shadow.mapSize.height = 2048; 
    dirLight.shadow.bias = -0.0005;
    scene.add( dirLight );

    // Soft atmospheric fill light
    const fillLight = new THREE.DirectionalLight( 0x4488bb, 0.30 );
    fillLight.position.set( -120, 100, -100 );
    scene.add( fillLight );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
    viewModelContainer = new THREE.Group();
    viewModelContainer.position.set(0.4, -0.3, -0.6);
    camera.add(viewModelContainer);

    if (typeof THREE.PointerLockControls !== 'undefined') {
        controls = new THREE.PointerLockControls( camera, document.body );
    }

    const blocker = document.getElementById( 'blocker' );
    controls.addEventListener( 'lock', () => { 
        blocker.style.display = 'none'; 
        document.getElementById('shop-modal').classList.add('hidden'); 
        document.getElementById('vip-modal').classList.add('hidden'); 
        document.getElementById('admin-modal').classList.add('hidden'); 
        document.getElementById('hotbar').style.display = 'flex'; 
    });

    controls.addEventListener( 'unlock', () => { 
        if (isSmiteCinematicActive) {
            return;
        }
        isScoped = false; 
        camera.fov = 75; 
        camera.updateProjectionMatrix(); 
        document.getElementById('scope-overlay').classList.add('hidden'); 
        document.getElementById('hotbar').style.display = 'none'; 
        if (myHp > 0 && !isMobileDeploy) {
            const settingsModal = document.getElementById('settings-modal');
            const isSettingsOpen = settingsModal && !settingsModal.classList.contains('hidden');
            const shopModal = document.getElementById('shop-modal');
            const isShopOpen = shopModal && !shopModal.classList.contains('hidden');
            const vipModal = document.getElementById('vip-modal');
            const isVipOpen = vipModal && !vipModal.classList.contains('hidden');
            const adminModal = document.getElementById('admin-modal');
            const isAdminOpen = adminModal && !adminModal.classList.contains('hidden');
            
            if (isSettingsOpen || isShopOpen || isVipOpen || isAdminOpen) {
                return;
            }

            if (gameState.started) {
                document.getElementById('exit-panel').classList.remove('hidden');
                document.getElementById('exit-panel').style.display = 'flex';
            } else {
                blocker.style.display = 'flex'; 
            }
        }
    });

function resumeGame() {
    const exitPanel = document.getElementById('exit-panel');
    if (exitPanel) {
        exitPanel.classList.add('hidden');
        exitPanel.style.display = 'none';
    }
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) settingsModal.classList.add('hidden');
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) shopModal.classList.add('hidden');
    const vipModal = document.getElementById('vip-modal');
    if (vipModal) vipModal.classList.add('hidden');
    const adminModal = document.getElementById('admin-modal');
    if (adminModal) adminModal.classList.add('hidden');

    const hotbar = document.getElementById('hotbar');
    if (hotbar) hotbar.style.display = 'flex';

    if (!isMobileDeploy && myHp > 0 && controls && !controls.isLocked) {
        try {
            controls.lock();
        } catch(e) {
            console.warn("Could not lock controls:", e);
        }
    }
}

    // Exit Panel Actions
    document.getElementById('btn-resume-match').addEventListener('click', () => {
        resumeGame();
    });
    
    document.getElementById('btn-exit-match').addEventListener('click', () => {
        window.location.reload();
    });

    scene.add( controls.getObject() );

    document.addEventListener('keydown', onKeyDown); 
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', (e) => { 
        if (!controls.isLocked || myHp <= 0) return; 
        if (e.button === 2) toggleScope(); 
        else if (e.button === 0) shoot(); 
    });

    renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } ); 
    renderer.setPixelRatio( window.devicePixelRatio ); 
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    renderer.toneMapping = THREE.NoToneMapping; // Single unified ACES tone mapping in RTXUberShader
    renderer.toneMappingExposure = 1.0; 
    document.body.appendChild( renderer.domElement ); 
    window.addEventListener('resize', onWindowResize, false);

    const renderScene = new THREE.RenderPass( scene, camera );
    // Clean, silky smooth Gaussian bloom (16-bit Half-Float Target: eliminates 8-bit banding & graininess)
    bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.22, 0.20, 0.92 ); 
    bloomPass.threshold = 0.92; 
    bloomPass.strength = gameSettings.bloomStrength !== undefined ? gameSettings.bloomStrength : 0.22; 
    bloomPass.radius = gameSettings.bloomRadius !== undefined ? gameSettings.bloomRadius : 0.20;
    bloomPass.enabled = gameSettings.enableBloom;

    rtxPass = new THREE.ShaderPass( RTXUberShader );

    composer = new THREE.EffectComposer( renderer ); 
    composer.addPass( renderScene ); 
    composer.addPass( bloomPass );
    composer.addPass( rtxPass );

    loadSettings();
    setupSettingsUI();
    updateJumpHUD();
    applySettings();

    // Cannon.js Physics
    world = new CANNON.World(); 
    world.gravity.set(0, -60, 0); 
    physicsMaterial = new CANNON.Material("standard");
    const physicsContactMaterial = new CANNON.ContactMaterial( physicsMaterial, physicsMaterial, { friction: 0.0, restitution: 0.0 } ); 
    world.addContactMaterial(physicsContactMaterial);

    const shape = new CANNON.Sphere(1.5); 
    playerBody = new CANNON.Body({ mass: 5, material: physicsMaterial }); 
    playerBody.addShape(shape); 
    playerBody.position.set(0, 80, 0); 
    playerBody.linearDamping = 0.9;
    world.addBody(playerBody);

    myAvatar = createHumanoid(); 
    myAvatar.matTorso.color.setHex(0x0055ff); 
    myAvatar.matTorso.emissive.setHex(0x001155); 
    scene.add(myAvatar.group);
    updateMyNametag();

    buildMap('FFA'); 
    setupUIEvents(); 
    updateUI(); 
    updateHotbarUI(); 
    animate();
}

function deploySolo() {
    if (!ensureCustomNametag()) return;
    applyClass(document.getElementById('player-class').value); 
    isHost = true; 
    currentGamemode = document.getElementById('host-gamemode') ? document.getElementById('host-gamemode').value : 'FFA'; 
    
    const hudRoomEl = document.getElementById('ingame-room-hud');
    const hudCodeEl = document.getElementById('hud-room-code');
    if (hudRoomEl && hudCodeEl) {
        hudRoomEl.style.display = 'flex';
        hudCodeEl.innerText = "SOLO PRACTICE";
    }

    initGamemode(currentGamemode, true);
    if (isMobile) { 
        isMobileDeploy = true; 
        document.getElementById('blocker').style.display = 'none'; 
        document.getElementById('hotbar').style.display = 'flex'; 
        showMobileControls(); 
    } else { 
        if (!controls.isLocked && myHp > 0) controls.lock(); 
    }
    setConnectionStatus("Solo Practice Simulation Active", true);
}

function initJoysticks() {
    if (typeof nipplejs === 'undefined') return;
    const joyMove = nipplejs.create({ zone: document.getElementById('zone-left'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'cyan' }); 
    const joyLook = nipplejs.create({ zone: document.getElementById('zone-right'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'red' });
    joyMove.on('move', (evt, data) => { gpMoveX = data.vector.x; gpMoveY = -data.vector.y; }); 
    joyMove.on('end', () => { gpMoveX = 0; gpMoveY = 0; });
    joyLook.on('move', (evt, data) => { gpLookX = data.vector.x; gpLookY = -data.vector.y; }); 
    joyLook.on('end', () => { gpLookX = 0; gpLookY = 0; });
    const bindTouch = (id, fn) => { 
        const el = document.getElementById(id); 
        el.addEventListener('touchstart', (e)=>{ e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false }); 
    };
    bindTouch('btn-m-jump', () => { if (myJumpsLeft>0){ playerBody.velocity.y = (jumpMode === 'normal' ? 22 : 25); jumpAntiGravityTimer = (jumpMode === 'normal' ? 0 : 0.5); myJumpsLeft--; canJump = false; } });
    bindTouch('btn-m-ability', () => triggerAbility()); 
    bindTouch('btn-m-scope', () => toggleScope());
}

function updateGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for(let i=0; i<gamepads.length; i++) {
        const gp = gamepads[i]; if (!gp) continue; let deadzone = 0.15;
        if (Math.abs(gp.axes[0]) > deadzone) gpMoveX = gp.axes[0]; else if (!isMobile) gpMoveX = 0;
        if (Math.abs(gp.axes[1]) > deadzone) gpMoveY = gp.axes[1]; else if (!isMobile) gpMoveY = 0;
        if (Math.abs(gp.axes[2]) > deadzone) gpLookX = gp.axes[2]; else if (!isMobile) gpLookX = 0;
        if (Math.abs(gp.axes[3]) > deadzone) gpLookY = gp.axes[3]; else if (!isMobile) gpLookY = 0;
        
        if (!gpBtnPrev[gp.index]) gpBtnPrev[gp.index] = []; const prev = gpBtnPrev[gp.index];
        if (gp.buttons[0]?.pressed && !prev[0]) { if (myJumpsLeft > 0) { playerBody.velocity.y = (jumpMode === 'normal' ? 22 : 25); jumpAntiGravityTimer = (jumpMode === 'normal' ? 0 : 0.5); myJumpsLeft--; canJump = false; } }
        if (gp.buttons[2]?.pressed && !prev[2]) triggerAbility();
        if (gp.buttons[1]?.pressed && !prev[1]) toggleCrouch(); 
        if (gp.buttons[10]?.pressed && !prev[10]) isThirdPerson = !isThirdPerson; 
        if (gp.buttons[6]?.pressed && !prev[6]) toggleScope(); 
        if (gp.buttons[7]?.pressed) shoot(); 
        if (gp.buttons[4]?.pressed && !prev[4]) window.equipSlot((currentSlot - 1 + 5) % 5);
        if (gp.buttons[5]?.pressed && !prev[5]) window.equipSlot((currentSlot + 1) % 5);
        prev[0] = gp.buttons[0]?.pressed; prev[2] = gp.buttons[2]?.pressed; prev[1] = gp.buttons[1]?.pressed; prev[10] = gp.buttons[10]?.pressed; prev[6] = gp.buttons[6]?.pressed; prev[4] = gp.buttons[4]?.pressed; prev[5] = gp.buttons[5]?.pressed;
    }
}

function applyClass(c) {
    myClass = c;
    if (c === 'tank') { myMaxHp = 200; myHp = 200; baseSpeed = 15; baseMaxSpeed = 25; }
    else if (c === 'ninja') { myMaxHp = 80; myHp = 80; baseSpeed = 35; baseMaxSpeed = 50; myJumps = 3; myJumpsLeft = 3; }
    else { myMaxHp = 100; myHp = 100; baseSpeed = 25; baseMaxSpeed = 40; myJumps = 2; }
    mySpeed = baseSpeed; myMaxSpeed = baseMaxSpeed;
    
    if (adminStatOverrides) {
        if (typeof adminStatOverrides.maxHp === 'number') myMaxHp = adminStatOverrides.maxHp;
        if (typeof adminStatOverrides.hp === 'number') myHp = adminStatOverrides.hp;
        if (typeof adminStatOverrides.speed === 'number') {
            baseSpeed = adminStatOverrides.speed;
            mySpeed = baseSpeed;
            baseMaxSpeed = baseSpeed * 1.5;
            myMaxSpeed = baseMaxSpeed;
        }
        if (typeof adminStatOverrides.coins === 'number') myCoins = adminStatOverrides.coins;
    }
    updateUI();
}

function triggerAbility() {
    let cost = myClass === 'tank' ? 70 : (myClass === 'ninja' ? 40 : 30);
    if (myEnergy >= cost && myHp > 0 && !isScoped) {
        if (myClass === 'assault') { 
            const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); 
            fwd.y = 0; 
            fwd.normalize(); 
            playerBody.velocity.x += fwd.x * 60; 
            playerBody.velocity.z += fwd.z * 60;
        } else if (myClass === 'tank') { 
            myShield = true; 
            setTimeout(() => { myShield = false; updateUI(); }, 2000);
        } else if (myClass === 'ninja') { 
            for(let i=-1; i<=1; i++) fireRay((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, 10, 0x00ff00); 
        }
        myEnergy -= cost; 
        updateUI();
    }
}

function toggleScope() {
    if (myGun === 'sniper') {
        isScoped = !isScoped; 
        camera.fov = isScoped ? 20 : (isSprinting ? 85 : 75); 
        camera.updateProjectionMatrix();
        if (isScoped) document.getElementById('scope-overlay').classList.remove('hidden'); 
        else document.getElementById('scope-overlay').classList.add('hidden');
    }
}

function toggleCrouch() {
    isCrouching = !isCrouching;
    if (isCrouching) { 
        isSprinting = false; 
        mySpeed = baseSpeed * 0.5; 
        myMaxSpeed = baseMaxSpeed * 0.5; 
        if (!isScoped) { camera.fov = 75; camera.updateProjectionMatrix(); } 
    } else { 
        mySpeed = baseSpeed; 
        myMaxSpeed = baseMaxSpeed; 
    }
}

// ============================================================================
// ROGUE-LITE PERK CARDS & DRAFTING (ON DEATH)
// ============================================================================
const availableCards = []; 
const opCards = [];

function generateCards() {
    const ranks = [
        {name:'Common',color:'#aaaaaa',m:1}, 
        {name:'Rare',color:'#0055ff',m:2}, 
        {name:'Epic',color:'#aa00ff',m:3}, 
        {name:'Legendary',color:'#ffd700',m:5},
        {name:'Mythic',color:'#ff0055',m:8}
    ];
    const t = [
        {p:'Vitality', d:'Max HP', a:(m)=>{myMaxHp+=25*m;myHp+=25*m;}}, 
        {p:'Swift', d:'Speed', a:(m)=>{baseSpeed+=3*m;baseMaxSpeed+=4*m;mySpeed=baseSpeed;myMaxSpeed=baseMaxSpeed;}},
        {p:'Brutal', d:'Weapon Damage', a:(m)=>{flatDamageBonus+=15*m;}}, 
        {p:'Battery', d:'Max Energy', a:(m)=>{myMaxEnergy+=25*m;myEnergy+=25*m;}},
        {p:'Dynamo', d:'Energy Regen', a:(m)=>{energyRegen+=5*m;}}, 
        {p:'Rapid', d:'Fire Rate', a:(m)=>{flatFireRateBonus-=2*m;}},
        {p:'Vampiric', d:'Lifesteal', a:(m)=>{myLifesteal=true; flatDamageBonus+=5*m;}}, 
        {p:'Thief', d:'Coin Steal', a:(m)=>{myCoinSteal=true;}},
        {p:'Jumper', d:'Extra Jumps', a:(m)=>{myJumps+=Math.ceil(m/2);myJumpsLeft=myJumps;}},
        {p:'Heavy', d:'Massive HP, Slower', a:(m)=>{myMaxHp+=40*m;myHp+=40*m;baseSpeed-=m;mySpeed=baseSpeed;}},
        {p:'SniperEye', d:'High Damage', a:(m)=>{flatDamageBonus+=25*m;}},
        {p:'Berserk', d:'Less HP, Huge Dmg', a:(m)=>{myMaxHp=Math.max(10, myMaxHp-15*m);flatDamageBonus+=30*m;}},
        {p:'Acrobat', d:'Jump & Speed', a:(m)=>{myJumps+=Math.ceil(m/2);myJumpsLeft=myJumps;baseSpeed+=2*m;mySpeed=baseSpeed;}},
        {p:'Guardian', d:'HP & Energy', a:(m)=>{myMaxHp+=15*m;myHp+=15*m;myMaxEnergy+=15*m;myEnergy+=15*m;}},
        {p:'Sprinter', d:'Max Speed', a:(m)=>{baseMaxSpeed+=10*m;myMaxSpeed=baseMaxSpeed;}},
        {p:'Brawler', d:'Melee/Close Range', a:(m)=>{flatDamageBonus+=10*m;myMaxHp+=10*m;}}
    ];
    
    ranks.forEach(r => { 
        t.forEach(x => { 
            availableCards.push({ name:`${x.p} (${r.name})`, desc:`Boosts ${x.d}`, rank:r.name, color:r.color, apply:()=>{ x.a(r.m); } }); 
        });
        
        for(let i=0; i<30; i++) { 
            const t1 = t[Math.floor(Math.random()*t.length)]; 
            let t2 = t[Math.floor(Math.random()*t.length)];
            while(t1 === t2 && t.length > 1) t2 = t[Math.floor(Math.random()*t.length)];
            
            availableCards.push({
                name:`${t1.p} + ${t2.p}`, 
                desc:`${r.name} Hybrid Upgrade`, 
                rank:r.name, 
                color:r.color, 
                apply:() => { t1.a(r.m*0.6); t2.a(r.m*0.6); }
            }); 
        }
    });

    opCards.push(
        {name:"God Mode", rank:"OP", apply:()=>{myMaxHp+=9999;myHp+=9999;}}, 
        {name:"Speedforce", rank:"OP", apply:()=>{baseSpeed+=60;mySpeed=baseSpeed;baseMaxSpeed+=80;myMaxSpeed=baseMaxSpeed;}}, 
        {name:"Instakill", rank:"OP", apply:()=>{flatDamageBonus=9999;}}, 
        {name:"Flight", rank:"OP", apply:()=>{myJumps=999;}}, 
        {name:"Laser Beam", rank:"OP", apply:()=>{flatFireRateBonus-=50;}}, 
        {name:"Time Lord", rank:"OP", apply:()=>{energyRegen+=1000;myMaxEnergy+=1000;myEnergy=myMaxEnergy;}}, 
        {name:"Midas Touch", rank:"OP", apply:()=>{myCoins+=1000000;myCoinSteal=true;}}
    );
} 
generateCards();

function die() {
    if (isSmiteInvincible || isDead) return;
    isDead = true;
    myHp = 0;
    if (playerBody) playerBody.velocity.set(0, 0, 0);
    myDeaths++;
    saveLocalProfile();
    netBroadcast({ type: 'killed', victim: myPeerId, killer: lastHitBy });

    let killerName = "Combat";
    if (lastHitBy) {
        if (remotePlayers[lastHitBy]) killerName = remotePlayers[lastHitBy].username;
        else {
            const b = activeBots.find(x => x.id === lastHitBy);
            if (b) killerName = b.name;
        }
    }
    lastHitBy = null;

    if (!isMobileDeploy) controls.unlock();
    isScoped = false; 
    camera.fov = 75; 
    camera.updateProjectionMatrix(); 
    document.getElementById('scope-overlay').classList.add('hidden');
    document.getElementById('blocker').style.display = 'none'; 
    document.getElementById('hotbar').style.display = 'none';
    hideMobileControls();

    const respawnModal = document.getElementById('respawn-modal');
    const killerText = document.getElementById('respawn-killer-text');
    const timerDisplay = document.getElementById('respawn-timer-display');
    const btnRespawnNow = document.getElementById('btn-respawn-now');

    if (respawnModal) {
        respawnModal.classList.remove('hidden');
        if (killerText) {
            killerText.innerText = (killerName && killerName !== "Combat") 
                ? `Eliminated by ${killerName}. Tactical redeploy in progress...`
                : `Flew out of the arena barrier! Tactical redeploy in progress...`;
        }
    }

    let countdown = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH') ? 2 : 3;
    if (timerDisplay) timerDisplay.innerText = countdown;

    let respawnInterval = null;
    let onKeyRespawn = null;

    const performRespawn = () => {
        if (respawnInterval) {
            clearInterval(respawnInterval);
            respawnInterval = null;
        }
        if (onKeyRespawn) {
            window.removeEventListener('keydown', onKeyRespawn);
            onKeyRespawn = null;
        }
        isDead = false;
        if (respawnModal) respawnModal.classList.add('hidden');
        myHp = myMaxHp;
        updateUI();
        respawn();
        document.getElementById('hotbar').style.display = 'flex';
        if (!isMobileDeploy) {
            controls.lock();
        } else {
            showMobileControls();
        }
        netBroadcast({
            type: 'pos',
            pos: { x: playerBody.position.x, y: playerBody.position.y - 1.5, z: playerBody.position.z },
            rot: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w },
            isCrouching: false,
            gun: myGun,
            hp: myHp,
            maxHp: myMaxHp,
            coins: myCoins,
            speed: mySpeed,
            kothScore: myKothScore
        });
        netBroadcast({ type: 'respawn', id: myPeerId });
    };

    onKeyRespawn = (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            performRespawn();
        }
    };
    window.addEventListener('keydown', onKeyRespawn, { once: true });

    if (btnRespawnNow) {
        btnRespawnNow.onclick = performRespawn;
    }

    respawnInterval = setInterval(() => {
        countdown--;
        if (timerDisplay) timerDisplay.innerText = Math.max(0, countdown);
        if (countdown <= 0) {
            performRespawn();
        }
    }, 1000);
}

function updateWeaponVisuals(humanoidObj, weaponType) {
    if (!humanoidObj || !humanoidObj.gunContainer) return;
    while(humanoidObj.gunContainer.children.length > 0) humanoidObj.gunContainer.remove(humanoidObj.gunContainer.children[0]);
    humanoidObj.gunContainer.add(createGunMesh(weaponType)); 
    humanoidObj.currentGun = weaponType;
}

function updateViewModel(weaponType) {
    if (!viewModelContainer) return;
    while(viewModelContainer.children.length > 0) viewModelContainer.remove(viewModelContainer.children[0]);
    if (weaponType) {
        viewModelContainer.add(createGunMesh(weaponType));
    }
}

window.equipSlot = function(index) {
    if (gameState.mode === 'KOTH' || currentGamemode === 'KOTH') {
        if (index > 1) return; // In KOTH only slots 0 (Knockback Rifle) and 1 (Knock Stick) are usable
    }
    currentSlot = index;
    for(let i=0; i<5; i++) {
        const el = document.getElementById(`slot-${i}`);
        if (el) { 
            if (i === index) el.classList.add('active'); 
            else el.classList.remove('active'); 
        }
    }
    if (myInventory[index] !== null) {
        myGun = myInventory[index];
        updateWeaponVisuals(myAvatar, myGun);
        updateViewModel(myGun);
        netBroadcast({ type: 'gun', gun: myGun });
    } else {
        if (myAvatar && myAvatar.gunContainer) {
            while(myAvatar.gunContainer.children.length > 0) myAvatar.gunContainer.remove(myAvatar.gunContainer.children[0]);
        }
        myGun = null;
        updateViewModel(null);
        netBroadcast({ type: 'gun', gun: null });
    }
};

function updateHotbarUI() {
    for(let i=0; i<5; i++) {
        const nameEl = document.getElementById(`slot-name-${i}`);
        if (nameEl) { 
            const w = myInventory[i]; 
            nameEl.innerText = w ? WEAPON_STATS[w].name : "Empty"; 
        }
    }
}

// ============================================================================
// SHOP, VIP, & ADMIN UI EVENTS (PRESERVED COMPLETE)
// ============================================================================
function setupUIEvents() {
    // Shop Trigger & Close
    document.getElementById('shop-trigger').onclick = () => { 
        if (!isMobileDeploy) controls.unlock(); else hideMobileControls(); 
        document.getElementById('shop-modal').classList.remove('hidden'); 
    };
    document.getElementById('btn-shop-close').onclick = () => { 
        document.getElementById('shop-modal').classList.add('hidden'); 
        if (isMobileDeploy && myHp > 0) showMobileControls(); 
    };

    // VIP Trigger & Unlock
    document.getElementById('vip-trigger').onclick = () => { 
        if (!isMobileDeploy) controls.unlock(); else hideMobileControls(); 
        document.getElementById('vip-modal').classList.remove('hidden'); 
    };
    document.getElementById('btn-vip-close').onclick = () => { 
        document.getElementById('vip-modal').classList.add('hidden'); 
        if (isMobileDeploy && myHp > 0) showMobileControls(); 
    };
    document.getElementById('btn-vip-login').onclick = () => { 
        if (document.getElementById('vip-password').value === 'Seth1234@!') { 
            isVipUnlocked = true;
            document.getElementById('vip-modal').classList.add('hidden'); 
            const smiteSec = document.getElementById('vip-smite-section');
            if (smiteSec) smiteSec.style.display = 'block';
            opCards.forEach(c => c.apply()); 
            myActiveAbility = 'smite';
            updateAbilityHUD();
            saveLocalProfile();
            updateUI(); 
            alert("⚡ VIP UNLOCKED: DIVINE SMITE ABILITY GRANTED!\nInstant 1-Hit Execution [Q] with exclusive Cinematic!"); 
            netBroadcast({ type: 'vip' }); 
            if (isMobileDeploy && myHp > 0) showMobileControls(); 
        } else {
            alert("Incorrect VIP Passcode.");
        }
    };

    const btnEquipSmite = document.getElementById('btn-vip-equip-smite');
    if (btnEquipSmite) {
        btnEquipSmite.onclick = () => {
            myActiveAbility = 'smite';
            updateAbilityHUD();
            saveLocalProfile();
            alert("⚡ DIVINE SMITE MODULE EQUIPPED!\nPress [Q] to execute targets in 1 hit with cinematic execution!");
        };
    }

    const hudJumpBadge = document.getElementById('hud-jump-badge');
    if (hudJumpBadge) {
        hudJumpBadge.onclick = () => {
            jumpMode = (jumpMode === 'normal') ? 'floaty' : 'normal';
            updateJumpHUD();
        };
    }

    // Admin Terminal Trigger & Login
    document.getElementById('admin-trigger').onclick = () => { 
        if (!isMobileDeploy) controls.unlock(); else hideMobileControls(); 
        document.getElementById('admin-modal').classList.remove('hidden'); 
    };
    document.getElementById('btn-admin-close').onclick = () => { 
        document.getElementById('admin-modal').classList.add('hidden'); 
        if (isMobileDeploy && myHp > 0) showMobileControls(); 
    };
    document.getElementById('btn-admin-login').onclick = () => { 
        if (document.getElementById('admin-password').value === 'Seth1234@!') { 
            document.getElementById('admin-modal').classList.add('hidden'); 
            document.getElementById('admin-dashboard').classList.remove('hidden'); 
            adminLog("Access granted. Initialized Admin Control.");
            
            // Populate self stats box
            document.getElementById('my-inspector-name').innerText = myUsername;
            document.getElementById('my-set-hp').value = Math.floor(myHp);
            document.getElementById('my-set-maxhp').value = Math.floor(myMaxHp);
            document.getElementById('my-set-coins').value = Math.floor(myCoins);
            document.getElementById('my-set-speed').value = Math.floor(baseSpeed);
        } else {
            alert("Access Denied: Invalid Security Key.");
        }
    };

    if (document.getElementById('btn-admin-dash-close')) {
        document.getElementById('btn-admin-dash-close').onclick = () => { 
            document.getElementById('admin-dashboard').classList.add('hidden'); 
            if (isMobileDeploy && myHp > 0) showMobileControls(); 
        };

        document.getElementById('btn-admin-apply-stats').onclick = () => {
            if (adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                const spd = document.getElementById('admin-set-speed').value;
                netSendTo(adminSelectedPeer, { 
                    type: 'admin_cmd', 
                    action: 'set_stats', 
                    hp: document.getElementById('admin-set-hp').value, 
                    maxHp: document.getElementById('admin-set-maxhp').value, 
                    coins: document.getElementById('admin-set-coins').value, 
                    speed: spd 
                });
                adminLog("Applied stat override to " + remotePlayers[adminSelectedPeer].username);
            }
        };

        document.getElementById('btn-admin-give-weapon').onclick = () => {
            if (adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                netSendTo(adminSelectedPeer, { 
                    type: 'admin_cmd', 
                    action: 'give_weapon', 
                    weapon: document.getElementById('admin-give-weapon-sel').value 
                });
                adminLog("Dispatched payload [WEAPON] to " + remotePlayers[adminSelectedPeer].username);
            }
        };

        document.getElementById('btn-admin-give-card').onclick = () => {
            if (adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                netSendTo(adminSelectedPeer, { 
                    type: 'admin_cmd', 
                    action: 'give_card' 
                });
                adminLog("Dispatched payload [EPIC CARD] to " + remotePlayers[adminSelectedPeer].username);
            }
        };

        const btnAdminSmite = document.getElementById('btn-admin-equip-smite');
        if (btnAdminSmite) {
            btnAdminSmite.onclick = () => {
                isVipUnlocked = true;
                myActiveAbility = 'smite';
                updateAbilityHUD();
                saveLocalProfile();
                adminLog("⚡ Equipped DIVINE SMITE on local operator!");
                alert("⚡ DIVINE SMITE EQUIPPED!\nPress [Q] to execute targets in 1 hit with cinematic execution!");
            };
        }

        document.getElementById('btn-admin-vip').onclick = () => {
            if (adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                netSendTo(adminSelectedPeer, { 
                    type: 'admin_cmd', 
                    action: 'give_vip' 
                });
                adminLog("Elevated privilege [VIP] for " + remotePlayers[adminSelectedPeer].username);
            }
        };

        document.getElementById('btn-admin-kick').onclick = () => {
            if (adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                netSendTo(adminSelectedPeer, { 
                    type: 'admin_cmd', 
                    action: 'kick' 
                });
                adminLog("TERMINATED connection for " + remotePlayers[adminSelectedPeer].username);
            }
        };
        
        if (document.getElementById('btn-my-apply-stats')) {
            document.getElementById('btn-my-apply-stats').onclick = () => {
                myHp = parseFloat(document.getElementById('my-set-hp').value);
                myMaxHp = parseFloat(document.getElementById('my-set-maxhp').value);
                myCoins = parseFloat(document.getElementById('my-set-coins').value);
                baseSpeed = parseFloat(document.getElementById('my-set-speed').value);
                mySpeed = baseSpeed;
                adminStatOverrides = { hp: myHp, maxHp: myMaxHp, coins: myCoins, speed: baseSpeed };
                updateUI();
                saveLocalProfile();
                adminLog("Applied stat override to SELF");
            };
        }
    }
    
    // Shop Purchase Logic
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = (e) => {
            const btnEl = e.currentTarget;
            const cost = parseInt(btnEl.getAttribute('data-cost')); 
            const type = btnEl.getAttribute('data-type');
            
            if (type === 'weapon') {
                const wid = btnEl.getAttribute('data-id');
                if (myOwnedWeapons.includes(wid)) {
                    let slotIdx = myInventory.indexOf(null);
                    if (slotIdx === -1) slotIdx = currentSlot;
                    myInventory[slotIdx] = wid;
                    updateHotbarUI(); 
                    window.equipSlot(slotIdx);
                    return; 
                }
            }

            if (myCoins >= cost || isNaN(cost)) {
                if (!isNaN(cost)) myCoins -= cost;
                
                if (type === 'ability') {
                    const abId = btnEl.getAttribute('data-id');
                    if (abId === 'smite' && !isVipUnlocked) {
                        alert("ACCESS DENIED: Divine Smite is locked with the Admin Passcode!\nAccess through the VIP terminal.");
                        document.getElementById('shop-modal').classList.add('hidden');
                        document.getElementById('vip-modal').classList.remove('hidden');
                        return;
                    }
                    if (ABILITY_DEFINITIONS[abId]) {
                        myActiveAbility = abId;
                        updateAbilityHUD();
                        saveLocalProfile();
                        alert(`TACTICAL MODULE EQUIPPED: ${ABILITY_DEFINITIONS[abId].name}\nPress [Q] in combat to activate!`);
                    }
                }
                else if (type === 'card') { 
                    const rankStr = btnEl.getAttribute('data-rank');
                    let pool = (!rankStr || rankStr === 'Random') ? availableCards : availableCards.filter(c => c.rank === rankStr);
                    if (pool.length === 0) pool = availableCards;
                    const c = pool[Math.floor(Math.random() * pool.length)]; 
                    c.apply(); 
                    if (rankStr === 'Random' || !rankStr) alert(`CARD UNLOCKED: ${c.name}\nRank: ${c.rank}\n\n${c.desc}`);
                }
                else if (type === 'specific_card') { 
                    const cid = parseInt(btnEl.getAttribute('data-id')); 
                    availableCards[cid].apply(); 
                }
                else if (type === 'weapon') { 
                    const wid = btnEl.getAttribute('data-id');
                    if (!myOwnedWeapons.includes(wid)) myOwnedWeapons.push(wid);
                    let slotIdx = myInventory.indexOf(null);
                    if (slotIdx === -1) slotIdx = currentSlot;
                    myInventory[slotIdx] = wid;
                    updateHotbarUI(); 
                    window.equipSlot(slotIdx);
                }
                else if (type === 'heal') {
                    myHp = myMaxHp;
                }
                updateUI();
                saveLocalProfile();
            } else {
                alert("Not enough coins!");
            }
        };
    });
}

function updateUI() {
    document.getElementById('hp-text').innerText = `${Math.floor(myHp)} / ${Math.floor(myMaxHp)}`; 
    document.getElementById('hp-bar').style.width = Math.min(100, Math.max(0, (myHp/myMaxHp)*100)) + '%';
    document.getElementById('hp-bar-bg').style.background = myShield ? '#00f3ff' : 'rgba(255,0,0,0.5)';
    if (!myShield) document.getElementById('hp-bar').style.background = (myHp/myMaxHp < 0.4) ? '#f00' : '#0f0'; 
    else document.getElementById('hp-bar').style.background = '#00f3ff';
    
    document.getElementById('energy-text').innerText = `${Math.floor(myEnergy)} / ${Math.floor(myMaxEnergy)}`;
    document.getElementById('energy-bar').style.width = Math.min(100, Math.max(0, (myEnergy/myMaxEnergy)*100)) + '%';
    
    document.getElementById('coin-text').innerText = myCoins; 
    document.getElementById('shop-coins').innerText = myCoins;
    
    document.querySelectorAll('.buy-btn[data-type="weapon"]').forEach(btn => {
        const wid = btn.getAttribute('data-id');
        if (myOwnedWeapons.includes(wid)) {
            btn.innerHTML = `<span style="font-size:18px;">🛠️</span> Equip`;
            btn.style.background = "rgba(0,255,170,0.2)";
            btn.style.borderColor = "#00ffaa";
        }
    });
}

function onKeyDown(e) {
    keys[e.code] = true;
    keys[e.key] = true;
    if (e.code === 'Space') moveUp = true;
    if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ControlLeft' || e.code === 'ControlRight') moveDown = true;

    if (isSmiteCinematicActive) {
        if (e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyQ' || e.code === 'Enter') {
            e.preventDefault();
            closeSmiteCinematic();
            stopContinuousSmiteLightning(true);
            isSmiteInvincible = false;
        }
        return;
    }
    if (e.code === 'Escape') {
        const exitPanel = document.getElementById('exit-panel');
        const isExitOpen = exitPanel && exitPanel.style.display === 'flex' && !exitPanel.classList.contains('hidden');
        const settingsModal = document.getElementById('settings-modal');
        const isSettingsOpen = settingsModal && !settingsModal.classList.contains('hidden');
        const shopModal = document.getElementById('shop-modal');
        const isShopOpen = shopModal && !shopModal.classList.contains('hidden');
        const vipModal = document.getElementById('vip-modal');
        const isVipOpen = vipModal && !vipModal.classList.contains('hidden');
        const adminModal = document.getElementById('admin-modal');
        const isAdminOpen = adminModal && !adminModal.classList.contains('hidden');

        if (isExitOpen || isSettingsOpen || isShopOpen || isVipOpen || isAdminOpen) {
            e.preventDefault();
            resumeGame();
            return;
        } else if (gameState.started && controls && controls.isLocked) {
            e.preventDefault();
            controls.unlock();
            return;
        }
    }
    if (e.code === 'KeyR') isWallRunning = true;
    if (e.code === 'KeyF') {
        isHoldingGrapple = true;
        if (!grappleActive && grappleCooldownTimer <= 0) {
            startGrapple();
        }
    }
    if (e.code === 'KeyO') openSettingsModal();
    if (e.code === 'KeyQ') castActiveAbility();
    switch(e.code) {
        case 'KeyW': moveForward = true; break; 
        case 'KeyA': moveLeft = true; break; 
        case 'KeyS': moveBackward = true; break; 
        case 'KeyD': moveRight = true; break;
        case 'Space': 
            if (myJumpsLeft > 0) { 
                if (jumpMode === 'normal') {
                    playerBody.velocity.y = 22; // Snappy standard FPS jump
                    jumpAntiGravityTimer = 0;   // No floatiness!
                } else {
                    playerBody.velocity.y = 25; // Floaty jump
                    jumpAntiGravityTimer = 0.5; // Anti-gravity hang time
                }
                myJumpsLeft--; 
                canJump = false; 
            } 
            break;
        case 'KeyJ':
            jumpMode = (jumpMode === 'normal') ? 'floaty' : 'normal';
            updateJumpHUD();
            break;
        case 'ShiftLeft': 
            isSprinting = !isSprinting; 
            if (isSprinting) { 
                isCrouching = false; 
                mySpeed = baseSpeed * 1.8; 
                myMaxSpeed = baseMaxSpeed * 1.8; 
                if (!isScoped) { camera.fov = 85; camera.updateProjectionMatrix(); } 
            } else { 
                mySpeed = baseSpeed; 
                myMaxSpeed = baseMaxSpeed; 
                if (!isScoped) { camera.fov = 75; camera.updateProjectionMatrix(); } 
            }
            break;
        case 'ControlLeft': case 'MetaLeft': case 'MetaRight': case 'KeyC': toggleCrouch(); break; 
        case 'KeyE': triggerAbility(); break; 
        case 'KeyV': isThirdPerson = !isThirdPerson; break;
        case 'Digit1': window.equipSlot(0); break; 
        case 'Digit2': window.equipSlot(1); break; 
        case 'Digit3': window.equipSlot(2); break; 
        case 'Digit4': window.equipSlot(3); break; 
        case 'Digit5': window.equipSlot(4); break;
    }
}

function onKeyUp(e) {
    keys[e.code] = false;
    keys[e.key] = false;
    if (e.code === 'Space') moveUp = false;
    if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ControlLeft' || e.code === 'ControlRight') moveDown = false;

    if (e.code === 'KeyR') isWallRunning = false;
    if (e.code === 'KeyF') {
        isHoldingGrapple = false;
        if (grappleActive) {
            releaseGrapple();
        }
    }
    switch(e.code) {
        case 'KeyW': moveForward = false; break; 
        case 'KeyA': moveLeft = false; break; 
        case 'KeyS': moveBackward = false; break; 
        case 'KeyD': moveRight = false; break;
    }
}

// ============================================================================
// COMBAT & SHOOTING SYSTEM
// ============================================================================
function shoot() {
    if (fireCooldown <= 0 && myGun) {
        const stats = WEAPON_STATS[myGun];
        if (stats.type === 'support') {
            if (myHp < myMaxHp) {
                myHp = Math.min(myMaxHp, myHp + stats.heal);
                myInventory[currentSlot] = null; 
                updateHotbarUI(); 
                window.equipSlot(0); 
                updateUI();
            }
        } else if (stats.type === 'melee') {
            fireMelee(stats.range, stats.damage + flatDamageBonus);
        } else {
            const actualDamage = stats.damage + flatDamageBonus;
            const actualFireRate = Math.max(2, stats.fireRate + flatFireRateBonus);
            if (stats.projectiles) {
                for(let i=0; i<stats.projectiles; i++) fireRay((Math.random()-0.5)*stats.spread, (Math.random()-0.5)*stats.spread, actualDamage, stats.color);
            } else {
                fireRay((Math.random()-0.5)*stats.spread, (Math.random()-0.5)*stats.spread, actualDamage, stats.color);
            }
            recoilAnimTimer = 0.15;
            fireCooldown = actualFireRate;
        }
    }
}

function fireMelee(range, damage) {
    const raycaster = new THREE.Raycaster(); 
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera); 
    const targets = [];
    Object.values(remotePlayers).forEach(r => { if (r?.mesh) targets.push(r.mesh); });
    activeBots.forEach(b => { if (b?.mesh && b.hp > 0) targets.push(b.mesh); });

    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0 && intersects[0].distance <= range) {
        const hitPoint = intersects[0].point;
        let hitId = null; 
        let isBotHit = false;
        let cur = intersects[0].object;
        while(cur && !hitId) { 
            if (cur.userData && cur.userData.botId) { hitId = cur.userData.botId; isBotHit = true; break; }
            if (cur.userData && cur.userData.peerId) { hitId = cur.userData.peerId; isBotHit = false; break; }
            cur = cur.parent; 
        }

        const isKoth = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH');
        const finalDamage = isKoth ? 0 : damage;

        const wStats = WEAPON_STATS[myGun];
        if (wStats && wStats.knockback) {
            const kDir = new THREE.Vector3();
            camera.getWorldDirection(kDir);
            kDir.y = (wStats.lift && wStats.lift > 10) ? 0.42 : 0.05; // Upward super-launch trajectory
            kDir.normalize();

            if (isBotHit) {
                const b = activeBots.find(x => x.id === hitId);
                if (b) {
                    b.velX = (b.velX || 0) + kDir.x * wStats.knockback;
                    b.velZ = (b.velZ || 0) + kDir.z * wStats.knockback;
                    b.velocityY = Math.max(b.velocityY || 0, wStats.lift || 160);
                    b.lastHitBy = myPeerId;
                }
            } else if (remotePlayers[hitId]) {
                netSendTo(hitId, {
                    type: 'knockback',
                    forceX: kDir.x * wStats.knockback,
                    forceY: wStats.lift || 160,
                    forceZ: kDir.z * wStats.knockback,
                    attacker: myPeerId
                });
            }
        }

        if (isBotHit) {
            if (finalDamage > 0) damageBot(hitId, finalDamage, false);
            createHitSpark(hitPoint, 0xffd700);
        } else if (hitId && remotePlayers[hitId]) {
            netSendTo(hitId, { type: 'hit', target: hitId, damage: finalDamage });
            if (myLifesteal && finalDamage > 0) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if (myCoinSteal) myCoins += 50; else myCoins += 20; 
            updateUI(); 
            saveLocalProfile();
            createHitSpark(hitPoint, 0xffd700);
        }

        playKnockSound(wStats?.knockback > 100);
    }
    if (myAvatar && myAvatar.rArm) { 
        myAvatar.rArm.rotation.x -= Math.PI/2; 
        setTimeout(() => { if (myAvatar && myAvatar.rArm) myAvatar.rArm.rotation.x += Math.PI/2; }, 150); 
    }
    meleeAnimTimer = 0.25;
    fireCooldown = (WEAPON_STATS[myGun]?.fireRate || 14);
}

function createHitSpark(pos, colorHex) {
    const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: colorHex })
    );
    spark.position.copy(pos);
    scene.add(spark);
    let scale = 1.0;
    const sparkTimer = setInterval(() => {
        scale -= 0.25;
        if (scale <= 0) {
            clearInterval(sparkTimer);
            scene.remove(spark);
        } else {
            spark.scale.set(scale, scale, scale);
        }
    }, 25);
}

function fireRay(offsetX, offsetY, damage, colorHex) {
    const raycaster = new THREE.Raycaster(); 
    const rx = offsetX * 2; 
    const ry = offsetY * 2; 
    raycaster.setFromCamera(new THREE.Vector2(rx, ry), camera); 
    if (isScoped) raycaster.setFromCamera(new THREE.Vector2(0,0), camera); 

    const targets = [];
    Object.keys(remotePlayers).forEach(pid => {
        const r = remotePlayers[pid];
        if (r && r.mesh) {
            targets.push(r.mesh);
        }
    });
    activeBots.forEach(b => {
        if (b && b.mesh && b.hp > 0) {
            targets.push(b.mesh);
        }
    });
    const intersects = raycaster.intersectObjects(targets, true);
    
    let endPoint;
    if (intersects.length > 0) {
        const hit = intersects[0];
        const hitPoint = hit.point; 
        endPoint = hitPoint; 
        const hitMesh = hit.object;
        let hitId = null; 
        let isBotHit = false;
        let cur = hitMesh;
        while(cur && !hitId) { 
            if (cur.userData && cur.userData.botId) { hitId = cur.userData.botId; isBotHit = true; }
            else if (cur.userData && cur.userData.peerId) { hitId = cur.userData.peerId; isBotHit = false; }
            cur = cur.parent; 
        }
        
        if (hitId) {
            let targetMaxHp = 100;
            let targetPos = hitPoint;
            if (isBotHit) {
                const b = activeBots.find(x => x.id === hitId);
                if (b) { targetMaxHp = b.maxHp; targetPos = b.pos; }
            } else if (remotePlayers[hitId]) {
                targetMaxHp = remotePlayers[hitId].maxHp || 100;
                targetPos = remotePlayers[hitId].mesh.position;
            }

            let isHeadshot = false;
            let testObj = hitMesh;
            while(testObj) {
                if (testObj.name === 'head' || testObj.userData?.isHead) { isHeadshot = true; break; }
                testObj = testObj.parent;
            }
            if (!isHeadshot && hitPoint.y - targetPos.y >= 2.6) {
                isHeadshot = true;
            }

            let finalDamage = damage;
            const dist = camera.position.distanceTo(hitPoint);
            const isKoth = (gameState.mode === 'KOTH' || currentGamemode === 'KOTH');

            const wStats = WEAPON_STATS[myGun];
            if (wStats && wStats.knockback) {
                const kDir = new THREE.Vector3().subVectors(hitPoint, camera.position).normalize();
                kDir.y = (wStats.lift && wStats.lift > 10) ? 0.42 : 0.05;
                kDir.normalize();
                if (isBotHit) {
                    const b = activeBots.find(x => x.id === hitId);
                    if (b) {
                        b.velX = (b.velX || 0) + kDir.x * wStats.knockback;
                        b.velZ = (b.velZ || 0) + kDir.z * wStats.knockback;
                        b.velocityY = Math.max(b.velocityY || 0, wStats.lift || 0.5);
                        b.lastHitBy = myPeerId;
                    }
                } else if (remotePlayers[hitId]) {
                    netSendTo(hitId, { 
                        type: 'knockback', 
                        forceX: kDir.x * wStats.knockback, 
                        forceY: wStats.lift || 0.5, 
                        forceZ: kDir.z * wStats.knockback,
                        attacker: myPeerId
                    });
                }
            }

            if (isKoth) {
                finalDamage = 0; // KOTH guns deal zero damage!
            } else if (myGun === 'sniper') {
                if (isHeadshot) {
                    finalDamage = targetMaxHp;
                } else {
                    finalDamage = Math.ceil(targetMaxHp / 3);
                }
            } else if (myGun === 'golden_eagle' || myGun === 'pistol') {
                if (isHeadshot) {
                    finalDamage = targetMaxHp;
                } else {
                    finalDamage = Math.ceil(targetMaxHp / 3);
                }
            } else if (myGun === 'shotgun') {
                if (dist <= 6.0) {
                    finalDamage = Math.ceil(targetMaxHp * 0.50);
                } else {
                    const falloffFactor = Math.max(0.15, 1.0 - (dist - 6.0) / 30.0);
                    finalDamage = Math.ceil(targetMaxHp * 0.50 * falloffFactor);
                }
                if (isHeadshot) finalDamage = Math.min(targetMaxHp, Math.ceil(finalDamage * 1.5));
            } else {
                if (isHeadshot) finalDamage = Math.ceil(damage * 2.2);
            }

            if (isBotHit) {
                if (finalDamage > 0) damageBot(hitId, finalDamage, isHeadshot);
            } else if (remotePlayers[hitId]) {
                netSendTo(hitId, { type: 'hit', target: hitId, damage: finalDamage, isHeadshot: isHeadshot });
            }

            if (myLifesteal) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if (myCoinSteal) myCoins += 50; else myCoins += 20; 
            updateUI(); 
            saveLocalProfile();
            createHitSpark(hitPoint, isHeadshot ? 0xff0055 : colorHex);
        }
    } else { 
        const dir = raycaster.ray.direction; 
        endPoint = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(350)); 
    }
    
    const bMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 }); 
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 9.0, 8), bMat); 
    bullet.geometry.rotateX(Math.PI/2);

    // Glowing white-hot projectile tip for intense visibility
    const tipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    tipMesh.position.set(0, 0, 4.5);
    bullet.add(tipMesh);
    
    let startPoint = new THREE.Vector3().copy(camera.position); 
    if (isThirdPerson && !isScoped && myAvatar && myAvatar.gunContainer) {
        myAvatar.gunContainer.getWorldPosition(startPoint);
    }
    
    bullet.position.copy(startPoint); 
    bullet.lookAt(endPoint); 
    scene.add(bullet);

    const dist = startPoint.distanceTo(endPoint);
    // Smooth visible duration: 0.10s to 0.22s (visible to the human eye, perfectly responsive)
    const travelTime = Math.min(0.22, Math.max(0.10, dist / 280));

    activeBullets.push({ 
        mesh: bullet, 
        start: startPoint.clone(), 
        end: endPoint.clone(), 
        progress: 0,
        travelTime: travelTime,
        color: colorHex
    });
}

function createNametag(name, team = 'none', hp = 100, maxHp = 100) {
    const canvas = document.createElement('canvas'); 
    canvas.width = 512; 
    canvas.height = 160; 
    const ctx = canvas.getContext('2d');

    // Rounded sci-fi glass badge background
    ctx.fillStyle = 'rgba(6, 12, 24, 0.90)';
    const x = 12, y = 10, w = 488, h = 140, r = 18;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Determine team accent colors
    let glowColor = '#00f3ff';
    let roleText = 'CYBER PILOT';
    if (team === 'red') { 
        glowColor = '#ff0055'; 
        roleText = 'CRIMSON LEGION'; 
    } else if (team === 'blue') { 
        glowColor = '#0088ff'; 
        roleText = 'COBALT ORDER'; 
    } else if (team === 'vip') { 
        glowColor = '#ffd700'; 
        roleText = 'VIP OPERATIVE'; 
    }

    // Border with neon cyber glow
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top role/team tag
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = glowColor;
    ctx.fillText(`• ${roleText} •`, 256, 38);

    // Player Callsign / Nametag
    ctx.font = '900 50px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fillText((name || 'PILOT').toUpperCase(), 256, 88);
    ctx.shadowBlur = 0;

    // Mini Health Bar on Nametag
    const barW = 380, barH = 8;
    const barX = (512 - barW) / 2, barY = 126;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = Math.min(1.0, Math.max(0.0, hp / (maxHp || 100)));
    ctx.fillStyle = hpPct < 0.35 ? '#ff0055' : (hpPct < 0.7 ? '#ffff00' : '#00ffaa');
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    const tex = new THREE.CanvasTexture(canvas); 
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }); 
    const sprite = new THREE.Sprite(mat); 
    sprite.scale.set(5.5, 1.7, 1); 
    return sprite;
}

// 3D Gun Meshes
function createGunMesh(type) {
    const group = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.5 }); 
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    if (type === 'sniper') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.8), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -1.0;
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), new THREE.MeshStandardMaterial({color: 0x000000})); 
        scope.rotation.x = Math.PI/2; scope.position.y = 0.2; scope.position.z = -0.2;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.6), accentMat); 
        stock.position.z = 0.6; stock.position.y = -0.05; 
        group.add(body, barrel, scope, stock);
    } else if (type === 'shotgun') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.6), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.6;
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), new THREE.MeshStandardMaterial({color: 0x4a3424})); 
        pump.position.y = -0.15; pump.position.z = -0.5;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.5), new THREE.MeshStandardMaterial({color: 0x4a3424})); 
        stock.position.z = 0.5; stock.position.y = -0.1; 
        group.add(body, barrel, pump, stock);
    } else if (type === 'smg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.4;
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.1), accentMat); 
        mag.position.y = -0.2; 
        group.add(body, barrel, mag);
    } else if (type === 'pistol' || type === 'golden_eagle') {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.15 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.14), blackMat);
        grip.rotation.x = -0.25; grip.position.set(0, -0.08, 0.08);
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.42), goldMat);
        slide.position.set(0, 0.08, -0.1);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.44), goldMat);
        barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.08, -0.12);
        group.add(grip, slide, barrel);
    } else if (type === 'lmg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.7), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.8;
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15), accentMat); 
        drum.rotation.z = Math.PI/2; drum.position.y = -0.2; 
        group.add(body, barrel, drum);
    } else if (type === 'knockback_rifle') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.9), gunMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.4), gunMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.9;
        const coilMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00f3ff, emissiveIntensity: 2.0 });
        const coil1 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), coilMat);
        coil1.position.z = -0.6;
        const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), coilMat);
        coil2.position.z = -0.9;
        const coil3 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 16), coilMat);
        coil3.position.z = -1.2;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.5), accentMat);
        stock.position.z = 0.55;
        group.add(body, barrel, coil1, coil2, coil3, stock);
    } else if (type === 'knock_stick') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6), accentMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 0.15;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6), gunMat);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.8;
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 2.2, metalness: 0.9 });
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.5), headMat);
        head.rotation.x = Math.PI / 2;
        head.position.z = -1.75;
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 16), headMat);
        ring1.position.z = -1.6;
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 16), headMat);
        ring2.position.z = -1.85;
        group.add(handle, shaft, head, ring1, ring2);
    } else if (type === 'katana') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25), accentMat); 
        handle.rotation.x = Math.PI/2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 2.0), new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.9, roughness:0.1})); 
        blade.position.z = -1.125; 
        group.add(handle, blade);
    } else if (type === 'medkit') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), new THREE.MeshStandardMaterial({color:0x00ff00}));
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.21), new THREE.MeshBasicMaterial({color:0xffffff}));
        const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.21), new THREE.MeshBasicMaterial({color:0xffffff})); 
        group.add(box, cross, cross2);
    } else { 
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.6), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.6;
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.15), accentMat); 
        mag.position.y = -0.3; mag.position.z = -0.1;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.4), accentMat); 
        stock.position.z = 0.4; 
        group.add(body, barrel, mag, stock);
    }
    group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; }); 
    return group;
}

// ============================================================================
// HIGH-POLY SCI-FI CYBER WARRIOR AVATAR
// ============================================================================
function createHumanoid(themeColor = 0x00f3ff) {
    const group = new THREE.Group();

    // Sci-Fi PBR Materials
    const matArmorMain = new THREE.MeshStandardMaterial({ 
        color: 0x141824, 
        metalness: 0.85, 
        roughness: 0.25 
    }); 
    const matArmorSecondary = new THREE.MeshStandardMaterial({ 
        color: 0x222838, 
        metalness: 0.7, 
        roughness: 0.35 
    }); 
    const matArmorAccent = new THREE.MeshStandardMaterial({ 
        color: themeColor, 
        metalness: 0.8, 
        roughness: 0.3,
        emissive: themeColor,
        emissiveIntensity: 0.3
    }); 
    const matGlow = new THREE.MeshStandardMaterial({ 
        color: themeColor, 
        emissive: themeColor, 
        emissiveIntensity: 2.2, 
        roughness: 0.1, 
        metalness: 0.9 
    });
    const matJoints = new THREE.MeshStandardMaterial({ 
        color: 0x0a0c10, 
        roughness: 0.85, 
        metalness: 0.2 
    });

    // Generous Hitbox cylinder for 100% reliable raycast hit registration
    const hitboxGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.2, 12);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 2.0;
    group.add(hitbox);

    // Torso Core & Chassis
    const torso = new THREE.Group();
    torso.position.y = 2.0;
    group.add(torso);

    // Inner Body Suit
    const innerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.7, 16), matJoints);
    innerTorso.castShadow = true; innerTorso.receiveShadow = true;
    torso.add(innerTorso);

    // Outer Armored Chest Carapace (Ballistic Breastplate)
    const breastplate = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.9, 0.85), matArmorMain);
    breastplate.position.set(0, 0.35, 0);
    breastplate.castShadow = true; breastplate.receiveShadow = true;
    torso.add(breastplate);

    // Chest Armor Accent Plates
    const chestPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.15), matArmorAccent);
    chestPlateL.position.set(-0.32, 0.35, 0.42);
    const chestPlateR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.15), matArmorAccent);
    chestPlateR.position.set(0.32, 0.35, 0.42);
    torso.add(chestPlateL, chestPlateR);

    // Glowing Arc Reactor Core in Chest Center
    const arcCore = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16), matGlow);
    arcCore.rotation.x = Math.PI / 2;
    arcCore.position.set(0, 0.38, 0.44);
    torso.add(arcCore);

    // Segmented Abdominal Armor
    const absArmor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.75), matArmorSecondary);
    absArmor.position.set(0, -0.4, 0);
    absArmor.castShadow = true; absArmor.receiveShadow = true;
    torso.add(absArmor);

    // Tactical Utility Belt with Cartridges
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.85), matJoints);
    belt.position.set(0, -0.75, 0);
    torso.add(belt);
    for (let b = -0.4; b <= 0.4; b += 0.25) {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.12), matArmorAccent);
        pouch.position.set(b, -0.75, 0.45);
        torso.add(pouch);
    }

    // High-Tech Twin-Thruster Jetpack on Back
    const jetpackGroup = new THREE.Group();
    jetpackGroup.position.set(0, 0.2, -0.5);
    const jetMain = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.1, 0.35), matArmorMain);
    jetMain.castShadow = true;
    jetpackGroup.add(jetMain);

    // Dual Thruster Nozzles with Glowing Neon Exhaust Rings
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.4, 16), matArmorSecondary);
    nozzleL.position.set(-0.25, -0.45, -0.05);
    const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.4, 16), matArmorSecondary);
    nozzleR.position.set(0.25, -0.45, -0.05);
    const ringL = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16), matGlow);
    ringL.rotation.x = Math.PI / 2; ringL.position.set(-0.25, -0.65, -0.05);
    const ringR = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16), matGlow);
    ringR.rotation.x = Math.PI / 2; ringR.position.set(0.25, -0.65, -0.05);
    jetpackGroup.add(nozzleL, nozzleR, ringL, ringR);
    torso.add(jetpackGroup);

    // --- CYBER HELMET ---
    const head = new THREE.Group();
    head.name = 'head';
    head.userData.isHead = true;
    head.position.y = 1.35;
    torso.add(head);

    // Helmet Base Chassis
    const helmDome = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.75, 16), matArmorMain);
    helmDome.castShadow = true;
    head.add(helmDome);

    // Curved Crown Armor Plate
    const helmCrown = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), matArmorSecondary);
    helmCrown.position.y = 0.25;
    head.add(helmCrown);

    // Glowing Cyber Visor
    const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.53, 0.53, 0.2, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7),
        matGlow
    );
    visor.position.set(0, 0.05, 0);
    head.add(visor);

    // Helmet Side Comms / Filters
    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), matArmorAccent);
    earL.rotation.z = Math.PI / 2; earL.position.set(-0.52, 0.05, 0);
    const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), matArmorAccent);
    earR.rotation.z = Math.PI / 2; earR.position.set(0.52, 0.05, 0);
    head.add(earL, earR);

    // Rebreather Mouthpiece
    const rebreather = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.35), matArmorSecondary);
    rebreather.position.set(0, -0.25, 0.38);
    head.add(rebreather);

    // --- ARMS & WEAPON SOCKET ---
    // Left Arm
    const lArm = new THREE.Group(); 
    lArm.position.set(-0.85, 0.7, 0); 
    torso.add(lArm);
    
    const lPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), matArmorAccent);
    lPauldron.position.set(0, 0.1, 0);
    lArm.add(lPauldron);

    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 12), matArmorMain);
    lArmMesh.position.y = -0.45; lArmMesh.castShadow = true;
    lArm.add(lArmMesh);

    const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.32), matArmorSecondary);
    lForearm.position.y = -1.1; lForearm.castShadow = true;
    lArm.add(lForearm);

    const lGlowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.34), matGlow);
    lGlowStrip.position.set(-0.14, -1.1, 0);
    lArm.add(lGlowStrip);

    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), matJoints);
    lHand.position.y = -1.55;
    lArm.add(lHand);

    // Right Arm
    const rArm = new THREE.Group(); 
    rArm.position.set(0.85, 0.2, -0.4); 
    rArm.rotation.x = -Math.PI / 3; 
    torso.add(rArm);

    const rPauldron = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), matArmorAccent);
    rPauldron.position.set(0, 0.1, 0);
    rArm.add(rPauldron);

    const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 12), matArmorMain);
    rArmMesh.position.y = -0.45; rArmMesh.castShadow = true;
    rArm.add(rArmMesh);

    const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.32), matArmorSecondary);
    rForearm.position.y = -1.1; rForearm.castShadow = true;
    rArm.add(rForearm);

    const rGlowStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.34), matGlow);
    rGlowStrip.position.set(0.14, -1.1, 0);
    rArm.add(rGlowStrip);

    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), matJoints);
    rHand.position.y = -1.55;
    rArm.add(rHand);

    const gunContainer = new THREE.Group(); 
    gunContainer.position.set(0, -0.15, -0.5); 
    rHand.add(gunContainer); 
    gunContainer.add(createGunMesh('default'));

    // --- LEGS & CYBER BOOTS ---
    // Left Leg
    const lLeg = new THREE.Group(); 
    lLeg.position.set(-0.38, -0.9, 0); 
    torso.add(lLeg);

    const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.45), matArmorSecondary);
    lThigh.position.y = -0.45; lThigh.castShadow = true;
    lLeg.add(lThigh);

    const lKnee = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 12), matArmorAccent);
    lKnee.rotation.x = Math.PI / 2; lKnee.position.set(0, -0.9, 0.12);
    lLeg.add(lKnee);

    const lShin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.42), matArmorMain);
    lShin.position.y = -1.35; lShin.castShadow = true;
    lLeg.add(lShin);

    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.6), matJoints);
    lBoot.position.set(0, -1.85, 0.08); lBoot.castShadow = true;
    lLeg.add(lBoot);

    const lBootGlow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.62), matGlow);
    lBootGlow.position.set(0, -1.96, 0.08);
    lLeg.add(lBootGlow);

    // Right Leg
    const rLeg = new THREE.Group(); 
    rLeg.position.set(0.38, -0.9, 0); 
    torso.add(rLeg);

    const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.45), matArmorSecondary);
    rThigh.position.y = -0.45; rThigh.castShadow = true;
    rLeg.add(rThigh);

    const rKnee = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 12), matArmorAccent);
    rKnee.rotation.x = Math.PI / 2; rKnee.position.set(0, -0.9, 0.12);
    rLeg.add(rKnee);

    const rShin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.42), matArmorMain);
    rShin.position.y = -1.35; rShin.castShadow = true;
    rLeg.add(rShin);

    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.6), matJoints);
    rBoot.position.set(0, -1.85, 0.08); rBoot.castShadow = true;
    rLeg.add(rBoot);

    const rBootGlow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.62), matGlow);
    rBootGlow.position.set(0, -1.96, 0.08);
    rLeg.add(rBootGlow);

    return { 
        group, 
        head, 
        torso, 
        lArm, 
        rArm, 
        lLeg, 
        rLeg, 
        gunContainer, 
        matTorso: matArmorAccent, 
        matPants: matArmorSecondary, 
        matGlow, 
        hitbox, 
        currentGun: 'default' 
    };
}

// Procedural Sci-Fi Hex & Circuit Texture
function createNeonGridTexture(hexColor, glowColor) {
    const canvas = document.createElement('canvas'); 
    canvas.width = 256; 
    canvas.height = 256; 
    const ctx = canvas.getContext('2d');

    // Dark metallic panel background
    ctx.fillStyle = '#' + hexColor.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 256, 256);

    // Inset beveled tech tile
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.fillRect(12, 12, 232, 232);

    // Glowing cyber circuit border
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);

    // Angled corner brackets
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 48); ctx.lineTo(48, 0);
    ctx.moveTo(256, 48); ctx.lineTo(208, 0);
    ctx.moveTo(0, 208); ctx.lineTo(48, 256);
    ctx.moveTo(256, 208); ctx.lineTo(208, 256);
    ctx.stroke();

    // Center illuminated power node
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(128, 128, 7, 0, Math.PI * 2);
    ctx.fill();

    // Circuit trace runners
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(128, 0); ctx.lineTo(128, 120);
    ctx.moveTo(0, 128); ctx.lineTo(120, 128);
    ctx.moveTo(256, 128); ctx.lineTo(136, 128);
    ctx.moveTo(128, 256); ctx.lineTo(128, 136);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas); 
    tex.wrapS = THREE.RepeatWrapping; 
    tex.wrapT = THREE.RepeatWrapping; 
    return tex;
}

// ============================================================================
// WATER, MIRROR & POST-PROCESSING RT SHOWCASE HELPERS
// ============================================================================

function createSparklingWaterTexture(accent = '#40e0d0') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear transparent foundation with natural sparkling crystal light-blue tint
    ctx.clearRect(0, 0, 512, 512);
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, 'rgba(40, 210, 245, 0.22)');
    grad.addColorStop(0.5, 'rgba(56, 225, 250, 0.32)');
    grad.addColorStop(1, 'rgba(32, 190, 230, 0.25)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    
    // Organic Voronoi-like cellular liquid caustics (NO grid / perpendicular lines)
    // Draw smooth curved pools and elliptical caustics rings
    const seedPoints = [
        { x: 90, y: 80, r: 55 }, { x: 230, y: 70, r: 65 }, { x: 390, y: 95, r: 50 },
        { x: 150, y: 190, r: 70 }, { x: 320, y: 210, r: 75 }, { x: 460, y: 180, r: 55 },
        { x: 80, y: 340, r: 60 }, { x: 240, y: 350, r: 80 }, { x: 410, y: 330, r: 65 },
        { x: 160, y: 460, r: 70 }, { x: 350, y: 450, r: 60 }, { x: 480, y: 470, r: 50 }
    ];

    for (let i = 0; i < seedPoints.length; i++) {
        const p = seedPoints[i];
        const radGrad = ctx.createRadialGradient(p.x, p.y, p.r * 0.2, p.x, p.y, p.r);
        radGrad.addColorStop(0, 'rgba(235, 255, 255, 0.45)');
        radGrad.addColorStop(0.65, 'rgba(110, 240, 255, 0.25)');
        radGrad.addColorStop(1.0, 'rgba(40, 210, 245, 0.0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Shimmering organic liquid caustics loops (closed organic curves)
    ctx.lineWidth = 2.4;
    for (let c = 0; c < 16; c++) {
        const ox = (c * 67 + 31) % 512;
        const oy = (c * 89 + 53) % 512;
        const radius = 25 + (c % 5) * 8;
        ctx.beginPath();
        ctx.strokeStyle = (c % 2 === 0) ? 'rgba(240, 255, 255, 0.42)' : 'rgba(120, 245, 255, 0.32)';
        for (let a = 0; a <= Math.PI * 2 + 0.1; a += Math.PI / 4) {
            const rOffset = Math.sin(a * 3 + c) * 6;
            const px = ox + Math.cos(a) * (radius + rOffset);
            const py = oy + Math.sin(a) * (radius + rOffset);
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Sharp sparkling specular sun glints & star flares
    ctx.fillStyle = '#ffffff';
    for (let j = 0; j < 50; j++) {
        const gx = ((j * 137.5) % 500) + 6;
        const gy = ((j * 269.3) % 500) + 6;
        const radius = (j % 4 === 0) ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.arc(gx, gy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 4-point star flare on brightest sparkles
        if (j % 4 === 0) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.0;
            ctx.moveTo(gx - radius * 3.0, gy);
            ctx.lineTo(gx + radius * 3.0, gy);
            ctx.moveTo(gx, gy - radius * 3.0);
            ctx.lineTo(gx, gy + radius * 3.0);
            ctx.stroke();
        }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createWaterNormalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Flat normal map base (RGB 128, 128, 255 = Vec3(0, 0, 1))
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 256, 256);
    
    // Perturb with smooth organic ripple normal gradients
    for (let i = 0; i < 35; i++) {
        const cx = (i * 73) % 256;
        const cy = (i * 109) % 256;
        const rad = 20 + (i % 6) * 6;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
        // Vary R & G slightly to create subtle surface tilt
        const rVal = 128 + Math.round(Math.sin(i * 1.5) * 35);
        const gVal = 128 + Math.round(Math.cos(i * 1.5) * 35);
        grad.addColorStop(0, `rgba(${rVal}, ${gVal}, 255, 0.45)`);
        grad.addColorStop(1, 'rgba(128, 128, 255, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function createUnderwaterBubble(x, y, z) {
    const geo = new THREE.SphereGeometry(0.18 + Math.random() * 0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xd0f8ff,
        transparent: true,
        opacity: 0.85
    });
    const bubble = new THREE.Mesh(geo, mat);
    bubble.position.set(
        x + (Math.random() - 0.5) * 0.6,
        y,
        z + (Math.random() - 0.5) * 0.6
    );
    bubble.userData.noGroundRay = true;
    scene.add(bubble);
    
    let life = 0;
    const speedY = 3.5 + Math.random() * 2.5;
    const anim = {
        update(t) {
            life += 1 / 60;
            bubble.position.y += speedY * (1 / 60);
            bubble.position.x += Math.sin(t * 8 + x) * 0.02;
            bubble.scale.multiplyScalar(1.015);
            mat.opacity = Math.max(0, 0.85 * (1 - life / 1.2));
            if (life >= 1.2 || bubble.position.y >= -0.5) {
                scene.remove(bubble);
                const idx = animatedMapObjects.indexOf(anim);
                if (idx !== -1) animatedMapObjects.splice(idx, 1);
            }
        }
    };
    animatedMapObjects.push(anim);
}

function createWaterSplash(x, y, z) {
    const splashGeo = new THREE.RingGeometry(0.3, 1.4, 20);
    splashGeo.rotateX(-Math.PI / 2);
    const splashMat = new THREE.MeshBasicMaterial({
        color: 0x70f0ff,
        transparent: true,
        opacity: 0.80,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(splashGeo, splashMat);
    ring.position.set(x, y + 0.08, z);
    ring.userData.noGroundRay = true;
    scene.add(ring);
    
    let life = 0;
    const anim = {
        update(t) {
            life += 1 / 60;
            const s = 1.0 + life * 5.5;
            ring.scale.set(s, s, s);
            splashMat.opacity = Math.max(0, 0.80 * (1.0 - life / 0.40));
            if (life >= 0.40) {
                scene.remove(ring);
                const idx = animatedMapObjects.indexOf(anim);
                if (idx !== -1) animatedMapObjects.splice(idx, 1);
            }
        }
    };
    animatedMapObjects.push(anim);
}

function addMoatWater(w, d, x, y, z, depth = 10, options = {}) {
    const segsX = Math.min(32, Math.max(8, Math.round(w / 8)));
    const segsZ = Math.min(32, Math.max(8, Math.round(d / 8)));
    const geo = new THREE.PlaneGeometry(w, d, segsX, segsZ);
    geo.rotateX(-Math.PI / 2);
    
    const pos = geo.attributes.position;
    const origY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
        origY[i] = pos.getY(i);
    }
    
    const waterColor = options.color !== undefined ? options.color : 0x24b8e0; // Sparkling crystal light blue
    const waterGlow = options.emissive !== undefined ? options.emissive : 0x033844;
    const opacity = options.opacity !== undefined ? options.opacity : 0.65; // Transparent view of moat bed with surface reflection
    const causticTex = createSparklingWaterTexture(options.glowColor || '#40e0d0');
    causticTex.repeat.set(Math.max(1, w / 22), Math.max(1, d / 22));
    
    const normalTex = createWaterNormalTexture();
    normalTex.repeat.set(Math.max(1, w / 18), Math.max(1, d / 18));
    
    const mat = new THREE.MeshStandardMaterial({
        color: waterColor,
        emissive: waterGlow,
        emissiveIntensity: 0.28,
        map: causticTex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.08,
        metalness: 0.52,
        transparent: true,
        opacity: opacity,
        depthWrite: false
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.userData.isWater = true;
    mesh.userData.noGroundRay = true;
    scene.add(mesh);
    mapDecorations.push(mesh);
    
    const waterObj = {
        mesh,
        w, d, x, y, z,
        depth: depth,
        bedY: y - depth,
        surfaceY: y,
        update(time) {
            causticTex.offset.x = (time * 0.022) % 1;
            causticTex.offset.y = (time * 0.016) % 1;
            normalTex.offset.x = (time * 0.018) % 1;
            normalTex.offset.y = (time * 0.026) % 1;
            const p = geo.attributes.position;
            const cnt = p.count;
            const waveSpeed = 2.0;
            for (let i = 0; i < cnt; i++) {
                const vx = p.getX(i);
                const vz = p.getZ(i);
                const wave = Math.sin(vx * 0.12 + time * waveSpeed) * 0.28 + 
                             Math.cos(vz * 0.14 + time * (waveSpeed * 0.8)) * 0.22 +
                             Math.sin((vx + vz) * 0.08 + time * 1.5) * 0.15;
                p.setY(i, origY[i] + wave);
            }
            p.needsUpdate = true;
            geo.computeVertexNormals();
        }
    };
    animatedMapObjects.push(waterObj);
    activeWaterPlanes.push(waterObj);
    return mesh;
}

function addMoat(x, z, width, length, depth = 10, options = {}) {
    const isAlongZ = options.isAlongZ !== false; // Default river runs along Z
    const wallCol = options.wallColor || (options.isLandscape ? 0x2d323c : 0x111624);
    const wallGlow = options.wallGlow || (options.isLandscape ? '#3a414d' : '#00f3ff');
    const bedCol = options.bedColor || 0x182028;
    const bedGlow = options.bedGlow || '#203040';
    
    // 1. Solid Moat Bed Physics & Visual (at y = -depth)
    addBox(width, 4, length, x, -depth - 2, z, bedCol, bedGlow);
    
    // 2. Solid Retaining Embankment Walls on the Left and Right
    const wallThick = 2.0;
    if (isAlongZ) {
        // Left (West) wall
        addBox(wallThick, depth, length, x - width / 2 - wallThick / 2, -depth / 2, z, wallCol, wallGlow);
        // Right (East) wall
        addBox(wallThick, depth, length, x + width / 2 + wallThick / 2, -depth / 2, z, wallCol, wallGlow);
        
        // Walkable Cobblestone Exit Ramps connecting moat bed to ground level y = 0
        if (options.hasRamps !== false) {
            const rampLen = depth * 2.5;
            const angle = Math.atan2(depth, rampLen);
            // Left bank exit ramps
            addRamp(wallThick + 2, 1.5, rampLen, x - width / 2 + 1, -depth / 2, z + length * 0.25, angle, 0, wallCol, wallGlow);
            addRamp(wallThick + 2, 1.5, rampLen, x - width / 2 + 1, -depth / 2, z - length * 0.25, -angle, 0, wallCol, wallGlow);
            // Right bank exit ramps
            addRamp(wallThick + 2, 1.5, rampLen, x + width / 2 - 1, -depth / 2, z + length * 0.25, angle, 0, wallCol, wallGlow);
            addRamp(wallThick + 2, 1.5, rampLen, x + width / 2 - 1, -depth / 2, z - length * 0.25, -angle, 0, wallCol, wallGlow);
        }
    } else {
        // North wall
        addBox(width, depth, wallThick, x, -depth / 2, z - length / 2 - wallThick / 2, wallCol, wallGlow);
        // South wall
        addBox(width, depth, wallThick, x, -depth / 2, z + length / 2 + wallThick / 2, wallCol, wallGlow);
        
        if (options.hasRamps !== false) {
            const rampLen = depth * 2.5;
            const angle = Math.atan2(depth, rampLen);
            addRamp(rampLen, 1.5, wallThick + 2, x + width * 0.25, -depth / 2, z - length / 2 + 1, 0, angle, wallCol, wallGlow);
            addRamp(rampLen, 1.5, wallThick + 2, x - width * 0.25, -depth / 2, z + length / 2 - 1, 0, -angle, wallCol, wallGlow);
        }
    }
    
    // 3. Sparkling Clear Light Blue Water Surface at y = -0.5
    addMoatWater(width, length, x, -0.5, z, depth, options);
}

function addWater(w, d, x, y, z, options = {}) {
    return addMoatWater(w, d, x, y, z, options.depth || 10, options);
}

function addMirrorBox(w, h, d, x, y, z, color = 0x111624, glow = '#00f3ff', metalness = 0.96, roughness = 0.04) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); 
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); 
    body.addShape(shape); 
    body.position.set(x, y, z); 
    world.addBody(body);

    const geo = new THREE.BoxGeometry(w, h, d); 
    const tex = createNeonGridTexture(color, glow); 
    tex.repeat.set(Math.max(1, w/12), Math.max(1, h/12));
    const mat = new THREE.MeshStandardMaterial({ 
        color: color,
        map: tex, 
        emissiveMap: tex, 
        emissive: color, 
        emissiveIntensity: 0.25,
        roughness: roughness,
        metalness: metalness
    }); 
    const mesh = new THREE.Mesh(geo, mat); 
    mesh.position.set(x, y, z); 
    mesh.castShadow = true; 
    mesh.receiveShadow = true; 
    scene.add(mesh); 
    mapMeshes.push(mesh); 
    mapBodies.push(body);
    return mesh;
}

function addGlassBox(w, h, d, x, y, z, color = 0x00f3ff, glow = '#00f3ff', opacity = 0.45) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); 
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); 
    body.addShape(shape); 
    body.position.set(x, y, z); 
    world.addBody(body);

    const geo = new THREE.BoxGeometry(w, h, d); 
    const tex = createNeonGridTexture(0x0a1e30, glow); 
    tex.repeat.set(Math.max(1, w/8), Math.max(1, d/8));
    const mat = new THREE.MeshStandardMaterial({ 
        color: color,
        map: tex, 
        emissive: color, 
        emissiveIntensity: 0.35,
        roughness: 0.05,
        metalness: 0.85,
        transparent: true,
        opacity: opacity,
        depthWrite: false
    }); 
    const mesh = new THREE.Mesh(geo, mat); 
    mesh.position.set(x, y, z); 
    mesh.castShadow = false; 
    mesh.receiveShadow = true; 
    scene.add(mesh); 
    mapMeshes.push(mesh); 
    mapBodies.push(body);
    return mesh;
}

function addJumpPad(x, z, y = 0.3, power = 38) {
    const padBase = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.8, 0.6, 24),
        new THREE.MeshStandardMaterial({ color: 0x0d1424, metalness: 0.9, roughness: 0.2 })
    );
    padBase.position.set(x, y, z);
    scene.add(padBase);
    mapMeshes.push(padBase);

    const padRing = new THREE.Mesh(
        new THREE.RingGeometry(1.8, 3.6, 32),
        new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide })
    );
    padRing.rotateX(-Math.PI / 2);
    padRing.position.set(x, y + 0.32, z);
    scene.add(padRing);
    mapDecorations.push(padRing);

    const padCore = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 24),
        new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide })
    );
    padCore.rotateX(-Math.PI / 2);
    padCore.position.set(x, y + 0.33, z);
    scene.add(padCore);
    mapDecorations.push(padCore);

    activeJumpPads.push({ x, z, y, power });
}

// ============================================================================
// PROCEDURAL HIGH-POLY LANDSCAPE ASSETS, GREY TOWERS, AND VEGETATION
// ============================================================================

function createVerdantTerrainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Rich natural base turf
    ctx.fillStyle = '#1e4722';
    ctx.fillRect(0, 0, 512, 512);
    
    // Procedural grass blade flecks and moss patterns
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random();
        if (r < 0.42) {
            ctx.fillStyle = '#2d6a33'; // Vibrant grass fleck
        } else if (r < 0.72) {
            ctx.fillStyle = '#143818'; // Deep moss shadow
        } else if (r < 0.90) {
            ctx.fillStyle = '#3e8846'; // Sunlit emerald blade
        } else {
            ctx.fillStyle = '#3c4432'; // Dry earth blend
        }
        ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }
    
    // Soft subtle tactical perimeter grid accent
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 512, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Procedural High-Poly 3D Tree Generator (Deciduous, Pine, Willow)
function addTree(x, z, scale = 1.0, type = 'deciduous') {
    const isPine = (type === 'pine');
    const isWillow = (type === 'willow');
    const trunkH = (isPine ? 22 : (isWillow ? 18 : 16)) * scale;
    const trunkRTop = (isPine ? 0.6 : 0.8) * scale;
    const trunkRBot = (isPine ? 1.2 : 1.4) * scale;
    
    // 1. High-poly bark cylinder trunk
    const trunkGeo = new THREE.CylinderGeometry(trunkRTop, trunkRBot, trunkH, 12, 3);
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3d271d,
        roughness: 0.92,
        metalness: 0.08
    });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.set(x, trunkH / 2, z);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    scene.add(trunkMesh);
    mapMeshes.push(trunkMesh);
    
    // Cannon.js solid physics body for tactical combat cover
    const trunkShape = new CANNON.Box(new CANNON.Vec3(trunkRBot * 0.9, trunkH / 2, trunkRBot * 0.9));
    const trunkBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    trunkBody.addShape(trunkShape);
    trunkBody.position.set(x, trunkH / 2, z);
    world.addBody(trunkBody);
    mapBodies.push(trunkBody);
    
    // Root flares spreading into the soil
    for (let r = 0; r < 4; r++) {
        const angle = (r * Math.PI) / 2 + 0.35;
        const rootMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.7 * scale, 1.2 * scale, 1.8 * scale),
            trunkMat
        );
        rootMesh.position.set(
            x + Math.cos(angle) * (trunkRBot * 0.9),
            0.6 * scale,
            z + Math.sin(angle) * (trunkRBot * 0.9)
        );
        rootMesh.rotation.y = angle;
        rootMesh.castShadow = true;
        rootMesh.userData.noGroundRay = true;
        scene.add(rootMesh);
        mapDecorations.push(rootMesh);
    }
    
    // 2. Multi-Cluster High-Poly Foliage Canopy (Marked noGroundRay so gravity never snaps to canopies)
    if (isPine) {
        // Layered alpine conifer skirts tapering upward
        const tiers = [
            { r: 7.2 * scale, h: 6.2 * scale, y: 9.0 * scale, color: 0x1b4332 },
            { r: 5.8 * scale, h: 5.6 * scale, y: 13.0 * scale, color: 0x22573f },
            { r: 4.4 * scale, h: 5.2 * scale, y: 17.0 * scale, color: 0x2d6a4f },
            { r: 2.8 * scale, h: 4.6 * scale, y: 20.8 * scale, color: 0x40916c }
        ];
        tiers.forEach(t => {
            const coneGeo = new THREE.ConeGeometry(t.r, t.h, 14, 2);
            const coneMat = new THREE.MeshStandardMaterial({
                color: t.color,
                roughness: 0.78,
                metalness: 0.05
            });
            const coneMesh = new THREE.Mesh(coneGeo, coneMat);
            coneMesh.position.set(x, t.y, z);
            coneMesh.castShadow = true;
            coneMesh.receiveShadow = true;
            coneMesh.userData.noGroundRay = true;
            scene.add(coneMesh);
            mapDecorations.push(coneMesh);
        });
    } else if (isWillow) {
        // Drooping weeping willow clusters for lakesides
        const willowColors = [0x4a7c59, 0x588157, 0x386641];
        const clusters = [
            { r: 5.5 * scale, sy: 1.6, ox: 0, oy: 15 * scale, oz: 0 },
            { r: 4.2 * scale, sy: 1.8, ox: -2.8 * scale, oy: 12.5 * scale, oz: 1.8 * scale },
            { r: 4.0 * scale, sy: 1.7, ox: 2.8 * scale, oy: 13 * scale, oz: -1.8 * scale },
            { r: 3.8 * scale, sy: 1.9, ox: 1.5 * scale, oy: 12 * scale, oz: 2.6 * scale },
            { r: 3.9 * scale, sy: 1.7, ox: -1.6 * scale, oy: 12.8 * scale, oz: -2.5 * scale }
        ];
        clusters.forEach((c, idx) => {
            const geo = new THREE.IcosahedronGeometry(c.r, 2);
            const mat = new THREE.MeshStandardMaterial({
                color: willowColors[idx % willowColors.length],
                roughness: 0.8,
                metalness: 0.05
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(1.0, c.sy, 1.0);
            mesh.position.set(x + c.ox, c.oy, z + c.oz);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.noGroundRay = true;
            scene.add(mesh);
            mapDecorations.push(mesh);
        });
    } else {
        // Broad lush deciduous oak with 6 multi-cluster organic domes
        const foliageColors = [0x2d6a4f, 0x40916c, 0x1b4332, 0x52b788, 0x38b000];
        const clusters = [
            { r: 5.8 * scale, ox: 0, oy: 16.0 * scale, oz: 0 },
            { r: 4.5 * scale, ox: -2.8 * scale, oy: 14.2 * scale, oz: 1.6 * scale },
            { r: 4.3 * scale, ox: 3.0 * scale, oy: 14.8 * scale, oz: -1.4 * scale },
            { r: 4.1 * scale, ox: 0.8 * scale, oy: 13.8 * scale, oz: 3.0 * scale },
            { r: 4.2 * scale, ox: -1.2 * scale, oy: 14.5 * scale, oz: -2.8 * scale },
            { r: 3.6 * scale, ox: 0, oy: 19.5 * scale, oz: 0 }
        ];
        clusters.forEach((c, idx) => {
            const geo = new THREE.IcosahedronGeometry(c.r, 2);
            const mat = new THREE.MeshStandardMaterial({
                color: foliageColors[idx % foliageColors.length],
                roughness: 0.76,
                metalness: 0.05
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + c.ox, c.oy, z + c.oz);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.noGroundRay = true;
            scene.add(mesh);
            mapDecorations.push(mesh);
        });
    }
}

// Procedural High-Poly Bush Clumps
function addBush(x, y, z, scale = 1.0) {
    const bushColors = [0x2d6a4f, 0x40916c, 0x38b000];
    const clumps = [
        { r: 1.8 * scale, ox: 0, oy: 1.2 * scale, oz: 0 },
        { r: 1.4 * scale, ox: 1.1 * scale, oy: 0.9 * scale, oz: 0.4 * scale },
        { r: 1.3 * scale, ox: -1.0 * scale, oy: 0.8 * scale, oz: -0.5 * scale }
    ];
    clumps.forEach((c, i) => {
        const geo = new THREE.IcosahedronGeometry(c.r, 2);
        const mat = new THREE.MeshStandardMaterial({
            color: bushColors[i % bushColors.length],
            roughness: 0.82,
            metalness: 0.04
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + c.ox, y + c.oy, z + c.oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.noGroundRay = true;
        scene.add(mesh);
        mapDecorations.push(mesh);
    });
}

// Procedural High-Poly Weathered Granite Rock Outcroppings
function addRock(x, y, z, sx, sy, sz, rotY = 0) {
    const geo = new THREE.DodecahedronGeometry(1.0, 1);
    const mat = new THREE.MeshStandardMaterial({
        color: 0x4a4f56,
        roughness: 0.88,
        metalness: 0.15
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.y = rotY;
    mesh.position.set(x, y + sy * 0.7, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    mapMeshes.push(mesh);
    
    // Physics collision box
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial });
    body.addShape(new CANNON.Box(new CANNON.Vec3(sx * 0.8, sy * 0.7, sz * 0.8)));
    body.position.set(x, y + sy * 0.7, z);
    world.addBody(body);
    mapBodies.push(body);
}

// Procedural Creeping Ivy Vines
function addVines(x, y, z, w, h, d) {
    const vineMat = new THREE.MeshStandardMaterial({
        color: 0x2d6a4f,
        roughness: 0.85,
        metalness: 0.05
    });
    const vineGeo = new THREE.BoxGeometry(w, h, d);
    const vineMesh = new THREE.Mesh(vineGeo, vineMat);
    vineMesh.position.set(x, y, z);
    vineMesh.castShadow = true;
    vineMesh.userData.noGroundRay = true;
    scene.add(vineMesh);
    mapDecorations.push(vineMesh);
}

// ============================================================================
// INTERACTIVE SECRET PORTAL, ISOLATED SNIPER NEST & EASTER EGG SYSTEMS
// ============================================================================

function addSecretPortal(x, y, z, targetX, targetY, targetZ, options = {}) {
    const isExit = options.isExit === true;
    const portalCol = options.color || (isExit ? 0x00ffaa : 0x00f3ff);
    
    // Glowing ground ring
    const ringGeo = new THREE.RingGeometry(0.7, 1.9, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
        color: portalCol,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(x, y + 0.08, z);
    ringMesh.userData.noGroundRay = true;
    scene.add(ringMesh);
    mapDecorations.push(ringMesh);
    
    // Vertical ethereal particle cylinder / light beam
    const beamGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
        color: portalCol,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(x, y + 2.0, z);
    beamMesh.userData.noGroundRay = true;
    scene.add(beamMesh);
    mapDecorations.push(beamMesh);
    
    const portalObj = {
        x, y, z,
        targetX, targetY, targetZ,
        options,
        mesh: ringMesh,
        beamMesh,
        cooldown: 0,
        update(time) {
            ringMesh.rotation.z = time * 2.0;
            beamMat.opacity = 0.25 + Math.sin(time * 5.0) * 0.15;
            if (this.cooldown > 0) this.cooldown -= 1/60;
        }
    };
    animatedMapObjects.push(portalObj);
    activePortals.push(portalObj);
    return portalObj;
}

function addIsolatedSniperSanctuary(towerX, towerZ, towerHeight, options = {}) {
    const isCyber = options.style === 'cyber' || options.isCyber === true;
    const nestW = 22.0;
    const nestD = 22.0;
    const nestH = 7.5;
    
    // Suspended high in the sky, isolated from the tower so nobody can reach it from outside
    const nestX = towerX + 48;
    const nestY = towerHeight + 28;
    const nestZ = towerZ - 48;
    
    const wallCol = isCyber ? 0x111624 : 0x22262d;
    const floorCol = isCyber ? 0x161c2e : 0x2d323c;
    const trimHex = isCyber ? '#00f3ff' : '#00ffaa';
    
    // 1. Isolated Floor Slab
    addBox(nestW, 1.6, nestD, nestX, nestY - 0.8, nestZ, floorCol, trimHex);
    
    // Transparent glass floor section in center (8x8) to observe the battlefield
    const glassGeo = new THREE.PlaneGeometry(8, 8);
    glassGeo.rotateX(-Math.PI / 2);
    const glassMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
        metalness: 0.9,
        side: THREE.DoubleSide
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(nestX, nestY + 0.05, nestZ);
    glassMesh.userData.noGroundRay = true;
    scene.add(glassMesh);
    mapDecorations.push(glassMesh);
    
    // 2. Fortified Perimeter Walls with 360-Degree Sniper Murder Slits
    const slitH = 1.8;
    const baseWallH = 2.8;
    const topWallH = nestH - (baseWallH + slitH);
    
    // Lower chest cover
    addBox(nestW, baseWallH, 1.4, nestX, nestY + baseWallH / 2, nestZ - nestD / 2, wallCol, trimHex);
    addBox(nestW, baseWallH, 1.4, nestX, nestY + baseWallH / 2, nestZ + nestD / 2, wallCol, trimHex);
    addBox(1.4, baseWallH, nestD, nestX - nestW / 2, nestY + baseWallH / 2, nestZ, wallCol, trimHex);
    addBox(1.4, baseWallH, nestD, nestX + nestW / 2, nestY + baseWallH / 2, nestZ, wallCol, trimHex);
    
    // Upper wall above shoot slits
    addBox(nestW, topWallH, 1.4, nestX, nestY + baseWallH + slitH + topWallH / 2, nestZ - nestD / 2, wallCol, trimHex);
    addBox(nestW, topWallH, 1.4, nestX, nestY + baseWallH + slitH + topWallH / 2, nestZ + nestD / 2, wallCol, trimHex);
    addBox(1.4, topWallH, nestD, nestX - nestW / 2, nestY + baseWallH + slitH + topWallH / 2, nestZ, wallCol, trimHex);
    addBox(1.4, topWallH, nestD, nestX + nestW / 2, nestY + baseWallH + slitH + topWallH / 2, nestZ, wallCol, trimHex);
    
    // Slit pillar dividers
    [-nestW * 0.28, nestW * 0.28].forEach(ox => {
        addBox(1.6, slitH, 1.4, nestX + ox, nestY + baseWallH + slitH / 2, nestZ - nestD / 2, wallCol, trimHex);
        addBox(1.6, slitH, 1.4, nestX + ox, nestY + baseWallH + slitH / 2, nestZ + nestD / 2, wallCol, trimHex);
    });
    [-nestD * 0.28, nestD * 0.28].forEach(oz => {
        addBox(1.4, slitH, 1.6, nestX - nestW / 2, nestY + baseWallH + slitH / 2, nestZ + oz, wallCol, trimHex);
        addBox(1.4, slitH, 1.6, nestX + nestW / 2, nestY + baseWallH + slitH / 2, nestZ + oz, wallCol, trimHex);
    });
    
    // 3. Blast-Proof Heavy Canopy Roof
    addBox(nestW + 2, 1.4, nestD + 2, nestX, nestY + nestH + 0.7, nestZ, floorCol, trimHex);
    
    // 4. Return Portal inside Sanctuary (in corner)
    addSecretPortal(nestX - 7.0, nestY, nestZ - 7.0, towerX, 1.5, towerZ + 18, {
        isExit: true,
        message: "Redeployed from Sniper Sanctuary to Arena Floor!"
    });
    
    // 5. Exclusive Arsenal Cache inside Sanctuary
    addEasterEgg(nestX + 6.0, nestY + 1.2, nestZ + 6.0, "Ghost Sniper Arsenal", 150, 'relic');
    
    return { nestX, nestY, nestZ };
}

function addEasterEgg(x, y, z, name, rewardCoins = 150, type = 'relic', options = {}) {
    let mesh;
    if (type === 'duck') {
        const duckGroup = new THREE.Group();
        const duckMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.15, emissive: 0xffaa00, emissiveIntensity: 0.4 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.5), duckMat);
        duckGroup.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), duckMat);
        head.position.set(0, 0.75, 0.45);
        duckGroup.add(head);
        const billMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 0.5 });
        const bill = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.55), billMat);
        bill.position.set(0, 0.55, 0.95);
        duckGroup.add(bill);
        duckGroup.position.set(x, y, z);
        duckGroup.userData.noGroundRay = true;
        scene.add(duckGroup);
        mapDecorations.push(duckGroup);
        mesh = duckGroup;
    } else if (type === 'matrix') {
        const boxGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x00ff44, wireframe: true, emissive: 0x00ff44, emissiveIntensity: 1.2 });
        mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.set(x, y, z);
        mesh.userData.noGroundRay = true;
        scene.add(mesh);
        mapDecorations.push(mesh);
    } else if (type === 'crystals') {
        const cGroup = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const cGeo = new THREE.ConeGeometry(0.35 + i * 0.08, 1.8 + i * 0.3, 5);
            const cMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, emissive: 0x00a0ff, emissiveIntensity: 1.5, transparent: true, opacity: 0.85 });
            const cMesh = new THREE.Mesh(cGeo, cMat);
            cMesh.position.set(Math.sin(i * 1.3) * 0.7, 0.9, Math.cos(i * 1.3) * 0.7);
            cMesh.rotation.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
            cGroup.add(cMesh);
        }
        cGroup.position.set(x, y, z);
        cGroup.userData.noGroundRay = true;
        scene.add(cGroup);
        mapDecorations.push(cGroup);
        mesh = cGroup;
    } else {
        const relicGeo = new THREE.OctahedronGeometry(1.2, 0);
        const relicMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xff8800, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1 });
        mesh = new THREE.Mesh(relicGeo, relicMat);
        mesh.position.set(x, y, z);
        mesh.userData.noGroundRay = true;
        scene.add(mesh);
        mapDecorations.push(mesh);
    }
    
    const animObj = {
        mesh,
        update(time) {
            mesh.rotation.y = time * 2.0;
            mesh.position.y = y + Math.sin(time * 3.0 + x) * 0.35;
        }
    };
    animatedMapObjects.push(animObj);
    activeEasterEggs.push({ x, y, z, name, rewardCoins, mesh, collected: false });
}

// ============================================================================
// MODULAR HOLLOW TACTICAL TOWER SYSTEM WITH STAIRS, SHOOT SLITS & SECRET SNIPER PERCH
// ============================================================================

function addHollowTower(x, z, width, height, depth, options = {}) {
    const isCyber = options.style === 'cyber' || options.isCyber === true;
    const team = options.team || 'neutral';
    
    let trimHex = '#a0b4c8';
    let wallCol = 0x282c34;
    let floorCol = 0x3d434e;
    let beaconCol = 0x00ffaa;
    
    if (isCyber) {
        wallCol = 0x111624;
        floorCol = 0x161c2e;
        trimHex = '#00f3ff';
        beaconCol = 0x00f3ff;
        if (team === 'red') { trimHex = '#ff0055'; beaconCol = 0xff0055; }
        else if (team === 'blue') { trimHex = '#0077ff'; beaconCol = 0x0077ff; }
    } else {
        if (team === 'red') { trimHex = '#ff0044'; wallCol = 0x2e2528; beaconCol = 0xff0044; }
        else if (team === 'blue') { trimHex = '#0077ff'; wallCol = 0x25282e; beaconCol = 0x0077ff; }
    }

    const wallThick = 1.6;
    const halfW = width / 2;
    const halfD = depth / 2;
    
    // Tower Story Elevations:
    const floor2Y = Math.max(12, Math.round(height * 0.36)); // Mid Observation Deck
    const floor3Y = Math.max(floor2Y + 12, Math.round(height * 0.70)); // Upper Battlement Deck
    const roofY = height;                     // Rooftop Parapet
    const slitH = 2.0;                        // Tactical Shoot Hole Slit Height
    
    // ------------------------------------------------------------------------
    // 1. GROUND FLOOR (y = 0 to floor2Y)
    // ------------------------------------------------------------------------
    // Arched Entrance Doorway on Front Wall (+Z / South)
    const doorW = width * 0.38;
    const doorH = 9.0;
    const frontSideW = (width - doorW) / 2;
    
    // Front Wall: Left Column, Right Column, Header over Door
    addBox(frontSideW, floor2Y, wallThick, x - halfW + frontSideW / 2, floor2Y / 2, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(frontSideW, floor2Y, wallThick, x + halfW - frontSideW / 2, floor2Y / 2, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(doorW, floor2Y - doorH, wallThick, x, doorH + (floor2Y - doorH) / 2, z + halfD - wallThick / 2, wallCol, trimHex);
    
    // Left (West) Wall on Ground Floor with Murder Slits
    addBox(wallThick, 3.4, depth, x - halfW + wallThick / 2, 1.7, z, wallCol, trimHex);
    const topH1 = floor2Y - (3.4 + slitH);
    addBox(wallThick, topH1, depth, x - halfW + wallThick / 2, (3.4 + slitH) + topH1 / 2, z, wallCol, trimHex);
    for (let s = -depth * 0.35; s <= depth * 0.35; s += depth * 0.35) {
        addBox(wallThick, slitH, 1.8, x - halfW + wallThick / 2, 3.4 + slitH / 2, z + s, wallCol, trimHex);
    }
    
    // Right (East) Wall on Ground Floor with Murder Slits
    addBox(wallThick, 3.4, depth, x + halfW - wallThick / 2, 1.7, z, wallCol, trimHex);
    addBox(wallThick, topH1, depth, x + halfW - wallThick / 2, (3.4 + slitH) + topH1 / 2, z, wallCol, trimHex);
    for (let s = -depth * 0.35; s <= depth * 0.35; s += depth * 0.35) {
        addBox(wallThick, slitH, 1.8, x + halfW - wallThick / 2, 3.4 + slitH / 2, z + s, wallCol, trimHex);
    }
    
    // Rear Wall on Ground Floor with Truly Concealed Secret Sniper Entry
    const secretDoorW = 3.6;
    const rearSideW = (width - secretDoorW) / 2;
    addBox(rearSideW, floor2Y, wallThick, x - halfW + rearSideW / 2, floor2Y / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(rearSideW, floor2Y, wallThick, x + halfW - rearSideW / 2, floor2Y / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(secretDoorW, floor2Y - 6.5, wallThick, x, 6.5 + (floor2Y - 6.5) / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    
    // Concealed Secret Alcove behind rear wall
    const secretAlcoveZ = z - halfD - 3.2;
    addBox(wallThick, 7.5, 5.5, x - 2.5, 3.75, secretAlcoveZ, wallCol, trimHex);
    addBox(wallThick, 7.5, 5.5, x + 2.5, 3.75, secretAlcoveZ, wallCol, trimHex);
    addBox(5.5, 1.2, 5.5, x, 7.5, secretAlcoveZ, wallCol, trimHex);
    
    if (!isCyber) {
        // Camouflage hanging ivy vines completely concealing the secret entrance
        addVines(x, 4.0, secretAlcoveZ - 2.8, 5.6, 7.5, 1.0);
        addVines(x - 2.8, 3.5, secretAlcoveZ, 1.0, 6.5, 5.0);
        addVines(x + 2.8, 3.5, secretAlcoveZ, 1.0, 6.5, 5.0);
    }
    
    // Generate the Isolated Ghost Sniper Sanctuary high in the sky!
    const sanctuary = addIsolatedSniperSanctuary(x, z, height, options);
    
    // Secret Infiltration Portal inside the concealed alcove
    addSecretPortal(x, 0.3, secretAlcoveZ, sanctuary.nestX, sanctuary.nestY + 1.5, sanctuary.nestZ, {
        isSecret: true,
        message: "🏆 SECRET DISCOVERED: Infiltrated the Isolated Sniper Sanctuary! (+150 Coins)",
        rewardWeapon: 'sniper'
    });
    
    // Central Ground Floor Express Core Lift (instantly lofts player straight to rooftop battlement!)
    addJumpPad(x, z, 0.35, Math.sqrt(2 * 60 * (roofY + 3.0)), { name: "Tower Core Express Lift" });
    
    // ------------------------------------------------------------------------
    // 2. FLOOR 2 (y = floor2Y): Mid Observation Deck & Murder Slits
    // ------------------------------------------------------------------------
    const stairHoleW = width * 0.36;
    // Walkable floor slab with stairwell opening on East side
    addBox(width - stairHoleW - 1, 1.4, depth - 2, x - stairHoleW / 2, floor2Y - 0.7, z, floorCol, trimHex);
    
    // Walkable Interior Stairs 1 (Ground -> Floor 2) along East wall
    addRamp(width * 0.30, 1.2, depth * 0.80, x + halfW - width * 0.18, floor2Y / 2, z - depth * 0.05, Math.atan2(floor2Y, depth * 0.80), 0, floorCol, trimHex);
    
    // Floor 2 Perimeter Walls with Shoot Slits on ALL 4 Sides
    const f2H = floor3Y - floor2Y;
    addBox(width, 3.2, wallThick, x, floor2Y + 1.6, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(width, 3.2, wallThick, x, floor2Y + 1.6, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(wallThick, 3.2, depth, x - halfW + wallThick / 2, floor2Y + 1.6, z, wallCol, trimHex);
    addBox(wallThick, 3.2, depth, x + halfW - wallThick / 2, floor2Y + 1.6, z, wallCol, trimHex);
    
    const topH2 = f2H - (3.2 + slitH);
    addBox(width, topH2, wallThick, x, floor2Y + (3.2 + slitH) + topH2 / 2, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(width, topH2, wallThick, x, floor2Y + (3.2 + slitH) + topH2 / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(wallThick, topH2, depth, x - halfW + wallThick / 2, floor2Y + (3.2 + slitH) + topH2 / 2, z, wallCol, trimHex);
    addBox(wallThick, topH2, depth, x + halfW - wallThick / 2, floor2Y + (3.2 + slitH) + topH2 / 2, z, wallCol, trimHex);
    
    [-halfW * 0.5, halfW * 0.5].forEach(ox => {
        addBox(1.8, slitH, wallThick, x + ox, floor2Y + 3.2 + slitH / 2, z + halfD - wallThick / 2, wallCol, trimHex);
        addBox(1.8, slitH, wallThick, x + ox, floor2Y + 3.2 + slitH / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    });
    [-halfD * 0.5, halfD * 0.5].forEach(oz => {
        addBox(wallThick, slitH, 1.8, x - halfW + wallThick / 2, floor2Y + 3.2 + slitH / 2, z + oz, wallCol, trimHex);
        addBox(wallThick, slitH, 1.8, x + halfW - wallThick / 2, floor2Y + 3.2 + slitH / 2, z + oz, wallCol, trimHex);
    });
    
    // ------------------------------------------------------------------------
    // 3. FLOOR 3 (y = floor3Y): Upper Fortress Deck & Murder Slits
    // ------------------------------------------------------------------------
    // Walkable floor slab with stairwell opening on West side
    addBox(width - stairHoleW - 1, 1.4, depth - 2, x + stairHoleW / 2, floor3Y - 0.7, z, floorCol, trimHex);
    
    // Walkable Interior Stairs 2 (Floor 2 -> Floor 3) along West wall
    addRamp(width * 0.30, 1.2, depth * 0.80, x - halfW + width * 0.18, floor2Y + f2H / 2, z + depth * 0.05, -Math.atan2(f2H, depth * 0.80), 0, floorCol, trimHex);
    
    const f3H = roofY - floor3Y;
    addBox(width, 3.2, wallThick, x, floor3Y + 1.6, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(width, 3.2, wallThick, x, floor3Y + 1.6, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(wallThick, 3.2, depth, x - halfW + wallThick / 2, floor3Y + 1.6, z, wallCol, trimHex);
    addBox(wallThick, 3.2, depth, x + halfW - wallThick / 2, floor3Y + 1.6, z, wallCol, trimHex);
    
    const topH3 = f3H - (3.2 + slitH);
    addBox(width, topH3, wallThick, x, floor3Y + (3.2 + slitH) + topH3 / 2, z + halfD - wallThick / 2, wallCol, trimHex);
    addBox(width, topH3, wallThick, x, floor3Y + (3.2 + slitH) + topH3 / 2, z - halfD + wallThick / 2, wallCol, trimHex);
    addBox(wallThick, topH3, depth, x - halfW + wallThick / 2, floor3Y + (3.2 + slitH) + topH3 / 2, z, wallCol, trimHex);
    addBox(wallThick, topH3, depth, x + halfW - wallThick / 2, floor3Y + (3.2 + slitH) + topH3 / 2, z, wallCol, trimHex);
    
    // Walkable Interior Stairs 3 (Floor 3 -> Rooftop) along East wall
    addRamp(width * 0.30, 1.2, depth * 0.80, x + halfW - width * 0.18, floor3Y + f3H / 2, z - depth * 0.05, Math.atan2(f3H, depth * 0.80), 0, floorCol, trimHex);
    
    // ------------------------------------------------------------------------
    // 4. ROOFTOP BATTLEMENT (y = roofY) WITH OPEN STAIRWELL HATCHWAY
    // ------------------------------------------------------------------------
    const balcW = width * 1.25;
    const balcD = depth * 1.25;
    const stairHatchW = width * 0.38;
    const stairHatchD = depth * 0.55;
    
    // West Main Rooftop Deck Slab
    const westBalcW = balcW - stairHatchW;
    addBox(westBalcW, 1.8, balcD, x - stairHatchW / 2, roofY - 0.9, z, floorCol, trimHex);
    
    // East North & South Deck Slabs outside the Stairwell Opening
    const hatchMargD = (balcD - stairHatchD) / 2;
    addBox(stairHatchW, 1.8, hatchMargD, x + balcW / 2 - stairHatchW / 2, roofY - 0.9, z + balcD / 2 - hatchMargD / 2, floorCol, trimHex);
    addBox(stairHatchW, 1.8, hatchMargD, x + balcW / 2 - stairHatchW / 2, roofY - 0.9, z - balcD / 2 + hatchMargD / 2, floorCol, trimHex);
    
    // Interior stairwell protective railing so players don't fall back down accidentally
    addBox(stairHatchW, 1.4, 0.8, x + balcW / 2 - stairHatchW / 2, roofY + 0.7, z + stairHatchD / 2, wallCol, trimHex);
    addBox(0.8, 1.4, stairHatchD, x + balcW / 2 - stairHatchW, roofY + 0.7, z, wallCol, trimHex);
    
    // Parapet Walls around the Roof with Crenellations / Sniper Embrasures
    const railH = 3.6;
    addBox(balcW, railH, 1.2, x, roofY + railH / 2, z - balcD / 2, wallCol, trimHex);
    addBox(balcW, railH, 1.2, x, roofY + railH / 2, z + balcD / 2, wallCol, trimHex);
    addBox(1.2, railH, balcD, x - balcW / 2, roofY + railH / 2, z, wallCol, trimHex);
    addBox(1.2, railH, balcD, x + balcW / 2, roofY + railH / 2, z, wallCol, trimHex);
    
    // Rooftop Elevator Lift Pad to the Eagle's Nest
    addJumpPad(x, z - depth * 0.22, roofY + 0.35, Math.sqrt(2 * 60 * 16), { name: "Eagle's Nest Ascender" });
    
    // ------------------------------------------------------------------------
    // 5. HIGH SNIPER ROOST (THE EAGLE'S NEST at roostY = roofY + 14)
    // ------------------------------------------------------------------------
    const roostY = roofY + 14;
    const roostW = width * 0.52;
    const roostD = depth * 0.52;
    addBox(1.5, 14, 1.5, x - roostW / 2, roofY + 7, z - roostD / 2, wallCol, trimHex);
    addBox(1.5, 14, 1.5, x + roostW / 2, roofY + 7, z - roostD / 2, wallCol, trimHex);
    addBox(1.5, 14, 1.5, x - roostW / 2, roofY + 7, z + roostD / 2, wallCol, trimHex);
    addBox(1.5, 14, 1.5, x + roostW / 2, roofY + 7, z + roostD / 2, wallCol, trimHex);
    
    addBox(roostW, 1.4, roostD, x, roostY - 0.7, z, floorCol, trimHex);
    
    const roostRailH = 3.2;
    addBox(roostW, roostRailH, 0.9, x, roostY + roostRailH / 2, z - roostD / 2, wallCol, trimHex);
    addBox(roostW, roostRailH, 0.9, x, roostY + roostRailH / 2, z + roostD / 2, wallCol, trimHex);
    addBox(0.9, roostRailH, roostD, x - roostW / 2, roostY + roostRailH / 2, z, wallCol, trimHex);
    addBox(0.9, roostRailH, roostD, x + roostW / 2, roostY + roostRailH / 2, z, wallCol, trimHex);
    
    addBox(roostW * 1.15, 1.0, roostD * 1.15, x, roostY + 5.5, z, floorCol, trimHex);
    
    const spireH = 12.0;
    const spireGeo = new THREE.CylinderGeometry(0.3, 0.7, spireH, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.9, roughness: 0.2 });
    const spireMesh = new THREE.Mesh(spireGeo, spireMat);
    spireMesh.position.set(x, roostY + 6.0 + spireH / 2, z);
    spireMesh.userData.noGroundRay = true;
    scene.add(spireMesh);
    mapDecorations.push(spireMesh);
    
    const beaconGeo = new THREE.SphereGeometry(0.9, 12, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
        color: beaconCol,
        emissive: beaconCol,
        emissiveIntensity: 1.8
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(x, roostY + 6.0 + spireH + 0.5, z);
    beaconMesh.userData.noGroundRay = true;
    scene.add(beaconMesh);
    mapDecorations.push(beaconMesh);
    
    animatedMapObjects.push({
        update(time) {
            beaconMat.emissiveIntensity = 1.0 + Math.sin(time * 5.0) * 0.8;
        }
    });
    
    if (!isCyber) {
        addVines(x - width * 0.48, floor2Y * 0.4, z - depth * 0.48, 3.5, floor2Y * 0.8, 3.5);
        addVines(x + width * 0.48, floor2Y * 0.3, z + depth * 0.48, 3.5, floor2Y * 0.6, 3.5);
    }
}

function addGreyTower(x, z, width, height, depth, options = {}) {
    return addHollowTower(x, z, width, height, depth, { ...options, style: 'landscape' });
}

// ============================================================================
// ORIGINAL CLASSIC MAP BUILDERS (MAP 1 FOR EACH GAMEMODE)
// ============================================================================

function buildMapOriginal_FFA() {
    // Central Subterranean Cyber Coolant Moat (depth 8, crystal-clear luminous blue water)
    addMoat(0, 0, 42, 260, 8, { isAlongZ: true, isLandscape: false, wallColor: 0x111624, wallGlow: '#00f3ff', color: 0x38d8f0 });

    // 2 Cyber Crossing Bridges across the coolant trench
    addBox(42, 2.5, 20, 0, 2.0, 65, 0x161c2e, '#00f3ff');
    addBox(42, 2.5, 20, 0, 2.0, -65, 0x161c2e, '#00f3ff');

    // Central Hollow Cyber Spire Tower with Stairs, Neon Shoot Slits & Secret Maintenance Sniper Roost
    addHollowTower(0, 0, 42, 65, 42, { style: 'cyber', team: 'neutral' });

    // 4 Corner Hollow Cyber Defense Towers with Stairs & Shoot Holes
    const s = 70;
    addHollowTower(-s, -s, 22, 50, 22, { style: 'cyber', team: 'neutral' });
    addHollowTower(s, -s, 22, 50, 22, { style: 'cyber', team: 'red' });
    addHollowTower(-s, s, 22, 50, 22, { style: 'cyber', team: 'blue' });
    addHollowTower(s, s, 22, 50, 22, { style: 'cyber', team: 'neutral' });

    // Spiral Ascending Combat Platforms
    for (let i = 0; i < 8; i++) {
        const radius = 55;
        const angle = i * (Math.PI / 4);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 6 + (i * 5);
        addBox(10, 2, 10, x, y, z, 0x1a2236, '#00ffaa');
    }

    addJumpPad(-s, -s + 18, 0.3, 38);
    addJumpPad(s, -s + 18, 0.3, 38);
    addJumpPad(-s, s - 18, 0.3, 38);
    addJumpPad(s, s - 18, 0.3, 38);

    // Easter Eggs & Secret Spots:
    // 1. Subterranean Coolant Vault (swim down into the glowing water!)
    addEasterEgg(0, -5.5, 0, "Coolant Vault Cyber Crystals", 250, 'crystals');
    // 2. High Spire Pinnacle Golden Duck (rooftop needle)
    addEasterEgg(0, 65 + 14 + 19, 0, "Spire Pinnacle Golden Duck", 500, 'duck');
    // 3. Matrix Glitch Node on corner platform
    addEasterEgg(-85, 2.5, 85, "Overclocked Matrix Glitch Node", 250, 'matrix');
    // 4. Forgotten Cyber Prototype Relic hidden behind Red defense tower
    addEasterEgg(s + 12, 1.5, -s - 12, "Forgotten Cyber Prototype Relic", 300, 'relic');
    // 5. Secret Skybeam Conduit Portal from the depths of the moat up to the highest spiral platform
    addSecretPortal(0, -6.5, -95, 0, 44, -55, { isSecret: true, message: "⚡ Coolant Flow Skybeam Surge!" });
}

function buildMapOriginal_TDM() {
    // Red Titan Fortress - Hollow with Stairs, Shoot Slits & Secret Sniper Nest
    addHollowTower(450, 0, 65, 80, 65, { style: 'cyber', team: 'red' });
    addHollowTower(320, 160, 35, 52, 35, { style: 'cyber', team: 'red' });
    addHollowTower(320, -160, 35, 52, 35, { style: 'cyber', team: 'red' });

    // Blue Titan Fortress - Hollow with Stairs, Shoot Slits & Secret Sniper Nest
    addHollowTower(-450, 0, 65, 80, 65, { style: 'cyber', team: 'blue' });
    addHollowTower(-320, 160, 35, 52, 35, { style: 'cyber', team: 'blue' });
    addHollowTower(-320, -160, 35, 52, 35, { style: 'cyber', team: 'blue' });

    // Central Hollow Cyber Spire & Catwalk Bridges
    addHollowTower(0, 0, 50, 65, 50, { style: 'cyber', team: 'neutral' });

    addRamp(30, 2, 80, 65, 20, 0, 0, -Math.PI / 6, 0x222222, '#ffff00');
    addRamp(30, 2, 80, -65, 20, 0, 0, Math.PI / 6, 0x222222, '#ffff00');
    addRamp(30, 2, 80, 0, 20, 65, -Math.PI / 6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 80, 0, 20, -65, Math.PI / 6, 0, 0x222222, '#ffff00');

    addBox(80, 15, 80, 0, 7.5, 200, 0x222222, '#ffff00');
    addBox(80, 15, 80, 0, 7.5, -200, 0x222222, '#ffff00');

    // Easter Eggs & Secret Spots:
    // 1. Under-catwalk Sub-Matrix Core
    addEasterEgg(0, 1.8, 0, "Catwalk Sub-Matrix Core", 350, 'matrix');
    // 2. Red Titan Apex Relic
    addEasterEgg(450, 80 + 14 + 19, 0, "Red Titan Apex Relic", 400, 'relic');
    // 3. Blue Titan Apex Relic
    addEasterEgg(-450, 80 + 14 + 19, 0, "Blue Titan Apex Relic", 400, 'relic');
    // 4. North Catwalk Skyway Vantage Duck
    addEasterEgg(0, 17, 200, "Skyway Vantage Golden Duck", 350, 'duck');
    // 5. South Catwalk Void Walker Crystals
    addEasterEgg(0, 17, -200, "Void Walker Cyber Crystals", 250, 'crystals');
    // 6. Secret Flank Teleport Conduit
    addSecretPortal(0, 15.5, 230, 0, 15.5, -230, { isSecret: true, message: "⚡ Flank Warp: North to South Catwalk!" });
    addSecretPortal(0, 15.5, -230, 0, 15.5, 230, { isSecret: true, message: "⚡ Flank Warp: South to North Catwalk!" });
}

function buildMapOriginal_CTF() {
    buildMapOriginal_TDM();
    const flagGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    const flagMatRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
    const flagMatBlue = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1 });
    
    flagMeshRed = new THREE.Mesh(flagGeo, flagMatRed);
    flagMeshBlue = new THREE.Mesh(flagGeo, flagMatBlue);
    flagMeshRed.position.copy(gameState.flagRed.pos);
    flagMeshBlue.position.copy(gameState.flagBlue.pos);
    
    scene.add(flagMeshRed); 
    scene.add(flagMeshBlue);
    mapMeshes.push(flagMeshRed); 
    mapMeshes.push(flagMeshBlue);

    // CTF Secret Infiltration Tunnels
    addSecretPortal(450, 1.5, 55, 320, 2.0, 140, { isSecret: true, message: "🚩 Red Forward Infiltration Conduit!" });
    addSecretPortal(-450, 1.5, 55, -320, 2.0, 140, { isSecret: true, message: "🚩 Blue Forward Infiltration Conduit!" });
}

function buildMapOriginal_KOTH() {
    // Central Hill Dais with Hollow Temple Tower
    addBox(80, 20, 80, 0, 10, 0, 0x222211, '#ffff00');
    addHollowTower(0, 0, 36, 48, 36, { style: 'cyber', team: 'neutral' });

    addRamp(30, 2, 40, 0, 10, 60, -Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 0, 10, -60, Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 60, 10, 0, 0, -Math.PI/6, 0x222222, '#ffff00');
    addRamp(30, 2, 40, -60, 10, 0, 0, Math.PI/6, 0x222222, '#ffff00');
    
    const s = 100;
    addHollowTower(s, s, 20, 38, 20, { style: 'cyber', team: 'neutral' });
    addHollowTower(-s, s, 20, 38, 20, { style: 'cyber', team: 'neutral' });
    addHollowTower(s, -s, 20, 38, 20, { style: 'cyber', team: 'neutral' });
    addHollowTower(-s, -s, 20, 38, 20, { style: 'cyber', team: 'neutral' });

    // Easter Eggs & Secret Spots:
    // 1. King of the Hill Pinnacle Golden Duck
    addEasterEgg(0, 48 + 14 + 19, 0, "King of the Hill Golden Duck", 500, 'duck');
    // 2. Subterranean Under-Dais Matrix Core
    addEasterEgg(0, 1.5, 45, "Under-Dais Matrix Core", 250, 'matrix');
    // 3. Subterranean Under-Dais Luminous Crystals
    addEasterEgg(0, 1.5, -45, "Under-Dais Luminous Crystals", 250, 'crystals');
    // 4. Corner Bastion Relic
    addEasterEgg(s, 38 + 14 + 19, s, "Corner Bastion Apex Relic", 300, 'relic');
    // 5. Secret Infiltration Slipway: Instant Hill access from corner tower
    addSecretPortal(-s + 18, 1.0, -s + 18, 0, 22.0, 0, { isSecret: true, message: "👑 Secret Flank Warp: Instant Hill Access!" });
}

function buildMapOriginal_GunGame() {
    // Central Hollow Combat Spire
    addHollowTower(0, 0, 30, 52, 30, { style: 'cyber', team: 'neutral' });

    for (let i = 0; i < 24; i++) {
        const x = (Math.random() - 0.5) * 180; 
        const z = (Math.random() - 0.5) * 180;
        if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;
        const w = 6 + Math.random() * 16; 
        const h = 18 + Math.random() * 18;
        addBox(w, h, 6, x, h/2, z, 0x111111, '#ff00ff');
    }
    addBox(180, 2, 10, 0, 26, 0, 0x111111, '#00f3ff');
    addBox(10, 2, 180, 0, 26, 0, 0x111111, '#00f3ff');

    // Easter Eggs & Secret Spots:
    // 1. Central Spire Master Golden Duck
    addEasterEgg(0, 52 + 14 + 19, 0, "Gunsmith Master Golden Duck", 500, 'duck');
    // 2. Floating Crossbeam Glitch Relay
    addEasterEgg(0, 28, 0, "Glitch Sector Relay Matrix", 300, 'matrix');
    // 3. High Arena Corner Crystals & Relic
    addEasterEgg(65, 27, 65, "Skyline Crystal Cache", 250, 'crystals');
    addEasterEgg(-65, 27, -65, "Forgotten Arsenal Relic", 350, 'relic');
    // 4. Secret Gunsmith Skyway Leap Portal
    addSecretPortal(75, 1.0, -75, -75, 28.0, 75, { isSecret: true, message: "⚡ Gunsmith Skyway Leap!" });
}

function buildMapOriginal_Zombies() {
    // Hollow Survivor Defense Fortress with Stairs & Shoot Holes
    addHollowTower(0, 0, 48, 54, 48, { style: 'cyber', team: 'neutral' });

    addRamp(20, 2, 60, 0, 20, 60, -Math.PI/5, 0, 0x111111, '#555555');
    addRamp(20, 2, 60, 0, 20, -60, Math.PI/5, 0, 0x111111, '#555555');
    
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 220; 
        const z = (Math.random() - 0.5) * 220;
        if (Math.abs(x) < 35 && Math.abs(z) < 35) continue;
        addBox(10, 10, 10, x, 5, z, 0x1a1a1a, '#115511');
    }

    // Easter Eggs & Secret Spots:
    // 1. Survivor Fortress Apex Golden Duck
    addEasterEgg(0, 54 + 14 + 19, 0, "Survivor Legendary Duck", 500, 'duck');
    // 2. Subterranean Bunker Antidote Crypt
    addEasterEgg(0, 2.0, 45, "Hidden Antidote Crypt", 350, 'crystals');
    // 3. Lost Quarantine Matrix under south ramp
    addEasterEgg(0, 2.0, -45, "Lost Quarantine Matrix", 300, 'matrix');
    // 4. Far wilderness outpost relic
    addEasterEgg(95, 2.0, 95, "Outpost Alpha Relic", 350, 'relic');
    // 5. Emergency Rooftop Evacuation Conduit
    addSecretPortal(0, 1.0, 18, 0, 54 + 2.0, 0, { isSecret: true, message: "🚨 Emergency Evacuation to Rooftop Battlement!" });
}

// ============================================================================
// VERDANT LANDSCAPE MAP BUILDERS (MAP 2 FOR EACH GAMEMODE)
// ============================================================================

// FFA Landscape: Verdant Citadel (Towers, River & Greenery)
function buildMapLandscape_FFA(size = 400) {
    // Physical dug-out river moat crossing the valley (depth 10, sparkling clear light-blue water)
    addMoat(0, 0, 75, size - 20, 10, { isAlongZ: true, isLandscape: true });

    // 2 Concrete and Glass bridges across the river
    addBox(75, 3, 24, 0, 2.5, 95, 0x3d434e, '#00ffaa');
    addBox(75, 3, 24, 0, 2.5, -95, 0x3d434e, '#00ffaa');

    // Central Hollow Monolithic Grey Citadel on River Island with Stairs, Shoot Holes & Secret Sniper Nest
    addHollowTower(0, 0, 48, 72, 48, { style: 'landscape' });

    // 4 Perimeter Hollow Grey Monolith Watchtowers with Stairs, Shoot Slits & Secret Sniper Perches
    addHollowTower(125, 125, 28, 54, 28, { style: 'landscape' });
    addHollowTower(-125, 125, 28, 54, 28, { style: 'landscape' });
    addHollowTower(125, -125, 28, 54, 28, { style: 'landscape' });
    addHollowTower(-125, -125, 28, 54, 28, { style: 'landscape' });

    // High-Poly Forest Groves (Deciduous Oaks, Alpine Pines, Weeping Willows)
    const treeCoords = [
        { x: 75, z: 140, type: 'pine', s: 1.1 }, { x: 95, z: 165, type: 'pine', s: 1.3 },
        { x: 150, z: 80, type: 'pine', s: 1.2 }, { x: 165, z: 120, type: 'pine', s: 1.0 },
        { x: -75, z: 140, type: 'deciduous', s: 1.15 }, { x: -105, z: 160, type: 'deciduous', s: 1.25 },
        { x: -145, z: 85, type: 'deciduous', s: 1.0 }, { x: -160, z: 125, type: 'deciduous', s: 1.2 },
        { x: 80, z: -145, type: 'deciduous', s: 1.2 }, { x: 110, z: -160, type: 'deciduous', s: 1.1 },
        { x: 145, z: -80, type: 'deciduous', s: 1.3 }, { x: 165, z: -130, type: 'deciduous', s: 1.05 },
        { x: -80, z: -140, type: 'pine', s: 1.2 }, { x: -110, z: -165, type: 'pine', s: 1.15 },
        { x: -150, z: -85, type: 'pine', s: 1.3 }, { x: -165, z: -125, type: 'pine', s: 1.0 },
        { x: 48, z: 50, type: 'willow', s: 1.2 }, { x: 50, z: -50, type: 'willow', s: 1.25 },
        { x: -48, z: 45, type: 'willow', s: 1.15 }, { x: -50, z: -45, type: 'willow', s: 1.2 },
        { x: 52, z: 140, type: 'willow', s: 1.1 }, { x: -52, z: -140, type: 'willow', s: 1.15 }
    ];
    treeCoords.forEach(t => addTree(t.x, t.z, t.s, t.type));

    // High-Poly Weathered Granite Rock Clusters & Bushes
    const rocks = [
        { x: 42, y: 0, z: 80, sx: 4.5, sy: 3.5, sz: 5.0, rot: 0.4 },
        { x: -42, y: 0, z: 80, sx: 5.0, sy: 4.0, sz: 4.2, rot: -0.6 },
        { x: 42, y: 0, z: -80, sx: 4.2, sy: 3.2, sz: 4.8, rot: 1.2 },
        { x: -42, y: 0, z: -80, sx: 5.2, sy: 4.2, sz: 4.5, rot: -1.1 },
        { x: 100, y: 0, z: 30, sx: 6.0, sy: 4.5, sz: 5.5, rot: 0.8 },
        { x: -100, y: 0, z: -30, sx: 5.8, sy: 4.2, sz: 5.0, rot: -0.5 }
    ];
    rocks.forEach(r => {
        addRock(r.x, r.y, r.z, r.sx, r.sy, r.sz, r.rot);
        addBush(r.x + 4, r.y, r.z + 3, 1.2);
        addBush(r.x - 4, r.y, r.z - 3, 1.1);
    });

    addJumpPad(0, 32, 0.3, 40);
    addJumpPad(0, -32, 0.3, 40);
    addJumpPad(90, 0, 0.3, 38);
    addJumpPad(-90, 0, 0.3, 38);

    // Easter Eggs & Secret Spots:
    // 1. Sunken River Grotto (dive deep into the river with C/Shift to collect!)
    addEasterEgg(0, -6.5, 0, "Sunken River Grotto Crystals", 350, 'crystals');
    // 2. Riverbank Weeping Willow Cyber Duck
    addEasterEgg(55, 1.8, -55, "Riverbank Cyber Duck", 300, 'duck');
    // 3. Citadel Apex Relic (highest point of the monolithic grey tower)
    addEasterEgg(0, 72 + 14 + 19, 0, "Citadel Apex Relic", 500, 'relic');
    // 4. Granite Hollow Matrix Node hidden inside rock cluster
    addEasterEgg(102, 2.0, 32, "Granite Hollow Matrix Node", 250, 'matrix');
    // 5. Secret Submerged River Conduit Portal straight to Citadel Rooftop
    addSecretPortal(0, -7.5, 60, 0, 72 + 2.0, 0, { isSecret: true, message: "🌊 Submerged River Conduit: Emerged on Citadel Roof!" });
}

// TDM Landscape: Verdant Divide (Red & Blue Monoliths across River Gorge)
function buildMapLandscape_TDM(size = 1000) {
    // Expansive canyon river dividing the teams (depth 12, crystal-clear sparkling water)
    addMoat(0, 0, 120, size - 20, 12, { isAlongZ: true, isLandscape: true });

    // East Titan Red Hollow Monolith Fortress with Stairs & Secret Roosts
    addHollowTower(450, 0, 75, 92, 75, { style: 'landscape', team: 'red' });
    addHollowTower(320, 180, 40, 60, 40, { style: 'landscape', team: 'red' });
    addHollowTower(320, -180, 40, 60, 40, { style: 'landscape', team: 'red' });

    // West Titan Blue Hollow Monolith Fortress with Stairs & Secret Roosts
    addHollowTower(-450, 0, 75, 92, 75, { style: 'landscape', team: 'blue' });
    addHollowTower(-320, 180, 40, 60, 40, { style: 'landscape', team: 'blue' });
    addHollowTower(-320, -180, 40, 60, 40, { style: 'landscape', team: 'blue' });

    // River Crossings
    // 1. High-Altitude Glass Sky-Bridge
    addGlassBox(130, 2.5, 26, 0, 38, 0, 0x00f3ff, '#00f3ff', 0.55);
    // 2. North Stone Arch Bridge
    addBox(130, 4, 30, 0, 3, 250, 0x3d434e, '#a0b4c8');
    // 3. South Stone Arch Bridge
    addBox(130, 4, 30, 0, 3, -250, 0x3d434e, '#a0b4c8');

    // Massive Forest Groves (Pines & Deciduous)
    const tdmTrees = [
        { x: 220, z: 90, type: 'pine', s: 1.3 }, { x: 240, z: 140, type: 'pine', s: 1.4 },
        { x: 200, z: 180, type: 'deciduous', s: 1.2 }, { x: 250, z: -90, type: 'pine', s: 1.35 },
        { x: 220, z: -150, type: 'deciduous', s: 1.25 }, { x: 200, z: -200, type: 'pine', s: 1.4 },
        { x: 380, z: 90, type: 'pine', s: 1.2 }, { x: 380, z: -90, type: 'pine', s: 1.2 },
        { x: -220, z: 90, type: 'pine', s: 1.3 }, { x: -240, z: 140, type: 'pine', s: 1.4 },
        { x: -200, z: 180, type: 'deciduous', s: 1.2 }, { x: -250, z: -90, type: 'pine', s: 1.35 },
        { x: -220, z: -150, type: 'deciduous', s: 1.25 }, { x: -200, z: -200, type: 'pine', s: 1.4 },
        { x: -380, z: 90, type: 'pine', s: 1.2 }, { x: -380, z: -90, type: 'pine', s: 1.2 },
        { x: 75, z: 100, type: 'willow', s: 1.3 }, { x: 75, z: -100, type: 'willow', s: 1.3 },
        { x: -75, z: 100, type: 'willow', s: 1.3 }, { x: -75, z: -100, type: 'willow', s: 1.3 },
        { x: 75, z: 350, type: 'willow', s: 1.2 }, { x: -75, z: -350, type: 'willow', s: 1.2 }
    ];
    tdmTrees.forEach(t => addTree(t.x, t.z, t.s, t.type));

    // Tactical Boulders & Low Cover
    const tdmRocks = [
        { x: 140, y: 0, z: 60, sx: 7, sy: 5, sz: 6, rot: 0.5 },
        { x: -140, y: 0, z: 60, sx: 7, sy: 5, sz: 6, rot: -0.5 },
        { x: 140, y: 0, z: -60, sx: 6, sy: 4.5, sz: 7, rot: 1.0 },
        { x: -140, y: 0, z: -60, sx: 6, sy: 4.5, sz: 7, rot: -1.0 }
    ];
    tdmRocks.forEach(r => {
        addRock(r.x, r.y, r.z, r.sx, r.sy, r.sz, r.rot);
        addBush(r.x + 5, r.y, r.z, 1.4);
    });

    addJumpPad(200, 0, 0.4, 40);
    addJumpPad(-200, 0, 0.4, 40);

    // Easter Eggs & Secret Spots:
    // 1. Gorge Riverbed Luminous Crystals (deep swimming dive!)
    addEasterEgg(0, -9.0, 0, "Gorge Riverbed Luminous Crystals", 400, 'crystals');
    // 2. High Glass Skybridge Aviator Duck
    addEasterEgg(0, 41, 0, "Skybridge Aviator Golden Duck", 450, 'duck');
    // 3. Crimson Monolith Apex Relic
    addEasterEgg(450, 92 + 14 + 19, 0, "Crimson Monolith Relic", 500, 'relic');
    // 4. Cobalt Monolith Apex Relic
    addEasterEgg(-450, 92 + 14 + 19, 0, "Cobalt Monolith Relic", 500, 'relic');
    // 5. Gorge Boulder Matrix Core
    addEasterEgg(145, 2.0, 65, "Gorge Boulder Matrix Core", 300, 'matrix');
    // 6. Secret River Vortex Portals straight onto the high glass skybridge!
    addSecretPortal(0, -9.0, 220, 0, 40, 20, { isSecret: true, message: "🌀 River Vortex Lift to High Skybridge!" });
    addSecretPortal(0, -9.0, -220, 0, 40, -20, { isSecret: true, message: "🌀 River Vortex Lift to High Skybridge!" });
}

// CTF Landscape: Verdant Fortress (Opposing Monolith Bases & Flag Daises)
function buildMapLandscape_CTF(size = 1000) {
    buildMapLandscape_TDM(size);

    // Red Flag Dais inside fortified bastion
    addBox(36, 10, 36, 300, 5, 0, 0x2b303a, '#ff0044');
    // Blue Flag Dais inside fortified bastion
    addBox(36, 10, 36, -300, 5, 0, 0x2b303a, '#0077ff');

    const flagGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    const flagMatRed = new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0xff0044, emissiveIntensity: 1.2 });
    const flagMatBlue = new THREE.MeshStandardMaterial({ color: 0x0077ff, emissive: 0x0077ff, emissiveIntensity: 1.2 });

    flagMeshRed = new THREE.Mesh(flagGeo, flagMatRed);
    flagMeshBlue = new THREE.Mesh(flagGeo, flagMatBlue);
    flagMeshRed.position.copy(gameState.flagRed.pos);
    flagMeshBlue.position.copy(gameState.flagBlue.pos);

    scene.add(flagMeshRed);
    scene.add(flagMeshBlue);
    mapMeshes.push(flagMeshRed);
    mapMeshes.push(flagMeshBlue);

    // CTF Secret Infiltration Forest Flank Paths
    addSecretPortal(300, 1.5, 45, 130, 4.0, 240, { isSecret: true, message: "🚩 Red Forest Flank Path!" });
    addSecretPortal(-300, 1.5, 45, -130, 4.0, 240, { isSecret: true, message: "🚩 Blue Forest Flank Path!" });
}

// KOTH Landscape: Verdant Sanctuary (Central Dais inside Reflecting Lake)
function buildMapLandscape_KOTH(size = 400) {
    // Grand Central Sunken Lake (depth 10, crystal-clear sparkling light-blue water)
    addMoat(0, 0, 230, 230, 10, { isAlongZ: true, isLandscape: true });

    // The Hill: Elevated Stone & Glass Temple Dais in Center of Lake (matches KOTH scoring zone)
    addBox(60, 20, 60, 0, 10, 0, 0x3d434e, '#ffff00');

    // 4 Grand Causeways / Bridges leading onto the Dais from the 4 shores
    addRamp(24, 2, 50, 0, 10, 55, -Math.PI / 8, 0, 0x2a2e37, '#ffff00');
    addRamp(24, 2, 50, 0, 10, -55, Math.PI / 8, 0, 0x2a2e37, '#ffff00');
    addRamp(24, 2, 50, 55, 10, 0, 0, -Math.PI / 8, 0x2a2e37, '#ffff00');
    addRamp(24, 2, 50, -55, 10, 0, 0, Math.PI / 8, 0x2a2e37, '#ffff00');

    // 4 Hollow Grey Monolithic Sniper Watchtowers on the lake shore with Stairs & Secret Roosts
    addHollowTower(125, 125, 26, 52, 26, { style: 'landscape' });
    addHollowTower(-125, 125, 26, 52, 26, { style: 'landscape' });
    addHollowTower(125, -125, 26, 52, 26, { style: 'landscape' });
    addHollowTower(-125, -125, 26, 52, 26, { style: 'landscape' });

    // Lakeside Weeping Willows & Lush Greenery
    const kothTrees = [
        { x: 125, z: 0, type: 'willow', s: 1.3 }, { x: -125, z: 0, type: 'willow', s: 1.3 },
        { x: 0, z: 125, type: 'willow', s: 1.3 }, { x: 0, z: -125, type: 'willow', s: 1.3 },
        { x: 145, z: 60, type: 'deciduous', s: 1.15 }, { x: -145, z: 60, type: 'deciduous', s: 1.15 },
        { x: 145, z: -60, type: 'deciduous', s: 1.15 }, { x: -145, z: -60, type: 'deciduous', s: 1.15 },
        { x: 60, z: 145, type: 'pine', s: 1.2 }, { x: -60, z: 145, type: 'pine', s: 1.2 },
        { x: 60, z: -145, type: 'pine', s: 1.2 }, { x: -60, z: -145, type: 'pine', s: 1.2 }
    ];
    kothTrees.forEach(t => addTree(t.x, t.z, t.s, t.type));

    // Shoreline Boulders
    addRock(120, 0, 80, 5, 4, 5, 0.4);
    addRock(-120, 0, 80, 5, 4, 5, -0.4);
    addRock(120, 0, -80, 5, 4, 5, 0.8);
    addRock(-120, 0, -80, 5, 4, 5, -0.8);

    // Easter Eggs & Secret Spots:
    // 1. Lake Bed Ancient Crystals (swimming dive into lake)
    addEasterEgg(45, -7.0, 45, "Lake Bed Ancient Crystals", 350, 'crystals');
    // 2. Sunken Sanctuary Relic
    addEasterEgg(-45, -7.0, -45, "Sunken Sanctuary Relic", 350, 'relic');
    // 3. Sanctuary Hill Trophy Duck
    addEasterEgg(0, 24, 0, "Sanctuary Hill Trophy Duck", 500, 'duck');
    // 4. Willows Glade Matrix Node
    addEasterEgg(130, 2.0, 0, "Willows Glade Matrix Node", 250, 'matrix');
    // 5. Secret Submerged Underwater Causeway Tunnel
    addSecretPortal(0, -7.5, 90, 0, 22, 10, { isSecret: true, message: "🌊 Submerged Causeway Lift onto the Hill!" });
}

// Gun Game Landscape: Verdant Terraces (Stepped Botanical Gardens & Towers)
function buildMapLandscape_GunGame(size = 350) {
    // Reflecting stream in center (depth 8, crystal-clear sparkling water)
    addMoat(0, 0, 40, size - 20, 8, { isAlongZ: true, isLandscape: true });

    // Central Hollow Grey Clocktower with Stairs, Shoot Slits & Secret Sniper Roost
    addHollowTower(0, 0, 34, 68, 34, { style: 'landscape' });

    // Stepped Garden Terrace Decks
    addBox(80, 12, 100, 95, 6, 0, 0x2d323c, '#2d6a4f');
    addBox(80, 12, 100, -95, 6, 0, 0x2d323c, '#2d6a4f');
    addBox(70, 20, 70, 105, 10, 110, 0x262a32, '#a0b4c8');
    addBox(70, 20, 70, -105, 10, 110, 0x262a32, '#a0b4c8');
    addBox(70, 20, 70, 105, 10, -110, 0x262a32, '#a0b4c8');
    addBox(70, 20, 70, -105, 10, -110, 0x262a32, '#a0b4c8');

    // Sculpted Greenery Hedges
    addBox(50, 4, 6, 85, 14, 25, 0x1b4332, '#2d6a4f');
    addBox(50, 4, 6, 85, 14, -25, 0x1b4332, '#2d6a4f');
    addBox(50, 4, 6, -85, 14, 25, 0x1b4332, '#2d6a4f');
    addBox(50, 4, 6, -85, 14, -25, 0x1b4332, '#2d6a4f');

    // High-Poly Trees & Bushes
    const ggTrees = [
        { x: 130, z: 40, type: 'deciduous', s: 1.1 }, { x: -130, z: 40, type: 'deciduous', s: 1.1 },
        { x: 130, z: -40, type: 'deciduous', s: 1.1 }, { x: -130, z: -40, type: 'deciduous', s: 1.1 },
        { x: 45, z: 80, type: 'willow', s: 1.15 }, { x: -45, z: 80, type: 'willow', s: 1.15 },
        { x: 45, z: -80, type: 'willow', s: 1.15 }, { x: -45, z: -80, type: 'willow', s: 1.15 }
    ];
    ggTrees.forEach(t => addTree(t.x, t.z, t.s, t.type));

    // Jump pads for fast vertical gunplay
    addJumpPad(45, 0, 0.4, 42);
    addJumpPad(-45, 0, 0.4, 42);
    addJumpPad(0, 70, 0.4, 38);
    addJumpPad(0, -70, 0.4, 38);

    // Easter Eggs & Secret Spots:
    // 1. Clocktower Master Duck
    addEasterEgg(0, 68 + 14 + 19, 0, "Clocktower Master Duck", 500, 'duck');
    // 2. Stream Bed Shimmer Crystals (swim down in center stream)
    addEasterEgg(0, -5.5, 50, "Stream Bed Shimmer Crystals", 300, 'crystals');
    // 3. Terrace Garden Matrix Node
    addEasterEgg(105, 22, 110, "Terrace Garden Matrix Node", 250, 'matrix');
    // 4. Forgotten Sculptor Relic
    addEasterEgg(-105, 22, -110, "Forgotten Sculptor Relic", 350, 'relic');
    // 5. Hedge Maze Translocation Warp
    addSecretPortal(85, 14.5, 30, -85, 14.5, -30, { isSecret: true, message: "🌿 Hedge Maze Translocation!" });
}

// Zombies Landscape: Overgrown Citadel (Atmospheric Forest & Survivor Catwalks)
function buildMapLandscape_Zombies(size = 400) {
    // Dilapidated Central Hollow Grey Bunker with Stairs, Shoot Slits & Secret Sniper Roost
    addHollowTower(0, 0, 48, 54, 48, { style: 'landscape' });

    // 4 Corner Hollow Survivor Guard Posts with Stairs & Shoot Holes
    addHollowTower(110, 110, 28, 54, 28, { style: 'landscape' });
    addHollowTower(-110, 110, 28, 54, 28, { style: 'landscape' });
    addHollowTower(110, -110, 28, 54, 28, { style: 'landscape' });
    addHollowTower(-110, -110, 28, 54, 28, { style: 'landscape' });

    // Elevated Survivor Catwalks connecting the fortress
    addBox(90, 2, 8, 55, 20, 55, 0x3d434e, '#00ffaa');
    addBox(90, 2, 8, -55, 20, 55, 0x3d434e, '#00ffaa');
    addBox(90, 2, 8, 55, 20, -55, 0x3d434e, '#00ffaa');
    addBox(90, 2, 8, -55, 20, -55, 0x3d434e, '#00ffaa');

    // Access ramps to catwalks
    addRamp(14, 2, 45, 0, 10, 65, -Math.PI / 7, 0, 0x2a2e37, '#00ffaa');
    addRamp(14, 2, 45, 0, 10, -65, Math.PI / 7, 0, 0x2a2e37, '#00ffaa');

    // Dark, overgrown pine forest
    const zombieTrees = [
        { x: 60, z: 140, type: 'pine', s: 1.3 }, { x: 140, z: 60, type: 'pine', s: 1.35 },
        { x: -60, z: 140, type: 'pine', s: 1.25 }, { x: -140, z: 60, type: 'pine', s: 1.4 },
        { x: 60, z: -140, type: 'pine', s: 1.3 }, { x: 140, z: -60, type: 'pine', s: 1.3 },
        { x: -60, z: -140, type: 'pine', s: 1.25 }, { x: -140, z: -60, type: 'pine', s: 1.4 },
        { x: 155, z: 0, type: 'pine', s: 1.45 }, { x: -155, z: 0, type: 'pine', s: 1.45 },
        { x: 0, z: 155, type: 'pine', s: 1.4 }, { x: 0, z: -155, type: 'pine', s: 1.4 }
    ];
    zombieTrees.forEach(t => addTree(t.x, t.z, t.s, t.type));

    // Overgrown barricades & rocks
    for (let i = 0; i < 18; i++) {
        const angle = i * (Math.PI / 9);
        const r = 85 + (i % 3) * 20;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        addRock(x, 0, z, 3.5, 3.0, 3.5, angle);
        addBush(x + 2, 0, z + 2, 1.2);
    }

    // Easter Eggs & Secret Spots:
    // 1. Dilapidated Bunker Apex Golden Duck
    addEasterEgg(0, 54 + 14 + 19, 0, "Last Stand Golden Duck", 500, 'duck');
    // 2. Survivor Skyway Relic
    addEasterEgg(0, 22.5, 0, "Survivor Skyway Relic", 400, 'relic');
    // 3. Hermit Pine Glade Crystals
    addEasterEgg(145, 1.8, -65, "Hermit Pine Glade Crystals", 350, 'crystals');
    // 4. Abandoned Quarantine Matrix
    addEasterEgg(-145, 1.8, 65, "Abandoned Quarantine Matrix", 350, 'matrix');
    // 5. Secret Bunker Underground Escape Tunnel
    addSecretPortal(0, 1.5, 28, 110, 20.0, 110, { isSecret: true, message: "🚨 Guardpost Escape Route!" });
}

// ============================================================================
// MASTER MAP BUILDER & DISPATCHER (EXACTLY 2 MAPS PER GAMEMODE)
// ============================================================================

function buildMap(mode, mapId = null) {
    const rawId = mapId || gameState.map || `${mode.toLowerCase()}_original`;
    const isLandscape = rawId.includes('landscape');
    
    // Size determination
    let size = 300;
    if (mode === 'TDM' || mode === 'CTF') size = 1200;
    if (isLandscape) {
        if (mode === 'TDM' || mode === 'CTF') size = 1000;
        else size = 400;
    }
    currentMapSize = size;

    // Segmented Ground Generation with Physical Moat / Dugout Gaps (NO infinite CANNON.Plane)
    const floorGlow = isLandscape ? '#terrain_grass' : '#00ffaa';
    const floorCol = isLandscape ? 0x22262d : 0x111111;

    // Determine moat gap for current map:
    let moatGapW = 0;
    let isSunkenLake = false;
    if (isLandscape) {
        if (mode === 'FFA') moatGapW = 75;
        else if (mode === 'TDM' || mode === 'CTF') moatGapW = 120;
        else if (mode === 'KOTH') isSunkenLake = true;
        else if (mode === 'Gun Game' || mode === 'GUN_GAME') moatGapW = 40;
    } else {
        if (mode === 'FFA') moatGapW = 42;
    }

    if (isSunkenLake) {
        // Sunken Central Lake Dugout for KOTH: 230x230 cutout in center
        const lakeSize = 230;
        const shoreLen = (size - lakeSize) / 2;
        // North Shore
        addBox(size, 4, shoreLen, 0, -2, (size + lakeSize) / 4, floorCol, floorGlow);
        // South Shore
        addBox(size, 4, shoreLen, 0, -2, -(size + lakeSize) / 4, floorCol, floorGlow);
        // West Shore (between N & S)
        addBox(shoreLen, 4, lakeSize, -(size + lakeSize) / 4, -2, 0, floorCol, floorGlow);
        // East Shore (between N & S)
        addBox(shoreLen, 4, lakeSize, (size + lakeSize) / 4, -2, 0, floorCol, floorGlow);
        // Center Dais Island (for KOTH capture zone)
        addBox(70, 4, 70, 0, -2, 0, floorCol, floorGlow);
    } else if (moatGapW > 0) {
        // River / Moat Dugout running along Z across center
        const slabW = (size - moatGapW) / 2;
        // West Ground Slab (top at y = 0)
        addBox(slabW, 4, size, -size / 4 - moatGapW / 4, -2, 0, floorCol, floorGlow);
        // East Ground Slab (top at y = 0)
        addBox(slabW, 4, size, size / 4 + moatGapW / 4, -2, 0, floorCol, floorGlow);
    } else {
        // Solid ground slab (top at y = 0)
        addBox(size, 4, size, 0, -2, 0, floorCol, floorGlow);
    }

    // Perimeter boundary walls
    const wallCol = isLandscape ? 0x22262d : 0x050510;
    const wallGlow = isLandscape ? '#3a414d' : '#444444';
    addBox(size, 250, 5, 0, 125, -size/2, wallCol, wallGlow);
    addBox(size, 250, 5, 0, 125, size/2, wallCol, wallGlow);
    addBox(5, 250, size, -size/2, 125, 0, wallCol, wallGlow);
    addBox(5, 250, size, size/2, 125, 0, wallCol, wallGlow);

    // Dispatch to the requested map variant
    if (isLandscape) {
        switch(mode) {
            case 'TDM': buildMapLandscape_TDM(size); break;
            case 'CTF': buildMapLandscape_CTF(size); break;
            case 'KOTH': buildMapLandscape_KOTH(size); break;
            case 'Gun Game':
            case 'GUN_GAME': buildMapLandscape_GunGame(size); break;
            case 'Zombies':
            case 'ZOMBIES': buildMapLandscape_Zombies(size); break;
            case 'FFA':
            default: buildMapLandscape_FFA(size); break;
        }
    } else {
        switch(mode) {
            case 'TDM': buildMapOriginal_TDM(); break;
            case 'CTF': buildMapOriginal_CTF(); break;
            case 'KOTH': buildMapOriginal_KOTH(); break;
            case 'Gun Game':
            case 'GUN_GAME': buildMapOriginal_GunGame(); break;
            case 'Zombies':
            case 'ZOMBIES': buildMapOriginal_Zombies(); break;
            case 'FFA':
            default: buildMapOriginal_FFA(); break;
        }
    }
}

function addBox(w, h, d, x, y, z, color, glow) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); 
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); 
    body.addShape(shape); 
    body.position.set(x, y, z); 
    world.addBody(body);

    const geo = new THREE.BoxGeometry(w, h, d); 
    let mat;
    if (glow === '#terrain_grass') {
        const grassTex = createVerdantTerrainTexture();
        grassTex.repeat.set(Math.max(1, w / 24), Math.max(1, d / 24));
        mat = new THREE.MeshStandardMaterial({
            map: grassTex,
            roughness: 0.85,
            metalness: 0.05
        });
    } else {
        const tex = createNeonGridTexture(color, glow); 
        tex.repeat.set(Math.max(1, w/10), Math.max(1, h/10));
        mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 0.5 }); 
    }
    const mesh = new THREE.Mesh(geo, mat); 
    mesh.position.set(x, y, z); 
    mesh.castShadow = true; 
    mesh.receiveShadow = true; 
    scene.add(mesh); 
    mapMeshes.push(mesh); 
    mapBodies.push(body);
    return mesh;
}

function addRamp(w, h, d, x, y, z, angleX, angleZ, color, glow) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); 
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); 
    body.addShape(shape); 
    body.position.set(x, y, z);
    const qX = new CANNON.Quaternion(); 
    qX.setFromAxisAngle(new CANNON.Vec3(1,0,0), angleX); 
    const qZ = new CANNON.Quaternion(); 
    qZ.setFromAxisAngle(new CANNON.Vec3(0,0,1), angleZ); 
    body.quaternion = qX.mult(qZ); 
    world.addBody(body);

    const geo = new THREE.BoxGeometry(w, h, d); 
    const tex = createNeonGridTexture(color, glow); 
    tex.repeat.set(Math.max(1, w/10), Math.max(1, d/10));
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 0.5 }); 
    const mesh = new THREE.Mesh(geo, mat); 
    mesh.position.set(x, y, z); 
    mesh.quaternion.copy(body.quaternion); 
    mesh.castShadow = true; 
    mesh.receiveShadow = true; 
    scene.add(mesh); 
    mapMeshes.push(mesh); 
    mapBodies.push(body);
}

function onWindowResize() { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    let fsrScale = 1.0;
    if (gameSettings && gameSettings.fsrMode === 'ultra_quality') fsrScale = 0.77;
    else if (gameSettings && gameSettings.fsrMode === 'quality') fsrScale = 0.67;
    else if (gameSettings && gameSettings.fsrMode === 'balanced') fsrScale = 0.59;
    else if (gameSettings && gameSettings.fsrMode === 'performance') fsrScale = 0.50;

    const dpr = Math.min(2.0, window.devicePixelRatio || 1) * (gameSettings ? gameSettings.resolutionScale : 1.0) * fsrScale;
    renderer.setPixelRatio( dpr );
    renderer.setSize( window.innerWidth, window.innerHeight ); 
    composer.setSize( window.innerWidth, window.innerHeight ); 
    if (bloomPass) {
        bloomPass.setSize( window.innerWidth * dpr, window.innerHeight * dpr );
    }
    if (rtxPass && rtxPass.uniforms && rtxPass.uniforms.uResolution) {
        rtxPass.uniforms.uResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
    }
}

const downVector = new THREE.Vector3(0, -1, 0); 
const downRay = new THREE.Raycaster();
const wallRight = new THREE.Vector3(); 
const wallLeft = new THREE.Vector3(); 
const wallPos = new THREE.Vector3();
const wallRayR = new THREE.Raycaster(); 
const wallRayL = new THREE.Raycaster();
const inputDir = new THREE.Vector3(); 
const forwardVec = new THREE.Vector3(); 
const rightVec = new THREE.Vector3();

// ============================================================================
// MAIN GAME & ANIMATION LOOP
// ============================================================================
function animate() {
    requestAnimationFrame( animate );

    const nowMs = performance.now();
    if (gameSettings && gameSettings.maxFps > 0) {
        const minDelta = 1000 / gameSettings.maxFps;
        if (nowMs - lastFrameTime < minDelta) return;
    }
    lastFrameTime = nowMs;

    if (rtxPass) {
        rtxPass.uniforms.uTime.value = nowMs * 0.001;
        if (gameSettings && gameSettings.enableMotionBlur) {
            rtxPass.uniforms.uMotionBlurVec.value.set(gpLookX || 0, gpLookY || 0);
        }
    }

    const isControlLocked = (controls && controls.isLocked === true) || isMobileDeploy;
    const isPaused = !isControlLocked && !isSmiteCinematicActive;

    // Simulation physics & bots ALWAYS run while match is active so pressing ESC never freezes the engine
    if (gameState.started) {
        world.step(1/60);
        if (isBotMatch && activeBots.length > 0) {
            updateBots(1/60);
        }
    }

    if ( myHp > 0 ) {
        if (isPaused || isSmiteCinematicActive) {
            playerBody.velocity.x = 0;
            playerBody.velocity.z = 0;
            if (playerBody.velocity.y > 0) playerBody.velocity.y = 0;
            moveForward = false;
            moveBackward = false;
            moveLeft = false;
            moveRight = false;
            isShooting = false;
        }

        if (jumpAntiGravityTimer > 0 && !isPaused && !isSmiteCinematicActive) { 
            jumpAntiGravityTimer -= 1/60; 
            playerBody.force.y += playerBody.mass * 55; 
        }

        if (!isPaused && !isSmiteCinematicActive) {
            updateGamepads();
        }
        
        // 1. Water Volume & Deep Swimming Detection (evaluated before ground raycasting)
        let inWater = false;
        let activeWater = null;
        for (let i = 0; i < activeWaterPlanes.length; i++) {
            const wp = activeWaterPlanes[i];
            const inX = Math.abs(playerBody.position.x - wp.x) <= (wp.w / 2) + 0.6;
            const inZ = Math.abs(playerBody.position.z - wp.z) <= (wp.d / 2) + 0.6;
            const planeSY = wp.surfaceY !== undefined ? wp.surfaceY : wp.y;
            const planeBY = wp.bedY !== undefined ? wp.bedY : wp.y - 15.0;
            const inY = playerBody.position.y <= planeSY + 0.9 && playerBody.position.y >= planeBY - 2.0;
            if (inX && inZ && inY) {
                inWater = true;
                activeWater = wp;
                break;
            }
        }
        
        const hudSwim = document.getElementById('hud-swim-badge');
        if (inWater && activeWater) {
            const sY = activeWater.surfaceY !== undefined ? activeWater.surfaceY : activeWater.y;
            const waterDepth = sY - playerBody.position.y;
            
            // Allow continuous jumps while swimming
            myJumpsLeft = myJumps;
            
            // Base fluid damping
            playerBody.velocity.x *= 0.94;
            playerBody.velocity.z *= 0.94;
            playerBody.velocity.y *= 0.92;
            
            // Natural neutral buoyancy balances gravity (-60) so swimmer naturally floats near surface
            playerBody.force.y += playerBody.mass * 60.0;
            
            // Swimming vertical controls:
            const isSwimmingUp = moveUp || keys['Space'] || keys[' '] || false;
            const isSwimmingDown = moveDown || isCrouching || keys['KeyC'] || keys['c'] || keys['C'] || keys['ShiftLeft'] || keys['ShiftRight'] || keys['ControlLeft'] || false;
            
            // Full 3D Camera-Directed Swimming (pitch angle dives & surfaces naturally)
            const look3D = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
            const right3D = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
            
            let swimVec = new THREE.Vector3(0, 0, 0);
            if (moveForward) swimVec.add(look3D);
            if (moveBackward) swimVec.sub(look3D);
            if (moveLeft) swimVec.sub(right3D);
            if (moveRight) swimVec.add(right3D);
            
            if (isSwimmingUp) swimVec.y += 1.4;
            if (isSwimmingDown) swimVec.y -= 1.4;
            
            const swimSpeed = mySpeed * 1.12;
            if (swimVec.lengthSq() > 0.01) {
                swimVec.normalize();
                playerBody.velocity.x = swimVec.x * swimSpeed;
                playerBody.velocity.z = swimVec.z * swimSpeed;
                playerBody.velocity.y = swimVec.y * (isSwimmingUp || isSwimmingDown ? 15.0 : 12.0);
            } else {
                // Natural surface treading: if near surface and idle, stabilize head above water
                if (Math.abs(playerBody.position.y - (sY - 0.2)) < 0.6 && !isSwimmingDown) {
                    playerBody.velocity.y = (sY - 0.2 - playerBody.position.y) * 4.0;
                }
            }
            
            // Surface Breach / Ledge Vault Boost:
            // When near water line, pressing Space powers player out of water onto shore or bridge!
            if (playerBody.position.y >= sY - 0.9 && isSwimmingUp) {
                playerBody.velocity.y = Math.max(playerBody.velocity.y, 22.0);
                if (moveForward) {
                    playerBody.velocity.x += look3D.x * 12.0;
                    playerBody.velocity.z += look3D.z * 12.0;
                }
                createWaterSplash(playerBody.position.x, sY, playerBody.position.z);
            }
            
            // Submerged bubble particles
            if (waterDepth > 0.4 && Math.random() < 0.24) {
                createUnderwaterBubble(playerBody.position.x, playerBody.position.y + 0.35, playerBody.position.z);
            }
            // Surface splash when breaking through water
            if (Math.abs(waterDepth) < 0.45 && Math.random() < 0.18 && (Math.abs(playerBody.velocity.x) > 1 || Math.abs(playerBody.velocity.z) > 1)) {
                createWaterSplash(playerBody.position.x, sY, playerBody.position.z);
            }
            if (hudSwim) hudSwim.style.display = 'flex';
        } else {
            if (hudSwim) hudSwim.style.display = 'none';
        }

        let isGrounded = false;
        downRay.set(playerBody.position, downVector); 
        downRay.far = 1.8; 
        const groundHits = downRay.intersectObjects(mapMeshes);
        for (let i = 0; i < groundHits.length; i++) {
            const obj = groundHits[i].object;
            if (obj && obj.userData && (obj.userData.noGroundRay || obj.userData.isWater)) continue;
            isGrounded = true;
            break;
        }
        if (!isGrounded && !inWater && Math.abs(playerBody.position.y - 1.0) < 0.6) {
            isGrounded = true;
        }
        if (isGrounded && jumpAntiGravityTimer <= 0) myJumpsLeft = myJumps;

        // Wall climbing & wall running (Hold W + R to climb wall)
        if (isWallRunning) {
            forwardVec.set(0,0,-1).applyQuaternion(camera.quaternion);
            forwardVec.y = 0;
            forwardVec.normalize();
            wallRight.set(1,0,0).applyQuaternion(camera.quaternion).normalize(); 
            wallLeft.set(-1,0,0).applyQuaternion(camera.quaternion).normalize();
            wallPos.copy(playerBody.position);
            
            const wallRayF = new THREE.Raycaster(wallPos, forwardVec, 0, 3.5);
            wallRayR.set(wallPos, wallRight); wallRayR.far = 3.5;
            wallRayL.set(wallPos, wallLeft); wallRayL.far = 3.5;
            
            const hitF = wallRayF.intersectObjects(mapMeshes).length > 0;
            const hitR = wallRayR.intersectObjects(mapMeshes).length > 0;
            const hitL = wallRayL.intersectObjects(mapMeshes).length > 0;
            
            if (hitF || hitR || hitL) {
                if (moveForward) {
                    playerBody.velocity.y = 19;
                } else if (!isGrounded) {
                    playerBody.velocity.y = Math.max(playerBody.velocity.y, -1.5);
                }
                myJumpsLeft = myJumps;
            }
        }

        // Grapple Hook Physics (Hold F to fully grapple to target point)
        if (grappleActive && grappleTarget) {
            grappleHoldDuration += 1/60;
            if (!isHoldingGrapple || grappleHoldDuration > 6.0) {
                releaseGrapple();
            } else {
                const pPos = new THREE.Vector3().copy(playerBody.position);
                const toTarget = new THREE.Vector3().subVectors(grappleTarget, pPos);
                const dist = toTarget.length();
                
                if (dist <= 2.4) {
                    playerBody.velocity.y = Math.max(playerBody.velocity.y, 16);
                    forwardVec.set(0, 0, -1).applyQuaternion(camera.quaternion);
                    forwardVec.y = 0;
                    forwardVec.normalize();
                    playerBody.velocity.x += forwardVec.x * 12;
                    playerBody.velocity.z += forwardVec.z * 12;
                    myJumpsLeft = myJumps;
                    releaseGrapple();
                } else {
                    toTarget.normalize();
                    const pullSpeed = Math.min(70, Math.max(45, dist * 1.65));
                    playerBody.velocity.x = toTarget.x * pullSpeed;
                    playerBody.velocity.y = toTarget.y * pullSpeed + 2.5;
                    playerBody.velocity.z = toTarget.z * pullSpeed;
                    myJumpsLeft = myJumps;
                    
                    if (grappleLineMesh) {
                        const posAttr = grappleLineMesh.geometry.attributes.position;
                        posAttr.setXYZ(0, camera.position.x, camera.position.y - 0.2, camera.position.z);
                        posAttr.setXYZ(1, grappleTarget.x, grappleTarget.y, grappleTarget.z);
                        posAttr.needsUpdate = true;
                    }
                }
            }
        }
        if (grappleCooldownTimer > 0) {
            grappleCooldownTimer = Math.max(0, grappleCooldownTimer - 1/60);
            updateGrappleHUD();
        }
        if (abilityCooldownTimer > 0) {
            abilityCooldownTimer = Math.max(0, abilityCooldownTimer - 1/60);
            updateAbilityHUD();
        }

        // Check Interactive Jump Pad triggers
        for (let i = 0; i < activeJumpPads.length; i++) {
            const jp = activeJumpPads[i];
            const dist = Math.hypot(playerBody.position.x - jp.x, playerBody.position.z - jp.z);
            if (dist < 4.2 && Math.abs(playerBody.position.y - jp.y) < 2.5) {
                if (playerBody.velocity.y < jp.power * 0.75) {
                    playerBody.velocity.y = jp.power;
                    jumpAntiGravityTimer = 0.35;
                    myJumpsLeft = myJumps;
                    playTone(520, 'sine', 0.18, 0.3);
                    setTimeout(() => playTone(880, 'sine', 0.25, 0.35), 60);
                    if (jp.isSecret && !jp.hasNotified) {
                        jp.hasNotified = true;
                        adminLog("🏆 SECRET DISCOVERED: Sniper's Eagle Perch!");
                        setTimeout(() => { jp.hasNotified = false; }, 8000);
                    }
                }
            }
        }


        // Check Interactive Secret Portals
        for (let i = 0; i < activePortals.length; i++) {
            const portal = activePortals[i];
            if (portal.cooldown > 0) continue;
            const dist = Math.hypot(playerBody.position.x - portal.x, playerBody.position.z - portal.z);
            if (dist < 3.2 && Math.abs(playerBody.position.y - portal.y) < 3.0) {
                portal.cooldown = 3.5;
                playerBody.position.set(portal.targetX, portal.targetY, portal.targetZ);
                playerBody.velocity.set(0, 0, 0);
                
                playTone(440, 'sine', 0.15, 0.35);
                setTimeout(() => playTone(880, 'sine', 0.25, 0.4), 80);
                
                if (portal.options.message) {
                    adminLog(portal.options.message);
                }
                
                if (portal.options.rewardWeapon && !myOwnedWeapons.includes(portal.options.rewardWeapon)) {
                    myOwnedWeapons.push(portal.options.rewardWeapon);
                    myInventory[currentSlot] = portal.options.rewardWeapon;
                    updateHotbarUI();
                    if (typeof window.equipSlot === 'function') window.equipSlot(currentSlot);
                }
            }
        }

        // Check Easter Egg Collection
        for (let i = 0; i < activeEasterEggs.length; i++) {
            const egg = activeEasterEggs[i];
            if (egg.collected) continue;
            const dist = Math.hypot(playerBody.position.x - egg.x, playerBody.position.z - egg.z);
            if (dist < 3.5 && Math.abs(playerBody.position.y - egg.y) < 3.0) {
                egg.collected = true;
                scene.remove(egg.mesh);
                myCoins += egg.rewardCoins;
                updateUI();
                saveLocalProfile();
                
                playTone(523.25, 'sine', 0.18, 0.4);
                setTimeout(() => playTone(659.25, 'sine', 0.22, 0.45), 90);
                setTimeout(() => playTone(783.99, 'sine', 0.32, 0.5), 180);
                setTimeout(() => playTone(1046.50, 'sine', 0.45, 0.55), 270);
                
                adminLog(`🏆 EASTER EGG FOUND: ${egg.name}! (+${egg.rewardCoins} Coins)`);
            }
        }

        const mapSize = currentMapSize || ((gameState.mode === 'TDM' || gameState.mode === 'CTF' || currentGamemode === 'TDM' || currentGamemode === 'CTF') ? 1200 : 300);
        const barrierLimit = (mapSize / 2) + 6.0;
        const isOutOfBarrier = Math.abs(playerBody.position.x) > barrierLimit || 
                              Math.abs(playerBody.position.z) > barrierLimit || 
                              playerBody.position.y < -35 || 
                              playerBody.position.y > 320;

        if (isOutOfBarrier) {
            if (!isSmiteInvincible && !isDead) {
                adminLog("Flew out of arena barrier! Redeploying...");
                die();
            } else if (isSmiteInvincible) {
                playerBody.position.set(0, 25, 0);
                playerBody.velocity.set(0, 0, 0);
            }
        }
        if (fireCooldown > 0) fireCooldown--; 
        myEnergy = Math.min(myMaxEnergy, myEnergy + (energyRegen * 1/60)); 
        updateUI();
        updateAdminDashboard();
        
        forwardVec.set(0,0,-1).applyQuaternion(camera.quaternion); 
        rightVec.set(1,0,0).applyQuaternion(camera.quaternion);
        forwardVec.y = 0; 
        rightVec.y = 0; 
        forwardVec.normalize(); 
        rightVec.normalize();

        inputDir.set(0,0,0);
        if (moveForward) inputDir.add(forwardVec); 
        if (moveBackward) inputDir.sub(forwardVec); 
        if (moveLeft) inputDir.sub(rightVec); 
        if (moveRight) inputDir.add(rightVec);
        if (Math.abs(gpMoveX) > 0.05 || Math.abs(gpMoveY) > 0.05) { 
            inputDir.addScaledVector(rightVec, gpMoveX); 
            inputDir.addScaledVector(forwardVec, -gpMoveY); 
        }
        inputDir.normalize();
        
        if (!inWater && inputDir.lengthSq() > 0) {
            let tryVelX = inputDir.x * mySpeed;
            let tryVelZ = inputDir.z * mySpeed;
            
            if (isCrouching && isGrounded) {
                let nextPos = playerBody.position.clone();
                nextPos.x += tryVelX * (1/60);
                nextPos.z += tryVelZ * (1/60);
                downRay.set(nextPos, downVector);
                downRay.far = 1.8;
                if (downRay.intersectObjects(mapMeshes).length === 0) {
                    tryVelX = 0;
                    tryVelZ = 0;
                }
            }
            
            const currentSpeed = Math.sqrt(playerBody.velocity.x**2 + playerBody.velocity.z**2);
            if (currentSpeed <= myMaxSpeed) { 
                playerBody.velocity.x = tryVelX; 
                playerBody.velocity.z = tryVelZ; 
            } else {
                playerBody.velocity.x *= 0.94;
                playerBody.velocity.z *= 0.94;
            }
        } else if (!inWater && isCrouching && isGrounded) {
            playerBody.velocity.x = 0; 
            playerBody.velocity.z = 0;
        } else if (!inWater && isGrounded) {
            playerBody.velocity.x *= 0.82;
            playerBody.velocity.z *= 0.82;
            if (Math.abs(playerBody.velocity.x) < 0.05) playerBody.velocity.x = 0;
            if (Math.abs(playerBody.velocity.z) < 0.05) playerBody.velocity.z = 0;
        } else if (!inWater) {
            playerBody.velocity.x *= 0.985;
            playerBody.velocity.z *= 0.985;
        }

        if (Math.abs(gpLookX) > 0.05 || Math.abs(gpLookY) > 0.05) {
            const euler = new THREE.Euler(0, 0, 0, 'YXZ'); 
            euler.setFromQuaternion(camera.quaternion);
            euler.y -= gpLookX * 0.05; 
            euler.x -= gpLookY * 0.04; 
            euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x)); 
            camera.quaternion.setFromEuler(euler);
        }

        let walkTime = Date.now() / 1000 * (isSprinting ? 15 : 10);
        let pSpeed = Math.sqrt(playerBody.velocity.x**2 + playerBody.velocity.z**2);
        let movingAmt = (isGrounded && pSpeed > 2 && inputDir.lengthSq() > 0) ? 1 : 0;
        let swing = Math.sin(walkTime) * 0.6 * movingAmt;
        if (isCrouching) swing *= 0.5;

        const trueThirdPerson = isThirdPerson && !isScoped;
        if (trueThirdPerson) {
            myAvatar.group.visible = true;
            if (myAvatar.nametag) {
                myAvatar.nametag.visible = true;
                myAvatar.nametag.quaternion.copy(camera.quaternion);
            }
            if (viewModelContainer) viewModelContainer.visible = false;
            const pivot = new THREE.Vector3().copy(playerBody.position); 
            pivot.y += (isCrouching ? 0.0 : 1.5);
            const back = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion).normalize(); 
            const rightVecPivot = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
            camera.position.copy(pivot); 
            camera.position.add(back.multiplyScalar(4.5)); 
            camera.position.add(rightVecPivot.multiplyScalar(1.2)); 
            
            myAvatar.group.position.copy(playerBody.position); 
            myAvatar.group.position.y -= 1.5; 
            myAvatar.group.scale.y = isCrouching ? 0.5 : 1.0;
            const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            myAvatar.group.rotation.y = euler.y; 
            myAvatar.head.rotation.x = euler.x; 
            myAvatar.rArm.rotation.x = -Math.PI/3 + euler.x;
            
            myAvatar.lLeg.rotation.x = swing;
            myAvatar.rLeg.rotation.x = -swing;
            myAvatar.lArm.rotation.x = -swing;
        } else {
            myAvatar.group.visible = false; 
            if (myAvatar.nametag) myAvatar.nametag.visible = false;
            if (viewModelContainer) viewModelContainer.visible = !isScoped;
            camera.position.copy(playerBody.position); 
            camera.position.y += (isCrouching ? 0.0 : 1.5); 
        }

        if (viewModelContainer) {
            if (meleeAnimTimer > 0) {
                meleeAnimTimer -= 1/60;
                let t = 1.0 - (meleeAnimTimer / 0.25);
                viewModelContainer.position.x = 0.4 - Math.sin(t * Math.PI) * 0.6;
                viewModelContainer.rotation.y = Math.sin(t * Math.PI) * 1.5;
                viewModelContainer.rotation.z = -Math.sin(t * Math.PI) * 0.5;
            } else if (recoilAnimTimer > 0) {
                recoilAnimTimer -= 1/60;
                let t = recoilAnimTimer / 0.15;
                viewModelContainer.position.z = -0.6 + t * 0.2;
                viewModelContainer.rotation.x = t * 0.2;
                viewModelContainer.rotation.y = 0;
                viewModelContainer.rotation.z = 0;
            } else {
                let bobY = (movingAmt > 0 && isGrounded) ? Math.abs(Math.sin(walkTime)) * 0.05 : 0;
                let bobX = (movingAmt > 0 && isGrounded) ? Math.sin(walkTime * 0.5) * 0.03 : 0;
                viewModelContainer.position.set(0.4 + bobX, -0.3 + bobY, -0.6);
                if (myGun === 'katana' || myGun === 'knock_stick') {
                    viewModelContainer.rotation.set(0, 0.4, 0.4);
                } else {
                    viewModelContainer.rotation.set(0, 0, 0);
                }
            }
        }

        // Remote Player Procedural Animations
        Object.values(remotePlayers).forEach(r => {
            let rWalkTime = Date.now() / 1000 * 10;
            let rSwing = r.moving ? Math.sin(rWalkTime) * 0.6 : 0;
            if (r.mesh.scale.y < 1.0) rSwing *= 0.5;
            
            if (r.lLeg) r.lLeg.rotation.x = rSwing;
            if (r.rLeg) r.rLeg.rotation.x = -rSwing;
            if (r.lArm) r.lArm.rotation.x = -rSwing;
            if (r.nametag) r.nametag.quaternion.copy(camera.quaternion);
        });

        // Visible Cyberpunk Laser Tracers (Smooth travel & impact sparks)
        for(let i=activeBullets.length-1; i>=0; i--) {
            const b = activeBullets[i]; 
            const step = (1 / 60) / (b.travelTime || 0.15);
            b.progress += step;
            if (b.progress >= 1.0) { 
                scene.remove(b.mesh); 
                activeBullets.splice(i, 1); 
                createHitSpark(b.end, b.color || 0x00f3ff);
            } else { 
                b.mesh.position.lerpVectors(b.start, b.end, b.progress); 
            }
        }

        // Animated Map Cybernetics
        const nowSec = Date.now() / 1000;
        animatedMapObjects.forEach(obj => {
            if (obj && typeof obj.update === 'function') obj.update(nowSec);
        });

        // P2P Position Sync Broadcast (20 Hz)
        const myPos = { x: playerBody.position.x, y: playerBody.position.y - 1.5, z: playerBody.position.z };
        const myRot = { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w };
        const now = Date.now();
        if (now - lastNetTime > 50) {
            netBroadcast({ 
                type: 'pos', 
                pos: myPos, 
                rot: myRot, 
                isCrouching: isCrouching, 
                gun: myGun, 
                hp: myHp, 
                maxHp: myMaxHp, 
                coins: myCoins, 
                speed: mySpeed, 
                kothScore: myKothScore 
            });
            lastNetTime = now;
        }
        
        // CTF Flag Visual Sync
        if (gameState.mode === 'CTF') {
            if (flagMeshRed && gameState.flagRed) flagMeshRed.position.copy(gameState.flagRed.pos);
            if (flagMeshBlue && gameState.flagBlue) flagMeshBlue.position.copy(gameState.flagBlue.pos);
            
            const ctfHud = document.getElementById('ctf-flag-status');
            if (ctfHud) {
                ctfHud.style.display = 'block';
                if (!gameState.flagRed.home && !gameState.flagBlue.home) { 
                    ctfHud.innerText = "BOTH FLAGS TAKEN!"; 
                    ctfHud.style.color = "#ff00ff"; 
                } else if (!gameState.flagRed.home) { 
                    ctfHud.innerText = "RED FLAG STOLEN!"; 
                    ctfHud.style.color = "#ff0000"; 
                } else if (!gameState.flagBlue.home) { 
                    ctfHud.innerText = "BLUE FLAG STOLEN!"; 
                    ctfHud.style.color = "#0055ff"; 
                } else { 
                    ctfHud.innerText = "FLAGS SAFE"; 
                    ctfHud.style.color = "#ffff00"; 
                }
            }
        } else {
            const ctfHud = document.getElementById('ctf-flag-status');
            if (ctfHud) ctfHud.style.display = 'none';
        }
    }
    if (gameSettings.rtxPreset === 'off' && gameSettings.fsrMode === 'off' && gameSettings.antiAliasing === 'off' && !gameSettings.enableBloom) {
        renderer.render(scene, camera);
    } else {
        composer.render();
    }
}

// Start
init();
