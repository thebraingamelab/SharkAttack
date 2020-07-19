///////////////////////////////////////
// Helper functions/objects
///////////////////////////////////////

// Animates a menu to pop out and remain visible
function showMenu(menuElement) {

    // Show the menu
    menuElement.classList.remove("center-popin");
    menuElement.classList.add("center-popout");

    // Dim the background
    dimmer.classList.remove("partial-fade-out");
    dimmer.classList.add("partial-fade-in");

    // Hide the top bar
    topBar.style.display = "none";
}

// Animates a menu to pop in and stay invisible
function hideMenu(menuElement) {
    // Hide the menu
    menuElement.classList.remove("center-popout");
    menuElement.classList.add("center-popin");

    // Undim the background
    dimmer.classList.remove("partial-fade-in");
    dimmer.classList.add("partial-fade-out");

    // Show the top bar
    topBar.style.display = "";
}

// Animates the current menu to pop in and stay invisible, while the
// next menu pops out and remains visible
function switchMenu(currentMenu, nextMenu) {

    // Hide current menu
    currentMenu.classList.remove("center-popout");
    currentMenu.classList.add("center-popin");

    // After current menu's animation ends, show next menu
    currentMenu.addEventListener("animationend", function showNextMenu() {
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
    topBar.style.display = "";
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