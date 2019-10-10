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

class Ladder extends GameObject {
  constructor(game, z, y, x) {
    super(game, z, y, x);
    this.type = OBJ_LADDER;
    this.name = 'Ladder';
  }
}

class Torch extends GameObject {
  constructor(game, z, y, x) {
    super(game, z, y, x);
    this.type = OBJ_TORCH;
    this.name = 'Torch';
    this.dimLightRange = 10;
    this.brightLightRange = 5;
  }
}

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
    this.name = 'Garrett';
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

export { Ladder, Torch, Door, Creature };
