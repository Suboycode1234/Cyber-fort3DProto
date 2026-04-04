// --- Core Systems ---
let camera, scene, renderer, controls, composer;
let world, physicsMaterial, playerBody;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;

// --- Player Stats ---
let myHp = 100, myMaxHp = 100, myCoins = 0;
let baseSpeed = 25, baseMaxSpeed = 40, mySpeed = 25, myMaxSpeed = 40;
let myJumps = 2, myJumpsLeft = 2; 
let jumpAntiGravityTimer = 0;
let myClass = 'assault', myEnergy = 100, myMaxEnergy = 100, energyRegen = 20, myShield = false, myLifesteal = false;

// Tactical Mechanics
let isCrouching = false, isSprinting = false, isScoped = false;
let isThirdPerson = true, isWallRunning = false; 
let myAvatar;
let viewModelContainer = null;
let recoilAnimTimer = 0;
let meleeAnimTimer = 0;
let mapMeshes = [];
let mapBodies = [];
let flagMeshRed = null;
let flagMeshBlue = null;

let gameState = {
    mode: 'FFA',
    timer: 300,
    scoreRed: 0,
    scoreBlue: 0,
    myTeam: 'none',
    started: false,
    flagRed: { home: true, carrier: null, pos: { x: 300, y: 10, z: 0 } },
    flagBlue: { home: true, carrier: null, pos: { x: -300, y: 10, z: 0 } }
};

let myKothScore = 0;

function respawn() {
    let spawnX = 0, spawnY = 80, spawnZ = 0;
    if (gameState.mode === 'TDM' || gameState.mode === 'CTF') {
        if (gameState.myTeam === 'red') { spawnX = 450; spawnY = 70; spawnZ = 0; }
        else if (gameState.myTeam === 'blue') { spawnX = -450; spawnY = 70; spawnZ = 0; }
        else { spawnX = (Math.random() < 0.5 ? 450 : -450); spawnY = 70; spawnZ = 0; }
    } else if (gameState.mode === 'KOTH') {
        // Corner spawn platforms are at X=±100, Z=±100, height Y=10.
        spawnX = (Math.random() < 0.5 ? 100 : -100); 
        spawnY = 20; 
        spawnZ = (Math.random() < 0.5 ? 100 : -100);
    } else {
        spawnX = (Math.random() - 0.5) * 100; spawnY = 80; spawnZ = (Math.random() - 0.5) * 100;
    }
    
    if (playerBody) {
        playerBody.position.set(spawnX, spawnY, spawnZ);
        playerBody.velocity.set(0,0,0);
    }
}

function updateMatchHUD() {
    const m = Math.floor(gameState.timer / 60);
    const s = gameState.timer % 60;
    document.getElementById('match-timer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    document.getElementById('match-score-red').innerText = gameState.scoreRed;
    document.getElementById('match-score-blue').innerText = gameState.scoreBlue;
}

function matchTimerTick() {
    if(!gameState.started) return;
    
    // Modes with match timer: TDM, FFA, KOTH, ZOMBIES
    const usesTimer = ['TDM', 'FFA', 'KOTH', 'ZOMBIES'].includes(gameState.mode);
    if(usesTimer && gameState.timer > 0) gameState.timer--;
    
    if (gameState.mode === 'KOTH') {
        if(Math.abs(playerBody.position.x) < 40 && Math.abs(playerBody.position.z) < 40 && playerBody.position.y > 5 && playerBody.position.y < 30) {
            myKothScore++;
        }
        updateKothLeaderboard();
        
        if (isHost && gameState.timer <= 0) {
            gameState.started = false;
            let win = {name: myUsername, score: myKothScore};
            Object.values(remotePlayers).forEach(r => { if((r.kothScore || 0) > win.score) win = {name: r.username, score: (r.kothScore || 0)}; });
            connections.forEach(conn => { if(conn.open) conn.send({ type: 'match_over_koth', winner: win.name, score: win.score }); });
            alert("KOTH MATCH OVER! WINNER: " + win.name + " with " + win.score + " points!");
        }
    }
    
    if (isHost && gameState.mode === 'CTF') {
        const checkFlag = (flag, flagName, basePos) => {
            if (flag.home) {
                let pickedUpBy = null;
                if (gameState.myTeam !== flagName && playerBody.position.distanceTo(flag.pos) < 15) pickedUpBy = myId;
                else {
                    Object.keys(remotePlayers).forEach(id => {
                        if (remotePlayers[id].team !== flagName && remotePlayers[id].mesh.position.distanceTo(flag.pos) < 15) pickedUpBy = id;
                    });
                }
                if (pickedUpBy) { flag.home = false; flag.carrier = pickedUpBy; }
            } else if (flag.carrier) {
                if (flag.carrier === myId) flag.pos = playerBody.position.clone();
                else if (remotePlayers[flag.carrier]) flag.pos = remotePlayers[flag.carrier].mesh.position.clone();
                else flag.carrier = null; // Carrier dc
                
                let carrierTeam = flag.carrier === myId ? gameState.myTeam : (remotePlayers[flag.carrier] ? remotePlayers[flag.carrier].team : 'none');
                let carrierBasePos = carrierTeam === 'red' ? {x:450, y:40, z:0} : {x:-450, y:40, z:0};
                if (flag.pos && typeof flag.pos.distanceTo === 'function' && flag.pos.distanceTo(carrierBasePos) < 15) {
                    if (carrierTeam === 'red') gameState.scoreRed++;
                    if (carrierTeam === 'blue') gameState.scoreBlue++;
                    flag.home = true; flag.carrier = null; flag.pos = basePos;
                }
            } else {
                let returnedBy = null;
                if (gameState.myTeam === flagName && playerBody.position.distanceTo(flag.pos) < 15) returnedBy = myId;
                else {
                     Object.keys(remotePlayers).forEach(id => {
                         if (remotePlayers[id].team === flagName && remotePlayers[id].mesh.position.distanceTo(flag.pos) < 15) returnedBy = id;
                     });
                }
                if (returnedBy) { flag.home = true; flag.pos = basePos; flag.carrier = null; }
            }
        };
        
        checkFlag(gameState.flagRed, 'red', {x: 300, y: 10, z: 0});
        checkFlag(gameState.flagBlue, 'blue', {x: -300, y: 10, z: 0});
        
        connections.forEach(conn => { if(conn.open) conn.send({ type: 'sync_ctf', scoreRed: gameState.scoreRed, scoreBlue: gameState.scoreBlue, flagRed: gameState.flagRed, flagBlue: gameState.flagBlue }); });
        
        if (gameState.scoreRed >= 5 || gameState.scoreBlue >= 5) {
            gameState.started = false;
            connections.forEach(conn => { if(conn.open) conn.send({ type: 'match_over' }); });
            alert("CTF MATCH OVER! SCORES:\nRED: " + gameState.scoreRed + "\nBLUE: " + gameState.scoreBlue);
        }
    }
    
    updateMatchHUD();
    if(isHost && usesTimer && gameState.timer <= 0 && gameState.mode !== 'KOTH') {
        gameState.started = false;
        connections.forEach(conn => { if(conn.open) conn.send({ type: 'match_over' }); });
        alert("MATCH OVER! SCORES:\nRED: " + gameState.scoreRed + "\nBLUE: " + gameState.scoreBlue);
    }
}
setInterval(matchTimerTick, 1000);

function updateKothLeaderboard() {
    if (gameState.mode !== 'KOTH') { document.getElementById('koth-leaderboard').style.display = 'none'; return; }
    document.getElementById('koth-leaderboard').style.display = 'flex';
    
    let scores = [];
    scores.push({name: myUsername, score: myKothScore});
    Object.values(remotePlayers).forEach(r => scores.push({name: r.username, score: r.kothScore || 0}));
    scores.sort((a,b) => b.score - a.score);
    
    const lines = document.getElementById('koth-lines');
    lines.innerHTML = '';
    scores.slice(0, 5).forEach((s, idx) => {
        lines.innerHTML += `<div style="display:flex; justify-content:space-between; color:${idx===0?'#00ff00':'#ccc'};"><span>${s.name.substring(0,10)}</span><span>${s.score}</span></div>`;
    });
}


// Networking
let peer = null, myId = "", connections = [], remotePlayers = {}; 
let lastNetTime = 0;

// Mobile & Gamepad
let isMobileDeploy = false, isMobile = false;
let gpMoveX = 0, gpMoveY = 0, gpLookX = 0, gpLookY = 0, gpBtnPrev = [];
let myUsername = "Player";

// Physical Bullets
const activeBullets = [];

// --- Weapon System ---
const WEAPON_STATS = {
    'default': { name: 'Assault', type: 'gun', fireRate: 15, damage: 25, color: 0x00ffff, spread: 0 },
    'sniper': { name: 'Sniper', type: 'gun', fireRate: 60, damage: 150, color: 0xff0000, spread: 0 },
    'shotgun': { name: 'Pump', type: 'gun', fireRate: 45, damage: 20, projectiles: 6, color: 0xffff00, spread: 0.06 },
    'smg': { name: 'SMG', type: 'gun', fireRate: 4, damage: 12, color: 0x00ff00, spread: 0.03 },
    'pistol': { name: 'Pistol', type: 'gun', fireRate: 12, damage: 35, color: 0xffaaaa, spread: 0 },
    'lmg': { name: 'LMG', type: 'gun', fireRate: 8, damage: 20, color: 0xff8800, spread: 0.04 },
    'katana': { name: 'Katana', type: 'melee', fireRate: 25, damage: 85, range: 6.0, color: 0xffffff },
    'medkit': { name: 'Medkit', type: 'support', fireRate: 60, heal: 100, consume: true, color: 0x00ff00 }
};

let myInventory = ['default', null, null, null, null];
let myOwnedWeapons = ['default'];
let currentSlot = 0;
let flatDamageBonus = 0;
let flatFireRateBonus = 0;
let myGun = 'default';
let myCoinSteal = false;
let fireCooldown = 0;
let myKills = 0, myDeaths = 0, lastHitBy = null;
let adminSelectedPeer = null;

function saveProfile() {
    const un = myUsername.trim();
    if(!un || un.startsWith("Player_")) return;
    const data = { coins: myCoins, kills: myKills, deaths: myDeaths, weapons: myOwnedWeapons };
    localStorage.setItem('cyberfort_profile_' + un, JSON.stringify(data));
}

function loadProfile(un) {
    const data = localStorage.getItem('cyberfort_profile_' + un);
    if(data) {
        try {
            const p = JSON.parse(data);
            myCoins = p.coins || 0;
            myKills = p.kills || 0;
            myDeaths = p.deaths || 0;
            if(p.weapons) myOwnedWeapons = p.weapons;
            updateUI();
            alert('Profile Loaded: ' + un + '\nCoins: ' + myCoins);
        } catch(e) {}
    } else {
        alert('New Profile Created: ' + un);
    }
}

function formatTime(ms) { const s = Math.floor(ms/1000); const m = Math.floor(s/60); return `${m}m ${s%60}s`; }
function adminLog(msg) {
    const feed = document.getElementById('admin-live-feed');
    if(!feed) return;
    const item = document.createElement('div'); item.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    feed.appendChild(item); feed.scrollTop = feed.scrollHeight;
}

function updateAdminDashboard() {
    if(!document.getElementById('admin-dashboard') || document.getElementById('admin-dashboard').classList.contains('hidden')) return;
    const list = document.getElementById('admin-player-list');
    list.innerHTML = '';
    const now = Date.now();
    Object.keys(remotePlayers).forEach(peerId => {
        const rp = remotePlayers[peerId];
        const btn = document.createElement('div');
        btn.style.padding = '5px'; btn.style.border = '1px solid #00f3ff'; btn.style.cursor = 'pointer';
        if(adminSelectedPeer === peerId) btn.style.background = 'rgba(0, 243, 255, 0.3)';
        btn.innerHTML = `<b style="color:#fff;">${rp.username}</b> <span style="color:#aaa; font-size:12px;">(${peerId.substring(0,6)}...)</span><br><span style="color:#0f0;">Uptime: ${formatTime(now - rp.connectedAt)}</span><br><span style="color:#ffff00;">K: ${rp.kills} | D: ${rp.deaths}</span>`;
        btn.onclick = () => {
            adminSelectedPeer = peerId;
            document.getElementById('inspector-name').innerText = rp.username + " (" + peerId.substring(0,8) + ")";
            document.getElementById('admin-set-hp').value = Math.floor(rp.hp || 100);
            document.getElementById('admin-set-maxhp').value = Math.floor(rp.maxHp || 100);
            document.getElementById('admin-set-coins').value = Math.floor(rp.coins || 0);
            document.getElementById('admin-set-speed').value = Math.floor(rp.speed || 25);
        };
        list.appendChild(btn);
    });
    
    const chartType = document.getElementById('admin-chart-type').value;
    const container = document.getElementById('admin-chart-container');
    container.innerHTML = '';
    
    const allEntities = Object.values(remotePlayers).map(r => ({name: r.username, val: (chartType === 'hp' ? r.hp : (chartType === 'kills' ? r.kills : (chartType === 'deaths' ? r.deaths : r.coins))) || 0}));
    allEntities.push({name: myUsername + " (You)", val: (chartType === 'hp' ? myHp : (chartType === 'kills' ? myKills : (chartType === 'deaths' ? myDeaths : myCoins)))});
    let maxVal = Math.max(1, ...allEntities.map(e => e.val));
    
    allEntities.forEach(e => {
        const barWraps = document.createElement('div'); barWraps.style.flex = "1"; barWraps.style.display = "flex"; barWraps.style.flexDirection = "column"; barWraps.style.justifyContent = "flex-end"; barWraps.style.alignItems = "center"; barWraps.style.height = "100%";
        const bar = document.createElement('div');
        const hPct = Math.max(2, (e.val / maxVal)*100);
        bar.style.width = "100%"; bar.style.height = hPct + "%"; bar.style.background = chartType === 'hp' ? '#0f0' : (chartType === 'deaths' ? '#f00' : '#ff0'); bar.style.transition = "height 0.2s";
        const lbl = document.createElement('span'); lbl.innerText = e.name.substring(0,5); lbl.style.fontSize = "10px"; lbl.style.color = "#fff"; lbl.style.marginTop = "2px"; lbl.style.overflow = "hidden"; lbl.style.whiteSpace = "nowrap"; lbl.style.textOverflow = "ellipsis"; lbl.style.maxWidth = "100%";
        const valLbl = document.createElement('span'); valLbl.innerText = Math.floor(e.val); valLbl.style.fontSize = "10px"; valLbl.style.color = "#fff"; valLbl.style.marginBottom = "2px";
        barWraps.appendChild(valLbl); barWraps.appendChild(bar); barWraps.appendChild(lbl);
        container.appendChild(barWraps);
    });
}
let joysticksInitialized = false;
function showMobileControls() {
    if(!isMobile) return;
    document.getElementById('mobile-buttons').style.display = 'flex'; 
    document.getElementById('touch-zones').style.display = 'block';
    if (!joysticksInitialized) {
        initJoysticks();
        joysticksInitialized = true;
    }
}
function hideMobileControls() {
    if(!isMobile) return;
    document.getElementById('mobile-buttons').style.display = 'none'; 
    document.getElementById('touch-zones').style.display = 'none';
}

let isHost = false;
let currentGamemode = 'FFA';

function fetchLobbies() {
    if(document.getElementById('blocker').style.display === 'none') return;
    fetch('/api/lobbies').then(r=>r.json()).then(list => {
        const sl = document.getElementById('server-list');
        sl.innerHTML = '';
        if(list.length === 0) { sl.innerHTML = '<p style="color:#aaa; font-size:12px; text-align:center;">No active servers found.</p>'; }
        list.forEach(l => {
            const div = document.createElement('div'); div.className = 'server-item';
            div.innerHTML = `<span>[${l.gamemode}] ${l.hostName}</span><span style="color:#FFD700;">${l.players} Player(s)</span>`;
            div.onclick = (e) => { e.stopPropagation(); document.getElementById('join-id').value = l.hostId; document.getElementById('btn-join').click(); };
            sl.appendChild(div);
        });
    }).catch(e=>{});
}
setInterval(fetchLobbies, 5000);

function pingLobby() {
    if(!isHost) return;
    if(document.getElementById('host-visibility') && document.getElementById('host-visibility').value !== 'public') return;
    const un = document.getElementById('my-username') ? document.getElementById('my-username').value : '';
    fetch('/api/lobbies', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ hostId: myId, hostName: un || 'Host', gamemode: currentGamemode, players: connections.length + 1 })
    }).catch(e=>{});
}
setInterval(pingLobby, 10000);

