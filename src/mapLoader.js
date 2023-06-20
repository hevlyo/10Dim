const tmx = require("tmx-parser");
const util = require("util");
const parseFile = util.promisify(tmx.parseFile);

async function loadMap() {
  const map = await parseFile("./src/map.tmx");
  const layer = map.layers[0];
  const map2D = [];

  for (let row = 0; row < map.height; row++) {
    const tileRow = [];
    for (let col = 0; col < map.width; col++) {
      const tileIndex = row * map.width + col;
      const tile = layer.tiles[tileIndex];
      tileRow.push({ id: tile.id, gid: tile.gid });
    }
    map2D.push(tileRow);
  }

  return map2D;
}

module.exports = {
  loadMap,
};
