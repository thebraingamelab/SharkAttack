//////////////////////////////////////
// Input Handling
///////////////////////////////////////

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
        clickLocation = resizer.getRelativeEventCoords(event.changedTouches[0]);
    }

    // Mouse click input
    else if (event.type === "mousedown") {
        clickLocation = resizer.getRelativeEventCoords(event);
    }

    // Only register the input if the game is running, the input location was valid,
    // and the player is allowed to input
    if (!game.gameOver() && player && game.inputEnabled() &&
        clickLocation.y >= clickZone) {

        // Determine the location of the clickbox
        clickBox.x = clickLocation.x - (clickBoxSize/2);
        //clickBox.y = clickLocation.y - (clickBoxSize/2);
        clickBox.y = game.stoppingThreshold;

        clickBox.height = GAME_FIELD_HEIGHT - game.stoppingThreshold;

        // Did the user click on an enemy?
        for (i = 0; i < len; i++) {
            enemy = enemies[i];

            collisionRect = enemy.collisionRect();
            intersectionArea = collisionRect.intersection(clickBox).getArea();

            // NOTE: intersection area > 0 if there is any actual intersection (player actually clicked on an enemy)

            // If more of the clickBox is on this enemy, then this is the intended enemy
            if (intersectionArea > hitArea) {
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

///////////////////////////////////////
// Main Logic
///////////////////////////////////////
/*
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
}*/

// Start the game when the button is clicked
document.getElementById("start-button").addEventListener("click", function() { game.start(); });

// Prevent stuff like user scrolling
// Passive: false is required for it to register
document.body.addEventListener("touchmove", function (e) {
    e.preventDefault();
}, { passive: false });


/*/ Load event for everything
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
}, false);*/

//////////////////////////
// Resize events
//////////////////////////

// Every time the Resizer resizes things, do some extra
// recaculations to position the sample button in the center
resizer.addResizeEvent(resizeBarButtons);

// Manual resize to ensure that our resize functions are executed
// (could have also just called resizerBarButtons() but this will do for demonstration purposes)
resizer.resize();


//////////////////////////
// Button events
//////////////////////////

pauseBtn.addEventListener("click", function() { showMenu(pauseMenu); }, false);
    
resumeBtn.addEventListener("click", function() { hideMenu(pauseMenu); }, false);
restartBtn.addEventListener("click", pauseToNotImplemented, false);
exitBtn.addEventListener("click", pauseToNotImplemented, false);

miniMusicBtn.addEventListener("click", pauseToNotImplemented, false);
miniVolumeBtn.addEventListener("click", pauseToNotImplemented, false);
miniHelpBtn.addEventListener("click", function() { switchMenu(pauseMenu, helpMenu); }, false);


helpBtn.addEventListener("click", function() { showMenu(helpMenu); }, false);
reportBtn.addEventListener("click", helpToNotImplemented, false);
tutorialBtn.addEventListener("click", helpToNotImplemented, false);
helpBackBtn.addEventListener("click", function() { switchMenu(helpMenu, pauseMenu); }, false);

notImplementedBackBtn.addEventListener("click", function() { switchMenu(notImplementedMenu, pauseMenu); }, false);