function initGamemode(mode, isNewGame=true) {
    console.log("Initialized Gamemode:", mode);
    document.getElementById('match-hud').style.display = 'flex';
    document.getElementById('match-mode-text').innerText = mode;
    gameState.mode = mode;
    
    if (isNewGame) {
        gameState.started = true;
        gameState.timer = 5 * 60;
        gameState.scoreRed = 0;
        gameState.scoreBlue = 0;
    }
    
    for (const ob of mapMeshes) scene.remove(ob);
    for (const ob of mapBodies) world.removeBody(ob);
    mapMeshes = []; mapBodies = [];
    buildMap(mode);
    respawn();
    updateMatchHUD();
}

function init() {
    peer = new Peer({ config: { 'iceServers': [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } }); 
    peer.on('open', id => { myId = id; document.getElementById('my-id-display').innerText = id; }); peer.on('connection', conn => setupConnection(conn));
    window.addEventListener('touchstart', () => { if(!isMobile) { isMobile = true; document.body.classList.add('mobile-mode'); } }, {once: true});
    document.addEventListener('touchstart', (e) => {
        if (!isMobileDeploy || myHp <= 0) return;
        if (e.target.closest('#mobile-buttons') || e.target.closest('#touch-zones') || e.target.closest('.modal') || e.target.closest('#hotbar') || e.target.closest('#ui-triggers') || e.target.closest('.menu-bg')) return;
        shoot();
    });
    document.getElementById('btn-join').addEventListener('click', (e) => { 
        e.stopPropagation(); const targetId = document.getElementById('join-id').value; 
        if(!targetId) return;
        const un = document.getElementById('my-username') ? document.getElementById('my-username').value : '';
        myUsername = un.trim() !== '' ? un.trim() : "Player_" + Math.floor(Math.random()*100);
        if(isMobile) { isMobileDeploy = true; document.getElementById('blocker').style.display = 'none'; document.getElementById('hotbar').style.display = 'flex'; showMobileControls(); } else { if(!controls.isLocked) controls.lock(); } 
        applyClass(document.getElementById('player-class').value); connectTo(targetId);
    });
    
    if(document.getElementById('btn-profile-auth')) {
        document.getElementById('btn-profile-auth').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const un = document.getElementById('my-username').value.trim();
            if(!un) { alert("Please enter a Callsign to load/save."); return; }
            myUsername = un;
            loadProfile(un);
        });
    }
    
    document.getElementById('btn-host').addEventListener('click', (e) => {
        e.stopPropagation();
        isHost = true;
        currentGamemode = document.getElementById('host-gamemode').value;
        
        let pref = document.getElementById('team-select') ? document.getElementById('team-select').value : 'auto';
        if (currentGamemode === 'TDM' || currentGamemode === 'CTF') {
            gameState.myTeam = (pref === 'auto') ? 'red' : pref; 
        } else {
            gameState.myTeam = 'none';
        }
        
        const un = document.getElementById('my-username') ? document.getElementById('my-username').value : '';
        myUsername = un.trim() !== '' ? un.trim() : "Player_" + Math.floor(Math.random()*100);
        applyClass(document.getElementById('player-class').value); 
        
        if(isMobile) { isMobileDeploy = true; document.getElementById('blocker').style.display = 'none'; document.getElementById('hotbar').style.display = 'flex'; showMobileControls(); } 
        else { if(!controls.isLocked) controls.lock(); } 
        
        pingLobby();
        initGamemode(currentGamemode, true);
    });

    document.getElementById('blocker').addEventListener('click', (e) => { 
        if(e.target.id === 'blocker') { 
            // Dev solo deploy if clicked outside
            const un = document.getElementById('my-username') ? document.getElementById('my-username').value : '';
            myUsername = un.trim() !== '' ? un.trim() : "Player_" + Math.floor(Math.random()*100);
            applyClass(document.getElementById('player-class').value); 
            isHost = true; currentGamemode = 'FFA'; initGamemode(currentGamemode, true);
            if(isMobile) { isMobileDeploy = true; document.getElementById('blocker').style.display = 'none'; document.getElementById('hotbar').style.display = 'flex'; showMobileControls(); } else { if(!controls.isLocked && myHp > 0) controls.lock(); } 
        } 
    });
    document.body.oncontextmenu = () => false;

    scene = new THREE.Scene(); scene.background = new THREE.Color( 0x050510 ); scene.fog = new THREE.FogExp2( 0x050510, 0.003 );
    const light = new THREE.HemisphereLight( 0xffffff, 0x444455, 0.4 ); light.position.set( 0.5, 1, 0.75 ); scene.add( light );
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.0 ); dirLight.position.set( 100, 200, 100 ); dirLight.castShadow = true;
    dirLight.shadow.camera.top = 200; dirLight.shadow.camera.bottom = -200; dirLight.shadow.camera.left = -200; dirLight.shadow.camera.right = 200; dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048; scene.add( dirLight );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
    viewModelContainer = new THREE.Group();
    viewModelContainer.position.set(0.4, -0.3, -0.6);
    camera.add(viewModelContainer);

    if(typeof THREE.PointerLockControls !== 'undefined') controls = new THREE.PointerLockControls( camera, document.body );
    const blocker = document.getElementById( 'blocker' );
    controls.addEventListener( 'lock', () => { 
        blocker.style.display = 'none'; 
        document.getElementById('shop-modal').classList.add('hidden'); 
        document.getElementById('vip-modal').classList.add('hidden'); 
        document.getElementById('admin-modal').classList.add('hidden'); 
        document.getElementById('hotbar').style.display = 'flex'; 
    });
    controls.addEventListener( 'unlock', () => { 
        isScoped = false; camera.fov = 75; camera.updateProjectionMatrix(); 
        document.getElementById('scope-overlay').classList.add('hidden'); 
        document.getElementById('hotbar').style.display = 'none'; 
        if(myHp > 0 && !isMobileDeploy) {
            if (gameState.started) {
                document.getElementById('exit-panel').classList.remove('hidden');
                document.getElementById('exit-panel').style.display = 'flex';
            } else {
                blocker.style.display = 'flex'; 
            }
        }
    });

    // Exit Panel Actions
    document.getElementById('btn-resume-match').addEventListener('click', () => {
        document.getElementById('exit-panel').classList.add('hidden');
        document.getElementById('exit-panel').style.display = 'none';
        if (!isMobileDeploy && myHp > 0) controls.lock();
    });
    
    document.getElementById('btn-exit-match').addEventListener('click', () => {
        window.location.reload(); // Wipes timer, disconnects peers, stops match loops, resets back to lobby beautifully
    });

    scene.add( controls.getObject() );

    document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', (e) => { if(!controls.isLocked || myHp <= 0) return; if(e.button === 2) toggleScope(); else if(e.button === 0) shoot(); });

    renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } ); renderer.setPixelRatio( window.devicePixelRatio ); renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ReinhardToneMapping; renderer.toneMappingExposure = 1.2; document.body.appendChild( renderer.domElement ); window.addEventListener('resize', onWindowResize, false);

    const renderScene = new THREE.RenderPass( scene, camera );
    const bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 ); bloomPass.threshold = 0.1; bloomPass.strength = 1.4; bloomPass.radius = 0.6;
    composer = new THREE.EffectComposer( renderer ); composer.addPass( renderScene ); composer.addPass( bloomPass );

    world = new CANNON.World(); world.gravity.set(0, -60, 0); physicsMaterial = new CANNON.Material("standard");
    const physicsContactMaterial = new CANNON.ContactMaterial( physicsMaterial, physicsMaterial, { friction: 0.0, restitution: 0.0 } ); world.addContactMaterial(physicsContactMaterial);
    const shape = new CANNON.Sphere(1.5); playerBody = new CANNON.Body({ mass: 5, material: physicsMaterial }); playerBody.addShape(shape); playerBody.position.set(0, 80, 0); playerBody.linearDamping = 0.9;
    world.addBody(playerBody);

    myAvatar = createHumanoid(); myAvatar.matTorso.color.setHex(0x0055ff); myAvatar.matTorso.emissive.setHex(0x001155); scene.add(myAvatar.group);
    buildMap(); setupUIEvents(); updateUI(); updateHotbarUI(); animate();
}

