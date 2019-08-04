const NOTHING = 0;
const SOLID_EARTH = 1;
const SOLID_STONE = 2;
const MUD = 3;
const COBBLESTONES = 4;
const WOOD_FLOOR = 5;
const STONE_FLOOR = 6;
const STONE_WALL = 7;
const WOOD_WALL = 8;
const SHINGLES = 9;
const GRASS = 10;
const WATER = 11;

const LIGHT_NONE = 0;
const LIGHT_DIM_FLICKER = 1;
const LIGHT_DIM = 2;
const LIGHT_BRIGHT_FLICKER = 3;
const LIGHT_BRIGHT = 4;

const OBJ_PLAYER = 0;
const OBJ_TORCH = 1;
const OBJ_WOOD_DOOR = 2;
const OBJ_GLASS_WINDOW = 3;
const OBJ_LADDER = 4;

const EAST = 0;
const WEST = 4;
const NORTH = 2;
const SOUTH = 6;
const NE = 1;
const NW = 3;
const SE = 7;
const SW = 5;
const CENTER = 8;
const UP = 9;
const DOWN = 10;

const DIRECTIONS = [];
DIRECTIONS[EAST] = [1, 0, 0];
DIRECTIONS[WEST] = [-1, 0, 0];
DIRECTIONS[NORTH] = [0, -1, 0];
DIRECTIONS[SOUTH] = [0, 1, 0];
DIRECTIONS[NE] = [1, -1, 0];
DIRECTIONS[NW] = [-1, -1, 0];
DIRECTIONS[SE] = [1, 1, 0];
DIRECTIONS[SW] = [-1, 1, 0];
DIRECTIONS[CENTER] = [0, 0, 0];
DIRECTIONS[UP] = [0, 0, 1];
DIRECTIONS[DOWN] = [0, 0, -1];

const VIEW_2D = 0;
const VIEW_ISO_NW = 1;
const VIEW_ISO_SE = 2;
const VIEWS = [];
VIEWS[VIEW_2D] = '2d';
VIEWS[VIEW_ISO_NW] = 'Iso NW';
VIEWS[VIEW_ISO_SE] = 'Iso SE';

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function percentChance(chance) { return getRandomIntInclusive(1, 100) <= chance; }

function unit(value) {
  if (value < 0) {
    return -1;
  }
  if (value > 0) {
    return 1;
  }
  return 0;
}

class Game {
  constructor() {
    this.map = new Map(this);
    this.player = {
      type: OBJ_PLAYER,
      name: 'Garrett',
      health: 10,
      awareness: 20,
      breath: 10
    };
    this.map.placeObject(this.player, 0, 50, -20);
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

  movePlayer(direction) {
    let newX = DIRECTIONS[direction][0] + this.pX();
    let newY = DIRECTIONS[direction][1] + this.pY();
    let newZ = DIRECTIONS[direction][2] + this.pZ();

    if (newZ > this.pZ() && blocksMovementFromBelow(this.map.getSpace(newZ, newY, newX))) {
      return false;
    }

    if (newZ < this.pZ() && blocksMovementFromBelow(this.map.getSpace(this.pZ(), newY, newX))) {
      return false;
    }

    if (this.map.blocksMovementAt(newZ, newY, newX)) {
      return false;
    }

    this.map.placeObject(this.player, newZ, newY, newX);
    this.map.playerFovUpToDate = false;
    return true;
  }

  playerOpenDoor(direction) {
    let doorX = DIRECTIONS[direction][0] + this.pX();
    let doorY = DIRECTIONS[direction][1] + this.pY();
    let doorZ = DIRECTIONS[direction][2] + this.pZ();

    let door = _.find(this.getObjectsAt(doorZ, doorY, doorX), o => o.type === OBJ_WOOD_DOOR);

    if (!door) {
      return false;
    }

    door.open = !door.open;
    door.blocksLight = !door.blocksLight;
    door.blocksMovement = !door.blocksMovement;

    this.map.playerFovUpToDate = false;
    this.map.illuminationUpToDate = false;
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
    let door = {
      type: OBJ_WOOD_DOOR,
      blocksLight: false,
      blocksMovement: false,
      open: false
    };
    this.placeObject(door, 0, doorY, doorX);
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
    return this.objects[key] || [];
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

let game = new Game();

var selectDirection = {};

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

displayForObject = function(objectType) {
  switch(objectType) {
    case OBJ_TORCH:
      return {character: '*', color: _.sample(['red', 'yellow', 'orange'])};
    case OBJ_PLAYER:
      return {character: '@', color: 'white'};
    case OBJ_WOOD_DOOR:
      return {character: ',', color: 'black'};
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

playerTurn = function()
{
	drawAll(false);
	window.addEventListener('keyup', selectDirection);
  //window.addEventListener('mousemove', highlightObjects);
  //window.addEventListener('click', clickTarget);
}

move =  function(direction) {
  return game.movePlayer(direction);
}

selectDirection.handleEvent = function(event) {
	console.log("event handle key code: " + event.keyCode);
	switch(event.keyCode)
	{
		case 103:
		case 36:
		case 55:
			//numpad7, top left
      if (move(NW)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
		case 105:
		case 33:
		case 57:
			//numpad9, top right
      if (move(NE)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
		case 100:
		case 37:
			//numpad4, left
      if (move(WEST)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
		case 102:
		case 39:
			//numpad6, right
      if (move(EAST)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
		case 97:
		case 35:
		case 49:
			//numpad1, bottom left
      if (move(SW)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
		case 99:
		case 34:
		case 51:
			//numpad3, bottom right
      if (move(SE)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
    case 40:
    case 98:
			//numpad2, down
      if (move(SOUTH)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
    case 38:
    case 104:
			//numpad8, up
      if (move(NORTH)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
    case 188: // <
    case 85:  // u
      if (move(UP)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
    case 190: // >
    case 68:  // d
      if (move(DOWN)) {
        window.removeEventListener('keyup', this);
        playerTurn();
      }
			break;
    case 86:
			//v
      window.removeEventListener('keyup', this);
      viewAngle++;
      if (viewAngle > VIEW_ISO_SE) {
        viewAngle = 0;
      }
      playerTurn();
			break;
	}

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
      let object = displayForObject(objects[0].type);
      color = object.color;
      character = object.character;
    }
    mapDisplay.draw(i, j, character, color, background);
  } else if (objects.length) {
    let object = displayForObject(objects[0].type);
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

  mapDisplay.drawText(0, 0, `${game.pX()},${game.pY()},${game.pZ()} View: ${VIEWS[viewAngle]}`);

  if(recursion) {
    setTimeout(() => drawAll(true), 900);
  }
}

init = function()
{
  document.body.appendChild(mapDisplay.getContainer());

  drawAll(true);

	playerTurn();

}
