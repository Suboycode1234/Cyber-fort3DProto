const express = require('express');
const http = require('http');
const { kv } = require('@vercel/kv'); // Works natively on Vercel
const crypto = require('crypto');     // For basic password hashing

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Serve the standalone HTML file directly when hitting root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/FortniteLite_Standalone.html');
});

// Serve static files from main dir
app.use(express.static(__dirname));

// --- LOBBY TRACKER ---
let activeLobbies = {};

// Clean up dead lobbies every 15 seconds
setInterval(() => {
    const now = Date.now();
    for (const hostId in activeLobbies) {
        if (now - activeLobbies[hostId].lastPing > 30000) { // 30 seconds without ping = dead
            delete activeLobbies[hostId];
        }
    }
}, 15000);

// Fetch all public lobbies
app.get('/api/lobbies', (req, res) => {
    res.json(Object.values(activeLobbies));
});

// Create or Ping a lobby (Host calls this every 10 seconds)
app.post('/api/lobbies', (req, res) => {
    const { hostId, hostName, gamemode, players } = req.body;
    if (!hostId) return res.status(400).json({error: 'Missing hostId'});
    
    activeLobbies[hostId] = {
        hostId,
        hostName: hostName || 'Unknown Host',
        gamemode: gamemode || 'FFA',
        players: players || 1,
        lastPing: Date.now()
    };
    
    res.json({success: true});
});

// --- AUTHENTICATION & PROFILE SYSTEM (VERCEL KV) ---

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const userKey = `user:${username}`;
        const existing = await kv.exists(userKey);
        
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const hashedPassword = hashPassword(password);
        await kv.hset(userKey, {
            password: hashedPassword,
            coins: 0,
            kills: 0,
            deaths: 0,
            weapons: JSON.stringify(['default'])
        });

        res.json({ success: true, message: 'Registration successful' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const userKey = `user:${username}`;
        const user = await kv.hgetall(userKey);

        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        if (user.password !== hashPassword(password)) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const profileData = {
            coins: parseInt(user.coins) || 0,
            kills: parseInt(user.kills) || 0,
            deaths: parseInt(user.deaths) || 0,
            weapons: typeof user.weapons === 'string' ? JSON.parse(user.weapons) : (user.weapons || ['default'])
        };

        res.json({ success: true, profile: profileData });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/profile', async (req, res) => {
    try {
        const { username, password, profile } = req.body;
        if (!username || !password || !profile) return res.status(400).json({ error: 'Missing parameters' });

        const userKey = `user:${username}`;
        const user = await kv.hgetall(userKey);

        if (!user || user.password !== hashPassword(password)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await kv.hset(userKey, {
            coins: profile.coins,
            kills: profile.kills,
            deaths: profile.deaths,
            weapons: JSON.stringify(profile.weapons)
        });

        res.json({ success: true, message: 'Profile updated' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