function initJoysticks() {
    if(typeof nipplejs === 'undefined') return;
    const joyMove = nipplejs.create({ zone: document.getElementById('zone-left'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'cyan' }); 
    const joyLook = nipplejs.create({ zone: document.getElementById('zone-right'), mode: 'static', position: { left: '50%', top: '50%' }, color: 'red' });
    joyMove.on('move', (evt, data) => { gpMoveX = data.vector.x; gpMoveY = -data.vector.y; }); joyMove.on('end', () => { gpMoveX = 0; gpMoveY = 0; });
    joyLook.on('move', (evt, data) => { gpLookX = data.vector.x; gpLookY = -data.vector.y; }); joyLook.on('end', () => { gpLookX = 0; gpLookY = 0; });
    const bindTouch = (id, fn) => { const el = document.getElementById(id); el.addEventListener('touchstart', (e)=>{e.preventDefault(); e.stopPropagation(); fn();}, {passive:false}); };
    bindTouch('btn-m-jump', () => { if(myJumpsLeft>0){ playerBody.velocity.y = 25; jumpAntiGravityTimer = 0.5; myJumpsLeft--; canJump = false;} });
    bindTouch('btn-m-ability', () => triggerAbility()); bindTouch('btn-m-scope', () => toggleScope());
}

function updateGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for(let i=0; i<gamepads.length; i++) {
        const gp = gamepads[i]; if(!gp) continue; let deadzone = 0.15;
        if(Math.abs(gp.axes[0]) > deadzone) gpMoveX = gp.axes[0]; else if(!isMobile) gpMoveX = 0;
        if(Math.abs(gp.axes[1]) > deadzone) gpMoveY = gp.axes[1]; else if(!isMobile) gpMoveY = 0;
        if(Math.abs(gp.axes[2]) > deadzone) gpLookX = gp.axes[2]; else if(!isMobile) gpLookX = 0;
        if(Math.abs(gp.axes[3]) > deadzone) gpLookY = gp.axes[3]; else if(!isMobile) gpLookY = 0;
        
        if(!gpBtnPrev[gp.index]) gpBtnPrev[gp.index] = []; const prev = gpBtnPrev[gp.index];
        if(gp.buttons[0]?.pressed && !prev[0]) { if(myJumpsLeft > 0) { playerBody.velocity.y = 25; jumpAntiGravityTimer = 0.5; myJumpsLeft--; canJump = false; } }
        if(gp.buttons[2]?.pressed && !prev[2]) triggerAbility();
        if(gp.buttons[1]?.pressed && !prev[1]) toggleCrouch(); 
        if(gp.buttons[10]?.pressed && !prev[10]) isThirdPerson = !isThirdPerson; 
        if(gp.buttons[6]?.pressed && !prev[6]) toggleScope(); 
        if(gp.buttons[7]?.pressed) shoot(); 
        if(gp.buttons[4]?.pressed && !prev[4]) window.equipSlot((currentSlot - 1 + 5) % 5);
        if(gp.buttons[5]?.pressed && !prev[5]) window.equipSlot((currentSlot + 1) % 5);
        prev[0] = gp.buttons[0]?.pressed; prev[2] = gp.buttons[2]?.pressed; prev[1] = gp.buttons[1]?.pressed; prev[10] = gp.buttons[10]?.pressed; prev[6] = gp.buttons[6]?.pressed; prev[4] = gp.buttons[4]?.pressed; prev[5] = gp.buttons[5]?.pressed;
    }
}

function applyClass(c) {
    myClass = c;
    if(c === 'tank') { myMaxHp = 200; myHp = 200; baseSpeed = 15; baseMaxSpeed = 25; }
    else if(c === 'ninja') { myMaxHp = 80; myHp = 80; baseSpeed = 35; baseMaxSpeed = 50; myJumps = 3; myJumpsLeft = 3; }
    else { myMaxHp = 100; myHp = 100; baseSpeed = 25; baseMaxSpeed = 40; myJumps = 2; }
    mySpeed = baseSpeed; myMaxSpeed = baseMaxSpeed; updateUI();
}

