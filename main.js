class Game {
  constructor() {
    this.map = new Map(this);
    this.map.build();
    this.turn = 0;
    this.player = new Creature(this, 0, 50, -20);
  }

  pX() {
    return this.player.x;
  }

  pY() {
    return this.player.y;
  }

  pZ() {
    return this.player.z;
  }

  advanceGameState() {
    this.turn++;
  }

  movePlayer(direction) {
    return this.player.move(direction);
  }

}

class GameObject {
  constructor(game, z, y, x) {
    this.blocksLight = false;
    this.blocksMovement = false;

    this.game = game;
    this.z = z;
    this.y = y;
    this.x = x;
    this.game.map.placeObject(this, z, y, x);
  }

}

/*class Torch extends GameObject {
  constructor(game, z, y, x) {
    GameObject.call(this, game);
    this.type = OBJ_TORCH;
    this.name = 'Torch';
  }
}*/

class Door extends GameObject {
  constructor(game, z, y, x) {
    super(game, z, y, x);
    this._open = false;
    this.type = OBJ_WOOD_DOOR;
    this.name = 'Door';
    this.isDoor = true;
    this.update();
  }

  isOpen() {
    return this._open;
  }

  open() {
    this._open = !this._open;
    this.update();
  }

  update() {
    this.blocksLight = !this.isOpen();
    this.blocksMovement = !this.isOpen();

    this.game.map.playerFovUpToDate = false;
    this.game.map.illuminationUpToDate = false;
  }
}

class Creature extends GameObject {
  constructor(game, z, y, x) {
    super(game, z, y, x);
    this.type = OBJ_PLAYER;
    this.isPlayer = true;
  }

  canMoveInDirection(direction) {

    let dx, dy, dz;

    if (Number.isInteger(direction)) {
      dx = DIRECTIONS[direction][0];
      dy = DIRECTIONS[direction][1];
      dz = DIRECTIONS[direction][2];
    } else {
      dz = direction[0];
      dy = direction[1];
      dx = direction[2];
    }

    let newX = dx + this.x;
    let newY = dy + this.y;
    let newZ = dz + this.z;

    if (newZ > this.z && blocksMovementFromBelow(this.game.map.getSpace(newZ, newY, newX))) {
      return false;
    }

    if (newZ < this.z && blocksMovementFromBelow(this.game.map.getSpace(this.z, newY, newX))) {
      return false;
    }

    if (this.game.map.blocksMovementAt(newZ, newY, newX)) {
      return false;
    }

    return true;
  }

  move(direction) {

    let dx, dy, dz;

    if (Number.isInteger(direction)) {
      dx = DIRECTIONS[direction][0];
      dy = DIRECTIONS[direction][1];
      dz = DIRECTIONS[direction][2];
    } else {
      dx = direction[2];
      dy = direction[1];
      dz = direction[0];
    }

    let newX = dx + this.x;
    let newY = dy + this.y;
    let newZ = dz + this.z;

    if (!this.canMoveInDirection(direction)) {
      return false
    }

    this.game.map.placeObject(this, newZ, newY, newX);
    if (this.isPlayer) {
      this.game.map.playerFovUpToDate = false;
    }

    return true;
  }

  open(object) {
    if (!object.isDoor) {
      return false;
    }

    object.open();
    return true;
  }

}

class Map {
  constructor(game) {
    this.game = game;
    this.layers = [];
    this.layersBelow = [];
    this.layers[0] = new Layer(this, 0);

    this.objects = {}; //map of 'z,y,x' to []

    this.illumination = {}; //map of 'z,y,x' to CONST
    this.illuminationUpToDate = false;

    this.playerFov = {}; //map of 'z,y,x' to boolean
    this.playerFovUpToDate = false;

    for (let z = -1; z > -10; z--) {
      this.layersBelow[-1*(z+1)] = new Layer(this, z);
    }
    for (let z = 1; z < 10; z++) {
      this.layers[z] = new Layer(this, z);
    }
  }

