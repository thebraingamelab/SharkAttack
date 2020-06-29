//////////////////////////////////////
// Input Handling
///////////////////////////////////////
let clickBoxSize = 32;
let clickBox = new Rectangle(-1*clickBoxSize, -1*clickBoxSize, clickBoxSize, clickBoxSize+10);

let lastEvent = null;
let eventTime = null;
let inputDeviceSwapTime = 1000;

///////////////////////////////////////
// Touch
///////////////////////////////////////
renderer.canvas.addEventListener("touchstart", function(event) {
    //event.preventDefault();

    if (lastEvent === "mousedown") {

        if ( (Date.now() - eventTime) > inputDeviceSwapTime ) {
            lastEvent = event.type;
            eventTime = Date.now();
            inputHandler(event);
        } 
    }
    else {
        lastEvent = event.type;
        eventTime = Date.now();
        inputHandler(event); 
    }
});

///////////////////////////////////////
// Mouse
///////////////////////////////////////
renderer.canvas.addEventListener("mousedown", function(event) {
    //event.preventDefault();

    if (lastEvent === "touchstart") {

        if ( (Date.now() - eventTime) > inputDeviceSwapTime ) {
            lastEvent = event.type;
            eventTime = Date.now();
            inputHandler(event);
        } 
    }
    else {
        lastEvent = event.type;
        eventTime = Date.now();
        inputHandler(event); 
    }
});


///////////////////////////////////////
// Input Helper Functions
///////////////////////////////////////

// The bulk of the handler for touch or mouse event
function inputHandler(event) {
    if (!game.started()) {
        return;
    }

    let clickLocation;
    let clickZone = game.clickZone;
    let enemy, intendedEnemy = null, enemies = game.frontRowEnemies(), player = game.player();
    let i, len = enemies.length;
    let collisionRect;
    let intersectionArea = 0, hitArea = 0;
    
    // Touch input
    if (event.type === "touchstart") {
        clickLocation = getRelativeEventCoords(event.changedTouches[0]);
    }

    // Mouse click input
    else if (event.type === "mousedown") {
        clickLocation = getRelativeEventCoords(event);
    }

    // Only register the input if the game is running, the input location was valid,
    // and the player is allowed to input
    if (!game.gameOver() && player && game.inputEnabled() &&
        clickLocation.y >= clickZone) {

        // Determine the location of the clickbox
        clickBox.x = clickLocation.x - (clickBoxSize/2);
        clickBox.y = clickLocation.y - (clickBoxSize/2);

        if (game.easyAccuracy) {
            clickBox.x = game.lanes.getCenterX(game.lanes.getLaneByLocation(clickLocation.x));
            clickBox.y = game.stoppingThreshold;
            clickBox.height = 64;
            clickBox.width = 1;
        }

        // Did the user click on an enemy?
        for (i = 0; i < len; i++) {
            enemy = enemies[i];

            collisionRect = enemy.collisionRect();
            intersectionArea = collisionRect.intersection(clickBox).getArea();

            // NOTE: intersection area > 0 if there is any actual intersection (player actually clicked on an enemy)

            // If more of the clickBox is on this enemy, then this is the intended enemy
            if (/*collisionRect.intersects(clickBox) && */intersectionArea > hitArea) {
                hitArea = intersectionArea;
                enemy.clicked = true;
                intendedEnemy = enemy;
            }
            
        }

        if (hitArea > 0) {
            // Disable input for now, so player can't click multiple enemies in one go
            game.toggleInput();

            // Put the sprite back since we are changing it anyway
            resources.putSpriteBack(intendedEnemy.sprite);

            // If the clicked enemy is fake, lose life, reset multiplier
            if (intendedEnemy.isFake) {
                intendedEnemy.sprite = resources.spr_bigX();
                player.loseLife();
                game.inputTimer.reset();
                resources.snd_error.play();
                
            }

            // It's real! Gain a life
            else {
                intendedEnemy.sprite = resources.spr_check();
                player.addLife();
                game.inputTimer.stop();
                resources.snd_valid.play();
            }

            // Toggle event flag
            game.setInputEventFired();

            // Unpause the game
            if (!game.accelerating()) {
                game.toggleAcceleration();
            }
            
            // If the game is already unpaused, buffer the input
            else if (!game.inputBuffered()) {
                game.toggleInputBuffer();
            }


            // Reset the front row for next wave
            enemies.length = 0;
            game.updateWavesPassed();
        }
    }
}

