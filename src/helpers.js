///////////////////////////////////////
// Helper functions/objects
///////////////////////////////////////

// clamp between two values
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

// Optimizes certain event listeners by only executing the callback
// a certain amount of time after the event *stops* firing (useful for resize)
function debounce(func, delay, immediate) {
    let timeout;

    return function() {
        let context = this, args = arguments;

        let later = function() {
            timeout = null;
            if (!immediate)
                func.apply(context, args);
        };

        let callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = window.setTimeout(later, delay);

        if (callNow) 
            func.apply(context, args);
    };
}