  build() {
    let canalAttemptCount = 0;
    while (canalAttemptCount < 20) {
      this.placeCanal();
      canalAttemptCount++;
    }

    let buildingAttemptCount = 0;
    while (buildingAttemptCount < 100) {
      this.placeBuilding();
      buildingAttemptCount++;
    }

    let lampAttemptCount = 0;
    while (lampAttemptCount < 30) {
      this.placeLamp();
      lampAttemptCount++;
    }
  }

  placeBuilding() {
    let topEdge = getRandomIntInclusive(0, 90);
    let leftEdge = getRandomIntInclusive(0, 90);
    let width = getRandomIntInclusive(5, 9);
    for (let j = topEdge; j < topEdge + width; j++) {
      for (let i = leftEdge; i < leftEdge + width; i++) {
        let space = this.getLayer(0).spaces[j][i];
        if (space.building) {
          return false;
        }
      }
    }
    let floors = getRandomIntInclusive(1, 4);
    for (let j = topEdge; j < topEdge + width; j++) {
      for (let i = leftEdge; i < leftEdge + width; i++) {
        for (let k = 0; k < floors; k++) {
          this.getLayer(k).spaces[j][i] = {
            building: true,
            terrain: STONE_WALL
          }
        }
        this.getLayer(floors).spaces[j][i] = {
          building: true,
          terrain: SHINGLES
        }
      }
    }

    for (let j = topEdge + 1; j < topEdge + width - 1; j++) {
      for (let i = leftEdge + 1; i < leftEdge + width - 1; i++) {
        for (let k = 0; k < floors; k++) {
          this.getLayer(k).spaces[j][i] = {
            building: true,
            terrain: WOOD_FLOOR
          }
        }
      }
    }

    let doorY, doorX;
    switch(_.sample([NORTH, SOUTH, EAST, WEST])) {
      case NORTH:
        doorY = topEdge;
        doorX = leftEdge + getRandomIntInclusive(1, width - 2);
        break;
      case SOUTH:
        doorY = topEdge + width - 1;
        doorX = leftEdge + getRandomIntInclusive(1, width - 2);
        break;
      case WEST:
        doorY = topEdge + getRandomIntInclusive(1, width - 2);
        doorX = leftEdge;
        break;
      case EAST:
        doorY = topEdge + getRandomIntInclusive(1, width - 2);
        doorX = leftEdge + width - 1;
        break;
    }

    this.getLayer(0).spaces[doorY][doorX] = {
      building: true,
      terrain: WOOD_FLOOR
    }
    new Door(this.game, 0, doorY, doorX);
  }

  placeCanal() {
    let topEdge = getRandomIntInclusive(20, 80);
    let leftEdge = getRandomIntInclusive(20, 80);
    let width = getRandomIntInclusive(2, 4);
    let length = getRandomIntInclusive(8, 20);
    let depth = getRandomIntInclusive(1, 2);
    if (getRandomIntInclusive(1, 2) == 1) {
      //vertical
      for (let j = topEdge; j < topEdge + length; j++) {
        for (let i = leftEdge; i < leftEdge + width; i++) {
          let space = this.getLayer(0).spaces[j][i];
          if (space.building) {
            return false;
          }
        }
      }

      for (let j = topEdge; j < topEdge + length; j++) {
        for (let i = leftEdge; i < leftEdge + width; i++) {
          for (let k = 0; k < depth; k++) {
            this.getLayer(-1*k).spaces[j][i] = {
              building: true,
              terrain: NOTHING
            }
          }
          this.getLayer(-1*depth).spaces[j][i] = {
            building: true,
            terrain: WATER
          }
        }
      }
    }
  }

  updateIllumination() {
    this.illuminationUpToDate = true;
    console.log('updating illumination...');
    this.illumination = {};
    this.layersBelow.forEach(l => l.updateIllumination());
    this.layers.forEach(l => l.updateIllumination());
    console.log('all illumination updated');
  }

  getIlluminationAt(z, y, x) {
    if (!this.illuminationUpToDate) {
      this.updateIllumination();
    }
    let key = `${z},${y},${x}`;
    return this.illumination[key] || LIGHT_NONE;
  }

