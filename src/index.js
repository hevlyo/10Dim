const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

const loadmap = require('./mapLoader');

async function main() {
    const map2D = await loadmap();

    io.on("connection", (socket) => {
        console.log("user connected", socket.id);

        socket.emit("map", map2D);
    });

    app.use(express.static("public"));

    httpServer.listen(5000);
}

main();
