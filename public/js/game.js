// --- Cyber-Fort 3D Core Engine & PeerJS Mesh Architecture ---

// Core Three.js & Physics Systems
let camera, scene, renderer, controls, composer;
let world, physicsMaterial, playerBody;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, canJump = false;

// Player Stats & State
let myHp = 100, myMaxHp = 100, myCoins = 0;
let baseSpeed = 25, baseMaxSpeed = 40, mySpeed = 25, myMaxSpeed = 40;
let myJumps = 2, myJumpsLeft = 2; 
let jumpAntiGravityTimer = 0;
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
    timer: 300,
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
    'pistol': { name: 'Pistol', type: 'gun', fireRate: 6, damage: 35, color: 0xffaaaa, spread: 0 },
    'lmg': { name: 'LMG', type: 'gun', fireRate: 4, damage: 22, color: 0xff8800, spread: 0.035 },
    'katana': { name: 'Katana', type: 'melee', fireRate: 14, damage: 90, range: 7.0, color: 0xffffff },
    'medkit': { name: 'Medkit', type: 'support', fireRate: 45, heal: 100, consume: true, color: 0x00ff00 }
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
            weapons: myOwnedWeapons
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

function escapeHtml(str) {
    if (!str) return 'Player';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function fetchLobbies() {
    const sl = document.getElementById('server-list');
    if (!sl) return;
    
    fetch('/api/lobbies')
        .then(r => r.json())
        .then(list => {
            sl.innerHTML = '';
            if (!Array.isArray(list) || list.length === 0) {
                sl.innerHTML = '<p style="color:#aaa; font-size:12px; text-align:center; margin:auto;">No public servers online.</p>';
                return;
            }
            list.forEach(l => {
                const div = document.createElement('div');
                div.className = 'server-item';
                div.innerHTML = `<span><strong>[${l.gamemode}]</strong> ${escapeHtml(l.hostName)}</span><span style="color:#00ffaa; font-weight:bold;">${l.players}/${l.maxPlayers || 8}</span>`;
                div.onclick = (e) => {
                    e.stopPropagation();
                    if (!ensureCustomNametag()) return;
                    joinMatch(l.roomCode || l.hostPeerId);
                };
                sl.appendChild(div);
            });
        })
        .catch(() => {
            if (sl.children.length === 0 || sl.innerText.includes('Fetching')) {
                sl.innerHTML = '<p style="color:#888; font-size:12px; text-align:center; margin:auto;">Server browser offline.</p>';
            }
        });
}

function registerPublicLobby() {
    if (!isPublicRoom || !isHost || !currentRoomCode) return;
    fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            roomCode: currentRoomCode,
            hostPeerId: myPeerId,
            hostName: myUsername,
            gamemode: currentGamemode,
            players: roomPeerIds.length || 1
        })
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
    if (currentRoomCode) {
        fetch(`/api/lobbies/${currentRoomCode}`, { method: 'DELETE', keepalive: true }).catch(() => {});
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
        if (onReady) onReady(myPeerId);
        return;
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
                timer: gameState.timer,
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

    setConnectionStatus(`Hosting ${isPublicRoom ? 'Public' : 'Private'} Room [${code}]...`);
    initPeer(fullHostId, (id) => {
        isHost = true;
        hostPeerId = myPeerId;
        roomPeerIds = [myPeerId];
        currentGamemode = document.getElementById('host-gamemode').value;

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

        initGamemode(currentGamemode, true);
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
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        gameState.flagRed = data.flagRed || gameState.flagRed;
        gameState.flagBlue = data.flagBlue || gameState.flagBlue;
        hostPeerId = data.hostId;
        roomPeerIds = data.peers || [myPeerId];

        // Connect to all other peers in room mesh
        if (Array.isArray(data.peers)) {
            data.peers.forEach(pid => {
                if (pid !== myPeerId && !peerConnections[pid]) {
                    connectToPeer(pid);
                }
            });
        }

        initGamemode(currentGamemode, false);
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
                timer: gameState.timer,
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
        gameState.scoreRed = data.scoreRed;
        gameState.scoreBlue = data.scoreBlue;
        gameState.myTeam = data.team;
        if (data.flagRed) gameState.flagRed = data.flagRed;
        if (data.flagBlue) gameState.flagBlue = data.flagBlue;
        initGamemode(currentGamemode, false);
        gameState.started = true;
        updateMyNametag();
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

    if (data.type === 'vip') {
        remote.mat.color.setHex(0xFFD700); 
        remote.mat.emissive.setHex(0x554400); 
        remote.matPants.color.setHex(0xFFD700); 
    }

    if (data.type === 'hit') {
        if (data.target === myPeerId) {
            if (myShield) return;
            myHp -= data.damage || 25;
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
    if (gameState.mode === 'TDM' || gameState.mode === 'CTF') {
        if (gameState.myTeam === 'red') { spawnX = 450; spawnY = 70; spawnZ = 0; }
        else if (gameState.myTeam === 'blue') { spawnX = -450; spawnY = 70; spawnZ = 0; }
        else { spawnX = (Math.random() < 0.5 ? 450 : -450); spawnY = 70; spawnZ = 0; }
    } else if (gameState.mode === 'KOTH') {
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
    updateMyNametag();
}

function updateMatchHUD() {
    const m = Math.floor(gameState.timer / 60);
    const s = gameState.timer % 60;
    document.getElementById('match-timer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    document.getElementById('match-score-red').innerText = gameState.scoreRed;
    document.getElementById('match-score-blue').innerText = gameState.scoreBlue;
}

function matchTimerTick() {
    if (!gameState.started) return;
    
    const usesTimer = ['TDM', 'FFA', 'KOTH', 'ZOMBIES'].includes(gameState.mode);
    if (usesTimer && gameState.timer > 0 && isHost) {
        gameState.timer--;
        if (gameState.timer % 5 === 0) {
            netBroadcast({ type: 'sync_score', scoreRed: gameState.scoreRed, scoreBlue: gameState.scoreBlue });
        }
    }
    
    if (gameState.mode === 'KOTH') {
        if (Math.abs(playerBody.position.x) < 40 && Math.abs(playerBody.position.z) < 40 && playerBody.position.y > 5 && playerBody.position.y < 30) {
            myKothScore++;
        }
        updateKothLeaderboard();
        
        if (isHost && gameState.timer <= 0) {
            gameState.started = false;
            let win = { name: myUsername, score: myKothScore };
            Object.values(remotePlayers).forEach(r => { 
                if ((r.kothScore || 0) > win.score) win = { name: r.username, score: (r.kothScore || 0) }; 
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
    if (gameState.mode !== 'KOTH') { 
        document.getElementById('koth-leaderboard').style.display = 'none'; 
        return; 
    }
    document.getElementById('koth-leaderboard').style.display = 'flex';
    
    let scores = [];
    scores.push({ name: myUsername, score: myKothScore });
    Object.values(remotePlayers).forEach(r => scores.push({ name: r.username, score: r.kothScore || 0 }));
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

function initGamemode(mode, isNewGame = true) {
    console.log("[Gamemode Init]:", mode);
    document.getElementById('match-hud').style.display = 'flex';
    document.getElementById('match-mode-text').innerText = mode;
    gameState.mode = mode;
    
    if (isNewGame) {
        gameState.started = true;
        gameState.timer = 5 * 60;
        gameState.scoreRed = 0;
        gameState.scoreBlue = 0;
        
        if (mode === 'Gun Game' || mode === 'GUN_GAME') {
            myInventory = ['default', null, null, null, null];
            currentSlot = 0;
            if (typeof window.equipSlot === 'function') window.equipSlot(0);
        }
    }
    
    for (const ob of mapMeshes) scene.remove(ob);
    for (const ob of mapBodies) world.removeBody(ob);
    for (const d of mapDecorations) scene.remove(d);
    mapMeshes = []; 
    mapBodies = [];
    mapDecorations = [];
    animatedMapObjects = [];
    buildMap(mode);
    respawn();
    updateMatchHUD();
}

// ============================================================================
// CORE INITIALIZATION & DOM EVENTS
// ============================================================================
function init() {
    loadLocalProfile();

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
            fetchLobbies();
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

    // High fidelity main directional light with soft shadows
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1.35 ); 
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

    // Deep neon fill light
    const fillLight = new THREE.DirectionalLight( 0x0066ff, 0.45 );
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
        isScoped = false; 
        camera.fov = 75; 
        camera.updateProjectionMatrix(); 
        document.getElementById('scope-overlay').classList.add('hidden'); 
        document.getElementById('hotbar').style.display = 'none'; 
        if (myHp > 0 && !isMobileDeploy) {
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
    renderer.toneMapping = THREE.ReinhardToneMapping; 
    renderer.toneMappingExposure = 1.2; 
    document.body.appendChild( renderer.domElement ); 
    window.addEventListener('resize', onWindowResize, false);

    const renderScene = new THREE.RenderPass( scene, camera );
    const bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 ); 
    bloomPass.threshold = 0.1; 
    bloomPass.strength = 1.4; 
    bloomPass.radius = 0.6;
    composer = new THREE.EffectComposer( renderer ); 
    composer.addPass( renderScene ); 
    composer.addPass( bloomPass );

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
    bindTouch('btn-m-jump', () => { if (myJumpsLeft>0){ playerBody.velocity.y = 25; jumpAntiGravityTimer = 0.5; myJumpsLeft--; canJump = false; } });
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
        if (gp.buttons[0]?.pressed && !prev[0]) { if (myJumpsLeft > 0) { playerBody.velocity.y = 25; jumpAntiGravityTimer = 0.5; myJumpsLeft--; canJump = false; } }
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
    mySpeed = baseSpeed; myMaxSpeed = baseMaxSpeed; updateUI();
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
    myDeaths++;
    saveLocalProfile();
    netBroadcast({ type: 'killed', victim: myPeerId, killer: lastHitBy });
    lastHitBy = null;

    if (!isMobileDeploy) controls.unlock();
    isScoped = false; 
    camera.fov = 75; 
    camera.updateProjectionMatrix(); 
    document.getElementById('scope-overlay').classList.add('hidden');
    document.getElementById('blocker').style.display = 'none'; 
    document.getElementById('draft-modal').classList.remove('hidden'); 
    document.getElementById('hotbar').style.display = 'none';
    hideMobileControls();

    const opts = document.getElementById('draft-options'); 
    opts.innerHTML = '';
    const shuffled = [...availableCards].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(c => {
        const btn = document.createElement('div'); 
        btn.className = 'draft-card'; 
        btn.innerHTML = `<h3>${c.name}</h3><p>${c.desc}</p>`;
        btn.onclick = () => { 
            c.apply(); 
            myHp = myMaxHp; 
            updateUI(); 
            respawn(); 
            document.getElementById('draft-modal').classList.add('hidden'); 
            if (!isMobileDeploy) document.getElementById('blocker').style.display = 'flex'; 
            else { document.getElementById('hotbar').style.display = 'flex'; showMobileControls(); } 
        }; 
        opts.appendChild(btn);
    });
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
            document.getElementById('vip-modal').classList.add('hidden'); 
            opCards.forEach(c => c.apply()); 
            updateUI(); 
            alert("VIP UNLOCKED!"); 
            netBroadcast({ type: 'vip' }); 
            if (isMobileDeploy && myHp > 0) showMobileControls(); 
        } else {
            alert("Incorrect VIP Passcode.");
        }
    };

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
                
                if (type === 'card') { 
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
    if (e.code === 'KeyR') isWallRunning = true;
    switch(e.code) {
        case 'KeyW': moveForward = true; break; 
        case 'KeyA': moveLeft = true; break; 
        case 'KeyS': moveBackward = true; break; 
        case 'KeyD': moveRight = true; break;
        case 'Space': 
            if (myJumpsLeft > 0) { 
                playerBody.velocity.y = 25; 
                jumpAntiGravityTimer = 0.5; 
                myJumpsLeft--; 
                canJump = false; 
            } 
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
    if (e.code === 'KeyR') isWallRunning = false;
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
    const targets = Object.values(remotePlayers).map(r => r.mesh); 
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0 && intersects[0].distance <= range) {
        let hitId = null; 
        let cur = intersects[0].object;
        while(cur && !hitId) { 
            if (cur.userData && cur.userData.peerId) hitId = cur.userData.peerId; 
            cur = cur.parent; 
        }
        if (hitId && remotePlayers[hitId]) {
            netSendTo(hitId, { type: 'hit', target: hitId, damage: damage });
            if (myLifesteal) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if (myCoinSteal) myCoins += 50; else myCoins += 20; 
            updateUI(); 
            saveLocalProfile();
        }
    }
    if (myAvatar && myAvatar.rArm) { 
        myAvatar.rArm.rotation.x -= Math.PI/2; 
        setTimeout(() => { myAvatar.rArm.rotation.x += Math.PI/2; }, 150); 
    }
    meleeAnimTimer = 0.25;
    fireCooldown = 25;
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
    const intersects = raycaster.intersectObjects(targets, true);
    
    let endPoint;
    if (intersects.length > 0) {
        const hitPoint = intersects[0].point; 
        endPoint = hitPoint; 
        const hitMesh = intersects[0].object;
        let hitId = null; 
        let cur = hitMesh;
        while(cur && !hitId) { 
            if (cur.userData && cur.userData.peerId) hitId = cur.userData.peerId; 
            cur = cur.parent; 
        }
        
        if (hitId && remotePlayers[hitId]) {
            // Immediate Hitscan Damage Dispatch over P2P Mesh
            netSendTo(hitId, { type: 'hit', target: hitId, damage: damage });
            if (myLifesteal) { myHp = Math.min(myMaxHp, myHp + 20); updateUI(); }
            if (myCoinSteal) myCoins += 50; else myCoins += 20; 
            updateUI(); 
            saveLocalProfile();
            createHitSpark(hitPoint, colorHex);
        }
    } else { 
        const dir = raycaster.ray.direction; 
        endPoint = new THREE.Vector3().copy(camera.position).add(dir.multiplyScalar(350)); 
    }
    
    // Supersonic Sci-Fi Tracer
    const bMat = new THREE.MeshBasicMaterial({ color: colorHex }); 
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8.0, 8), bMat); 
    bullet.geometry.rotateX(Math.PI/2);
    
    let startPoint = new THREE.Vector3().copy(camera.position); 
    if (isThirdPerson && !isScoped && myAvatar && myAvatar.gunContainer) {
        myAvatar.gunContainer.getWorldPosition(startPoint);
    }
    
    bullet.position.copy(startPoint); 
    bullet.lookAt(endPoint); 
    scene.add(bullet);

    const dir = new THREE.Vector3().subVectors(endPoint, startPoint).normalize(); 
    bullet.position.add(dir.multiplyScalar(4));
    activeBullets.push({ 
        mesh: bullet, 
        start: new THREE.Vector3().copy(bullet.position), 
        end: endPoint, 
        progress: 0,
        speed: 35 
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
    } else if (type === 'pistol') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.2; 
        group.add(body, barrel);
    } else if (type === 'lmg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.7), gunMat); 
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), gunMat); 
        barrel.rotation.x = Math.PI/2; barrel.position.z = -0.8;
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15), accentMat); 
        drum.rotation.z = Math.PI/2; drum.position.y = -0.2; 
        group.add(body, barrel, drum);
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

function buildMap(mode) {
    let size = 300;
    if (mode === 'TDM' || mode === 'CTF') size = 1200;

    const floorShape = new CANNON.Plane(); 
    const floorBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    floorBody.addShape(floorShape); 
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2); 
    world.addBody(floorBody); 
    mapBodies.push(floorBody);

    const floorGeo = new THREE.PlaneGeometry(size, size, 1, 1); 
    floorGeo.rotateX(-Math.PI/2);
    const fTex = createNeonGridTexture(0x111111, '#00ffaa'); 
    fTex.repeat.set(size/5, size/5); 
    const floorMat = new THREE.MeshStandardMaterial({ map: fTex, emissiveMap: fTex, emissive: 0x00ffaa, emissiveIntensity: 0.3, roughness: 0.2 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat); 
    floorMesh.receiveShadow = true; 
    scene.add(floorMesh); 
    mapMeshes.push(floorMesh);

    // Outer Walls
    addBox(size, 250, 5, 0, 125, -size/2, 0x050510, '#444444'); 
    addBox(size, 250, 5, 0, 125, size/2, 0x050510, '#444444'); 
    addBox(5, 250, size, -size/2, 125, 0, 0x050510, '#444444'); 
    addBox(5, 250, size, size/2, 125, 0, 0x050510, '#444444');

    if (mode === 'FFA') buildMapFFA();
    else if (mode === 'TDM') buildMapTDM();
    else if (mode === 'CTF') buildMapCTF();
    else if (mode === 'KOTH') buildMapKOTH();
    else if (mode === 'Gun Game' || mode === 'GUN_GAME') buildMapGunGame();
    else if (mode === 'Zombies' || mode === 'ZOMBIES') buildMapZombies();
    else buildMapFFA();
}

function buildMapFFA() {
    // --- CENTRAL TITAN CYBER SPIRE ---
    // Ground Tier Foundation
    addBox(46, 26, 46, 0, 13, 0, 0x111624, '#00f3ff'); 
    // Mid Tier Spire
    addBox(28, 36, 28, 0, 44, 0, 0x141b2e, '#ff0055');
    // High Pinnacle Observation Tier
    addBox(14, 28, 14, 0, 76, 0, 0x0f1526, '#00f3ff');
    
    // Spiral Ascending Combat Platforms
    for(let i=0; i<12; i++) {
        const radius = 35; 
        const angle = i * (Math.PI / 4);
        const x = Math.cos(angle) * radius; 
        const z = Math.sin(angle) * radius; 
        const y = 6 + (i * 6);
        addBox(12, 2, 12, x, y, z, 0x1a2236, '#00ffaa');
    }

    // Floating Holographic Torus Ring around Central Spire
    const ringGeo = new THREE.TorusGeometry(26, 0.75, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 1.8,
        roughness: 0.15,
        metalness: 0.85
    });
    const holoRing = new THREE.Mesh(ringGeo, ringMat);
    holoRing.position.set(0, 78, 0);
    holoRing.rotation.x = Math.PI / 4;
    scene.add(holoRing);
    mapDecorations.push(holoRing);

    // Floating Pulsating Cyber Power Core
    const coreGeo = new THREE.OctahedronGeometry(5.5, 2);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xff0055,
        emissive: 0xff0055,
        emissiveIntensity: 2.4,
        roughness: 0.1,
        metalness: 0.95
    });
    const powerCore = new THREE.Mesh(coreGeo, coreMat);
    powerCore.position.set(0, 88, 0);
    scene.add(powerCore);
    mapDecorations.push(powerCore);

    const coreLight = new THREE.PointLight(0xff0055, 3.5, 110);
    coreLight.position.set(0, 88, 0);
    scene.add(coreLight);
    mapDecorations.push(coreLight);

    animatedMapObjects.push({
        update: (t) => {
            holoRing.rotation.z += 0.012;
            holoRing.rotation.y += 0.005;
            powerCore.rotation.y += 0.02;
            powerCore.rotation.x += 0.01;
            const cy = 88 + Math.sin(t * 2) * 2.5;
            powerCore.position.y = cy;
            coreLight.position.y = cy;
        }
    });

    // --- 4 CORNER CYBER DEFENSE TOWERS & PYLONS ---
    const s = 70; 
    addBox(22, 60, 22, -s, 30, -s, 0x111624, '#00f3ff'); 
    addBox(22, 60, 22, s, 30, -s, 0x111624, '#00f3ff'); 
    addBox(22, 60, 22, -s, 30, s, 0x111624, '#00f3ff'); 
    addBox(22, 60, 22, s, 30, s, 0x111624, '#00f3ff');

    const pylonData = [
        { x: -s, z: -s, color: 0x00f3ff },
        { x: s, z: -s, color: 0xff0088 },
        { x: -s, z: s, color: 0xffaa00 },
        { x: s, z: s, color: 0x00ff88 }
    ];
    pylonData.forEach(p => {
        // High-poly cylindrical pylon mast
        const pylonMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 2.0, 75, 16),
            new THREE.MeshStandardMaterial({ color: 0x111624, metalness: 0.85, roughness: 0.25 })
        );
        pylonMesh.position.set(p.x, 37.5, p.z);
        pylonMesh.castShadow = true;
        scene.add(pylonMesh);
        mapMeshes.push(pylonMesh);

        // Glowing torus emitter crown
        const crownMesh = new THREE.Mesh(
            new THREE.TorusGeometry(3.0, 0.45, 12, 32),
            new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 2.2 })
        );
        crownMesh.rotation.x = Math.PI / 2;
        crownMesh.position.set(p.x, 75, p.z);
        scene.add(crownMesh);
        mapDecorations.push(crownMesh);

        // Real-time Cyber Point Light
        const pLight = new THREE.PointLight(p.color, 2.4, 90);
        pLight.position.set(p.x, 77, p.z);
        scene.add(pLight);
        mapDecorations.push(pLight);
    });

    // High-Poly Concentric Jump Pads
    const jumpPadCoords = [{ x: 0, z: 55 }, { x: 0, z: -55 }, { x: 55, z: 0 }, { x: -55, z: 0 }];
    jumpPadCoords.forEach(j => {
        const padBase = new THREE.Mesh(
            new THREE.CylinderGeometry(4.2, 4.8, 0.6, 24),
            new THREE.MeshStandardMaterial({ color: 0x0d1424, metalness: 0.9, roughness: 0.2 })
        );
        padBase.position.set(j.x, 0.3, j.z);
        scene.add(padBase);
        mapMeshes.push(padBase);

        const padRing = new THREE.Mesh(
            new THREE.RingGeometry(1.8, 3.6, 32),
            new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide })
        );
        padRing.rotateX(-Math.PI / 2);
        padRing.position.set(j.x, 0.62, j.z);
        scene.add(padRing);
        mapDecorations.push(padRing);

        const padCore = new THREE.Mesh(
            new THREE.CircleGeometry(1.2, 24),
            new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide })
        );
        padCore.rotateX(-Math.PI / 2);
        padCore.position.set(j.x, 0.63, j.z);
        scene.add(padCore);
        mapDecorations.push(padCore);
    });

    // Elevated Ramps and Cross-Walkways
    addRamp(20, 2, 80, -s, 15, -s + 40, Math.PI/5, 0, 0x1f293d, '#ffff00'); 
    addRamp(20, 2, 80, s, 15, -s + 40, Math.PI/5, 0, 0x1f293d, '#ffff00'); 
    addRamp(20, 2, 80, -s, 15, s - 40, -Math.PI/5, 0, 0x1f293d, '#ffff00'); 
    addRamp(20, 2, 80, s, 15, s - 40, -Math.PI/5, 0, 0x1f293d, '#ffff00'); 

    addBox(40, 2, 10, s, 40, 0, 0x1a2438, '#00ffaa'); 
    addBox(40, 2, 10, -s, 40, 0, 0x1a2438, '#00ffaa'); 
    addBox(10, 2, 40, 0, 40, s, 0x1a2438, '#00ffaa'); 
    addBox(10, 2, 40, 0, 40, -s, 0x1a2438, '#00ffaa');

    // Strategic High-Fidelity Tactical Cover Nodes
    const coverColors = ['#ff00ff', '#00f3ff', '#ffff00', '#ff8800'];
    for(let i=0; i<18; i++) {
        const x = (Math.random() - 0.5) * 240; 
        const z = (Math.random() - 0.5) * 240;
        if (Math.abs(x) < 45 && Math.abs(z) < 45) continue;
        const w = 10 + Math.random() * 15; 
        const h = 5 + Math.random() * 15;
        addBox(w, h, w, x, h/2, z, 0x141a29, coverColors[i % coverColors.length]);
    }
}

