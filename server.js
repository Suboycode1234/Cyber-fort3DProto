const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Serve the standalone HTML file directly when hitting root
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/FortniteLite_Standalone.html');
});

const players = {};

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);
    
    socket.on('init', (data) => {
        players[socket.id] = { id: socket.id, username: data.username, pos: {x:0, y:80, z:0}, rot: {x:0,y:0,z:0,w:1}, isCrouching: false, gun: 'default' };
        
        // Tell this player about everyone else
        for(const id in players) {
            if(id !== socket.id) {
                socket.emit('player_joined', { id: id, username: players[id].username });
            }
        }
        
        // Tell everyone else about this player
        socket.broadcast.emit('player_joined', { id: socket.id, username: data.username });
        console.log(`Player initialized: ${data.username} (${socket.id})`);
    });

    socket.on('pos', (data) => {
        if(players[socket.id]) {
            players[socket.id].pos = data.pos;
            players[socket.id].rot = data.rot;
            players[socket.id].isCrouching = data.isCrouching;
            players[socket.id].gun = data.gun;
            socket.broadcast.emit('player_pos', { id: socket.id, ...data });
        }
    });

    socket.on('gun_switch', (data) => {
        if(players[socket.id]) {
            players[socket.id].gun = data.gun;
            socket.broadcast.emit('player_gun', { id: socket.id, gun: data.gun });
        }
    });

    socket.on('hit', (data) => {
        // data should be { target: socketId, damage: amount }
        console.log(`Hit! ${socket.id} hit ${data.target} for ${data.damage}`);
        socket.to(data.target).emit('hit_registered', { source: socket.id, damage: data.damage });
    });

    socket.on('vip_status', () => {
        socket.broadcast.emit('player_vip', { id: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('player_left', { id: socket.id });
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
