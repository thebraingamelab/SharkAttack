///////////////////////////////////////
// Helper functions/objects
///////////////////////////////////////


// Draw background and "tap to start" text on load
let displayTapToStart = (function () {
    let isDisplaying = false;

    return function() {
        // Dim the background
        dimmer.classList.remove("partial-fade-out");
        dimmer.classList.add("partial-fade-in");
        dimmer.style.display = "block";

        // Hide top bar
        topBar.style.visibility = "hidden";

        tapInterval = window.setInterval(function() {
            if (tapToStart.style.display === "none") {
                tapToStart.style.display = "";
            }
            else {
                tapToStart.style.display = "none";
            }

            // Stop displaying message on tap, then start game
            if (!isDisplaying) {
                isDisplaying = true;

                resizer.getCanvas().addEventListener("click", function tappedAndStarted() {
                    window.clearInterval(tapInterval);
                    tapToStart.style.display = "none";
                    topBar.style.visibility = "visible";

                    // Undim the background
                    dimmer.classList.remove("partial-fade-in");
                    dimmer.classList.add("partial-fade-out");

                    dimmer.addEventListener("animationend", function hideDimmer() {
                        dimmer.style.display = "none";
                        dimmer.removeEventListener("animationend", hideDimmer);
                    }, false);

                    isDisplaying = false;

                    game.start();

                    resizer.getCanvas().removeEventListener("click", tappedAndStarted);
                }, false);
            }
        }, 500);

        
    };
})();



// Navigate to thebraingamelab.org
function goToBGL() {
    window.location.assign("https://thebraingamelab.org/");
}

// Toggles muted or unmuted states
let toggleVolume = (function() {
    let muted = false;
    let use = miniVolumeBtn.firstElementChild.firstElementChild;

    return function () {
        muted = !muted;

        if (muted) {
            use.setAttribute("href", "#no-volume-icon");
            resources.mute();
        }
        else {
            use.setAttribute("href", "#volume-icon");
            resources.unmute();
        }
    };
})();

// Specifically switches from help menu to not implemented menu
function helpToNotImplemented() {
    switchMenu(helpMenu, notImplementedMenu);
}

// Specifically switches from pause menu to not implemented menu
function pauseToNotImplemented() {
    switchMenu(pauseMenu, notImplementedMenu);
}

// Animates a menu to pop out and remain visible
function showMenu(menuElement) {

    // Show the menu
    menuElement.style.display = "block";
    menuElement.classList.remove("center-popin");
    menuElement.classList.add("center-popout");

    // Dim the background
    dimmer.classList.remove("partial-fade-out");
    dimmer.classList.add("partial-fade-in");
    dimmer.style.display = "block";

    // Hide the top bar
    topBar.style.display = "none";
}

// Animates a menu to pop in and stay invisible
function hideMenu(menuElement) {
    // Hide the menu
    menuElement.classList.remove("center-popout");
    menuElement.classList.add("center-popin");

    menuElement.addEventListener("animationend", function hideMenuElement() {
        menuElement.style.display = "none";
        menuElement.removeEventListener("animationend", hideMenuElement);
    }, false);

    // Undim the background
    dimmer.classList.remove("partial-fade-in");
    dimmer.classList.add("partial-fade-out");

    dimmer.addEventListener("animationend", function hideDimmer() {
        dimmer.style.display = "none";
        dimmer.removeEventListener("animationend", hideDimmer);
    }, false);

    // Show the top bar
    topBar.style.display = "block";
}

// Animates the current menu to pop in and stay invisible, while the
// next menu pops out and remains visible
function switchMenu(currentMenu, nextMenu) {

    // Hide current menu
    currentMenu.classList.remove("center-popout");
    currentMenu.classList.add("center-popin");

    currentMenu.addEventListener("animationend", function hideCurrent() {
        currentMenu.style.display = "none";
        currentMenu.removeEventListener("animationend", hideCurrent);
    }, false);

    // After current menu's animation ends, show next menu
    currentMenu.addEventListener("animationend", function showNextMenu() {
        nextMenu.style.display = "block";
        nextMenu.classList.remove("center-popin");
        nextMenu.classList.add("center-popout");

        currentMenu.removeEventListener("animationend", showNextMenu);
    }, false);
}

// Clamp between two values
function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

// Random Integer, 0 thru max - 1
function randomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// Removes an element by replacing it with the last element,
// and then shortens the array
function mutableRemoveIndex(array, index) {

    if (index >= array.length) {
        console.error('ERROR: mutableRemoveIndex: index is out of range');
        return;
    }

    if (array.length <= 0) {
        console.error('ERROR: mutableRemoveIndex: empty array');
        return;
    }

    array[index] = array[array.length-1];
    array[array.length-1] = undefined;

    array.length = array.length-1;
}


// Size the top bar buttons
function resizeBarButtons() {
    let barHeight, originalDisplay;

    // Store display setting
    originalDisplay = topBar.style.display;

    // In case top bar isn't visible (which means clientHeight === 0),
    // temporarily make it visible to calculate true height
    topBar.style.display = "block";
    barHeight = topBar.clientHeight;
    topBar.style.display = originalDisplay;

    // Box size is slightly larger than the bar (120% of height)
    boxSize = barHeight * 1.20;

    // Set styles
    pauseBox.style.height = boxSize + "px";
    pauseBox.style.width = boxSize + "px";

    helpBox.style.height = boxSize + "px";
    helpBox.style.width = boxSize + "px";
}