function buildMapTDM() {
    // Red Fortress
    addBox(240, 60, 240, 450, 30, 0, 0x331111, '#ff0000'); 
    addBox(80, 140, 80, 520, 70, 0, 0x440000, '#ff0000');  
    addRamp(40, 2, 100, 310, 30, 60, 0, -Math.PI/6, 0x222222, '#ff0000'); 
    addRamp(40, 2, 100, 310, 30, -60, 0, -Math.PI/6, 0x222222, '#ff0000'); 
    
    addBox(200, 40, 30, 220, 20, 160, 0x220000, '#ff0000'); 
    addBox(200, 40, 30, 220, 20, -160, 0x220000, '#ff0000'); 
    addBox(40, 40, 30, 220, 20, 0, 0x220000, '#ff0000'); 
    addBox(120, 10, 30, 220, 45, 0, 0x220000, '#ff0000'); 
    
    addBox(180, 2, 30, 220, 41, 160, 0x222222, '#00ffaa'); 
    addBox(180, 2, 30, 220, 41, -160, 0x222222, '#00ffaa'); 
    addBox(60, 80, 60, 220, 40, 280, 0x330000, '#ff0000'); 
    addBox(60, 80, 60, 220, 40, -280, 0x330000, '#ff0000'); 
    
    addRamp(20, 2, 80, 250, 20, 160, 0, -Math.PI/5, 0x111111, '#ff5500');
    addRamp(20, 2, 80, 250, 20, -160, 0, -Math.PI/5, 0x111111, '#ff5500');
    
    addBox(60, 25, 60, 300, 12.5, 180, 0x111111, '#ff00ff');
    addBox(60, 25, 60, 300, 12.5, -180, 0x111111, '#ff00ff');

    // Blue Fortress
    addBox(240, 60, 240, -450, 30, 0, 0x111133, '#0000ff'); 
    addBox(80, 140, 80, -520, 70, 0, 0x000044, '#0000ff');  
    addRamp(40, 2, 100, -310, 30, 60, 0, Math.PI/6, 0x222222, '#0000ff'); 
    addRamp(40, 2, 100, -310, 30, -60, 0, Math.PI/6, 0x222222, '#0000ff'); 
    
    addBox(200, 40, 30, -220, 20, 160, 0x000022, '#0000ff'); 
    addBox(200, 40, 30, -220, 20, -160, 0x000022, '#0000ff'); 
    addBox(40, 40, 30, -220, 20, 0, 0x000022, '#0000ff'); 
    addBox(120, 10, 30, -220, 45, 0, 0x000022, '#0000ff'); 
    
    addBox(180, 2, 30, -220, 41, 160, 0x222222, '#00ffaa'); 
    addBox(180, 2, 30, -220, 41, -160, 0x222222, '#00ffaa'); 
    addBox(60, 80, 60, -220, 40, 280, 0x000033, '#0000ff'); 
    addBox(60, 80, 60, -220, 40, -280, 0x000033, '#0000ff'); 
    
    addRamp(20, 2, 80, -250, 20, 160, 0, Math.PI/5, 0x111111, '#0055ff');
    addRamp(20, 2, 80, -250, 20, -160, 0, Math.PI/5, 0x111111, '#0055ff');

    addBox(60, 25, 60, -300, 12.5, 180, 0x111111, '#ff00ff');
    addBox(60, 25, 60, -300, 12.5, -180, 0x111111, '#ff00ff');

    // Central Spire
    addBox(140, 80, 140, 0, 40, 0, 0x111111, '#ffffff'); 
    addRamp(60, 2, 160, 110, 40, 0, 0, -Math.PI/6, 0x222222, '#ffff00'); 
    addRamp(60, 2, 160, -110, 40, 0, 0, Math.PI/6, 0x222222, '#ffff00'); 
    addRamp(60, 2, 160, 0, 40, 110, -Math.PI/6, 0, 0x222222, '#ffff00');  
    addRamp(60, 2, 160, 0, 40, -110, Math.PI/6, 0, 0x222222, '#ffff00');   
    
    addBox(120, 15, 120, 0, 7.5, 250, 0x222222, '#ffff00'); 
    addBox(120, 15, 120, 0, 7.5, -250, 0x222222, '#ffff00'); 
    addBox(60, 40, 60, 0, 20, 250, 0x1a1a1a, '#ffffff');
    addBox(60, 40, 60, 0, 20, -250, 0x1a1a1a, '#ffffff');
}