  updatePlayerFov() {
    this.playerFovUpToDate = true;
    console.log('updating player FOV...');
    this.playerFov = {};
    this.layersBelow.forEach(l => l.updatePlayerFov());
    this.layers.forEach(l => l.updatePlayerFov());
    console.log('player FOV updated');
  }

  getPlayerFovAt(z, y, x) {
    if (!this.playerFovUpToDate) {
      this.updatePlayerFov();
    }
    let key = `${z},${y},${x}`;
    return this.playerFov[key] || false;
  }

  getObjects() {
    let all = [];
    Object.values(this.objects).forEach(o => {
      all = all.concat(o);
    });
    return all;
  }

  getObjectsAt(z, y, x) {
    let key = `${z},${y},${x}`;
    let stuff = this.objects[key] || [];
    return stuff.sort((a, b) => a.type - b.type);
  }

  placeObject(object, z, y, x) {
    if (object.z !== undefined && object.y !== undefined && object.x !== undefined) {
      let oldKey = `${object.z},${object.y},${object.x}`;
      _.pull(this.objects[oldKey], object);
    }
    object.z = z;
    object.y = y;
    object.x = x;
    let newKey = `${object.z},${object.y},${object.x}`;
    if (this.objects[newKey] === undefined) {
      this.objects[newKey] = [];
    }
    this.objects[newKey].push(object);
    // remove object from old place in objects map
    // set the z,y,x for properties to the new location
    // put the object in the new place in objects map
  }

  placeLamp() {
    let x = getRandomIntInclusive(0, 99);
    let y = getRandomIntInclusive(0, 99);
    let space = this.getLayer(0).spaces[y][x];
    if (space.building) {
      return false;
    }
    space.building = true;
    let lamp = {
      type: OBJ_TORCH,
      dimLightRange: 10,
      brightLightRange: 5
    };
    this.placeObject(lamp, 0, y, x);
    return true;
  }

  getLayer(z) {
    if (z >= 0) {
      return this.layers[z];
    }
    return this.layersBelow[-1*(z+1)];
  }

  getSpace(z, y, x) {
    if (z >= this.layers.length) {
      return NOTHING;
    }
    if (z <= -1*this.layersBelow.length) {
      return SOLID_EARTH;
    }
    return this.getLayer(z).getSpace(y, x);
  }

  blocksLightAt(z, y, x) {
    if (_.some(this.getObjectsAt(z, y, x), o => o.blocksLight)) {
      return true;
    }
    let space = this.getSpace(z, y, x);
    switch (space) {
      case GRASS:
      case COBBLESTONES:
      case WATER:
      case SHINGLES:
      case WOOD_FLOOR:
      case STONE_FLOOR:
        return false;
      case STONE_WALL:
      case SOLID_EARTH:
        return true;
    }
    return false;
  }

  blocksLightFromBelowAt(z, y, x) {
    if (_.some(this.getObjectsAt(z, y, x), o => o.blocksLight)) {
      return true;
    }
    let space = this.getSpace(z, y, x);
    switch (space) {
      case GRASS:
      case COBBLESTONES:
      case WATER:
      case SHINGLES:
      case WOOD_FLOOR:
      case STONE_FLOOR:
      case STONE_WALL:
      case SOLID_EARTH:
        return true;
    }
    return false;
  }

  blocksMovementAt(z, y, x) {
    if (_.some(this.getObjectsAt(z, y, x), o => o.blocksMovement)) {
      return true;
    }
    let space = this.getSpace(z, y, x);
    switch(space) {
      case GRASS:
      case COBBLESTONES:
      case WATER:
      case SHINGLES:
      case WOOD_FLOOR:
      case STONE_FLOOR:
        return false;
      case STONE_WALL:
      case SOLID_EARTH:
        return true;
    }
    return false;
  }

}

