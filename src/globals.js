resizer.init();

const GAME_FIELD_HEIGHT = resizer.getGameHeight();
const GAME_FIELD_WIDTH = resizer.getGameWidth();
const GAME_SPEED = 20;

let clickBoxSize = 32;
let clickBox = new Rectangle(-1*clickBoxSize, -1*clickBoxSize, clickBoxSize, clickBoxSize+10);

let lastEvent = null;
let eventTime = null;
let inputDeviceSwapTime = 1000;

// Get the top bar elements
let topBar = document.getElementById("top-bar");
let pauseBox = document.getElementById("pause-box");
let helpBox = document.getElementById("help-box");

let pauseBtn = document.getElementById("pause");
let helpBtn = document.getElementById("help");

// Menu elements
let pauseMenu = document.getElementById("pause-menu");
let resumeBtn = document.getElementById("resume");
let miniHelpBtn = document.getElementById("help-mini");

let helpMenu = document.getElementById("help-menu");
let backBtn = document.getElementById("back");

let dimmer = document.getElementById("dimmer");

// Dimension value for top bar buttons
let boxSize;