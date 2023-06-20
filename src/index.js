const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mapLoader = require("./mapLoader");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 4000;
const SPEED = 5;
const TICK_RATE = 1000 / 60; // 60 ticks per second

let players = [];
const inputsMap = {};

function tick() {
  for (const player of players) {
    const inputs = inputsMap[player.id];
    player.x += (inputs.right ? SPEED : 0) - (inputs.left ? SPEED : 0);
    player.y += (inputs.down ? SPEED : 0) - (inputs.up ? SPEED : 0);
  }

  io.emit("players", players);
}

async function main() {
  const map2D = await mapLoader.loadMap();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

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

    socket.on("inputs", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("mute", (isMuted) => {
      const player = players.find((player) => player.id === socket.id);
      if (player) {
        player.muted = isMuted;
      }
    });

    socket.on("disconnect", () => {
      players = players.filter((player) => player.id !== socket.id);
      delete inputsMap[socket.id];
    });
  });

  app.use(express.static("public"));

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  setInterval(tick, TICK_RATE);
}

main();
