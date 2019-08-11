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

const KEY_CTRL = 17;
