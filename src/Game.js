import GameMap from './GameMap.js';
import { Creature } from './GameObject.js';

class Game {
  constructor() {
    this.map = new GameMap(this);
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

export default Game;
