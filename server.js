require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const crypto = require('crypto');
const { initializeApp } = require("firebase/app");
const { getDatabase, ref, get, set, update } = require("firebase/database");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2YF8CJafsb5yHe8F6RkXpAq_LuOhBfh8",
  authDomain: "backend-for-cyber-fort-3d.firebaseapp.com",
  databaseURL: "https://backend-for-cyber-fort-3d-default-rtdb.firebaseio.com",
  projectId: "backend-for-cyber-fort-3d",
  storageBucket: "backend-for-cyber-fort-3d.firebasestorage.app",
  messagingSenderId: "51625140353",
  appId: "1:51625140353:web:c53d1f02edd72908d9ed80",
  measurementId: "G-YB61X93J2E"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the standalone HTML file directly when hitting root
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/FortniteLite_Standalone.html');
});

// --- AUTHENTICATION & PROFILE SYSTEM (FIREBASE REALTIME DB) ---

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/api/register', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const userRef = ref(db, 'users/' + username);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const hashedPassword = hashPassword(password);
        await set(userRef, {
            hashedPassword,
            coins: 0,
            kills: 0,
            deaths: 0,
            weapons: ['default']
        });

        res.json({ success: true, message: 'Registration successful' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const userRef = ref(db, 'users/' + username);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const userData = snapshot.val();
        if (userData.hashedPassword !== hashPassword(password)) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const profileData = {
            coins: userData.coins || 0,
            kills: userData.kills || 0,
            deaths: userData.deaths || 0,
            weapons: userData.weapons || ['default']
        };

        res.json({ success: true, profile: profileData });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/profile', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    try {
        const { username, password, profile } = req.body;
        if (!username || !password || !profile) return res.status(400).json({ error: 'Missing parameters' });

        const userRef = ref(db, 'users/' + username);
        const snapshot = await get(userRef);

        if (!snapshot.exists() || snapshot.val().hashedPassword !== hashPassword(password)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await update(userRef, {
            coins: profile.coins,
            kills: profile.kills,
            deaths: profile.deaths,
            weapons: profile.weapons
        });

        res.json({ success: true, message: 'Profile updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- SOCKET.IO LOBBY AND REALTIME SYSTEM ---
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

let activeLobbies = {};

// Fetch lobbies for HTTP client
app.get('/api/lobbies', (req, res) => {
    res.json(Object.values(activeLobbies));
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Send assigned socket ID to the client
    socket.emit('welcome', { id: socket.id });

    // Client requests to host a lobby
    socket.on('host_lobby', (data) => {
        const { hostName, gamemode, players } = data;
        const hostId = socket.id;
        
        activeLobbies[hostId] = {
            hostId,
            hostName: hostName || 'Unknown Host',
            gamemode: gamemode || 'FFA',
            players: players || 1,
            lastPing: Date.now()
        };
        
        socket.join(hostId); // Host joins their own room
        console.log(`Lobby created by ${hostId}`);
    });

    // Client requests to update lobby info
    socket.on('ping_lobby', (data) => {
        if (activeLobbies[socket.id]) {
            activeLobbies[socket.id].players = data.players || activeLobbies[socket.id].players;
            activeLobbies[socket.id].lastPing = Date.now();
        }
    });

    // Client requests to join a lobby (room)
    socket.on('join_lobby', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined lobby ${roomId}`);
        // Notify host that someone connected
        socket.to(roomId).emit('peer_connected', { peerId: socket.id });
    });

    // Client relays a message to the room
    socket.on('relay', (msg) => {
        if (msg.roomId) {
            // Forward to everyone in the room except sender
            socket.to(msg.roomId).emit('relay_message', { senderId: socket.id, data: msg.data });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Clean up if this was a host
        if (activeLobbies[socket.id]) {
            delete activeLobbies[socket.id];
            // Tell everyone in room the host disconnected
            socket.to(socket.id).emit('host_disconnected');
        }
    });
});

// Clean up dead lobbies every 15 seconds
setInterval(() => {
    const now = Date.now();
    for (const hostId in activeLobbies) {
        if (now - activeLobbies[hostId].lastPing > 30000) {
            delete activeLobbies[hostId];
        }
    }
}, 15000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