function buildMapCTF() {
    buildMapTDM();
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
}

function buildMapKOTH() {
    addBox(80, 20, 80, 0, 10, 0, 0x222211, '#ffff00');
    addRamp(30, 2, 40, 0, 10, 60, -Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 0, 10, -60, Math.PI/6, 0, 0x222222, '#ffff00');
    addRamp(30, 2, 40, 60, 10, 0, 0, -Math.PI/6, 0x222222, '#ffff00');
    addRamp(30, 2, 40, -60, 10, 0, 0, Math.PI/6, 0x222222, '#ffff00');
    
    const s = 100;
    addBox(20, 10, 20, s, 5, s, 0x111111, '#00ffff');
    addBox(20, 10, 20, -s, 5, s, 0x111111, '#00ffff');
    addBox(20, 10, 20, s, 5, -s, 0x111111, '#00ffff');
    addBox(20, 10, 20, -s, 5, -s, 0x111111, '#00ffff');
}

function buildMapGunGame() {
    for(let i=0; i<30; i++) {
        const x = (Math.random() - 0.5) * 200; 
        const z = (Math.random() - 0.5) * 200;
        const w = 5 + Math.random() * 20; 
        const h = 20 + Math.random() * 20;
        addBox(w, h, 5, x, h/2, z, 0x111111, '#ff00ff');
    }
    addBox(200, 2, 10, 0, 30, 0, 0x111111, '#00f3ff');
    addBox(10, 2, 200, 0, 30, 0, 0x111111, '#00f3ff');
}