class Layer {
  constructor(map, z) {
    this.map = map;
    this.z = z;
    this.spaces = [];

    let def = COBBLESTONES;
    if (z > 0) {
      def = NOTHING;
    }
    if (z < 0) {
      def = SOLID_EARTH;
    }

    for (let j = 0; j < 100; j++) {
      this.spaces[j] = [];
      for (let i = 0; i < 100; i++) {
        this.spaces[j][i] = {
          building: false,
          terrain: def
        };
      }
    }
  }

  updateIllumination() {
    console.log('updating illumination at height ' + this.z);
    let fov = new ROT.FOV.RecursiveShadowcasting((x, y) => !this.map.blocksLightAt(this.z, y, x));


    this.map.getObjects().forEach(o => {

      if (o.z == this.z && (o.dimLightRange || o.brightLightRange)) {
        fov.compute(o.x, o.y, o.dimLightRange, (x, y, r, visibility) => {
          // r is radius, can use this to diffuse light up and down
          let light = LIGHT_DIM;//r == o.dimLightRange ? LIGHT_DIM_FLICKER : LIGHT_DIM;
          this.map.illumination[`${this.z},${y},${x}`] = Math.max(this.map.getIlluminationAt(this.z, y, x), light);
        });
        fov.compute(o.x, o.y, o.brightLightRange, (x, y, r, visibility) => {
          // r is radius, can use this to diffuse light up and down
          let light = LIGHT_BRIGHT;//r == o.brightLightRange ? LIGHT_BRIGHT_FLICKER : LIGHT_BRIGHT;
          this.map.illumination[`${this.z},${y},${x}`] = Math.max(this.map.getIlluminationAt(this.z, y, x), light);
        });
      }
    });
    console.log('updating illumination at height ' + this.z + ' DONE');
  }

  verticallyPropagateThroughSpace(z, y, x, yOffset, xOffset) {
    let d = [ xOffset, yOffset, 1 ];
    if (!this.map.blocksLightFromBelowAt(z + d[2], y + d[1], x + d[0])) {
      return true;
    }
    return false;
  }

  updatePlayerFov() {
    let fov = new ROT.FOV.RecursiveShadowcasting((x, y) => !this.map.blocksLightAt(this.z, y, x));
    let player = this.map.game.player;
    if (player.z == this.z) {
      fov.compute(player.x, player.y, 40, (x, y, r, visibility) => {

        let deltaX = unit(player.x - x);
        let deltaY = unit(player.y - y);

        for (let k = player.z; k < player.z + 10; k++) {
          this.map.playerFov[`${k},${y},${x}`] = true;
          if (!this.verticallyPropagateThroughSpace(k, y, x, deltaY, deltaX)) {
            break;
          }
        }

        for (let k = player.z; k > player.z - 10; k--) {
          this.map.playerFov[`${k},${y},${x}`] = true;
          if (!this.verticallyPropagateThroughSpace(k, y, x, deltaY, deltaX)) {
            break;
          }
        }

      });
    }
  }

  getSpace(y, x) {
    let outOfBounds = y < 0 || x < 0 || y >= this.spaces.length || x >= this.spaces[y].length;
    if (outOfBounds) {
      if (this.z > 0) {
        return NOTHING;
      } else if (this.z < 0) {
        return SOLID_EARTH;
      }
      return GRASS;
    }
    return this.spaces[y][x].terrain;
  }
}

let displayW = 69;
let displayH = 49;
let viewAngle = VIEW_ISO_NW;

let acceptingInput = false;

let game = new Game();

mapDisplay = new ROT.Display({
  width:displayW, height:displayH,
  layout:"rect", forceSquareRatio: false
});

displayForTerrain = function(terrainType) {
  switch(terrainType) {
    case GRASS:
      return {character: '"', color: 'lightgreen', background: 'green', catchLight: true};
    case COBBLESTONES:
      return {character: '.', color: 'white', background: 'black', catchLight: true};
    case SHINGLES:
      return {character: '=',
      color: 'white',//'black',
      background: 'grey',//'#703508',
      catchLight: true};
    case WOOD_FLOOR:
      return {character: '=', color: 'black', background: '#A0522D	', catchLight: true};
    case STONE_FLOOR:
      return {character: '.', color: 'white', background: 'grey	', catchLight: true};
    case STONE_WALL:
      return {character: '#', color: 'white', background: 'grey', catchLight: false};
    case WATER:
      return {character: percentChance(50) ? '~' : '', color: 'white', background: 'blue', catchLight: false};
    case SOLID_EARTH:
      return {character: '#', color: 'black', background: 'brown', catchLight: false};
    case NOTHING:
      return {character: '', color: 'black', background: 'black', catchLight: false};
  }
  return {character: '?', color: 'black', background: 'white'};
}

