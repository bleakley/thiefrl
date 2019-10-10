import { Ladder, Torch, Door } from './GameObject.js';

class GameMap {
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

    let ladderX = leftEdge + getRandomIntInclusive(2, width - 2);
    let ladderY = topEdge + getRandomIntInclusive(2, width - 2);
    new Ladder(this.game, 0, ladderY, ladderX);

    for (let k = 1; k < floors; k++) {
      new Ladder(this.game, k, ladderY, ladderX);
      this.getLayer(k).spaces[ladderY][ladderX] = {
        building: true,
        terrain: NOTHING
      }
    }

    if (percentChance(50)) {
      this.getLayer(floors).spaces[ladderY][ladderX] = {
        building: true,
        terrain: NOTHING
      }
      new Ladder(this.game, floors, ladderY, ladderX);
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
    if (percentChance(50)) {
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
    new Torch(this.game, 0, y, x);
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

  modifyMovementDirection(z, y, x, direction) {
    let space = this.getSpace(z, y, x);
    let _enum = vectorAsEnum(direction);
    switch (space) {
      case WOOD_STAIR_NORTH:
        if (_enum == NORTH) {
          return [0, -1, 1];
        }
        return direction;
      case WOOD_STAIR_SOUTH:
        if (_enum == SOUTH) {
          return [0, 1, 1];
        }
        return direction;
      case WOOD_STAIR_EAST:
        if (_enum == EAST) {
          return [1, 0, 1];
        }
        return direction;
      case WOOD_STAIR_WEST:
        if (_enum == EAST) {
          return [-1, 0, 1];
        }
        return direction;
      default:
        return direction;
    }
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

export default GameMap;