function triggerAbility() {
    let cost = myClass === 'tank' ? 70 : (myClass === 'ninja' ? 40 : 30);
    if(myEnergy >= cost && myHp > 0 && !isScoped) {
        if(myClass === 'assault') { const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize(); playerBody.velocity.x += fwd.x * 60; playerBody.velocity.z += fwd.z * 60;
        } else if(myClass === 'tank') { myShield = true; setTimeout(() => { myShield = false; updateUI(); }, 2000);
        } else if(myClass === 'ninja') { for(let i=-1; i<=1; i++) fireRay((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, 10, 0x00ff00); }
        myEnergy -= cost; updateUI();
    }
}

function toggleScope() {
    if(myGun === 'sniper') {
        isScoped = !isScoped; camera.fov = isScoped ? 20 : (isSprinting ? 85 : 75); camera.updateProjectionMatrix();
        if(isScoped) document.getElementById('scope-overlay').classList.remove('hidden'); else document.getElementById('scope-overlay').classList.add('hidden');
    }
}

function toggleCrouch() {
    isCrouching = !isCrouching;
    if(isCrouching) { isSprinting = false; mySpeed = baseSpeed * 0.5; myMaxSpeed = baseMaxSpeed * 0.5; if(!isScoped) { camera.fov = 75; camera.updateProjectionMatrix(); } }
    else { mySpeed = baseSpeed; myMaxSpeed = baseMaxSpeed; }
}

const availableCards = []; const opCards = [];
function generateCards() {
    const ranks = [
        {name:'Common',color:'#aaaaaa',m:1}, 
        {name:'Rare',color:'#0055ff',m:2}, 
        {name:'Epic',color:'#aa00ff',m:3}, 
        {name:'Legendary',color:'#ffd700',m:5},
        {name:'Mythic',color:'#ff0055',m:8} // Added extra rank purely for variety
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
        // Generates 16 pure per rank * 5 ranks = 80 cards
        t.forEach(x => { 
            availableCards.push({name:`${x.p} (${r.name})`, desc:`Boosts ${x.d}`, rank:r.name, color:r.color, apply:()=>{x.a(r.m);}}); 
        });
        
        // Generates 30 hybrids per rank * 5 ranks = 150 cards (Total ~230 cards)
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
    opCards.push({name:"God Mode", rank:"OP", apply:()=>{myMaxHp+=9999;myHp+=9999;}}, {name:"Speedforce", rank:"OP", apply:()=>{baseSpeed+=60;mySpeed=baseSpeed;baseMaxSpeed+=80;myMaxSpeed=baseMaxSpeed;}}, {name:"Instakill", rank:"OP", apply:()=>{flatDamageBonus=9999;}}, {name:"Flight", rank:"OP", apply:()=>{myJumps=999;}}, {name:"Laser Beam", rank:"OP", apply:()=>{flatFireRateBonus-=50;}}, {name:"Time Lord", rank:"OP", apply:()=>{energyRegen+=1000;myMaxEnergy+=1000;myEnergy=myMaxEnergy;}}, {name:"Midas Touch", rank:"OP", apply:()=>{myCoins+=1000000;myCoinSteal=true;}});
} generateCards();

function die() {
    myDeaths++;
    saveProfile();
    connections.forEach(conn => { if(conn.open) conn.send({ type: 'killed', victim: myId, killer: lastHitBy }); });
    lastHitBy = null;
    if(!isMobileDeploy) controls.unlock();
    isScoped = false; camera.fov = 75; camera.updateProjectionMatrix(); document.getElementById('scope-overlay').classList.add('hidden');
    document.getElementById('blocker').style.display = 'none'; document.getElementById('draft-modal').classList.remove('hidden'); document.getElementById('hotbar').style.display = 'none';
    hideMobileControls();
    const opts = document.getElementById('draft-options'); opts.innerHTML = '';
    const shuffled = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(c => {
        const btn = document.createElement('div'); btn.className = 'draft-card'; btn.innerHTML = `<h3>${c.name}</h3><p>${c.desc}</p>`;
        btn.onclick = () => { 
            c.apply(); 
            myHp = myMaxHp; 
            updateUI(); 
            respawn(); 
            document.getElementById('draft-modal').classList.add('hidden'); 
            if(!isMobileDeploy) document.getElementById('blocker').style.display = 'flex'; else { document.getElementById('hotbar').style.display = 'flex'; showMobileControls(); } 
        }; 
        opts.appendChild(btn);
    });
}

function updateWeaponVisuals(humanoidObj, weaponType) {
    if(!humanoidObj || !humanoidObj.gunContainer) return;
    while(humanoidObj.gunContainer.children.length > 0) humanoidObj.gunContainer.remove(humanoidObj.gunContainer.children[0]);
    humanoidObj.gunContainer.add(createGunMesh(weaponType)); humanoidObj.currentGun = weaponType;
}

function updateViewModel(weaponType) {
    if(!viewModelContainer) return;
    while(viewModelContainer.children.length > 0) viewModelContainer.remove(viewModelContainer.children[0]);
    if(weaponType) {
        viewModelContainer.add(createGunMesh(weaponType));
    }
}

window.equipSlot = function(index) {
    currentSlot = index;
    for(let i=0; i<5; i++) {
        const el = document.getElementById(`slot-${i}`);
        if(el) { if(i === index) el.classList.add('active'); else el.classList.remove('active'); }
    }
    if(myInventory[index] !== null) {
        myGun = myInventory[index];
        updateWeaponVisuals(myAvatar, myGun);
        updateViewModel(myGun);
        connections.forEach(conn => { if(conn.open) conn.send({ type: 'gun', gun: myGun }); });
    } else {
        if(myAvatar && myAvatar.gunContainer) {
            while(myAvatar.gunContainer.children.length > 0) myAvatar.gunContainer.remove(myAvatar.gunContainer.children[0]);
        }
        myGun = null;
        updateViewModel(null);
        connections.forEach(conn => { if(conn.open) conn.send({ type: 'gun', gun: null }); });
    }
}

function updateHotbarUI() {
    for(let i=0; i<5; i++) {
        const nameEl = document.getElementById(`slot-name-${i}`);
        if(nameEl) { const w = myInventory[i]; nameEl.innerText = w ? WEAPON_STATS[w].name : "Empty"; }
    }
}

function setupUIEvents() {
    document.getElementById('shop-trigger').onclick = () => { if(!isMobileDeploy) controls.unlock(); else hideMobileControls(); document.getElementById('shop-modal').classList.remove('hidden'); };
    document.getElementById('btn-shop-close').onclick = () => { document.getElementById('shop-modal').classList.add('hidden'); if(isMobileDeploy && myHp > 0) showMobileControls(); };
    document.getElementById('vip-trigger').onclick = () => { if(!isMobileDeploy) controls.unlock(); else hideMobileControls(); document.getElementById('vip-modal').classList.remove('hidden'); };
    document.getElementById('btn-vip-close').onclick = () => { document.getElementById('vip-modal').classList.add('hidden'); if(isMobileDeploy && myHp > 0) showMobileControls(); };
    document.getElementById('btn-vip-login').onclick = () => { if(document.getElementById('vip-password').value === 'Seth1234@!') { document.getElementById('vip-modal').classList.add('hidden'); opCards.forEach(c => c.apply()); updateUI(); alert("VIP UNLOCKED!"); connections.forEach(conn => { if(conn.open) conn.send({type: 'vip'}); }); if(isMobileDeploy && myHp > 0) showMobileControls(); } };
    document.getElementById('admin-trigger').onclick = () => { if(!isMobileDeploy) controls.unlock(); else hideMobileControls(); document.getElementById('admin-modal').classList.remove('hidden'); };
    document.getElementById('btn-admin-close').onclick = () => { document.getElementById('admin-modal').classList.add('hidden'); if(isMobileDeploy && myHp > 0) showMobileControls(); };
    document.getElementById('btn-admin-login').onclick = () => { if(document.getElementById('admin-password').value === 'Seth1234@!') { 
        document.getElementById('admin-modal').classList.add('hidden'); 
        document.getElementById('admin-dashboard').classList.remove('hidden'); 
        adminLog("Access granted. Initialized Admin Control.");
        
        // Populate self stats box
        document.getElementById('my-inspector-name').innerText = myUsername;
        document.getElementById('my-set-hp').value = Math.floor(myHp);
        document.getElementById('my-set-maxhp').value = Math.floor(myMaxHp);
        document.getElementById('my-set-coins').value = Math.floor(myCoins);
        document.getElementById('my-set-speed').value = Math.floor(baseSpeed);
    } };
    if(document.getElementById('btn-admin-dash-close')) {
        document.getElementById('btn-admin-dash-close').onclick = () => { document.getElementById('admin-dashboard').classList.add('hidden'); if(isMobileDeploy && myHp > 0) showMobileControls(); };
        document.getElementById('btn-admin-apply-stats').onclick = () => {
            if(adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                const spd = document.getElementById('admin-set-speed').value;
                remotePlayers[adminSelectedPeer].conn.send({ type: 'admin_cmd', action: 'set_stats', hp: document.getElementById('admin-set-hp').value, maxHp: document.getElementById('admin-set-maxhp').value, coins: document.getElementById('admin-set-coins').value, speed: spd });
                adminLog("Applied stat override to " + remotePlayers[adminSelectedPeer].username);
            }
        };
        document.getElementById('btn-admin-give-weapon').onclick = () => {
            if(adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                remotePlayers[adminSelectedPeer].conn.send({ type: 'admin_cmd', action: 'give_weapon', weapon: document.getElementById('admin-give-weapon-sel').value });
                adminLog("Dispatched payload [WEAPON] to " + remotePlayers[adminSelectedPeer].username);
            }
        };
        document.getElementById('btn-admin-give-card').onclick = () => {
            if(adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                remotePlayers[adminSelectedPeer].conn.send({ type: 'admin_cmd', action: 'give_card' });
                adminLog("Dispatched payload [EPIC CARD] to " + remotePlayers[adminSelectedPeer].username);
            }
        };
        document.getElementById('btn-admin-vip').onclick = () => {
            if(adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                remotePlayers[adminSelectedPeer].conn.send({ type: 'admin_cmd', action: 'give_vip' });
                adminLog("Elevated privilege [VIP] for " + remotePlayers[adminSelectedPeer].username);
            }
        };
        document.getElementById('btn-admin-kick').onclick = () => {
            if(adminSelectedPeer && remotePlayers[adminSelectedPeer]) {
                remotePlayers[adminSelectedPeer].conn.send({ type: 'admin_cmd', action: 'kick' });
                adminLog("TERMINATED connection for " + remotePlayers[adminSelectedPeer].username);
            }
        };
        
        // Self Stat Apply Event
        if(document.getElementById('btn-my-apply-stats')) {
            document.getElementById('btn-my-apply-stats').onclick = () => {
                myHp = parseFloat(document.getElementById('my-set-hp').value);
                myMaxHp = parseFloat(document.getElementById('my-set-maxhp').value);
                myCoins = parseFloat(document.getElementById('my-set-coins').value);
                baseSpeed = parseFloat(document.getElementById('my-set-speed').value);
                mySpeed = baseSpeed;
                updateUI();
                adminLog("Applied stat override to SELF");
            };
        }
    }
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = (e) => {
            const btnEl = e.currentTarget;
            const cost = parseInt(btnEl.getAttribute('data-cost')); 
            const type = btnEl.getAttribute('data-type');
            
            if (type === 'weapon') {
                const wid = btnEl.getAttribute('data-id');
                if (myOwnedWeapons.includes(wid)) {
                    let slotIdx = myInventory.indexOf(null);
                    if(slotIdx === -1) slotIdx = currentSlot;
                    myInventory[slotIdx] = wid;
                    updateHotbarUI(); window.equipSlot(slotIdx);
                    return; 
                }
            }

            if(myCoins >= cost || isNaN(cost)) {
                if(!isNaN(cost)) myCoins -= cost;
                
                if(type === 'card') { 
                    const rankStr = btnEl.getAttribute('data-rank');
                    let pool = (!rankStr || rankStr === 'Random') ? availableCards : availableCards.filter(c => c.rank === rankStr);
                    if(pool.length === 0) pool = availableCards;
                    const c = pool[Math.floor(Math.random() * pool.length)]; 
                    c.apply(); 
                    if (rankStr === 'Random' || !rankStr) alert(`CARD UNLOCKED: ${c.name}\nRank: ${c.rank}\n\n${c.desc}`);
                }
                else if(type === 'specific_card') { const cid = parseInt(btnEl.getAttribute('data-id')); availableCards[cid].apply(); }
                else if(type === 'weapon') { 
                    const wid = btnEl.getAttribute('data-id');
                    myOwnedWeapons.push(wid);
                    let slotIdx = myInventory.indexOf(null);
                    if(slotIdx === -1) slotIdx = currentSlot;
                    myInventory[slotIdx] = wid;
                    updateHotbarUI(); window.equipSlot(slotIdx);
                }
                else if(type === 'heal') {
                    myHp = myMaxHp;
                }
                updateUI();
                saveProfile();
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
    if(!myShield) document.getElementById('hp-bar').style.background = (myHp/myMaxHp < 0.4) ? '#f00' : '#0f0'; 
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
    if(e.code === 'KeyR') isWallRunning = true;
    switch(e.code) {
        case 'KeyW': moveForward = true; break; case 'KeyA': moveLeft = true; break; case 'KeyS': moveBackward = true; break; case 'KeyD': moveRight = true; break;
        case 'Space': if(myJumpsLeft > 0) { playerBody.velocity.y = 25; jumpAntiGravityTimer = 0.5; myJumpsLeft--; canJump = false; } break;
        case 'ShiftLeft': 
            isSprinting = !isSprinting; 
            if(isSprinting) { isCrouching = false; mySpeed = baseSpeed * 1.8; myMaxSpeed = baseMaxSpeed * 1.8; if(!isScoped) { camera.fov = 85; camera.updateProjectionMatrix(); } }
            else { mySpeed = baseSpeed; myMaxSpeed = baseMaxSpeed; if(!isScoped) { camera.fov = 75; camera.updateProjectionMatrix(); } }
            break;
        case 'ControlLeft': case 'MetaLeft': case 'MetaRight': case 'KeyC': toggleCrouch(); break; case 'KeyE': triggerAbility(); break; case 'KeyV': isThirdPerson = !isThirdPerson; break;
        case 'Digit1': window.equipSlot(0); break; case 'Digit2': window.equipSlot(1); break; case 'Digit3': window.equipSlot(2); break; case 'Digit4': window.equipSlot(3); break; case 'Digit5': window.equipSlot(4); break;
    }
}
function onKeyUp(e) {
    if(e.code === 'KeyR') isWallRunning = false;
    switch(e.code) {
        case 'KeyW': moveForward = false; break; case 'KeyA': moveLeft = false; break; case 'KeyS': moveBackward = false; break; case 'KeyD': moveRight = false; break;
    }
}

function shoot() {
    if(fireCooldown <= 0) {
        const stats = WEAPON_STATS[myGun];
        if(stats.type === 'support') {
            if(myHp < myMaxHp) {
                myHp = Math.min(myMaxHp, myHp + stats.heal);
                myInventory[currentSlot] = null; updateHotbarUI(); window.equipSlot(0); updateUI();
            }
        } else if(stats.type === 'melee') {
            fireMelee(stats.range, stats.damage + flatDamageBonus);
        } else {
            const actualDamage = stats.damage + flatDamageBonus;
            const actualFireRate = Math.max(2, stats.fireRate + flatFireRateBonus);
            if(stats.projectiles) {
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
    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(new THREE.Vector2(0,0), camera); 
    const targets = Object.values(remotePlayers).map(r => r.mesh); const intersects = raycaster.intersectObjects(targets, true);
    if(intersects.length > 0 && intersects[0].distance <= range) {
        let hitId = null; let cur = intersects[0].object;
        while(cur && !hitId) { if(cur.userData && cur.userData.peerId) hitId = cur.userData.peerId; cur = cur.parent; }
        if(hitId && remotePlayers[hitId]) {
            remotePlayers[hitId].conn.send({ type: 'hit', target: hitId, damage: damage });
            if(myLifesteal) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if(myCoinSteal) myCoins += 50; else myCoins += 20; updateUI(); 
        }
    }
    if(myAvatar && myAvatar.rArm) { myAvatar.rArm.rotation.x -= Math.PI/2; setTimeout(() => { myAvatar.rArm.rotation.x += Math.PI/2; }, 150); }
    meleeAnimTimer = 0.25;
    fireCooldown = 25;
}

function fireRay(offsetX, offsetY, damage, colorHex) {
    const raycaster = new THREE.Raycaster(); const rx = offsetX * 2; const ry = offsetY * 2; raycaster.setFromCamera(new THREE.Vector2(rx, ry), camera); 
    if(isScoped) raycaster.setFromCamera(new THREE.Vector2(0,0), camera); 
    const targets = Object.values(remotePlayers).map(r => r.mesh); const intersects = raycaster.intersectObjects(targets, true);
    
    let endPoint;
    if(intersects.length > 0) {
        const hitPoint = intersects[0].point; endPoint = hitPoint; const hitMesh = intersects[0].object;
        let hitId = null; let cur = hitMesh;
        while(cur && !hitId) { if(cur.userData && cur.userData.peerId) hitId = cur.userData.peerId; cur = cur.parent; }
        
        if(hitId && remotePlayers[hitId]) {
            remotePlayers[hitId].conn.send({ type: 'hit', target: hitId, damage: damage });
            if(myLifesteal) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if(myCoinSteal) myCoins += 50; else myCoins += 20; updateUI(); 
        }
    } else { const dir = raycaster.ray.direction; endPoint = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(300)); }
    
    const bMat = new THREE.MeshBasicMaterial({ color: colorHex }); var bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6.0, 8), bMat); bullet.geometry.rotateX(Math.PI/2);
    let startPoint = new THREE.Vector3().copy(camera.position); if(isThirdPerson && !isScoped && myAvatar && myAvatar.gunContainer) myAvatar.gunContainer.getWorldPosition(startPoint);
    
    bullet.position.copy(startPoint); bullet.lookAt(endPoint); scene.add(bullet);
    const dir = new THREE.Vector3().subVectors(endPoint, startPoint).normalize(); bullet.position.add(dir.multiplyScalar(4));
    activeBullets.push({ mesh: bullet, start: new THREE.Vector3().copy(bullet.position), end: endPoint, progress: 0 });
}

function createNametag(name) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128; const ctx = canvas.getContext('2d');
    ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeStyle = 'black'; ctx.lineWidth = 10; ctx.strokeText(name, 256, 64); ctx.fillStyle = '#00f3ff'; ctx.fillText(name, 256, 64);
    const tex = new THREE.CanvasTexture(canvas); const mat = new THREE.SpriteMaterial({ map: tex }); const sprite = new THREE.Sprite(mat); sprite.scale.set(6, 1.5, 1); return sprite;
}

function createGunMesh(type) {
    const group = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.5 }); const accentMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    if(type === 'sniper') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.8), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -1.0;
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), new THREE.MeshStandardMaterial({color: 0x000000})); scope.rotation.x = Math.PI/2; scope.position.y = 0.2; scope.position.z = -0.2;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.6), accentMat); stock.position.z = 0.6; stock.position.y = -0.05; group.add(body, barrel, scope, stock);
    } else if(type === 'shotgun') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.6), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -0.6;
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), new THREE.MeshStandardMaterial({color: 0x4a3424})); pump.position.y = -0.15; pump.position.z = -0.5;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.5), new THREE.MeshStandardMaterial({color: 0x4a3424})); stock.position.z = 0.5; stock.position.y = -0.1; group.add(body, barrel, pump, stock);
    } else if(type === 'smg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -0.4;
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.1), accentMat); mag.position.y = -0.2; group.add(body, barrel, mag);
    } else if(type === 'pistol') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -0.2; group.add(body, barrel);
    } else if(type === 'lmg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.7), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -0.8;
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15), accentMat); drum.rotation.z = Math.PI/2; drum.position.y = -0.2; group.add(body, barrel, drum);
    } else if(type === 'katana') {
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25), accentMat); handle.rotation.x = Math.PI/2;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 2.0), new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.9, roughness:0.1})); blade.position.z = -1.125; group.add(handle, blade);
    } else if(type === 'medkit') {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), new THREE.MeshStandardMaterial({color:0x00ff00}));
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.21), new THREE.MeshBasicMaterial({color:0xffffff}));
        const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.21), new THREE.MeshBasicMaterial({color:0xffffff})); group.add(box, cross, cross2);
    } else { 
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.6), gunMat); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), gunMat); barrel.rotation.x = Math.PI/2; barrel.position.z = -0.6;
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.15), accentMat); mag.position.y = -0.3; mag.position.z = -0.1;
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.4), accentMat); stock.position.z = 0.4; group.add(body, barrel, mag, stock);
    }
    group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; }); return group;
}