displayForObject = function(object) {
  switch(object.type) {
    case OBJ_TORCH:
      return {character: '*', color: _.sample(['red', 'yellow', 'orange'])};
    case OBJ_PLAYER:
      return {character: '@', color: 'white'};
    case OBJ_WOOD_DOOR:
      if (object.isOpen()) {
        return {character: ',', color: 'black'};
      }
      return {character: '#', color: 'black'};
  }
  return {character: '?', color: 'white'};
}

blocksMovementFromBelow = function(terrainType) {
  switch(terrainType) {
    case WATER:
      return false;
    case GRASS:
    case COBBLESTONES:
    case STONE_WALL:
    case SOLID_EARTH:
    case SHINGLES:
    case WOOD_FLOOR:
    case STONE_FLOOR:
      return true;
  }
  return false;
}

var keysDown = [];
var keydownHandler = {};
var keyupHandler = {};

let highlightedSpace = [game.pZ(), game.pY(), game.pX()];
let contextMenu = null;

class ContextMenu {
  constructor(display, game, z, y, x) {
    this.display = display;
    this.game = game;
    this.z = z;
    this.y = y;
    this.x = x;

    this.highlightedRow = 0;
    this.populateOptions();
  }

  sameSpaceAsPlayer() {
    return this.z == this.game.pZ() && this.y == this.game.pY() && this.x == this.game.pX();
  }

  adjacentToPlayer() {
    return Math.abs(this.z - this.game.pZ()) <= 1 && Math.abs(this.y - this.game.pY()) <= 1 && Math.abs(this.x - this.game.pX()) <= 1;
  }

  directionFromPlayer() {
    return [unit(this.z - this.game.pZ()), unit(this.y - this.game.pY()), unit(this.x - this.game.pX())];
  }

  changeSelection(direction) {
    this.highlightedRow += direction;
    if (this.highlightedRow >= this.options.length) {
      this.highlightedRow = 0;
    }
    if (this.highlightedRow < 0) {
      this.highlightedRow = this.options.length - 1;
    }
  }

  executeSelection() {
    this.options[this.highlightedRow].execute();
  }

  populateOptions() {
    this.options = [];
    let direction = this.directionFromPlayer();
    if (this.sameSpaceAsPlayer()) {
      this.options.push(new ContextMenuOption('Wait', this.game.player.wait));
    }

    if (this.adjacentToPlayer()) {
      if (this.game.player.canMoveInDirection(direction)) {
        this.options.push(new ContextMenuOption('Move', () => this.game.player.move(direction)));
      }
      if (this.game.player.canMoveInDirection(direction)) {
        this.options.push(new ContextMenuOption('Dash', () => this.game.player.move(direction)));
      }
    }

    if (this.sameSpaceAsPlayer() || this.adjacentToPlayer()) {
      this.game.map.getObjectsAt(this.z, this.y, this.x).filter(o => !o.isPlayer).forEach(object => {
        if (object.isDoor && object.isOpen()) {
          this.options.push(new ContextMenuOption(`Close the ${object.name}`, () => this.game.player.open(object)));
        }
        if (object.isDoor && !object.isOpen()) {
          this.options.push(new ContextMenuOption(`Open the ${object.name}`, () => this.game.player.open(object)));
        }
      });
    }

    if (this.options.length == 0) {
      this.options.push(new ContextMenuOption('-', () => true));
    }

  }

