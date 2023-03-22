const express = require ("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

io.on("connection", (socket) => {
    console.log("user connected", socket.id);
});

app.use(express.static("public"));
httpServer.listen(5000);