function createHumanoid() {
    const group = new THREE.Group();
    const matTorso = new THREE.MeshStandardMaterial({ color: 0x3b4d36, roughness: 0.9, metalness: 0.1 }); const matPants = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }); 
    const matHead  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }); const matSkin  = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.4 }); 
    
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.8), matTorso); torso.position.y = 2.0; torso.castShadow = true; torso.receiveShadow = true; group.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), matHead); head.position.y = 1.3; head.castShadow = true; head.receiveShadow = true; torso.add(head);
    
    const lArm = new THREE.Group(); lArm.position.set(-0.8, 0.7, 0); torso.add(lArm);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), matTorso); lArmMesh.position.y = -0.8; lArmMesh.castShadow = true; lArmMesh.receiveShadow = true; lArm.add(lArmMesh);
    
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), matTorso); rArm.position.set(0.8, 0.2, -0.4); rArm.rotation.x = -Math.PI/3; rArm.castShadow = true; rArm.receiveShadow = true; torso.add(rArm);
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matSkin); lHand.position.y = -0.8; lArmMesh.add(lHand);
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), matSkin); rHand.position.y = -0.8; rArm.add(rHand);
    
    const gunContainer = new THREE.Group(); gunContainer.position.set(0, -0.2, -0.6); rHand.add(gunContainer); gunContainer.add(createGunMesh('default'));
    
    const lLeg = new THREE.Group(); lLeg.position.set(-0.35, -0.9, 0); torso.add(lLeg);
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.45), matPants); lLegMesh.position.y = -0.9; lLegMesh.castShadow = true; lLegMesh.receiveShadow = true; lLeg.add(lLegMesh);
    
    const rLeg = new THREE.Group(); rLeg.position.set(0.35, -0.9, 0); torso.add(rLeg);
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.45), matPants); rLegMesh.position.y = -0.9; rLegMesh.castShadow = true; rLegMesh.receiveShadow = true; rLeg.add(rLegMesh);
    
    return { group, head, torso, lArm, rArm, lLeg, rLeg, gunContainer, matTorso, matPants, currentGun: 'default' };
}