function buildMapZombies() {
    addBox(60, 40, 60, 0, 20, 0, 0x050505, '#00ff00');
    addRamp(20, 2, 60, 0, 20, 60, -Math.PI/5, 0, 0x111111, '#555555');
    addRamp(20, 2, 60, 0, 20, -60, Math.PI/5, 0, 0x111111, '#555555');
    
    for(let i=0; i<40; i++) {
        const x = (Math.random() - 0.5) * 250; 
        const z = (Math.random() - 0.5) * 250;
        if (Math.abs(x) < 50 && Math.abs(z) < 50) continue;
        addBox(10, 10, 10, x, 5, z, 0x1a1a1a, '#115511');
    }
}

function addBox(w, h, d, x, y, z, color, glow) {
    const shape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)); 
    const body = new CANNON.Body({ mass: 0, material: physicsMaterial }); 
    body.addShape(shape); 
    body.position.set(x, y, z); 
    world.addBody(body);

    const geo = new THREE.BoxGeometry(w, h, d); 
    const tex = createNeonGridTexture(color, glow); 
    tex.repeat.set(Math.max(1, w/10), Math.max(1, h/10));
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: color, emissiveIntensity: 0.5 }); 
    const mesh = new THREE.Mesh(geo, mat); 
    mesh.position.set(x, y, z); 
    mesh.castShadow = true; 
    mesh.receiveShadow = true; 
    scene.add(mesh); 
    mapMeshes.push(mesh); 
    mapBodies.push(body);
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
    renderer.setSize( window.innerWidth, window.innerHeight ); 
    composer.setSize( window.innerWidth, window.innerHeight ); 
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
    const isActive = (controls && controls.isLocked === true) || isMobileDeploy;

    if ( isActive && myHp > 0 ) {
        if (jumpAntiGravityTimer > 0) { 
            jumpAntiGravityTimer -= 1/60; 
            playerBody.force.y += playerBody.mass * 55; 
        }
        world.step(1/60); 
        updateGamepads();
        
        let isGrounded = false;
        if (playerBody.position.y <= 1.6) isGrounded = true;
        else { 
            downRay.set(playerBody.position, downVector); 
            downRay.far = 1.7; 
            if (downRay.intersectObjects(mapMeshes).length > 0) isGrounded = true; 
        }
        if (isGrounded && jumpAntiGravityTimer <= 0) myJumpsLeft = myJumps;

        if (isWallRunning && !isGrounded) {
            wallRight.set(1,0,0).applyQuaternion(camera.quaternion).normalize(); 
            wallLeft.set(-1,0,0).applyQuaternion(camera.quaternion).normalize();
            wallPos.copy(playerBody.position); 
            wallPos.y -= 1; 
            wallRayR.set(wallPos, wallRight); wallRayR.far = 3; 
            wallRayL.set(wallPos, wallLeft); wallRayL.far = 3;
            if (wallRayR.intersectObjects(mapMeshes).length > 0 || wallRayL.intersectObjects(mapMeshes).length > 0) { 
                playerBody.velocity.y = 0; 
                myJumpsLeft = myJumps; 
            }
        }

        if (playerBody.position.y < -10) die();
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
        
        if (inputDir.lengthSq() > 0) {
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
            }
        } else if (isCrouching && isGrounded) {
            playerBody.velocity.x = 0; 
            playerBody.velocity.z = 0;
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
                if (myGun === 'katana') {
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

        // Bullet Tracers (Supersonic High-Velocity)
        for(let i=activeBullets.length-1; i>=0; i--) {
            const b = activeBullets[i]; 
            const dist = b.start.distanceTo(b.end); 
            const speed = b.speed || 35;
            const step = dist > 0.001 ? speed / dist : 1.0; 
            b.progress += step;
            if (b.progress >= 1.0) { 
                scene.remove(b.mesh); 
                activeBullets.splice(i, 1); 
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
    composer.render();
}

// Start
init();
