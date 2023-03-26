const mapImage = new Image();
mapImage.src = "/snowy-sheet.png";

const santaImage = new Image();
santaImage.src = "/santa.png";

const speakerImage = new Image();
speakerImage.src = "/speaker.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io();

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const localTracks = {
  audioTrack: null,
};

const remoteUsers = {};

let isPlaying = true;

const muteButton = document.getElementById("mute");

muteButton.addEventListener("click", () => {
  if (isPlaying) {
    localTracks.audioTrack.setEnabled(false);
    muteButton.innerText = "unmute";
    socket.emit("mute", true);
  } else {
    localTracks.audioTrack.setEnabled(true);
    muteButton.innerText = "mute";
    socket.emit("mute", false);
  }
  isPlaying = !isPlaying;
});

const options = {
  appid: '6cb0935ce7c64a98a732ca5e8fc2336c',
  channel: 'game',
  uid: null,
  token: null
};

async function subscribe(user, mediaType) {
  await client.subscribe(user, mediaType);
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  console.log('unsubs');
  delete remoteUsers[id];
}

async function join() {
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  [ options.uid, localTracks.audioTrack] = await Promise.all([
    client.join(options.appid, options.channel, options.token || null),
    AgoraRTC.createMicrophoneAudioTrack(),
  ]);

  await client.publish(Object.values(localTracks));
  console.log("publish success");
}

join();

let map = [[]];
let players = [];

const TILE_SIZE = 16;

socket.on("connect", () => {
    console.log("connected");
});

socket.on("map", (loadedMap) => {
    map = loadedMap;
});

socket.on("players", (serverPlayers) => {
   players = serverPlayers;
 });
 
 const inputs = {
   up: false,
   down: false,
   left: false,
   right: false,
 };
 
 window.addEventListener("keydown", (e) => {
   if (e.key === "w") {
     inputs["up"] = true;
   } else if (e.key === "s") {
     inputs["down"] = true;
   } else if (e.key === "d") {
     inputs["right"] = true;
   } else if (e.key === "a") {
     inputs["left"] = true;
   }
   socket.emit("inputs", inputs);
 });
 
 window.addEventListener("keyup", (e) => {
   if (e.key === "w") {
     inputs["up"] = false;
   } else if (e.key === "s") {
     inputs["down"] = false;
   } else if (e.key === "d") {
     inputs["right"] = false;
   } else if (e.key === "a") {
     inputs["left"] = false;
   }
   socket.emit("inputs", inputs);
 });

function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const myPlayer = players.find((player) => player.id === socket.id);
    let cameraX = 0;
    let cameraY = 0;
    if(myPlayer) {
      cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
      cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
    };

    const TILES_IN_ROW = 8;

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[0].length; col++) {
            const { id } = map[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE - cameraX,
                row * TILE_SIZE - cameraY,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }

      for (const player of players) {
      canvas.drawImage(santaImage, player.x - cameraX, player.y - cameraY,
        santaImage.width * 2,
        santaImage.height * 2);
      if (!player.muted) {
        canvas.drawImage(speakerImage,
          player.x - cameraX + 5,
          player.y - cameraY - 28
          );
        }
  }

    window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);