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
        let i;

        // If there is an available object, return it.
        for(i = 0; i < this.pool.length; i++) {
            if(this.pool[i].available) {
                this.pool[i].available = false;
                this.pool[i].object.init();
                return this.pool[i].object;
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
        let i;

        // Mark the object as available again.
        for(i = 0; i < this.pool.length; i++) {
            if (this.pool[i].object === cloneable) {
                this.pool[i].available = true;
                break;
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
        this.hitbox.x = this.x - this.width/2;
        this.hitbox.y = this.y - this.height/2;
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
        this.maxLife = 75;
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
        this.life += 25;
        
        if (this.life >= this.maxLife)
            this.life = this.maxLife;
    };

    // Decrease life
    Player.prototype.loseLife = function () {
        this.life -= 25;
        
        if (this.life <= 0)
            game.setGameOver();
    };

    // Move player to a lane 1-4
    Player.prototype.move = function (laneNum) {
        // 4 lanes of movement on screen
        this.x = game.lanes.getCenterX(laneNum);
    };

    // Enemy object
    function Enemy(x, y, speed, invisPointY, sprite) {
        Entity.call(this, x, y, 40, 10, sprite);
        
        this.invisPointY = invisPointY;
        this.speed = speed;
        this.disappeared = false;
    }

    // Enemy extends Entity
    Enemy.prototype = Object.create(Entity.prototype);

    Enemy.prototype.init = function () {
        Entity.prototype.init.call(this);

        this.invisPointY = 0;
        this.speed = 0;
        this.disappeared = false;
    };

    Enemy.prototype.clone = function () {
        return new Enemy(this.x, this.y, this.speed, this.invisPointY, this.sprite);
    };

    // Update time step
    Enemy.prototype.update = function (dt) {
        Entity.prototype.update.call(this, dt);

        this.y += this.speed;
    };

    ///////////////////////////////////////
    // Controllers
    ///////////////////////////////////////
    let renderer, game, resources;

    const GAME_FIELD_HEIGHT = 720;
    const GAME_FIELD_WIDTH = 480;

    // Resources
    resources = (function () {
        let _spritePool = new CloneablePool(new Sprite(null, 0, 0, 0, 0));

        let _playerWalkingUp = _spritePool.take().eventDriven("build/sprites/animals.png", 60, 60, 26, 37, 2, 6, 3, 3);
        _playerWalkingUp.animationEndEvent = _playerWalkingUp.resetAnimation;
        let _enemySprite = _spritePool.take().eventDriven("build/sprites/animals.png", 60, 60, 26, 36, 1, 0, 4, 7);
        let _playerExplode = _spritePool.take().eventDriven("build/sprites/explosion.png", 60, 60, 223, 174, 21, 21, 0, 0);
        let _pileOfLeaves = _spritePool.take().tiled("build/sprites/grassland.png", GAME_FIELD_WIDTH, 60, 128, 128, 15, 4, 6, 1);
        let _tapIcon = _spritePool.take().eventDriven("build/sprites/tap.png", 75, 76, 75, 76, 2, 3, 0, 0);
        _tapIcon.animationEndEvent = _tapIcon.resetAnimation;
        let _tiledGrass = _spritePool.take().tiled("build/sprites/grassland.png", GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT, 128, 128, 4, 6, 4, 10);

        return {
            spr_playerWalkingUp: function() { return _spritePool.take().copyAttributes(_playerWalkingUp); },
            spr_enemy: function() { return _spritePool.take().copyAttributes(_enemySprite); },
            spr_explosion: function() { return _spritePool.take().copyAttributes(_playerExplode); },
            spr_leafPile: function() { return _spritePool.take().copyAttributes(_pileOfLeaves); },
            spr_tapIcon: function() { return _spritePool.take().copyAttributes(_tapIcon); },
            spr_tiledGrass: function() { return _spritePool.take().copyAttributes(_tiledGrass); },

            putSpriteBack: function(spr) { _spritePool.putBack(spr); }
        };
    })();

    // Renderer
    renderer = (function () {
        let _canvas = document.querySelector("#gameWindow");
        let _context = _canvas.getContext("2d");

        let _currentHeight = GAME_FIELD_HEIGHT;
        let _currentWidth = GAME_FIELD_WIDTH;
        
        // Adjust initial canvas size
        _canvas.width = GAME_FIELD_WIDTH;
        _canvas.height = GAME_FIELD_HEIGHT;

        // Resize it according to device
        _resize();
        window.addEventListener('resize', debounce(_resize, 250, false), false);

        function _resize() {
            const ratio = GAME_FIELD_WIDTH / GAME_FIELD_HEIGHT;
            const addressBarHeight = 50;

            // Figure out if user device is android or ios
            const ua = navigator.userAgent.toLowerCase();
            const android = ua.indexOf('android') > -1 ? true : false;
            const ios = ( ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1  ) ? true : false; 

            let container = document.querySelector(".container");

            // Get correct  dimensions
            _currentHeight = window.innerHeight;
            _currentWidth = _currentHeight * ratio;

            // Add enough size to scroll down 
            // past the address bar on ios or android
            if (android || ios) {
                document.body.style.height = (window.innerHeight + addressBarHeight) + 'px';
            }

            // Adjust canvas accordingly
            _canvas.style.width = _currentWidth + 'px';
            _canvas.style.height = _currentHeight + 'px';
            container.style.width = _currentWidth + 'px';
            container.style.height = _currentHeight + 'px';

            // Automagically scroll down to get rid
            // of address bar
            window.setTimeout(function() {
                    window.scrollTo(0,1);
            }, 1);
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
            let movingSpeed = 6;
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

        // Render game elements and entities
        function _render(dt) {
            let entity;
            let entities = game.entities();
            let i;

            // Fill background
            _drawBG();

            // Draw every game entity and update their sprites
            for(i = 0; i < entities.length; i++) {
                entity = entities[i];

                if (game.accelerating() || entity instanceof TempEntity)
                    entity.sprite.update(dt);

                if (entity.draw && entity instanceof Enemy && entity.disappeared)
                    _drawSprite(entity.sprite, 0, entity.y-entity.height/2);

                else if (entity.draw)
                    _drawSprite(entity.sprite, entity.x, entity.y-entity.height/2);
                
            }
        }

        return {
            render: _render,
            GAME_FIELD_WIDTH: GAME_FIELD_WIDTH,
            GAME_FIELD_HEIGHT: GAME_FIELD_HEIGHT,
            canvas: _canvas,
            currentWidth: function () { return _currentWidth; }
        };

    })();

    // Game
    game = (function() {
        /* jshint validthis: true */

        let _lanes = {
            NUM_LANES: 4,

            getNumber: function(x) {
                let i;
                for (i = 1; i <= this.NUM_LANES; i++) {
                    if ( x < GAME_FIELD_WIDTH * (i/this.NUM_LANES) ) {
                        return i;
                    }
                }

                return -1;
            },

            getCenterX: function(laneNumber) {
                return (GAME_FIELD_WIDTH / this.NUM_LANES) * (laneNumber-1) + 20;
            },

            randomLane: function() {
                return randomInt(this.NUM_LANES) + 1;
            }
        };

        let _tempPool = new CloneablePool(new TempEntity(0, 0, 0, 0, null));
        let _enemyPool = new CloneablePool(new Enemy(0, 0, 0, 0, null));

        let _entities, _entitiesToRemove, _enemies;
        let _player;
        let _enemySpeed = 6;

        let _lastFrameTime;
        
        let _accelerating = false;
        let _inputBuffered, _inputEventFired;
        
        let _wavesPassed = 0;

        let _started = false;
        let _gameOver;

        let _tutorialEnabled = true;
        let _tutorialLanes;

        let _updateFunc;
        let _gameOverAnimation;

        let _score;
        let _highScores;

        // Initialize to something that enemies will never reach
        let _invisTurningPoint = GAME_FIELD_HEIGHT * 2;
        let _startBtn = document.querySelector("#start_button");

        // Spawn a wave of enemies
        function _spawnWave() {
            let enemy, enemyLane;
            let invisTurningWave = 3;

            // Easy waves are over, begin turning invisible
            if (_wavesPassed === invisTurningWave) {
                _invisTurningPoint = GAME_FIELD_HEIGHT / 2;
            }

            // Every wave, enemies turn invisible a littler sooner
            // caps at y = 80
            if (_invisTurningPoint >= 80)
                _invisTurningPoint -= 5;

            // Pick a lane to populate
            enemyLane = _lanes.getCenterX( _lanes.randomLane() );

            // make an enemy
            enemy = _enemyPool.take();

            enemy.x = enemyLane;
            enemy.y = -10;
            enemy.speed = _enemySpeed;
            enemy.invisPointY = _invisTurningPoint;
            enemy.sprite = resources.spr_enemy();
            enemy.disappeared = false;

            _addEntity(enemy);

            return enemyLane;
        }
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
                _player.sprite = resources.spr_explosion();
                _startBtn.style.display = "block";
                _insertScore(Math.round(_score));
                
                console.log(_highScores);
            }
        }

        // Start game
        function _start() {
            if (_entities) _removeEntities(_entities);
            _entities = [];
            _enemies = [];
            _entitiesToRemove = [];
            _tutorialLanes = [];
            _wavesPassed = -1;
            _gameOver = false;
            _accelerating = false;
            _inputBuffered = true;
            _inputEventFired = false;
            _score = 0;
            _lastFrameTime = 0;
            _invisTurningPoint = GAME_FIELD_HEIGHT * 2;
            

            // Make start button disappear
            _startBtn.style.display = "none";

            // Access/store high scores in local storage
            if (typeof(Storage) !== "undefined") {
                try {
                    _highScores = JSON.parse(localStorage.nBackScores);
                }
                catch(e) {
                    _highScores = [];
                }
            }

            // Spawn player and first wave
            _addEntity(new Player(_lanes.getCenterX(1), GAME_FIELD_HEIGHT - 60, resources.spr_playerWalkingUp()));
            _tutorialLanes.push(_spawnWave());

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
            _entities.push(entity);

            if (entity instanceof Player) {
                _player = entity;
            }

            else if (entity instanceof Enemy) {
                _enemies.push(entity);
            }
        }

        // Remove entities from game
        function _removeEntities(entitiesToRemove) {
            let i;

            // Don't do anything if no entities to remove
            if (entitiesToRemove.length === 0) {
                return;
            }
            
            // Go through the arrays and remove those in the kill list
            for (i = 0; i < entitiesToRemove.length; i++) {
                let entityToRemove = entitiesToRemove[i];
                let idxToRemove;

                // Put back the entity's sprite
                if (entityToRemove.sprite !== null) {
                    resources.putSpriteBack(entityToRemove.sprite);
                }

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
                    // Update waves passed
                    _wavesPassed++;
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

        // Check for a collision between two entities
        function _isColliding(entity1, entity2) {
            let hbox1 = entity1.collisionLine();
            let hbox2 = entity2.collisionLine();

            return hbox1.intersects(hbox2);
        }

        // Update game
        function _update(time) {
            let entity;
            let stoppingThreshold = _player.y - _player.height*1.5;
            let newWaveThreshold = GAME_FIELD_HEIGHT / 4;
            let alertZone;
            let i;

            // Smooth FPS
            let dt = Math.min((time - _lastFrameTime) / 1000, 3/60);

            _lastFrameTime = time;

            // Stop game if game over is reached
            if (_gameOver) {
                _started = false;
                renderer.render(dt);
                _gameOverAnimation = window.requestAnimationFrame(_updateFunc);
                return;
            }

            // Update all entities
            for (i = 0; i < _entities.length; i++) {
                entity = _entities[i];
                alertZone = entity.invisPointY-newWaveThreshold;

                if (_accelerating)
                    entity.update(dt);

                // Entity offscreen? Delet
                if (entity.y > GAME_FIELD_HEIGHT) {
                    _entitiesToRemove.push(entity);

                    if (entity instanceof Enemy) {
                        _player.loseLife();
                        
                        if (_inputBuffered)
                            _toggleInputBuffer();
                    }
                }

                // Check collisions with player
                else if (entity instanceof Enemy && _isColliding(entity, _player)) {
                    // Add life, kill enemy, update waves passed
                    _player.addLife();
                    _entitiesToRemove.push(entity);

                    if (_inputBuffered)
                        _toggleInputBuffer();
                }

                // About to be invisible? Flash!
                else if (entity instanceof Enemy &&
                    entity.y >= alertZone &&
                    entity.y < entity.invisPointY) {
                        
                        entity.draw = !entity.draw;
                }

                // Invisible?
                else if (entity instanceof Enemy &&
                        entity.y >= entity.invisPointY &&
                        entity.y < entity.invisPointY + entity.speed) {
                            entity.sprite = resources.spr_leafPile();

                            entity.draw = true;
                            entity.disappeared = true;
                }

                // Tutorial section?
                if (_tutorialEnabled) {

                    // Spawn 3 waves of normal guys along with tutorial tap
                    if (-1 <= _wavesPassed && _wavesPassed <= 2) {
                        let tutorialTap;

                        // Put a tutorial sign at the beginning of the game
                        if (_wavesPassed === -1) {

                            // Create tutorial stuff
                            tutorialTap = _tempPool.take();

                            tutorialTap.x = _tutorialLanes[++_wavesPassed];
                            tutorialTap.y = GAME_FIELD_HEIGHT * (3/4);
                            tutorialTap.sprite = resources.spr_tapIcon();
                            tutorialTap.width = tutorialTap.sprite.width;
                            tutorialTap.height = tutorialTap.sprite.height;

                            _addEntity(tutorialTap);
                        }

                        // Put a tutorial sign when paused
                        else if (_accelerating && 
                                !_inputBuffered &&
                                 entity instanceof Enemy &&
                                 entity.y >= stoppingThreshold &&
                                 entity.y < stoppingThreshold + entity.speed) {

                                // Pause
                                _toggleAcceleration();
                                _toggleInputBuffer();

                                // Create tutorial stuff
                                tutorialTap = _tempPool.take();

                                tutorialTap.x = _tutorialLanes[_wavesPassed];
                                tutorialTap.y = GAME_FIELD_HEIGHT * (3/4);
                                tutorialTap.sprite = resources.spr_tapIcon();
                                tutorialTap.width = tutorialTap.sprite.width;
                                tutorialTap.height = tutorialTap.sprite.height;

                                _addEntity(tutorialTap);
                        }
                    }

                    // Then spawn a couple waves of invis guys that still flash, with tutorial tap
                    

                    // End tutorial, begin real stuff
                    else if (_wavesPassed >= 3) {
                        _tutorialEnabled = false;
                    }
                }

                // Pause the game when a wave is within a distance
                // of the player
                else if (_accelerating && 
                    !_inputBuffered &&
                    entity instanceof Enemy &&
                    entity.y >= stoppingThreshold &&
                    entity.y < stoppingThreshold + entity.speed) {

                        _toggleAcceleration();
                        _toggleInputBuffer();
                }

                // Spawn a new wave after previous wave passed
                // a certain distance
                if (entity instanceof Enemy &&
                    entity.y >= newWaveThreshold &&
                    entity.y < newWaveThreshold + entity.speed) {

                    let enemyLane = _spawnWave();

                    if (_tutorialEnabled)
                        _tutorialLanes.push(enemyLane);
                }

                // Remove temp entities when an input event is fired
                if (_inputEventFired && entity instanceof TempEntity)
                    _entitiesToRemove.push(entity);
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
            accelerating: function() { return _accelerating; },
            inputBuffered: function() { return _inputBuffered; },
            //score: function() { return _score; },
            //highScores: function () { return _highScores; },
            gameOver: function() { return _gameOver; },
            entities: function () { return _entities; },
            enemies: function () { return _enemies; },
            player: function () { return _player; }
        };


    })();

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

    //////////////////////////////////////
    // Input helper functions
    ///////////////////////////////////////

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
    // Click input
    ///////////////////////////////////////
    function clickStart(e) {
        let clickLocation = getRelativeEventCoords(e);
        let player = game.player();
    
        e.preventDefault();

        if (!game.gameOver() && player) {

            player.move( game.lanes.getNumber(clickLocation.x) );
            game.setInputEventFired();

            if (!game.accelerating())
                game.toggleAcceleration();
            else if (!game.inputBuffered())
                game.toggleInputBuffer();
        }
    }
    
    renderer.canvas.addEventListener("click", clickStart);

    ///////////////////////////////////////
    // Touch input
    ///////////////////////////////////////
    
    function touchStart(e) {
        let touches = e.changedTouches;
        let touchLocation;
        let player = game.player();
    
        e.preventDefault();

        if (!game.gameOver() && player) {
            
            for (let i = touches.length - 1; i >= 0; i--) {
                touchLocation = getRelativeEventCoords(touches[i]);
        
                player.move( game.lanes.getNumber(touchLocation.x) );
                game.setInputEventFired();

                if (!game.accelerating())
                    game.toggleAcceleration();
                else if (!game.inputBuffered())
                    game.toggleInputBuffer();
            }
        }
    }

    renderer.canvas.addEventListener("touchstart", touchStart);

    ///////////////////////////////////////
    // Main Logic
    ///////////////////////////////////////

    // Start the game when the button is clicked
    document.querySelector("#start_button").addEventListener("click", function() { game.start(); });

    
    
})();