const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

const PORT = process.env.PORT || 4000;

const loadMap = require('./mapLoader');

const SPEED = 5;
const TICK_RATE = 60;

let players = [];
const inputsMap = {};

function tick() {
    for (const player of players) {
        const inputs = inputsMap[player.id];
        if (inputs.up) {
            player.y -= SPEED;
        } else if (inputs.down) {
            player.y += SPEED; 
        }

        if (inputs.left) {
            player.x -= SPEED;
        } else if (inputs.right) {
            player.x += SPEED;
        }
    }

    io.emit("players", players);
}

async function main() {
    const map2D = await loadMap();

    io.on("connection", (socket) => {
        console.log("user connected", socket.id);

        inputsMap[socket.id] = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        players.push({
            id: socket.id,
            voiceId: Math.floor(Math.random() * 1000000),
            x: 800,
            y: 800,
        });
        
        socket.emit("map", map2D);

        socket.on('inputs', (inputs) => {
            inputsMap[socket.id] = inputs;
        });

        socket.on("mute", (isMuted) => {
            const player = players.find((player) => player.id === socket.id);
            player.muted = isMuted;
        })
        
        socket.on('disconnect', () => {
            players = players.filter(player => player.id != socket.id);
        });
    });

    app.use(express.static("public"));

    httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    setInterval(tick, 1000 / TICK_RATE);
}

main();
