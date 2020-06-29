// Cloneable Pool
function CloneablePool(template) {
    this.template = template;

    this.pool = [];
}

CloneablePool.prototype.take = function () {
    let obj;
    let i, len = this.pool.length;
    let poolItem = null;

    // If there is an available object, return it.
    for (i = 0; i < len; i++) {
        poolItem = this.pool[i];

        if(poolItem.available) {
            poolItem.available = false;
            poolItem.object.init();
            return poolItem.object;
        }
    }

    // Otherwise, create a new one and return it.
    obj = this.template.clone();
    obj.init();

    this.pool.push({
        available: false,
        object: obj
    });

    return obj;
};

CloneablePool.prototype.putBack = function (cloneable) {
    let poolItem;
    let i, len = this.pool.length;

    // Mark the object as available again.
    for ( i = 0; i < len; i++) {
        poolItem = this.pool[i];

        if (poolItem.object === cloneable) {
            poolItem.available = true;
            return;
        }
    }
};

// Rectangle object
function Rectangle (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

Rectangle.prototype.left = function () {
    return this.x;
};

Rectangle.prototype.right = function () {
    return this.x + this.width;
};

Rectangle.prototype.top = function () {
    return this.y;
};

Rectangle.prototype.bottom = function () {
    return this.y + this.height;
};

Rectangle.prototype.intersects = function (r2) {
    return this.right() >= r2.left() &&
           this.left() <= r2.right() &&

           this.top() <= r2.bottom() &&
           this.bottom() >= r2.top();
};

Rectangle.prototype.contains = function (x, y) {
    return this.left() <= x && x <= this.right() &&
           this.bottom() <= y && y <= this.top();
};

Rectangle.prototype.union = function (r2) {
    let x, y, width, height;

    if( r2 === undefined ) {
        return;
    }

    x = Math.min( this.x, r2.x );
    y = Math.min( this.y, r2.y );

    width = Math.max( this.right(), r2.right() ) -
            Math.min( this.left(), r2.left() );

    height = Math.max( this.bottom(), r2.bottom() ) -
             Math.min( this.top(), r2.top() );

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    return this;
};

Rectangle.prototype.intersection = function (r2) {
    let iLeft, iRight, iTop, iBottom;

    iLeft = Math.max(this.left(), r2.left());
    iBottom = Math.min(this.bottom(), r2.bottom());

    iRight = Math.min(this.right(), r2.right());
    iTop = Math.max(this.top(), r2.top());

    //  no intersection
    if (iLeft > iRight || iBottom < iTop) {
        this.x = -1;
        this.y = -1;
        this.width = 0;
        this.height = 0;
    }
    
    // intersection!
    else {
        this.x = iLeft;
        this.y = iTop;
        this.width = iRight - iLeft;
        this.height = iBottom - iTop;
    }


    return this;
};

Rectangle.prototype.getArea = function () {
    return (this.height * this.width);
};


// Sprite Object
function Sprite(image, width, height, frames, frameRate) {
    this.width = width;
    this.height = height;
    this.frames = frames;
    this.frameRate = frameRate;
    this.timer = 0;
    this.currentFrame = 0;
    this.image = image;
    this.animationEndEvent = null;
    this.layers = [];
    this.draw = true;
    this.foreground = false;
    this.alpha = 1;
    this.fadeAmt = 0;
}

// Constructor for event-based sprites
Sprite.prototype.eventDriven = function (imgPath, width, height, frameWidth, frameHeight, frames, frameRate, row, col) {
    let spriteImage = document.createElement("img");
    let image = document.createElement("img");

    spriteImage.addEventListener("load",  function myLoadHandler() {
        let spriteCanvas = document.createElement("canvas");
        let spriteContext = spriteCanvas.getContext('2d');

        spriteCanvas.width = width*frames;
        spriteCanvas.height = height;

        spriteContext.drawImage(spriteImage,
                                col*frameWidth, row*frameHeight,
                                frameWidth*frames, frameHeight,
                                0, 0,
                                width*frames, height);

        image.src = spriteCanvas.toDataURL('image/png');

        spriteImage.removeEventListener("load", myLoadHandler);
    }, false);

    spriteImage.src = imgPath;

    this.width = width;
    this.height = height;
    this.frames = frames;
    this.frameRate = frameRate;
    this.image = image;

    return this;
};

// Constructor for a static, tiled image
Sprite.prototype.tiled = function (imgPath, width, height, frameWidth, frameHeight, row, col, xTiles, yTiles) {
    let spriteImage = document.createElement("img");
    let image = document.createElement("img");

    spriteImage.addEventListener("load",  function myLoadHandler() {
        let i, j;
        let spriteCanvas = document.createElement("canvas");
        let spriteContext = spriteCanvas.getContext('2d');
        
        spriteCanvas.width = width;
        spriteCanvas.height = height;

        for (i = 0; i < xTiles; i++) {
            for (j = 0; j < yTiles; j++) {
                spriteContext.drawImage(spriteImage,
                                        col*frameWidth, row*frameHeight,
                                        frameWidth, frameHeight,
                                        i*width/xTiles, j*height/yTiles,
                                        width/xTiles, height/yTiles);
            }
        }

        image.src = spriteCanvas.toDataURL('image/png');

        spriteImage.removeEventListener("load", myLoadHandler);
    }, false);

    spriteImage.src = imgPath;

    this.width = width;
    this.height = height;
    this.frameRate = 0;
    this.frames = 1;
    this.image = image;

    return this;
};

Sprite.prototype.resetAnimation = function () {
    this.currentFrame = 0;
};

Sprite.prototype.update = function (dt) {
    let i;

    // Fade in or out
    this.alpha = clamp(this.alpha+this.fadeAmt, 0, 1);

    // Update sprite layers
    for (i = 0; i < this.layers.length; i++) {
        this.layers[i].update(dt);
    }

    // While the sprite is animated...
    if (this.frameRate > 0) {
        this.timer += dt;
        
        // Increment the frame
        if (this.timer > 1/this.frameRate) {
            this.timer = 0;
            this.currentFrame++;

            // Run the callback after the animation finishes
            if (this.currentFrame > this.frames-1 && this.animationEndEvent !== null) {
                this.animationEndEvent();
            }
        }
    }
};

Sprite.prototype.init = function () {
    this.width = 0;
    this.height = 0;
    this.frameRate = 0;
    this.frames = 0;
    this.currentFrame = 0;
    this.timer = 0;
    this.alpha = 1;
    this.fadeAmt = 0;
    this.layers.length = 0;
    this.image = null;
    this.animationEndEvent = null;
    this.draw = true;
    this.foreground = false;
};

Sprite.prototype.clone = function () {
    return new Sprite(this.image, this.width, this.height, this.frames, this.frameRate);
};

Sprite.prototype.copyAttributes = function (otherSprite) {
    this.width = otherSprite.width;
    this.height = otherSprite.height;
    this.frameRate = otherSprite.frameRate;
    this.frames = otherSprite.frames;
    this.image = otherSprite.image;
    this.animationEndEvent = otherSprite.animationEndEvent;
    this.draw = otherSprite.draw;
    this.alpha = otherSprite.alpha;
    this.fadeAmt = otherSprite.fadeAmt;
    this.foreground = otherSprite.foreground;

    return this;
};

Sprite.prototype.addLayer = function (newSprite) {
    this.layers.push(newSprite);
};


///////////////////////////////////////
// Game entities
///////////////////////////////////////

// Entity superclass
function Entity(x, y, width, height, sprite) {
    this.x = x;
    this.y = y;

    this.xFraction = 0;
    this.yFraction = 0;

    this.time = 0;

    this.width = width;
    this.height = height;

    this.sprite = sprite;

    this.hitbox = new Rectangle(this.x - this.width/2,
                                        this.y - this.height/2,
                                        this.width,
                                        this.height);
}

Entity.prototype.init = function () {
    this.x = 0;
    this.y = 0;
    this.xFraction = 0;
    this.yFraction = 0;

    this.time = 0;
    this.sprite = null;
};

Entity.prototype.clone = function () {
    return new Entity(this.x, this.y, this.width, this.height, this.sprite);
};

// Update time step
Entity.prototype.update = function (dt) {
    let newX = this.x;
    let newY = this.y;
    let xFrac = this.xFraction;
    let yFrac= this.yFraction;

    this.time += dt;

    // Apply any fractions
    newX += xFrac;
    newY += yFrac;

    // Convert x and y to whole numbers and store leftover fractions
    xFrac = newX % 1;
    yFrac = newY % 1;

    newX -= xFrac;
    newY -= yFrac;

    // Finalize changes
    this.x = newX;
    this.y = newY;

    this.xFraction = xFrac;
    this.yFraction = yFrac;


};

// Entity rectangle collision
Entity.prototype.collisionRect = function () {
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
    this.hitbox.width = this.width;
    this.hitbox.height = this.height;

    return this.hitbox;
};

// Check collisions
Entity.prototype.isCollidingWith = function(entity2) {
    let myHitbox = this.collisionRect();
    let notMyHitbox = entity2.collisionRect();

    return myHitbox.intersects(notMyHitbox);
};

// Temporary Entity object (goes away pretty soon)
function TempEntity(x, y, width, height, sprite) {
    Entity.call(this, x, y, width, height, sprite);
}

// Temporary Entity extends Entity
TempEntity.prototype = Object.create(Entity.prototype);

TempEntity.prototype.init = function () {
    Entity.prototype.init.call(this);
};

TempEntity.prototype.clone = function () {
    return new TempEntity(this.x, this.y, this.width, this.height, this.sprite);
};

// Player object
function Player(x, y, sprite) {
    let width = 0;
    let height = 0;

    if (sprite) {
        width = sprite.width;
        height = sprite.height;
    }

    Entity.call(this, x, y, width, height, sprite);

    this.maxLife = 3;
    this.life = this.maxLife;
}

// Player extends Entity
Player.prototype = Object.create(Entity.prototype);

// Update player
Player.prototype.update = function (dt) {
    Entity.prototype.update.call(this, dt);

    game.addScore(1);
};

// Increase life amount
Player.prototype.addLife = function () {
    this.life += 1;
    
    if (this.life >= this.maxLife)
        this.life = this.maxLife;
};

// Decrease life
Player.prototype.loseLife = function () {
    this.life -= 1;
    
    if (this.life <= 0)
        game.setGameOver();
};

// Move player to new coordinates
Player.prototype.move = function (x, y) {
    this.x = x;
    this.y = y;
};

// Enemy object
function Enemy(x, y, speed, invisPointY, sprite) {
    let width = 0;
    let height = 0;

    if (sprite) {
        width = sprite.width;
        height = sprite.height;
    }

    Entity.call(this, x, y, width, height, sprite);
    
    this.invisPointY = invisPointY;
    this.speed = speed;
    this.isFake = false;
    this.lane = 1;
    this.triggeredWave = false;
    this.triggeredPause = false;
    this.clicked = false;
}

// Enemy extends Entity
Enemy.prototype = Object.create(Entity.prototype);

Enemy.prototype.init = function () {
    Entity.prototype.init.call(this);

    this.x = -100;
    this.y = -100;
    this.invisPointY = 0;
    this.speed = 0;
    this.lane = 1;
    this.isFake = false;
    this.triggeredWave = false;
    this.triggeredPause = false;
    this.clicked = false;
};

Enemy.prototype.clone = function () {
    return new Enemy(this.x, this.y, this.speed, this.invisPointY, this.sprite);
};

// Update time step
Enemy.prototype.update = function (dt) {
    Entity.prototype.update.call(this, dt);

    this.y += this.speed;
};


// Sound object
function Sound(filePath, audioContext, gainNode, loop=false) {
    let my = this;
    let testAudio;
    let xhr;
    
    // Initialize fields (constructor stuff)
    this.buffer = null;
    this.audioContext = audioContext;
    this.gainNode = gainNode;
    this.loop = loop;

    // Check for file type compatibility
    testAudio = document.createElement("audio");

    if (testAudio.canPlayType) {

        // Can we use a .mp4 file?
        if ( !!testAudio.canPlayType && testAudio.canPlayType('audio/mp4') !== "" ) {
            filePath += ".mp4";
        }

        // If we can't use .mp4, can we use a .ogg file?
        else if ( !!testAudio.canPlayType && testAudio.canPlayType('audio/ogg; codecs="vorbis"') !== "" ){
            filePath += ".ogg";
        }

        // Uh-oh! Neither are supported :(
        else {
            console.log("Error: MP4 and OGG files are unsupported on this device.");
            return;
        }
    }

    // Fetch the file
    xhr = new XMLHttpRequest();
    xhr.open('GET', encodeURI(filePath), true);
    xhr.responseType = 'arraybuffer';

    // Oopsie doopsie, couldn't fetch the file
    xhr.addEventListener("error", function() {
        console.log('Error loading from server: ' + filePath);
    }, false);

    // On successful load, decode the audio data
    xhr.addEventListener("load", function() {

        audioContext.decodeAudioData(xhr.response,

            // Success
            function(audioBuffer) {
                my.buffer = audioBuffer;
            },

            // Error
            function(e) {
                console.log("Error decoding audio data: " + e.err);
            });
    }, false);

    xhr.send();
}

// Play function, for playing the sound
Sound.prototype.play = function() {
    let thisObject = this;

    // Play the sound only if it's been decoded already
    if (this.buffer) {
        let bufferSource = this.audioContext.createBufferSource();
        bufferSource.buffer = this.buffer;
        bufferSource.connect(this.gainNode).connect(this.audioContext.destination);
        bufferSource.start(0);
        bufferSource.loop = this.loop;
    }

    // If it hasn't been decoded yet, check every 50ms to see if it's ready
    else {
        window.setTimeout(function() {
            thisObject.play();
        }, 50);
    }
};


const GAME_FIELD_HEIGHT = 960;
const GAME_FIELD_WIDTH = 540;
const GAME_SPEED = 20;