function connectTo(id) { const conn = peer.connect(id); setupConnection(conn); }
function setupConnection(conn) {
    connections.push(conn);
    conn.on('open', () => {
        document.getElementById('connection-status').innerText = "Connected to: " + conn.peer;
        const humanoid = createHumanoid(); const nametag = createNametag("Loading..."); nametag.position.y = 4.5; humanoid.group.add(nametag);
        humanoid.group.userData.peerId = conn.peer;
        scene.add(humanoid.group); remotePlayers[conn.peer] = { mesh: humanoid.group, head: humanoid.head, torso: humanoid.torso, rArm: humanoid.rArm, gunContainer: humanoid.gunContainer, currentGun: 'default', nametag: nametag, conn, mat: humanoid.matTorso, matPants: humanoid.matPants, connectedAt: Date.now(), kills: 0, deaths: 0, hp: 100, maxHp: 100, coins: 0, speed: 25, team: 'none', teamPref: 'auto', kothScore: 0 };
        conn.send({ type: 'init', username: myUsername, teamPref: document.getElementById('team-select') ? document.getElementById('team-select').value : 'auto' });
        adminLog(`New connection: ${conn.peer}`);
    });
    conn.on('data', data => {
        const remote = remotePlayers[conn.peer]; if(!remote) return;
        if(data.type === 'init') {
            remote.username = data.username;
            remote.teamPref = data.teamPref || 'auto';
            remote.mesh.remove(remote.nametag);
            remote.nametag = createNametag(data.username); remote.nametag.position.y = 4.5; remote.mesh.add(remote.nametag);
            
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
                conn.send({ type: 'init_game', mode: currentGamemode, timer: gameState.timer, scoreRed: gameState.scoreRed, scoreBlue: gameState.scoreBlue, team: t, flagRed: gameState.flagRed, flagBlue: gameState.flagBlue });
            }
        }
        if(data.type === 'pos') {
            const oldPos = remote.mesh.position.clone();
            remote.hp = data.hp; remote.maxHp = data.maxHp; remote.coins = data.coins; remote.speed = data.speed;
            remote.kothScore = data.kothScore || 0;
            remote.mesh.position.copy(data.pos); const q = new THREE.Quaternion(data.rot.x, data.rot.y, data.rot.z, data.rot.w); const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
            
            remote.moving = oldPos.distanceTo(data.pos) > 0.05;
            
            remote.mesh.rotation.y = euler.y; remote.head.rotation.x = euler.x; remote.rArm.rotation.x = -Math.PI/3 + euler.x;
            if(data.isCrouching) { remote.mesh.scale.y = 0.5; remote.nametag.visible = false; } else { remote.mesh.scale.y = 1.0; remote.nametag.visible = true; remote.nametag.quaternion.copy(camera.quaternion); }
            if(data.gun && remote.currentGun !== data.gun) { updateWeaponVisuals(remote, data.gun); }
        }
        if (data.type === 'init_game') {
            currentGamemode = data.mode;
            gameState.mode = data.mode;
            gameState.timer = data.timer;
            gameState.scoreRed = data.scoreRed;
            gameState.scoreBlue = data.scoreBlue;
            gameState.myTeam = data.team;
            initGamemode(currentGamemode, false);
            gameState.started = true;
        }
        if (data.type === 'match_over') {
            gameState.started = false;
            alert("MATCH OVER! SCORES:\nRED: " + gameState.scoreRed + "\nBLUE: " + gameState.scoreBlue);
        }
        if (data.type === 'sync_score') {
            gameState.scoreRed = data.scoreRed;
            gameState.scoreBlue = data.scoreBlue;
            updateMatchHUD();
        }
        if(data.type === 'vip') { remote.mat.color.setHex(0xFFD700); remote.mat.emissive.setHex(0x554400); remote.matPants.color.setHex(0xFFD700); }
        if(data.type === 'hit') { if(data.target === myId) { if(myShield) return; myHp -= data.damage || 25; lastHitBy = conn.peer; updateUI(); if(myHp <= 0) die(); } }
        if(data.type === 'killed') {
            if(data.victim === conn.peer && remote) remote.deaths++;
            if(data.killer === myId) { 
                myKills++; myCoins += 100; updateUI(); adminLog(`You eliminated ${remote.username}!`); 
                if (currentGamemode === 'Gun Game' || currentGamemode === 'GUN_GAME') {
                    const prog = ['default', 'pistol', 'smg', 'shotgun', 'lmg', 'sniper', 'katana'];
                    let idx = prog.indexOf(myGun) + 1;
                    if(idx < prog.length) { myInventory[0] = prog[idx]; window.equipSlot(0); updateUI(); adminLog(`Gun Game Level Up: ${prog[idx]}`); }
                }
                saveProfile();
            } 
            else if(remotePlayers[data.killer]) { remotePlayers[data.killer].kills++; adminLog(`${remotePlayers[data.killer].username} eliminated ${remote.username}.`); }
            
            if (currentGamemode === 'TDM') {
                if (remote && remote.team === 'red') gameState.scoreBlue++;
                else if (remote && remote.team === 'blue') gameState.scoreRed++;
                // If the victim was ME
                else if (data.victim === myId) {
                    if(gameState.myTeam === 'red') gameState.scoreBlue++;
                    else if(gameState.myTeam === 'blue') gameState.scoreRed++;
                }
                updateMatchHUD();
            }
        }
        if(data.type === 'admin_cmd') {
            if(data.action === 'kick') { peer.destroy(); window.location.reload(); }
            if(data.action === 'give_vip') { alert("Admin granted you VIP status!"); opCards.forEach(c => c.apply()); document.getElementById('vip-modal').classList.add('hidden'); connections.forEach(conn => { if(conn.open) conn.send({type: 'vip'}); }); updateUI(); }
            if(data.action === 'set_stats') { myHp = parseFloat(data.hp); myMaxHp = parseFloat(data.maxHp); myCoins = parseFloat(data.coins); baseSpeed = parseFloat(data.speed); mySpeed = baseSpeed; updateUI(); }
            if(data.action === 'give_weapon') { let slotIdx = myInventory.indexOf(null); if(slotIdx === -1) slotIdx = currentSlot; myInventory[slotIdx] = data.weapon; updateHotbarUI(); window.equipSlot(slotIdx); }
            if(data.action === 'give_card') { const avail = availableCards.filter(c => c.rank === 'Epic'); if(avail.length > 0) { const c = avail[Math.floor(Math.random() * avail.length)]; c.apply(); adminLog("Admin gave you: " + c.name); } }
        }
    });
    conn.on('close', () => { if(remotePlayers[conn.peer]) { adminLog(`Connection closed: ${remotePlayers[conn.peer].username}`); scene.remove(remotePlayers[conn.peer].mesh); delete remotePlayers[conn.peer]; } });
}

function createNeonGridTexture(hexColor, glowColor) {
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#' + hexColor.toString(16).padStart(6, '0'); ctx.fillRect(0,0,128,128); ctx.strokeStyle = glowColor; ctx.lineWidth = 4; ctx.strokeRect(0,0,128,128);
    const tex = new THREE.CanvasTexture(canvas); tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; return tex;
}

function buildMap(mode) {
    let size = 300;
    if (mode === 'TDM' || mode === 'CTF') size = 1200;

    // Add Floor first
    const floorShape = new CANNON.Plane(); const floorBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    floorBody.addShape(floorShape); floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2); world.addBody(floorBody); mapBodies.push(floorBody);
    const floorGeo = new THREE.PlaneGeometry(size, size, 1, 1); floorGeo.rotateX(-Math.PI/2);
    const fTex = createNeonGridTexture(0x111111, '#00ffaa'); fTex.repeat.set(size/5, size/5); const floorMat = new THREE.MeshStandardMaterial({ map: fTex, emissiveMap: fTex, emissive: 0x00ffaa, emissiveIntensity: 0.3, roughness: 0.2 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat); floorMesh.receiveShadow = true; scene.add(floorMesh); mapMeshes.push(floorMesh);

    // Outer Walls
    addBox(size, 250, 5, 0, 125, -size/2, 0x050510, '#444444'); addBox(size, 250, 5, 0, 125, size/2, 0x050510, '#444444'); addBox(5, 250, size, -size/2, 125, 0, 0x050510, '#444444'); addBox(5, 250, size, size/2, 125, 0, 0x050510, '#444444');

    if (mode === 'FFA') buildMapFFA();
    else if (mode === 'TDM') buildMapTDM();
    else if (mode === 'CTF') buildMapCTF();
    else if (mode === 'KOTH') buildMapKOTH();
    else if (mode === 'Gun Game' || mode === 'GUN_GAME') buildMapGunGame();
    else if (mode === 'Zombies' || mode === 'ZOMBIES') buildMapZombies();
    else buildMapFFA();
}

