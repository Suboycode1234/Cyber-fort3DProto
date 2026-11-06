const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets from public directory and project root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Default route serves the main game
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Standalone route
app.get('/standalone', (req, res) => {
    res.sendFile(path.join(__dirname, 'FortniteLite_Standalone.html'));
});

// --- PUBLIC SERVER BROWSER / LOBBY DISCOVERY ENDPOINTS ---
// Stores public rooms in memory; automatically pruned after 20s of inactivity
const activeLobbies = new Map();

// Get list of active public lobbies
app.get('/api/lobbies', (req, res) => {
    const now = Date.now();
    const list = [];
    for (const [code, lobby] of activeLobbies.entries()) {
        if (now - lobby.lastPing < 20000) {
            list.push(lobby);
        } else {
            activeLobbies.delete(code);
        }
    }
    res.json(list);
});

// Host registers or heartbeats a public lobby
app.post('/api/lobbies', (req, res) => {
    const { roomCode, hostPeerId, hostName, gamemode, players } = req.body;
    if (!roomCode || !hostPeerId) {
        return res.status(400).json({ error: 'Missing roomCode or hostPeerId' });
    }
    const cleanCode = roomCode.toUpperCase();
    activeLobbies.set(cleanCode, {
        roomCode: cleanCode,
        hostPeerId,
        hostName: (hostName || 'Host').substring(0, 14),
        gamemode: gamemode || 'FFA',
        players: Math.min(8, Math.max(1, parseInt(players) || 1)),
        maxPlayers: 8,
        lastPing: Date.now()
    });
    res.json({ success: true, activeCount: activeLobbies.size });
});

// Remove a lobby (when host closes match or leaves)
app.delete('/api/lobbies/:roomCode', (req, res) => {
    const code = req.params.roomCode.toUpperCase();
    activeLobbies.delete(code);
    res.json({ success: true });
});

// Periodic lobby prune
setInterval(() => {
    const now = Date.now();
    for (const [code, lobby] of activeLobbies.entries()) {
        if (now - lobby.lastPing > 20000) {
            activeLobbies.delete(code);
        }
    }
}, 10000);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), activeLobbies: activeLobbies.size });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cyber-Fort 3D Server running on http://localhost:${PORT}`);
});
