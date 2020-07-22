resizer.init();

const GAME_FIELD_HEIGHT = resizer.getGameHeight();
const GAME_FIELD_WIDTH = resizer.getGameWidth();
const GAME_SPEED = 20;

let clickBoxSize = 32;
let clickBox = new Rectangle(-1*clickBoxSize, -1*clickBoxSize, clickBoxSize, clickBoxSize+10);

let lastEvent = null;
let eventTime = null;
let inputDeviceSwapTime = 1000;

// Start button element
let startBtn = document.getElementById("start-button");

// Get the top bar elements
let topBar = document.getElementById("top-bar");
let pauseBox = document.getElementById("pause-box");
let helpBox = document.getElementById("help-box");

let pauseBtn = document.getElementById("pause");
let helpBtn = document.getElementById("help");

// Menu elements
let pauseMenu = document.getElementById("pause-menu");
let resumeBtn = document.getElementById("resume");
let restartBtn = document.getElementById("restart");
let exitBtn = document.getElementById("exit");

let miniMusicBtn = document.getElementById("music-mini");
let miniVolumeBtn = document.getElementById("volume-mini");
let miniHelpBtn = document.getElementById("help-mini");

let helpMenu = document.getElementById("help-menu");
let helpBackBtn = document.getElementById("help-back");
let reportBtn = document.getElementById("report-a-bug");
let tutorialBtn = document.getElementById("tutorial");

let notImplementedMenu = document.getElementById("not-implemented-menu");
let notImplementedBackBtn = document.getElementById("not-implemented-back");

let dimmer = document.getElementById("dimmer");

// Dimension value for top bar buttons
let boxSize;