function buildMapFFA() {
    // TITAN SPIRE (Center)
    addBox(40, 40, 40, 0, 20, 0, 0x111111, '#ff0055'); 
    addBox(20, 40, 20, 0, 60, 0, 0x111111, '#ff0055');
    
    // SPIRAL ASCENSION STAIRS
    for(let i=0; i<12; i++) {
        const radius = 35; const angle = i * (Math.PI / 4);
        const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius; const y = 5 + (i * 6);
        addBox(12, 2, 12, x, y, z, 0x333333, '#00ffaa');
    }

    const s = 70; 
    addBox(20, 60, 20, -s, 30, -s, 0x111122, '#00f3ff'); addBox(20, 60, 20, s, 30, -s, 0x111122, '#00f3ff'); addBox(20, 60, 20, -s, 30, s, 0x111122, '#00f3ff'); addBox(20, 60, 20, s, 30, s, 0x111122, '#00f3ff');
    addRamp(20, 2, 80, -s, 15, -s + 40, Math.PI/5, 0, 0x222222, '#ffff00'); addRamp(20, 2, 80, s, 15, -s + 40, Math.PI/5, 0, 0x222222, '#ffff00'); addRamp(20, 2, 80, -s, 15, s - 40, -Math.PI/5, 0, 0x222222, '#ffff00'); addRamp(20, 2, 80, s, 15, s - 40, -Math.PI/5, 0, 0x222222, '#ffff00'); 
    addBox(40, 2, 10, s, 40, 0, 0x222222, '#00ffaa'); addBox(40, 2, 10, -s, 40, 0, 0x222222, '#00ffaa'); addBox(10, 2, 40, 0, 40, s, 0x222222, '#00ffaa'); addBox(10, 2, 40, 0, 40, -s, 0x222222, '#00ffaa');

    // GROUND COVER
    const coverColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff8800'];
    for(let i=0; i<15; i++) {
        const x = (Math.random() - 0.5) * 240; const z = (Math.random() - 0.5) * 240;
        if(Math.abs(x) < 45 && Math.abs(z) < 45) continue;
        const w = 10 + Math.random() * 15; const h = 5 + Math.random() * 15;
        addBox(w, h, w, x, h/2, z, 0x1a1a1a, coverColors[i%coverColors.length]);
    }
}

function buildMapTDM() {
    // RED FORTRESS (Massive Citadel Setup)
    addBox(240, 60, 240, 450, 30, 0, 0x331111, '#ff0000'); // Central Keep
    addBox(80, 140, 80, 520, 70, 0, 0x440000, '#ff0000');  // Sniper Peak
    addRamp(40, 2, 100, 310, 30, 60, 0, -Math.PI/6, 0x222222, '#ff0000'); // Keep stairs Left
    addRamp(40, 2, 100, 310, 30, -60, 0, -Math.PI/6, 0x222222, '#ff0000'); // Keep stairs Right
    
    // Red Outer Forward Walls (220 units forward of Keep)
    addBox(200, 40, 30, 220, 20, 160, 0x220000, '#ff0000'); // Outer Wall Left
    addBox(200, 40, 30, 220, 20, -160, 0x220000, '#ff0000'); // Outer Wall Right
    addBox(40, 40, 30, 220, 20, 0, 0x220000, '#ff0000'); // Center Arch Base
    addBox(120, 10, 30, 220, 45, 0, 0x220000, '#ff0000'); // Archway bridging the gap
    
    // Parapets and Tower Guards on Red Walls
    addBox(180, 2, 30, 220, 41, 160, 0x222222, '#00ffaa'); // Walkway Left
    addBox(180, 2, 30, 220, 41, -160, 0x222222, '#00ffaa'); // Walkway Right
    addBox(60, 80, 60, 220, 40, 280, 0x330000, '#ff0000'); // Corner Guard Tower Left
    addBox(60, 80, 60, 220, 40, -280, 0x330000, '#ff0000'); // Corner Guard Tower Right
    
    // Ramps to Outer Walls (inside courtyard)
    addRamp(20, 2, 80, 250, 20, 160, 0, -Math.PI/5, 0x111111, '#ff5500');
    addRamp(20, 2, 80, 250, 20, -160, 0, -Math.PI/5, 0x111111, '#ff5500');
    
    // Courtyard Fillers
    addBox(60, 25, 60, 300, 12.5, 180, 0x111111, '#ff00ff');
    addBox(60, 25, 60, 300, 12.5, -180, 0x111111, '#ff00ff');


    // BLUE FORTRESS (Perfectly Mirrored)
    addBox(240, 60, 240, -450, 30, 0, 0x111133, '#0000ff'); // Central Keep
    addBox(80, 140, 80, -520, 70, 0, 0x000044, '#0000ff');  // Sniper Peak
    addRamp(40, 2, 100, -310, 30, 60, 0, Math.PI/6, 0x222222, '#0000ff'); // Keep stairs Left
    addRamp(40, 2, 100, -310, 30, -60, 0, Math.PI/6, 0x222222, '#0000ff'); // Keep stairs Right
    
    // Blue Outer Forward Walls
    addBox(200, 40, 30, -220, 20, 160, 0x000022, '#0000ff'); // Outer Wall Left
    addBox(200, 40, 30, -220, 20, -160, 0x000022, '#0000ff'); // Outer Wall Right
    addBox(40, 40, 30, -220, 20, 0, 0x000022, '#0000ff'); // Center Arch Base
    addBox(120, 10, 30, -220, 45, 0, 0x000022, '#0000ff'); // Archway bridging the gap
    
    // Parapets and Tower Guards on Blue Walls
    addBox(180, 2, 30, -220, 41, 160, 0x222222, '#00ffaa'); // Walkway Left
    addBox(180, 2, 30, -220, 41, -160, 0x222222, '#00ffaa'); // Walkway Right
    addBox(60, 80, 60, -220, 40, 280, 0x000033, '#0000ff'); // Corner Guard Tower Left
    addBox(60, 80, 60, -220, 40, -280, 0x000033, '#0000ff'); // Corner Guard Tower Right
    
    // Ramps to Outer Walls (inside courtyard)
    addRamp(20, 2, 80, -250, 20, 160, 0, Math.PI/5, 0x111111, '#0055ff');
    addRamp(20, 2, 80, -250, 20, -160, 0, Math.PI/5, 0x111111, '#0055ff');

    // Courtyard Fillers
    addBox(60, 25, 60, -300, 12.5, 180, 0x111111, '#ff00ff');
    addBox(60, 25, 60, -300, 12.5, -180, 0x111111, '#ff00ff');


    // NO-MAN'S LAND (Center structure stretching -200 to +200)
    addBox(140, 80, 140, 0, 40, 0, 0x111111, '#ffffff'); // Mega Spire
    addRamp(60, 2, 160, 110, 40, 0, 0, -Math.PI/6, 0x222222, '#ffff00'); // Spire Right Ramp
    addRamp(60, 2, 160, -110, 40, 0, 0, Math.PI/6, 0x222222, '#ffff00'); // Spire Left Ramp
    addRamp(60, 2, 160, 0, 40, 110, -Math.PI/6, 0, 0x222222, '#ffff00');  // Spire Front Ramp
    addRamp(60, 2, 160, 0, 40, -110, Math.PI/6, 0, 0x222222, '#ffff00');   // Spire Back Ramp
    
    // Auxiliary Flanks
    addBox(120, 15, 120, 0, 7.5, 250, 0x222222, '#ffff00'); 
    addBox(120, 15, 120, 0, 7.5, -250, 0x222222, '#ffff00'); 
    addBox(60, 40, 60, 0, 20, 250, 0x1a1a1a, '#ffffff');
    addBox(60, 40, 60, 0, 20, -250, 0x1a1a1a, '#ffffff');
}

function buildMapCTF() {
    buildMapTDM(); // Reuses TDM map bases
    
    // Create Flag Meshes
    const flagGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
    const flagMatRed = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
    const flagMatBlue = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1 });
    
    flagMeshRed = new THREE.Mesh(flagGeo, flagMatRed);
    flagMeshBlue = new THREE.Mesh(flagGeo, flagMatBlue);
    flagMeshRed.position.copy(gameState.flagRed.pos);
    flagMeshBlue.position.copy(gameState.flagBlue.pos);
    
    scene.add(flagMeshRed); scene.add(flagMeshBlue);
    mapMeshes.push(flagMeshRed); mapMeshes.push(flagMeshBlue);
}

function buildMapKOTH() {
    // Giant central hill
    addBox(80, 20, 80, 0, 10, 0, 0x222211, '#ffff00');
    addRamp(30, 2, 40, 0, 10, 60, -Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 0, 10, -60, Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 60, 10, 0, 0, -Math.PI/6, 0x222222, '#ffff00');
    addRamp(30, 2, 40, -60, 10, 0, 0, Math.PI/6, 0x222222, '#ffff00');
    
    // Corner spawns
    const s = 100;
    addBox(20, 10, 20, s, 5, s, 0x111111, '#00ffff');
    addBox(20, 10, 20, -s, 5, s, 0x111111, '#00ffff');
    addBox(20, 10, 20, s, 5, -s, 0x111111, '#00ffff');
    addBox(20, 10, 20, -s, 5, -s, 0x111111, '#00ffff');
}

function buildMapGunGame() {
    // Dense, close-quarters maze-like layout
    for(let i=0; i<30; i++) {
        const x = (Math.random() - 0.5) * 200; 
        const z = (Math.random() - 0.5) * 200;
        const w = 5 + Math.random() * 20; 
        const h = 20 + Math.random() * 20;
        addBox(w, h, 5, x, h/2, z, 0x111111, '#ff00ff');
    }
    // High walkways
    addBox(200, 2, 10, 0, 30, 0, 0x111111, '#00f3ff');
    addBox(10, 2, 200, 0, 30, 0, 0x111111, '#00f3ff');
}

function buildMapZombies() {
    // Darker environment, central safe zone, outer barricades
    addBox(60, 40, 60, 0, 20, 0, 0x050505, '#00ff00');
    addRamp(20, 2, 60, 0, 20, 60, -Math.PI/5, 0, 0x111111, '#555555');
    addRamp(20, 2, 60, 0, 20, -60, Math.PI/5, 0, 0x111111, '#555555');
    
    // Scattered small covers
    for(let i=0; i<40; i++) {
        const x = (Math.random() - 0.5) * 250; 
        const z = (Math.random() - 0.5) * 250;
        if(Math.abs(x) < 50 && Math.abs(z) < 50) continue;
        addBox(10, 10, 10, x, 5, z, 0x1a1a1a, '#115511');
    }
}

