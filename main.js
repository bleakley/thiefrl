import Game from './src/Game.js';
import ContextMenu from './src/ContextMenu.js';

let displayW = 69;
let displayH = 49;
let viewAngle = VIEW_ISO_NW;

let acceptingInput = false;

let game = new Game();

let mapDisplay = new ROT.Display({
  width:displayW, height:displayH,
  layout:"rect", forceSquareRatio: false
});

let displayForTerrain = function(terrainType) {
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
    case WOOD_STAIR_NORTH:
      return {character: '∨', color: 'black', background: '#A0522D	', catchLight: true};
    case WOOD_STAIR_SOUTH:
      return {character: '∧', color: 'black', background: '#A0522D	', catchLight: true};
    case WOOD_STAIR_EAST:
      return {character: '<', color: 'black', background: '#A0522D	', catchLight: true};
    case WOOD_STAIR_WEST:
      return {character: '>', color: 'black', background: '#A0522D	', catchLight: true};
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

let displayForObject = function(object) {
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
    case OBJ_LADDER:
      return {character: '\u2261', color: 'white'};
  }
  return {character: '?', color: 'white'};
}

let blocksMovementFromBelow = function(terrainType) {
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



let endPlayerTurn = function() {
  game.advanceGameState();
  drawAll(false);
}

let selectDirection =  function(direction) {
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

let move = function(direction) {
  let moved = game.movePlayer(direction);
  if (moved) {
    endPlayerTurn();
  }
  return moved;
}

let openContextMenu = function(z, y, x) {
  contextMenu = new ContextMenu(mapDisplay, game, z, y, x);
  highlightedSpace = [z, y, x];
  drawAll(false);
}

let closeContextMenu = function() {
  contextMenu = null;
  highlightedSpace = null;
  drawAll(false);
}

let keyPressed = function(code) {
  //console.log(code);

  if (contextMenu) {
    switch (code) {
      case 13:
        // enter
        contextMenu.executeSelection();
        closeContextMenu();
        drawAll(false);
        break;
      case 27:
        // esc
        closeContextMenu();
        break;
      case 40:
      case 98:
  			//numpad2, down
        contextMenu.changeSelection(1);
        drawAll(false);
  			break;
      case 38:
      case 104:
  			//numpad8, up
        contextMenu.changeSelection(-1);
        drawAll(false);
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
  } else {
    switch (code) {
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
        selectDirection(SOUTH);
  			break;
      case 38:
      case 104:
  			//numpad8, up
        selectDirection(NORTH);
  			break;
      case 188: // <
      case 85:  // u
        selectDirection(UP);
  			break;
      case 190: // >
      case 68:  // ds
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

}

keydownHandler.handleEvent = function(event) {
  //event.preventDefault();
  let code = event.keyCode;
  if (!keysDown[code]) {
    keyPressed(code);
  }
	keysDown[code] = true;
}

keyupHandler.handleEvent = function(event) {
  //event.preventDefault();
  let code = event.keyCode;
  keysDown[code] = false;
};

let zAdjustColor = function(color, z) {
  let asRGB = ROT.Color.fromString(color);
  return ROT.Color.toHex(ROT.Color.interpolate(asRGB, [0, 0, 0], 0.1*(4-z)));
}

let drawSpace = function(mapCoords, i, j) {
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

let findSpaceToDraw = function(y, x) {
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
      hasObject = game.map.getObjectsAt(mapZ, mapY, mapX).length > 0;
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
      hasObject = game.map.getObjectsAt(mapZ, mapY, mapX).length > 0;
    } while (!visible && cnt < maxCnt)

  }
  return { z: mapZ, y: mapY, x: mapX }
}

let drawAll = function(recursion=true) {

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

// INITIALIZE
document.body.appendChild(mapDisplay.getContainer());
drawAll(true);
window.addEventListener('keyup', keyupHandler);
window.addEventListener('keydown', keydownHandler);
