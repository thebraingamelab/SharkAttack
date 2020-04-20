(function () {
    "use strict";

    
    ///////////////////////////////////////
    // Helper functions/objects
    ///////////////////////////////////////

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
            timeout = setTimeout(later, delay);

            if (callNow) 
                func.apply(context, args);
        };
    }


    // Cloneable Pool
    function CloneablePool(cloneable) {
        this.template = cloneable;

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
        return this.right() >= r2.left() && this.left() <= r2.right() &&
               this.top() <= r2.bottom() && this.bottom() >= r2.top();
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
        this.timer = 0;
        this.currentFrame = 0;
        this.image = image;
        this.animationEndEvent = null;

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
        this.timer = 0;
        this.currentFrame = 0;
        this.image = image;

        return this;
    };

    Sprite.prototype.resetAnimation = function () {
        this.currentFrame = 0;
    };

    Sprite.prototype.update = function (dt) {
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
        this.image = null;
        this.animationEndEvent = null;
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

        return this;
    };


    ///////////////////////////////////////
    // Game entities
    ///////////////////////////////////////
    
    // Entity superclass
    function Entity(x, y, width, height, sprite) {
        this.x = x;
        this.y = y;

        this.time = 0;
        this.draw = true;

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
        this.time = 0;
        this.draw = true;
        this.sprite = null;
    };

    Entity.prototype.clone = function () {
        return new Entity(this.x, this.y, this.width, this.height, this.sprite);
    };

    // Update time step
    Entity.prototype.update = function (dt) {
        this.time += dt;
    };
    
    // Entity rectangle collision
    Entity.prototype.collisionRect = function () {
        this.hitbox.x = this.x;
        this.hitbox.y = this.y;
        this.hitbox.width = this.width;
        this.hitbox.height = this.height;

        return this.hitbox;
    };

    // 1px line for collision
    Entity.prototype.collisionLine = function () {
        this.hitbox.x = this.x - this.width/2;
        this.hitbox.y = this.y - this.height/2;
        this.hitbox.width = this.width;
        this.hitbox.height = 1;

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
        Entity.call(this, x, y, 40, 40, sprite);

        this.rangeOfMovement = 4;
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
        Entity.call(this, x, y, 40, 40, sprite);
        
        this.invisPointY = invisPointY;
        this.speed = speed;
        this.isFake = false;
        this.lane = 1;
        this.triggeredWave = false;
        this.triggeredPause = false;
    }

    // Enemy extends Entity
    Enemy.prototype = Object.create(Entity.prototype);

    Enemy.prototype.init = function () {
        Entity.prototype.init.call(this);

        this.invisPointY = 0;
        this.speed = 0;
        this.lane = 1;
        this.isFake = false;
        this.triggeredWave = false;
        this.triggeredPause = false;
    };

    Enemy.prototype.clone = function () {
        return new Enemy(this.x, this.y, this.speed, this.invisPointY, this.sprite);
    };

    // Update time step
    Enemy.prototype.update = function (dt) {
        Entity.prototype.update.call(this, dt);

        this.y += this.speed;
    };

    // object for a list of audio channels
    function ChannelList(audioElement, numChannels) {
        this.muted = false;
        this.channel = 0;
        this.channelList = [audioElement];

        let i;
        for (i = 1; i < numChannels; i++) {
            this.channelList.push(audioElement.cloneNode(true));
        }
    }

    ChannelList.prototype.play = function() {
        if (!this.muted) {
            this.channelList[this.channel].play();
            this.channel = (this.channel+1) % this.channelList.length;
        }
    };

    ChannelList.prototype.setVolume = function(vol) {
        let i;
        for (i = 0; i < this.channelList.length; i++) {
            this.channelList[i].volume = vol;
        }
    };

    ChannelList.prototype.mute = function() {
        this.muted = true;
    };

    ChannelList.prototype.unmute = function() {
        this.muted = false;
    };


    ///////////////////////////////////////
    // Controllers
    ///////////////////////////////////////
    let renderer, game, resources;

    const GAME_FIELD_HEIGHT = 720;
    const GAME_FIELD_WIDTH = 480;
    const GAME_SPEED = 20;

    // Resources
    ///////////////////////////////////////
    resources = (function () {
        // Sprites
        // eventDriven(imgPath, width, height, frameWidth, frameHeight, frames, frameRate, row, col)
        // tiled(imgPath, width, height, frameWidth, frameHeight, row, col, xTiles, yTiles)
        let _spritePool = new CloneablePool(new Sprite(null, 0, 0, 0, 0));

        //let _playerWalkingUp = _spritePool.take().eventDriven("build/sprites/animals.png", 60, 60, 26, 37, 2, 6, 3, 3);
        //_playerWalkingUp.animationEndEvent = _playerWalkingUp.resetAnimation;
        let _enemySprite = _spritePool.take().eventDriven("build/sprites/cat.png", 65, 54, 197, 162, 1, 0, 0, 0);
        //let _playerExplode = _spritePool.take().eventDriven("build/sprites/explosion.png", 51, 51, 223, 174, 21, 21, 0, 0);
        //let _pileOfLeaves = _spritePool.take().tiled("build/sprites/grassland.png", GAME_FIELD_WIDTH, 60, 128, 128, 15, 4, 6, 1);
        let _tapIcon = _spritePool.take().eventDriven("build/sprites/tap.png", 75, 76, 75, 76, 2, 3, 0, 0);
        _tapIcon.animationEndEvent = _tapIcon.resetAnimation;
        let _tiledGrass = _spritePool.take().tiled("build/sprites/grassland.png", GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT, 128, 128, 0, 0, 4, 10);
        let _bigX = _spritePool.take().eventDriven("build/sprites/bigx.png", 45, 60, 239, 299, 1, 0, 0, 0);
        let _collar = _spritePool.take().eventDriven("build/sprites/collar.png", 128, 128, 1024, 1024, 1, 0, 0, 0);
        let _check = _spritePool.take().eventDriven("build/sprites/check.png", 75, 75, 775, 552, 1, 0, 0, 0);

        // Audio
        let _valid = new ChannelList(document.getElementById("valid"), 4);
        //_valid.setVolume(0.2);

        let _error = new ChannelList(document.getElementById("error"), 4);
        //_error.setVolume(0.2);

        let _bgm = document.getElementById("bgm");
        _bgm.loop = true;
        //_bgm.volume = 0.05;

        return {
            //spr_playerWalkingUp: function() { return _spritePool.take().copyAttributes(_playerWalkingUp); },
            spr_enemy: function() { return _spritePool.take().copyAttributes(_enemySprite); },
            //spr_explosion: function() { return _spritePool.take().copyAttributes(_playerExplode); },
            //spr_leafPile: function() { return _spritePool.take().copyAttributes(_pileOfLeaves); },
            spr_tapIcon: function() { return _spritePool.take().copyAttributes(_tapIcon); },
            spr_tiledGrass: function() { return _spritePool.take().copyAttributes(_tiledGrass); },
            spr_bigX: function() { return _spritePool.take().copyAttributes(_bigX); },
            spr_collar: function() { return _spritePool.take().copyAttributes(_collar); },
            spr_check: function() { return _spritePool.take().copyAttributes(_check); },

            snd_valid: _valid,
            snd_error: _error,
            snd_bgm: _bgm,

            setMasterVolume: function(vol) {
                if (vol <= 0) {
                    _valid.mute();
                    _error.mute();
                    _bgm.pause();
                }
                else {
                    _valid.unmute();
                    _error.unmute();
                    _bgm.play();

                    _valid.setVolume(vol);
                    _error.setVolume(vol);
                    _bgm.volume = vol;
                }
            },

            putSpriteBack: function(spr) { _spritePool.putBack(spr); }
        };
    })();

    // Renderer
    ///////////////////////////////////////
    renderer = (function () {
        // Figure out if user device is android or ios
        const _ua = navigator.userAgent.toLowerCase();
        const _android = _ua.indexOf('android') > -1;
        const _ios = /ipad|iphone|ipod/i.test(_ua) && !window.MSStream;

        let _livesDiv;
        let _previousLives = 0;

        let _startBtn = document.getElementById("start_button");

        let _canvas = document.getElementById("gameWindow");
        let _context = _canvas.getContext("2d");

        let _currentHeight = GAME_FIELD_HEIGHT;
        let _currentWidth = GAME_FIELD_WIDTH;
        
        // Adjust initial canvas size
        _canvas.width = GAME_FIELD_WIDTH;
        _canvas.height = GAME_FIELD_HEIGHT;

        // Resize it according to device
        window.addEventListener('load', _resize, false);
        window.addEventListener('resize', debounce(_resize, 250, false), false);

        function _resize() {
            const addressBarHeight = 50;
            let ratio = GAME_FIELD_WIDTH / GAME_FIELD_HEIGHT;
            let container = document.getElementById("container");

            // Get correct  dimensions
            _currentHeight = window.innerHeight;
            _currentWidth = _currentHeight * ratio;

            // Cancel previous livesDiv settings
            if(_livesDiv) {
                _livesDiv.style.display = "none";
            }

            // Overlay the lives if there's no room up top
            _livesDiv = document.getElementById("overlay");
            _livesDiv.style.display = "initial";

            // Add enough size to scroll down 
            // past the address bar on ios or android
            if (_android || _ios) {
                document.body.style.height = (window.innerHeight + addressBarHeight) + 'px';
            }

            // Double check aspect ratio
            if (_currentWidth > window.innerWidth) {
                // resize to fit width
                ratio = GAME_FIELD_HEIGHT / GAME_FIELD_WIDTH;

                // Get correct  dimensions
                _currentWidth = window.innerWidth;
                _currentHeight = _currentWidth * ratio;

                // Fill extra space
                _livesDiv.style.display = "none";
                _livesDiv = document.getElementById("widebar");
                _livesDiv.style.display = "initial";
                _livesDiv.style.height = (window.innerHeight - _currentHeight)+'px';
            }

            // Adjust canvas accordingly
            _canvas.style.width = _currentWidth + 'px';
            _canvas.style.height = _currentHeight + 'px';
            container.style.width = _currentWidth + 'px';
            container.style.height = _currentHeight + 'px';

            // Center the container
            container.style.marginLeft = "-" + (_currentWidth/2) + 'px';

            // Automagically scroll down to get rid
            // of address bar
            window.setTimeout(function() {
                    window.scrollTo(0,1);
            }, 1);

            // Update UI elements
            _updateUI(true);
        }

        // Draw a sprite to the context
        function _drawSprite(sprite, x, y) {
            // If the image is static or the animation reached its end,
            // only draw the last frame (sometimes the only frame)
            if (sprite.frameRate <= 0 || sprite.currentFrame >= sprite.frames) {
                _context.drawImage(sprite.image,
                                    sprite.width*(sprite.frames-1), 0,
                                    sprite.width, sprite.height,
                                    x, y,
                                    sprite.width, sprite.height);
            }

            // Otherwise, draw the correct frame of the animated sprite
            else {
                _context.drawImage(sprite.image,
                                    sprite.width*sprite.currentFrame, 0,
                                    sprite.width, sprite.height,
                                    x, y,
                                    sprite.width, sprite.height);
            }
            
        }

        // Draw moving background
        let _drawBG = (function () {
            let y = 0;
            let movingSpeed = GAME_SPEED;
            let bgImg = resources.spr_tiledGrass();

            return function () {
                _drawSprite(bgImg, 0, y-GAME_FIELD_HEIGHT);
                _drawSprite(bgImg, 0, y);

                if (game.accelerating() && !game.gameOver())
                    y += movingSpeed;

                if (y >= GAME_FIELD_HEIGHT)
                    y = 0;
            };
        })();

        function _updateUI(forceUpdate=false) {
            let numLives;
            let i;

            if (!game.started()) {
                // Hide lives
                //_livesDiv.style.display = "none";
                
                // Make start button disappear
                _startBtn.style.display = "block";
            }
            else {
                // Show lives
                //_livesDiv.style.display = "flex";

                // Make start button disappear
                _startBtn.style.display = "none";

                numLives = game.player().life;
                // Update Player Lives
                if( _previousLives !== numLives || forceUpdate) {
                    _previousLives = numLives;


                    for (i = 0; i < _livesDiv.childNodes.length; i++) {
                        if (_livesDiv.childNodes[i] instanceof Image) {
                            _livesDiv.removeChild(_livesDiv.childNodes[i]);
                            i--;
                        }
                    }

                    // Add an image for each life
                    for (i = 0; i < numLives; i++) {
                        let img = document.createElement("img");
                        img.src = resources.spr_collar().image.src;
                        img.className = "life";

                        _livesDiv.appendChild(img);
                    }
                }
            }
        }

        // Render game elements and entities
        function _render(dt) {
            let entity;
            let entities = game.entities();
            let i, len = entities.length;

            // Fill background
            _drawBG();
            
            // Update UI
            _updateUI();

            // Draw every game entity and update their sprites
            for (i = 0; i < len; i++) {
                entity = entities[i];

                //_context.fillStyle = "#FF0000";
                //_context.fillRect(entity.x, entity.y, entity.width, entity.height);

                //if (clickBox !== null)
                //   _context.fillRect(clickBox.x, clickBox.y, clickBox.width, clickBox.height);

                if (game.accelerating() || entity instanceof TempEntity) {
                    entity.sprite.update(dt);
                }

                if (entity.draw && entity instanceof TempEntity) {
                    _drawSprite(entity.sprite, entity.x, entity.y);
                }

                else if (entity.draw) {
                    _drawSprite(entity.sprite, entity.x-(entity.width/4), entity.y-(entity.height/2));
                }
            }
        }

        return {
            render: _render,
            GAME_FIELD_WIDTH: GAME_FIELD_WIDTH,
            GAME_FIELD_HEIGHT: GAME_FIELD_HEIGHT,
            canvas: _canvas,

            isIOS: function() { return _ios; },
            currentWidth: function () { return _currentWidth; }
        };

    })();

    // Game
    ///////////////////////////////////////
    game = (function() {
        /* jshint validthis: true */

        let _tempPool = new CloneablePool(new TempEntity(0, 0, 0, 0, null));
        let _enemyPool = new CloneablePool(new Enemy(0, 0, 0, 0, null));

        let _entities, _entitiesToRemove, _enemies, _frontRowEnemies;
        let _player;
        let _enemySpeed = GAME_SPEED;

        let _stoppingThreshold = GAME_FIELD_HEIGHT - (GAME_FIELD_HEIGHT/5);
        let _newWaveThreshold = GAME_FIELD_HEIGHT / 4;
        let _clickZone = GAME_FIELD_HEIGHT - GAME_FIELD_HEIGHT/3;

        let _lastFrameTime;
        
        let _accelerating;
        let _inputBuffered, _inputEventFired;

        let _started = false;
        let _gameOver;

        let _tutorialEnabled = true;
        let _tutorialLanes;

        let _updateFunc;
        let _gameOverAnimation;

        let _score;
        let _highScores;

        let _lanes = (function() {
            const NUM_LANES = 6;

            let laneList = [];
            let i;

            // Populate the list of lanes with the x coord of each right bound
            for (i = 1; i <= NUM_LANES; i++) {
                laneList.push(GAME_FIELD_WIDTH * (i/NUM_LANES));
            }

            // Get the lane number by x coordinate
            function getLaneByLocation(x) {
                for (i = 0; i < NUM_LANES; i++) {
                    if ( x < laneList[i] ) {
                        return i;
                    }
                }

                return -1;
            }

            // Get the center of a numbered lane
            function getCenterX(laneNumber) {
                return (GAME_FIELD_WIDTH / NUM_LANES) * laneNumber + 20;
            }

            return {
                NUM_LANES: NUM_LANES,
                getLaneByLocation: getLaneByLocation,
                getCenterX: getCenterX
            };
        })();

        // Spawn a wave of enemies
        let _waves = (function() {
            let numClones;
            let invisTurningPoint; 
            let wavesPassed;
            let cloneList;

            function updateWavesPassed() {
                wavesPassed++;
            }

            function init() {
                numClones = 0;
                wavesPassed = 0;
                cloneList = [];
                // Initialize to something that enemies will never reach
                invisTurningPoint = GAME_FIELD_HEIGHT * 2;
            }

            function spawn() {
                let enemy, realEnemy, enemyLane, i;
                //console.log(wavesPassed);
                // Wave events
                switch(wavesPassed) {
                    case 5:
                        numClones = 1;
                        invisTurningPoint = GAME_FIELD_HEIGHT * (3/4);
                        break;

                    case 20:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 2;
                        break;

                    case 35:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 3;
                        break;

                    case 80:
                        numClones = 2;
                        invisTurningPoint = GAME_FIELD_HEIGHT * (3/4);
                        break;

                    case 100:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 2;
                        break;

                    case 140:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 3;
                        break;

                    case 220:
                        numClones = 3;
                        invisTurningPoint = GAME_FIELD_HEIGHT * (3/4);
                        break;

                    case 240:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 2;
                        break;

                    case 350:
                        invisTurningPoint = GAME_FIELD_HEIGHT / 3;
                        break;

                    default:
                        if (wavesPassed > 350) {
                            invisTurningPoint = GAME_FIELD_HEIGHT / 5;
                        }
                }

                // make several enemies

                enemyLane = randomInt(_lanes.NUM_LANES - numClones);

                for (i = 0; i <= numClones; i++) {
                    enemy = _enemyPool.take();

                    enemy.lane = enemyLane+i;
                    enemy.x = _lanes.getCenterX(enemyLane+i);
                    enemy.y = -10;
                    enemy.speed = _enemySpeed;
                    enemy.invisPointY = invisTurningPoint;
                    enemy.sprite = resources.spr_enemy();
                    enemy.draw = false;
                    enemy.isFake = true;
                    enemy.triggeredWave = false;
                    enemy.triggeredPause = false;

                    cloneList[i] = enemy;
                    _addEntity(enemy);
                }

                // Pick an enemy to be the real one
                realEnemy = cloneList[randomInt(cloneList.length)];
                realEnemy.isFake = false;
                realEnemy.draw = true;

                return realEnemy.lane;
            }

            return {
                init: init,
                spawn: spawn,
                updateWavesPassed: updateWavesPassed,
                wavesPassed: function() { return wavesPassed; }
            };
        })();
        // Add onto game score
        function _addScore(num) {
            _score += num;
            //console.log(_score);
        }

        // Insert a score into list of high scores
        function _insertScore(score) {
            _highScores.push(score);
            // Sort scores, highest first
            _highScores.sort(function(a, b){return b-a;});
            // Only top 10 scores
            _highScores = _highScores.slice(0, 10);
            // Insert into local storage
            if (typeof(Storage) !== "undefined") {
                localStorage.nBackScores = JSON.stringify(_highScores);
            }
        }

        // Toggle buffer flag
        function _toggleInputBuffer() {
            _inputBuffered = !_inputBuffered;
        }


        // Speed up wave until past player; player cannot move during this time
        function _toggleAcceleration() {
            _accelerating = !_accelerating;
        }

        function _setInputEventFired() {
            _inputEventFired = true;
        }

        // Game over
        function _setGameOver() {
            if (!_gameOver) {
                _gameOver = true;
                //_player.sprite = resources.spr_explosion();
                _insertScore(Math.round(_score));
                
                console.log(_highScores);
            }
        }

        // Start game
        function _start() {
            if (_entities) { 
                _removeEntities(_entities);
            }
            _entities = [];
            _enemies = [];
            _frontRowEnemies = [];
            _entitiesToRemove = [];
            _tutorialLanes = [];
            _gameOver = false;
            _accelerating = true;
            _inputBuffered = false;
            _inputEventFired = false;
            _score = 0;
            _lastFrameTime = 0;
            _waves.init();

            // Access/store high scores in local storage
            if (typeof(Storage) !== "undefined") {
                try {
                    _highScores = JSON.parse(localStorage.nBackScores);
                }
                catch(e) {
                    _highScores = [];
                }
            }

            // Start background music
            resources.snd_bgm.play();

            // Spawn player and first wave
            //_addEntity(new Player(_lanes.getCenterX(1), GAME_FIELD_HEIGHT-60, resources.spr_playerWalkingUp()));
            _player = new Player(-100, -100, null);
            _tutorialLanes.push(_waves.spawn());

            // Begin game loop
            if (!_started) {
                _started = true;
                _updateFunc = this.update.bind(this);

                if (_gameOverAnimation)
                    window.cancelAnimationFrame(_gameOverAnimation);

                window.requestAnimationFrame(_updateFunc);
            }
        }

        // Add an entity into the game
        function _addEntity(entity) {
            if (entity instanceof Player) {
                _player = entity;
            }

            else if (entity instanceof Enemy) {
                _enemies.push(entity);
            }

            _entities.push(entity);
        }

        // Remove entities from game
        function _removeEntities(entitiesToRemove) {
            let i, len = entitiesToRemove.length;

            // Don't do anything if no entities to remove
            if (len === 0) {
                return;
            }
            
            // Go through the arrays and remove those in the kill list
            // (note: because of mutableRemoveIndex, we have to count down
            //  to 0; if counting up to len, i will surpass the length of
            //  the array due to length changing as entities are removed)
            for (i = len-1; i >= 0; i--) {
                let entityToRemove = entitiesToRemove[i];
                let idxToRemove;

                // Put back the entity's sprite
                if (entityToRemove.sprite !== null)
                    resources.putSpriteBack(entityToRemove.sprite);

                // General entities array
                idxToRemove = _entities.indexOf(entityToRemove);
                
                // Only remove if it's actually there
                if (idxToRemove >= 0)
                    mutableRemoveIndex(_entities, idxToRemove);

                // Enemies
                idxToRemove = _enemies.indexOf(entityToRemove);

                // Only remove if it's actually there
                if (idxToRemove >= 0) {
                    mutableRemoveIndex(_enemies, idxToRemove);
                    // Put the object back in its pool
                    _enemyPool.putBack(entityToRemove);
                }

                // Temporary Entitites
                if (entityToRemove instanceof TempEntity)
                    _tempPool.putBack(entityToRemove);
            }
    
            // Wipe player off the face of the planet if
            // we must
            if (entitiesToRemove.includes(_player)) {
                _player = undefined;
            }
        }

        // Update game
        function _update(time) {
            let entity;
            let alertZone;
            let pauseThresholdPassed = false;
            let wavesPassed = _waves.wavesPassed();
            let i, len = _entities.length;

            // Smooth FPS
            let dt = Math.min((time - _lastFrameTime) / 1000, 3/60);

            _lastFrameTime = time;

            // Stop game if game over is reached
            if (_gameOver) {
                renderer.render(dt);
                _started = false;
                _gameOverAnimation = window.requestAnimationFrame(_updateFunc);
                return;
            }

            // Update all entities
            for (i = 0; i < len; i++) {
                entity = _entities[i];
                alertZone = entity.invisPointY-_newWaveThreshold;

                if (_accelerating)
                    entity.update(dt);

                // Enemy in the clickZone? Keep track in frontRow array
                if (entity instanceof Enemy && 
                    entity.y >= _clickZone &&
                    _frontRowEnemies.indexOf(entity) < 0) {
                        
                        _frontRowEnemies.push(entity);
                }

                // Entity offscreen? Delet
                if (entity.y > GAME_FIELD_HEIGHT) {
                    _entitiesToRemove.push(entity);

                    if (entity instanceof Enemy && !entity.isFake) {
                        // Increment waves passed
                        //_waves.updateWavesPassed();

                        // Lose life for missing one
                        //_player.loseLife();
                        
                        if (_inputBuffered)
                            _toggleInputBuffer();
                    }
                }

                /*/ Check collisions with player
                else if (entity instanceof Enemy &&
                        !entity.isFake && 
                        entity.isCollidingWith(_player)) {
                    // Add life, kill enemy, update waves passed
                    _player.addLife();
                    _entitiesToRemove.push(entity);
                    
                    _wavesPassed++;

                    if (_inputBuffered)
                        _toggleInputBuffer();
                }*/

                // About to be invisible? Flash!
                else if (entity instanceof Enemy &&
                        entity.isFake &&
                        entity.y >= alertZone &&
                        entity.y < entity.invisPointY) {
                        
                    entity.draw = !entity.draw;
                }

                // Invisible?
                else if (entity instanceof Enemy &&
                         entity.isFake &&
                         entity.y >= entity.invisPointY) {

                    entity.draw = true;
                }

                // Tutorial section?
                if (_tutorialEnabled) {
                    let tutorialTap;

                    // First 3 waves come with tutorial tap
                    if (0 <= wavesPassed && wavesPassed <= 2 &&
                        _accelerating && 
                        !_inputBuffered &&
                        entity instanceof Enemy &&
                        entity.y >= _stoppingThreshold &&
                        !entity.triggeredPause) {

                                // Pause
                                pauseThresholdPassed = true;
                                entity.triggeredPause = true;

                                // Create tutorial stuff
                                tutorialTap = _tempPool.take();

                                tutorialTap.x = _lanes.getCenterX( _tutorialLanes[wavesPassed] );
                                tutorialTap.y = _stoppingThreshold;
                                tutorialTap.sprite = resources.spr_tapIcon();
                                tutorialTap.width = tutorialTap.sprite.width;
                                tutorialTap.height = tutorialTap.sprite.height;

                                _addEntity(tutorialTap);
                    }

                    // Then spawn a couple waves of invis guys that still flash, with tutorial tap
                    

                    // End tutorial, begin real stuff
                    else if (wavesPassed >= 3) {
                        _tutorialEnabled = false;
                    }
                }

                // Pause the game when a wave is within a distance
                // of the player
                else if (_accelerating && 
                    !_inputBuffered &&
                    entity instanceof Enemy &&
                    entity.y >= _stoppingThreshold &&
                    !entity.triggeredPause) {

                        pauseThresholdPassed = true;
                        entity.triggeredPause = true;
                }

                // Spawn a new wave after previous wave passed
                // a certain distance
                if (entity instanceof Enemy &&
                    !entity.isFake &&
                    entity.y >= _newWaveThreshold &&
                    !entity.triggeredWave) {

                    let enemyLane = _waves.spawn();
                    entity.triggeredWave = true;
                    

                    if (_tutorialEnabled)
                        _tutorialLanes.push(enemyLane);
                }

                // Remove temp entities when an input event is fired
                if (_inputEventFired && entity instanceof TempEntity)
                    _entitiesToRemove.push(entity);
            }

            if (pauseThresholdPassed) {
                _toggleAcceleration();
                _toggleInputBuffer();
            }

            // Toggle flag
            if (_inputEventFired)
                _inputEventFired = false;

            // Delete offscreen or absorbed enemies
            _removeEntities(_entitiesToRemove);
            _entitiesToRemove.length = 0;

            // Render frame
            renderer.render(dt);

            // Loop
            window.requestAnimationFrame(_updateFunc);
        }

        return {
            start: _start,
            update: _update,
            setGameOver: _setGameOver,
            addScore: _addScore,
            toggleAcceleration: _toggleAcceleration,
            toggleInputBuffer: _toggleInputBuffer,
            setInputEventFired: _setInputEventFired,
            lanes: _lanes,
            addEntity: _addEntity,
            clickZone: _clickZone,
            updateWavesPassed: _waves.updateWavesPassed,
            accelerating: function() { return _accelerating; },
            inputBuffered: function() { return _inputBuffered; },
            //score: function() { return _score; },
            //highScores: function () { return _highScores; },
            started: function() { return _started; },
            gameOver: function() { return _gameOver; },
            entities: function () { return _entities; },
            enemies: function () { return _enemies; },
            player: function () { return _player; },
            frontRowEnemies: function () { return _frontRowEnemies; }
        };


    })();

    //////////////////////////////////////
    // Input Handling
    ///////////////////////////////////////
    let clickBoxSize = 40;
    let clickBox = new Rectangle(-1*clickBoxSize, -1*clickBoxSize, clickBoxSize, clickBoxSize+10);
    let lastEvent = null;
    let eventTime = null;
    let inputDeviceSwapTime = 1000;

    
    // Touch
    ///////////////////////////////////////
    renderer.canvas.addEventListener("touchstart", function(event) {
        event.preventDefault();

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

   
    // Mouse
    ///////////////////////////////////////
    renderer.canvas.addEventListener("mousedown", function(event) {
        event.preventDefault();

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


    
    // Input Helper Functions
    ///////////////////////////////////////

    // The bulk of the handler for touch or mouse event
    function inputHandler(event) {
        if (!game.started()) return;

        let clickLocation;
        let clickZone = game.clickZone;
        let enemy, enemies = game.frontRowEnemies(), player = game.player();
        let i, len = enemies.length;
        
        // Touch input
        if (event.type === "touchstart") {
            clickLocation = getRelativeEventCoords(event.changedTouches[0]);
        }

        // Mouse click input
        else if (event.type === "mousedown") {
            clickLocation = getRelativeEventCoords(event);
        }

        // Only register the input if the game is running
        if (!game.gameOver() && player && 
            clickLocation.y >= clickZone) {

            clickBox.x = clickLocation.x - (clickBoxSize/2);
            clickBox.y = clickLocation.y - (clickBoxSize/2);

            // Did the user click on an enemy?
            for (i = 0; i < len; i++) {
                enemy = enemies[i];

                if (enemy.draw && enemy.collisionRect().intersects(clickBox)) {

                    // If the clicked enemy is fake, lose life
                    if (enemy.isFake) {
                        enemy.sprite = resources.spr_bigX();
                        player.loseLife();
                        resources.snd_error.play();
                    }

                    // It's real! Gain a life
                    else {
                        enemy.sprite = resources.spr_check();
                        player.addLife();
                        resources.snd_valid.play();
                    }

                    // Toggle event flag
                    game.setInputEventFired();

                    // Unpause the game
                    if (!game.accelerating())
                        game.toggleAcceleration();
                    
                    // If the game is already unpaused, buffer the input
                    else if (!game.inputBuffered())
                        game.toggleInputBuffer();


                    // Reset the front row for next wave
                    enemies.length = 0;
                    game.updateWavesPassed();

                    return;
                }
                
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

    // Configure volume
    let overlaySlider = document.querySelector("#overlay-volume~.slider");
    let widebarSlider = document.querySelector("#widebar-volume~.slider");
    let overlayLabel = document.querySelector("#overlay-volume+label>i");
    let widebarLabel = document.querySelector("#widebar-volume+label>i");

    document.getElementById("overlay-volume").checked = false;
    document.getElementById("widebar-volume").checked = false;

    function volHandler(label, slider) {
        let vol = slider.value;
        vol = Number(vol);

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

        if (vol <= 0) {
            label.innerHTML = "volume_mute";
        }
        else {
            label.innerHTML = "volume_up";
        }

        resources.setMasterVolume(vol);
    }

    overlaySlider.addEventListener("mouseup", function(e) {
        volHandler(overlayLabel, overlaySlider);
    });
    widebarSlider.addEventListener("mouseup", function(e) {
        volHandler(widebarLabel, widebarSlider);
    });

    if (renderer.isIOS()) {
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

        overlaySlider.addEventListener("touchend", function(e) {
            e.preventDefault();
            volHandler(overlayLabel, overlaySlider);
        });
        widebarSlider.addEventListener("touchend", function(e) {
            e.preventDefault();
            volHandler(widebarLabel, widebarSlider);
        });
    }
    //overlayVol.addEventListener("mouseup", volHandler(overlayLabel, overlayVol.value));
    //widebarVol.addEventListener("mouseup", volHandler(widebarLabel, widebarVol.value));

    // Start the game when the button is clicked
    document.getElementById("start_button").addEventListener("click", 
    function() {
        game.start(); 
    });

    
    /*//////////////////////////////////////
    // Click input
    ///////////////////////////////////////

    function clickStart(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        console.log("click");

        let clickLocation = getRelativeEventCoords(e);
        let player = game.player();
        let i;
        let enemy, newX = -1, newY = -1;
        

        // Only register the input if the game is running
        if (!game.gameOver() && player && 
            clickLocation.y >= clickZoneY) {

            clickBox.x = clickLocation.x-5;
            clickBox.y = clickLocation.y-5;

            // Did the user click on an enemy?
            for (i = 0; i < game.enemies().length; i++) {
                enemy = game.enemies()[i];

                if (enemy.draw && enemy.collisionRect().intersects(clickBox)) {
                    //newX = enemy.x;
                    //newY = enemy.y;

                    if (enemy.isFake) {
                        enemy.sprite = resources.spr_bigX();
                        player.loseLife();
                    }
                    else {
                        enemy.sprite = resources.spr_explosion();
                        player.addLife();
                    }
                    // Toggle event flag
                    game.setInputEventFired();

                    // Unpause the game
                    if (!game.accelerating())
                        game.toggleAcceleration();
                    
                    // If the game is already unpaused, buffer the input
                    else if (!game.inputBuffered())
                        game.toggleInputBuffer();
                    }
                
            }

            /* Move the player
            
            // Missed?
            //if (newX !== -1 || newY !== -1) {
            //    player.move(newX, GAME_FIELD_HEIGHT-60);

                // Toggle event flag
            //    game.setInputEventFired();

                // Unpause the game
            //    if (!game.accelerating())
            //        game.toggleAcceleration();
                
                // If the game is already unpaused, buffer the input
            //    else if (!game.inputBuffered())
            //        game.toggleInputBuffer();
            //}
            
        }
    }
    
    renderer.canvas.addEventListener("mousedown", clickStart);

    ///////////////////////////////////////
    // Touch input
    //////////////////////////////////////
    
    function touchStart(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        console.log("touch");

        let touches = e.changedTouches;
        let enemy;
        let touchLocation;
        let player = game.player();
        let i, j;

        //touchLocation = getRelativeEventCoords(touches[touches.length-1]);

        // Only register the input if the game is running
        if (!game.gameOver() && player) {

            for (i = touches.length - 1; i >= 0; i--) {

                touchLocation = getRelativeEventCoords(touches[i]);

                clickBox.x = touchLocation.x-5;
                clickBox.y = touchLocation.y-5;
                

                // Did the user click on an enemy?
                for (j = 0; j < game.enemies().length && touchLocation.y >= clickZoneY; j++) {

                    enemy = game.enemies()[j];

                    if (enemy.draw && enemy.collisionRect().intersects(clickBox)) {

                        if (enemy.isFake) {
                            enemy.sprite = resources.spr_bigX();
                            player.loseLife();
                        }
                        else {
                            enemy.sprite = resources.spr_explosion();
                            player.addLife();
                        }
                        // Toggle event flag
                        game.setInputEventFired();

                        // Unpause the game
                        if (!game.accelerating())
                            game.toggleAcceleration();
                        
                        // If the game is already unpaused, buffer the input
                        else if (!game.inputBuffered())
                            game.toggleInputBuffer();
                    }
                
                }
            }
        }
    }

    renderer.canvas.addEventListener("touchstart", touchStart);*/

    /*/////////////////////////////////////
    // Keyboard input
    ///////////////////////////////////////
    let keybinds = {
        // num keys 1-4
        49: 0,
        50: 1,
        51: 2,
        52: 3
    };

    function keyDown(e) {
        // which or keyCode depends on browser support
        let key = e.which || e.keyCode;

        // Move player to lane according to key pressed
        if(keybinds[key] !== undefined && game.player() && !game.gameOver()) {
            e.preventDefault();
            
            game.player().move(keybinds[key]);

            if (!game.accelerating())
                game.toggleAcceleration();
            else if (!game.inputBuffered())
                game.toggleInputBuffer();
        }
    }

    document.body.addEventListener('keydown', keyDown);*/
})();