function addBox(w, h, d, x, y, z, color, glow) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); body.addShape(shape); body.position.set(x, y, z); world.addBody(body);
    const geo = new THREE.BoxGeometry(w, h, d); const tex = createNeonGridTexture(color, glow); tex.repeat.set(Math.max(1, w/10), Math.max(1, h/10));
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 0.5 }); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); mapMeshes.push(mesh); mapBodies.push(body);
}
function addRamp(w, h, d, x, y, z, angleX, angleZ, color, glow) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); body.addShape(shape); body.position.set(x, y, z);
    const qX = new CANNON.Quaternion(); qX.setFromAxisAngle(new CANNON.Vec3(1,0,0), angleX); const qZ = new CANNON.Quaternion(); qZ.setFromAxisAngle(new CANNON.Vec3(0,0,1), angleZ); body.quaternion = qX.mult(qZ); world.addBody(body);
    const geo = new THREE.BoxGeometry(w, h, d); const tex = createNeonGridTexture(color, glow); tex.repeat.set(Math.max(1, w/10), Math.max(1, d/10));
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 0.5 }); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.quaternion.copy(body.quaternion); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); mapMeshes.push(mesh); mapBodies.push(body);
}

function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize( window.innerWidth, window.innerHeight ); composer.setSize( window.innerWidth, window.innerHeight ); }

const downVector = new THREE.Vector3(0, -1, 0); const downRay = new THREE.Raycaster();
const wallRight = new THREE.Vector3(); const wallLeft = new THREE.Vector3(); const wallPos = new THREE.Vector3();
const wallRayR = new THREE.Raycaster(); const wallRayL = new THREE.Raycaster();
const inputDir = new THREE.Vector3(); const forwardVec = new THREE.Vector3(); const rightVec = new THREE.Vector3();

function animate() {
    requestAnimationFrame( animate );
    const isActive = (controls && controls.isLocked === true) || isMobileDeploy;

    if ( isActive && myHp > 0 ) {
        if(jumpAntiGravityTimer > 0) { jumpAntiGravityTimer -= 1/60; playerBody.force.y += playerBody.mass * 55; }
        world.step(1/60); updateGamepads();
        
        let isGrounded = false;
        if(playerBody.position.y <= 1.6) isGrounded = true;
        else { downRay.set(playerBody.position, downVector); downRay.far = 1.7; if(downRay.intersectObjects(mapMeshes).length > 0) isGrounded = true; }
        if(isGrounded && jumpAntiGravityTimer <= 0) myJumpsLeft = myJumps;

        if(isWallRunning && !isGrounded) {
            wallRight.set(1,0,0).applyQuaternion(camera.quaternion).normalize(); wallLeft.set(-1,0,0).applyQuaternion(camera.quaternion).normalize();
            wallPos.copy(playerBody.position); wallPos.y -= 1; 
            wallRayR.set(wallPos, wallRight); wallRayR.far = 3; wallRayL.set(wallPos, wallLeft); wallRayL.far = 3;
            if(wallRayR.intersectObjects(mapMeshes).length > 0 || wallRayL.intersectObjects(mapMeshes).length > 0) { playerBody.velocity.y = 0; myJumpsLeft = myJumps; }
        }

        if(playerBody.position.y < -10) die();
        if(fireCooldown > 0) fireCooldown--; 
        myEnergy = Math.min(myMaxEnergy, myEnergy + (energyRegen * 1/60)); updateUI();
        updateAdminDashboard();
        
        forwardVec.set(0,0,-1).applyQuaternion(camera.quaternion); rightVec.set(1,0,0).applyQuaternion(camera.quaternion);
        forwardVec.y = 0; rightVec.y = 0; forwardVec.normalize(); rightVec.normalize();

        inputDir.set(0,0,0);
        if(moveForward) inputDir.add(forwardVec); if(moveBackward) inputDir.sub(forwardVec); if(moveLeft) inputDir.sub(rightVec); if(moveRight) inputDir.add(rightVec);
        if(Math.abs(gpMoveX) > 0.05 || Math.abs(gpMoveY) > 0.05) { inputDir.addScaledVector(rightVec, gpMoveX); inputDir.addScaledVector(forwardVec, -gpMoveY); }
        inputDir.normalize();
        
        if(inputDir.lengthSq() > 0) {
            let tryVelX = inputDir.x * mySpeed;
            let tryVelZ = inputDir.z * mySpeed;
            
            if(isCrouching && isGrounded) {
                let nextPos = playerBody.position.clone();
                nextPos.x += tryVelX * (1/60);
                nextPos.z += tryVelZ * (1/60);
                downRay.set(nextPos, downVector);
                downRay.far = 1.8;
                if(downRay.intersectObjects(mapMeshes).length === 0) {
                    tryVelX = 0;
                    tryVelZ = 0;
                }
            }
            
            const currentSpeed = Math.sqrt(playerBody.velocity.x**2 + playerBody.velocity.z**2);
            if(currentSpeed <= myMaxSpeed) { playerBody.velocity.x = tryVelX; playerBody.velocity.z = tryVelZ; }
        } else if (isCrouching && isGrounded) {
            playerBody.velocity.x = 0; 
            playerBody.velocity.z = 0;
        }

        if(Math.abs(gpLookX) > 0.05 || Math.abs(gpLookY) > 0.05) {
            const euler = new THREE.Euler(0, 0, 0, 'YXZ'); euler.setFromQuaternion(camera.quaternion);
            euler.y -= gpLookX * 0.05; euler.x -= gpLookY * 0.04; euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x)); camera.quaternion.setFromEuler(euler);
        }

        let walkTime = Date.now() / 1000 * (isSprinting ? 15 : 10);
        let pSpeed = Math.sqrt(playerBody.velocity.x**2 + playerBody.velocity.z**2);
        let movingAmt = (isGrounded && pSpeed > 2 && inputDir.lengthSq() > 0) ? 1 : 0;
        let swing = Math.sin(walkTime) * 0.6 * movingAmt;
        if(isCrouching) swing *= 0.5;

        const trueThirdPerson = isThirdPerson && !isScoped;
        if(trueThirdPerson) {
            myAvatar.group.visible = true;
            if(viewModelContainer) viewModelContainer.visible = false;
            const pivot = new THREE.Vector3().copy(playerBody.position); pivot.y += (isCrouching ? 0.0 : 1.5);
            const back = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion).normalize(); const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
            camera.position.copy(pivot); camera.position.add(back.multiplyScalar(4.5)); camera.position.add(rightVec.multiplyScalar(1.2)); 
            
            myAvatar.group.position.copy(playerBody.position); myAvatar.group.position.y -= 1.5; myAvatar.group.scale.y = isCrouching ? 0.5 : 1.0;
            const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
            myAvatar.group.rotation.y = euler.y; myAvatar.head.rotation.x = euler.x; myAvatar.rArm.rotation.x = -Math.PI/3 + euler.x;
            
            myAvatar.lLeg.rotation.x = swing;
            myAvatar.rLeg.rotation.x = -swing;
            myAvatar.lArm.rotation.x = -swing;
        } else {
            myAvatar.group.visible = false; 
            if(viewModelContainer) viewModelContainer.visible = !isScoped;
            camera.position.copy(playerBody.position); camera.position.y += (isCrouching ? 0.0 : 1.5); 
        }

        if(viewModelContainer) {
            if(meleeAnimTimer > 0) {
                meleeAnimTimer -= 1/60;
                let t = 1.0 - (meleeAnimTimer / 0.25);
                viewModelContainer.position.x = 0.4 - Math.sin(t * Math.PI) * 0.6;
                viewModelContainer.rotation.y = Math.sin(t * Math.PI) * 1.5;
                viewModelContainer.rotation.z = -Math.sin(t * Math.PI) * 0.5;
            } else if(recoilAnimTimer > 0) {
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
                if (myGun === 'katana') {
                    viewModelContainer.rotation.set(0, 0.4, 0.4);
                } else {
                    viewModelContainer.rotation.set(0, 0, 0);
                }
            }
        }

        Object.values(remotePlayers).forEach(r => {
            let rWalkTime = Date.now() / 1000 * 10;
            let rSwing = r.moving ? Math.sin(rWalkTime) * 0.6 : 0;
            if(r.mesh.scale.y < 1.0) rSwing *= 0.5;
            
            if (r.lLeg) r.lLeg.rotation.x = rSwing;
            if (r.rLeg) r.rLeg.rotation.x = -rSwing;
            if (r.lArm) r.lArm.rotation.x = -rSwing;
        });

        for(let i=activeBullets.length-1; i>=0; i--) {
            const b = activeBullets[i]; const dist = b.start.distanceTo(b.end); const step = dist > 0.001 ? 5 / dist : 1.0; 
            b.progress += step;
            if(b.progress >= 1.0) { scene.remove(b.mesh); activeBullets.splice(i, 1); }
            else { b.mesh.position.lerpVectors(b.start, b.end, b.progress); }
        }

        const myPos = { x: playerBody.position.x, y: playerBody.position.y - 1.5, z: playerBody.position.z };
        const myRot = { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w };
        const now = Date.now();
        if (now - lastNetTime > 50) {
            connections.forEach(conn => { if(conn.open) conn.send({ type: 'pos', pos: myPos, rot: myRot, isCrouching: isCrouching, gun: myGun, hp: myHp, maxHp: myMaxHp, coins: myCoins, speed: mySpeed, kothScore: myKothScore }); });
            lastNetTime = now;
        }
        
        if (gameState.mode === 'CTF') {
            if (flagMeshRed && gameState.flagRed) flagMeshRed.position.copy(gameState.flagRed.pos);
            if (flagMeshBlue && gameState.flagBlue) flagMeshBlue.position.copy(gameState.flagBlue.pos);
            
            const ctfHud = document.getElementById('ctf-flag-status');
            if (ctfHud) {
                ctfHud.style.display = 'block';
                if (!gameState.flagRed.home && !gameState.flagBlue.home) { ctfHud.innerText = "BOTH FLAGS TAKEN!"; ctfHud.style.color = "#ff00ff"; }
                else if (!gameState.flagRed.home) { ctfHud.innerText = "RED FLAG STOLEN!"; ctfHud.style.color = "#ff0000"; }
                else if (!gameState.flagBlue.home) { ctfHud.innerText = "BLUE FLAG STOLEN!"; ctfHud.style.color = "#0055ff"; }
                else { ctfHud.innerText = "FLAGS SAFE"; ctfHud.style.color = "#ffff00"; }
            }
        } else {
            const ctfHud = document.getElementById('ctf-flag-status');
            if (ctfHud) ctfHud.style.display = 'none';
        }
    }
    composer.render();
}
init();
