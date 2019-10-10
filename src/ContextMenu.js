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
    let topEdge = this.game.pY() - (this.display._options.height - 1) / 2;
    let leftEdge = this.game.pX() - (this.display._options.width - 1) / 2;

    let y = this.y - topEdge;
    let x = this.x - leftEdge;

    for (let j = 0; j < this.options.length; j++) {
      let color = j == this.highlightedRow ? '%c{yellow}' : '%c{white}';
      this.display.drawText(x + 1, y + j, color + this.options[j].getText());
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

export default ContextMenu;