  draw() {
    let topEdge = this.game.pY() - (displayH - 1) / 2;
    let leftEdge = this.game.pX() - (displayW - 1) / 2;

    let y = this.y - topEdge;
    let x = this.x - leftEdge;

    for (let j = 0; j < this.options.length; j++) {
      let color = j == this.highlightedRow ? '%c{yellow}' : '%c{white}';
      mapDisplay.drawText(x + 1, y + j, color + this.options[j].getText());
    }
  }

}

class ContextMenuOption {
  constructor(text, fn) {
    this.text = text;
    this.fn = fn;
  }

  getText() {
    return this.text;
  }

  execute() {
    return this.fn();
  }
}

endPlayerTurn = function() {
  game.advanceGameState();
  drawAll(false);
}

selectDirection =  function(direction) {
  if (keysDown[KEY_CTRL]) {
    let newX = DIRECTIONS[direction][0] + game.pX();
    let newY = DIRECTIONS[direction][1] + game.pY();
    let newZ = DIRECTIONS[direction][2] + game.pZ();
    openContextMenu(newZ, newY, newX);
    return true;
  } else {
    return move(direction);
  }
}

move =  function(direction) {
  let moved = game.movePlayer(direction);
  if (moved) {
    endPlayerTurn();
  }
  return moved;
}

openContextMenu =  function(z, y, x) {
  contextMenu = new ContextMenu(mapDisplay, game, z, y, x);
  highlightedSpace = [z, y, x];
  drawAll(false);
}

closeContextMenu =  function() {
  contextMenu = null;
  highlightedSpace = null;
  drawAll(false);
}

keyPressed = function(code) {
  //console.log(code);

  switch (code) {
    case 13:
      // enter
      if (contextMenu) {
        contextMenu.executeSelection();
        closeContextMenu();
        drawAll(false);
      }
      break;
    case 27:
      // esc
      closeContextMenu();
      break;
		case 103:
		case 36:
		case 55:
			//numpad7, top left
      selectDirection(NW);
			break;
		case 105:
		case 33:
		case 57:
			//numpad9, top right
      selectDirection(NE);
			break;
		case 100:
		case 37:
			//numpad4, left
      selectDirection(WEST);
			break;
		case 102:
		case 39:
			//numpad6, right
      selectDirection(EAST);
			break;
		case 97:
		case 35:
		case 49:
			//numpad1, bottom left
      selectDirection(SW);
			break;
		case 99:
		case 34:
		case 51:
			//numpad3, bottom right
      selectDirection(SE);
			break;
    case 40:
    case 98:
			//numpad2, down
      if (contextMenu) {
        contextMenu.changeSelection(1);
        drawAll(false);
      } else {
        selectDirection(SOUTH);
      }
			break;
    case 38:
    case 104:
			//numpad8, up
      if (contextMenu) {
        contextMenu.changeSelection(-1);
        drawAll(false);
      } else {
        selectDirection(NORTH);
      }
			break;
    case 188: // <
    case 85:  // u
      selectDirection(UP);
			break;
    case 190: // >
    case 68:  // d
      selectDirection(DOWN);
			break;
    case 86:
			//v
      viewAngle++;
      if (viewAngle > VIEW_ISO_SE) {
        viewAngle = 0;
      }
      drawAll(false);
			break;
	}
}

keydownHandler.handleEvent = function(event) {
  event.preventDefault();
  let code = event.keyCode;
  if (!keysDown[code]) {
    keyPressed(code);
  }
	keysDown[code] = true;
}

keyupHandler.handleEvent = function(event) {
  event.preventDefault();
  let code = event.keyCode;
  keysDown[code] = false;
};

zAdjustColor = function(color, z) {
  let asRGB = ROT.Color.fromString(color);
  return ROT.Color.toHex(ROT.Color.interpolate(asRGB, [0, 0, 0], 0.1*(4-z)));
}

