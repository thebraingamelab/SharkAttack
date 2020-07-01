const GAME_FIELD_HEIGHT = 960;
const GAME_FIELD_WIDTH = 540;
const GAME_SPEED = 20;

let clickBoxSize = 32;
let clickBox = new Rectangle(-1*clickBoxSize, -1*clickBoxSize, clickBoxSize, clickBoxSize+10);

let lastEvent = null;
let eventTime = null;
let inputDeviceSwapTime = 1000;