// Get left offset of element
function getOffsetLeft(elem) {
    let offsetLeft = 0;

    // Add px to left offset...
    do {
        if( !isNaN(elem.offsetLeft) ) {
            offsetLeft += elem.offsetLeft;
        }

        // for each elem until there's no more parent element
        elem = elem.offsetParent;
    } while(elem !== null);

    // Return left offset
    return offsetLeft;
}

// Get top offset of element
function getOffsetTop(elem) {
    let offsetTop = 0;

    do {
        if( !isNaN(elem.offsetTop) ) {
            offsetTop += elem.offsetTop;
        }

        elem = elem.offsetParent;
    } while(elem !== null);

    return offsetTop;
}

// Return object with event (touch/click) location 
// x and y in game coords
function getRelativeEventCoords(event) {
    // Scale coords correctly
    let scale = renderer.currentWidth() / GAME_FIELD_WIDTH;

    // Get x and y values
    let x = event.pageX - getOffsetLeft(renderer.canvas);
    let y = event.pageY - getOffsetTop(renderer.canvas);

    return {
        x: x/scale,
        y: y/scale
    };
}

///////////////////////////////////////
// Main Logic
///////////////////////////////////////

function volHandler(label, slider) {
    // Convert slider value to a number (from a string)
    let vol = slider.value;
    vol = Number(vol);

    // Since IOS doesn't allow volume control,
    // simply go between mute and unmute
    if (renderer.isIOS()) {
        if (vol <= 0) {
            vol = 1;
            slider.value = "1";
        }
        else {
            vol = 0;
            slider.value = "0";
        }
    }

    // Adjust the volume icon accordingly
    if (vol <= 0) {
        label.innerHTML = "volume_mute";
    }
    else {
        label.innerHTML = "volume_up";
    }

    // Set the volume of all sounds
    resources.setMasterVolume(vol);
}

// Configure volume
let overlaySlider = document.querySelector("#overlay-volume~.slider");
let widebarSlider = document.querySelector("#widebar-volume~.slider");
let overlayLabel = document.querySelector("#overlay-volume+label>i");
let widebarLabel = document.querySelector("#widebar-volume+label>i");

document.getElementById("overlay-volume").checked = false;
document.getElementById("widebar-volume").checked = false;

// Mouse events
overlaySlider.addEventListener("mouseup", function(e) {
    volHandler(overlayLabel, overlaySlider);
});
widebarSlider.addEventListener("mouseup", function(e) {
    volHandler(widebarLabel, widebarSlider);
});

// Touch events
if (renderer.isIOS()) {
    // Don't display the slider on IOS
    overlaySlider.style.visibility = "hidden";
    widebarSlider.style.visibility = "hidden";

    overlayLabel.addEventListener("touchend", function(e) {
        e.preventDefault();
        volHandler(overlayLabel, overlaySlider);
    });
    widebarLabel.addEventListener("touchend", function(e) {
        e.preventDefault();
        volHandler(widebarLabel, widebarSlider);
    });
}
else {
    // Else proceed normally
    overlaySlider.addEventListener("touchend", function(e) {
        e.preventDefault();
        volHandler(overlayLabel, overlaySlider);
    });
    widebarSlider.addEventListener("touchend", function(e) {
        e.preventDefault();
        volHandler(widebarLabel, widebarSlider);
    });
}

// Start the game when the button is clicked
document.getElementById("start_button").addEventListener("click", 
function() {
    // Start background music
    resources.snd_bgm.play();

    game.start();
});

// Prevent stuff like user scrolling
// Passive: false is required for it to register
document.body.addEventListener("touchmove", function (e) {
    e.preventDefault();
}, { passive: false });


// Load event for everything
window.addEventListener("load", function() {
    // Ensure volume is still what it's supposed to be
    let lastVol = resources.initVolume();

    if (lastVol === 0) {
        overlayLabel.innerHTML = "volume_mute";
        widebarLabel.innerHTML = "volume_mute";
    }
    else if (lastVol) {
        overlayLabel.innerHTML = "volume_up";
        widebarLabel.innerHTML = "volume_up";
    }
    
    document.getElementById("container").style.display = "block";
}, false);