drawSpace = function(mapCoords, i, j) {
  let space = game.map.getSpace(mapCoords.z, mapCoords.y, mapCoords.x);
  let displayInfo = displayForTerrain(space);
  let illumination =  game.map.getIlluminationAt(mapCoords.z, mapCoords.y, mapCoords.x);
  let objects =  game.map.getObjectsAt(mapCoords.z, mapCoords.y, mapCoords.x);
  if (space != NOTHING) {
    let baseColor = displayInfo.background;
    let topColor = displayInfo.color;
    let character = displayInfo.character;
    let displayDim = displayInfo.catchLight && illumination == LIGHT_DIM;
    let displayBright = displayInfo.catchLight && illumination == LIGHT_BRIGHT;

    if (displayDim) {
      topColor = 'black'
      baseColor = '#D1CC5B';//'yellow';
    }
    if (displayBright) {
      topColor = 'black'
      baseColor = '#E3DC3B';//'orange';
    }

    let color = zAdjustColor(topColor, mapCoords.z - game.pZ());
    let background = zAdjustColor(baseColor, mapCoords.z - game.pZ());

    if (objects.length) {
      let object = displayForObject(objects[0]);
      color = object.color;
      character = object.character;
    }
    mapDisplay.draw(i, j, character, color, background);
  } else if (objects.length) {
    let object = displayForObject(objects[0]);
    color = object.color;
    character = object.character;
    mapDisplay.draw(i, j, character, color, null);
  }
}

findSpaceToDraw = function(y, x) {
  let mapZ = game.pZ();
  let topEdge = game.pY() - (displayH - 1) / 2;
  let leftEdge = game.pX() - (displayW - 1) / 2;

  let mapY = topEdge + y;
  let mapX = leftEdge + x;

  let visible = game.map.getPlayerFovAt(mapZ, mapY, mapX);
  let space = game.map.getSpace(mapZ, mapY, mapX);
  let hasObject = game.map.getObjectsAt(mapZ, mapY, mapX).length > 0;

  let maxCnt = 50;
  let cnt = 0;

  if (visible) {
    while (visible && space === NOTHING && cnt < maxCnt && !hasObject) {
      cnt++;
      if (viewAngle == VIEW_ISO_NW) {
        mapY -= 1;
        mapX -= 1;
      } else if (viewAngle == VIEW_ISO_SE) {
        mapY += 1;
        mapX += 1;
      }
      mapZ -= 1;
      visible = game.map.getPlayerFovAt(mapZ, mapY, mapX);
      space = game.map.getSpace(mapZ, mapY, mapX);
    }
  } else {
    let playerUnderSomething = blocksMovementFromBelow(game.map.getSpace(game.pZ() + 1, game.pY(), game.pX()));
    if (playerUnderSomething) {
      return null;
    }
    do {
      cnt++;
      if (viewAngle == VIEW_ISO_NW) {
        mapY += 1;
        mapX += 1;
      } else if (viewAngle == VIEW_ISO_SE) {
        mapY -= 1;
        mapX -= 1;
      }
      mapZ += 1;
      visible = game.map.getPlayerFovAt(mapZ, mapY, mapX);
      space = game.map.getSpace(mapZ, mapY, mapX);
    } while (!visible && cnt < maxCnt)
    /*if (cnt >= maxCnt) {
      return null;
    }*/

  }
  return { z: mapZ, y: mapY, x: mapX }
}

drawAll = function(recursion=true) {

  for (let j = 0; j < displayH; j++) {
    for (let i = 0; i < displayW; i++) {
      mapDisplay.draw(i, j, '', 'black', 'black');
    }
  }

  for (let j = 0; j < displayH; j++) {
    for (let i = 0; i < displayW; i++) {
      let coords = findSpaceToDraw(j, i);
      if (coords) {
        drawSpace(coords, i, j);
      }
    }
  }

  mapDisplay.drawText(0, 0, `${game.pX()},${game.pY()},${game.pZ()} View: ${VIEWS[viewAngle]} Turn: ${game.turn}`);

  if (contextMenu) {
    contextMenu.draw();
  }

  if (recursion) {
    setTimeout(() => drawAll(true), 900);
  }
}

init = function()
{
  document.body.appendChild(mapDisplay.getContainer());

  drawAll(true);

  window.addEventListener('keyup', keyupHandler);
  window.addEventListener('keydown', keydownHandler);

}
