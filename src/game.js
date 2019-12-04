(function () {
    "use strict";

    
    ///////////////////////////////////////
    // Helper functions/objects
    ///////////////////////////////////////

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
    function Sprite() {}

    // Constructor for animated sprites
    Sprite.prototype.animated = function (imgPath, width, height, frameWidth, frameHeight,
                                          frames, frameRate, loopOnce, row, col) {
        let spriteImage = document.createElement("img");
        let image = document.createElement("img");

        spriteImage.addEventListener("load",  function () {
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
        }, false);

        spriteImage.src = imgPath;

        this.width = width;
        this.height = height;
        this.row = row;
        this.col = col;
        this.frames = frames;
        this.frameRate = frameRate;
        this.timer = 0;
        this.currentFrame = 0;
        this.loopOnce = loopOnce;
        this.image = image;

        return this;
    };

    // Constructor for static images
    Sprite.prototype.static = function (imgPath, width, height, frameWidth, frameHeight, row, col) {
        let spriteImage = document.createElement("img");
        let image = document.createElement("img");

        spriteImage.addEventListener("load",  function () {
            let spriteCanvas = document.createElement("canvas");
            let spriteContext = spriteCanvas.getContext('2d');
            
            spriteCanvas.width = width;
            spriteCanvas.height = height;

            spriteContext.drawImage(spriteImage,
                                    col*frameWidth, row*frameHeight,
                                    frameWidth, frameHeight,
                                    0, 0,
                                    width, height);

            image.src = spriteCanvas.toDataURL('image/png');
        }, false);

        spriteImage.src = imgPath;

        this.width = width;
        this.height = height;
        this.row = row;
        this.col = col;
        this.frameRate = 0;
        this.frames = 0;
        this.currentFrame = 0;
        this.image = image;

        return this;
    };

    // Constructor for a static, tiled image
    Sprite.prototype.tiled = function (imgPath, width, height, frameWidth, frameHeight, row, col, xTiles, yTiles) {
        let spriteImage = document.createElement("img");
        let image = document.createElement("img");

        spriteImage.addEventListener("load",  function () {
            let i, j;
            //let xTiles = width / frameWidth;
            //let yTiles = height / frameHeight;
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
        }, false);

        spriteImage.src = imgPath;

        this.width = width;
        this.height = height;
        this.row = row;
        this.col = col;
        this.frameRate = 0;
        this.frames = 0;
        this.currentFrame = 0;
        this.image = image;

        return this;
    };

    Sprite.prototype.update = function (dt) {
        if (this.frameRate !== 0) {
            this.timer += dt;
            
            if (this.timer > 1/this.frameRate) {
                this.timer = 0;

                if (!this.loopOnce)
                    this.currentFrame = (this.currentFrame+1) % this.frames;
                    
                else if (this.currentFrame < this.frames-1)
                    this.currentFrame++;
            }
        }
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
        return new Entity(this.x, this.y, this.width, this,height, this.sprite);
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


    // Player object
    function Player(x, y, sprite) {
        Entity.call(this, x, y, 40, 40, sprite);

        this.rangeOfMovement = 4;
        this.maxLife = 75;
        this.life = this.maxLife;
        this.move(0);
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

    // Move player to a spot 1-4
    Player.prototype.move = function (spot) {
        // 4 spots of movement on screen
        this.x = (renderer.INITIAL_WIDTH / this.rangeOfMovement) * spot + 20;
    };

    // Enemy object
    function Enemy(x, y, speed, invisPointY, sprite) {
        Entity.call(this, x, y, 40, 10, sprite);
        
        this.invisPointY = invisPointY;
        this.speed = speed;
        this.disappeared = false;
    }

    Enemy.prototype.init = function () {
        Entity.prototype.init.call(this);

        this.invisPointY = 0;
        this.speed = 0;
        this.disappeared = false;
    };

    Entity.prototype.clone = function () {
        return new Enemy(this.x, this.y, this.speed, this.invisPointY, this.sprite);
    };

    // Enemy extends Entity
    Enemy.prototype = Object.create(Entity.prototype);

    // Update time step
    Enemy.prototype.update = function (dt) {
        Entity.prototype.update.call(this, dt);

        this.y += this.speed;
    };

    ///////////////////////////////////////
    // Controllers
    ///////////////////////////////////////
    let renderer, game;

    // Renderer
    renderer = (function () {
        let _canvas = document.getElementById("gameWindow");
        let _context = _canvas.getContext("2d");

        const _INITIAL_HEIGHT = 720;
        const _INITIAL_WIDTH = 480;
        let _currentHeight = _INITIAL_HEIGHT;
        let _currentWidth = _INITIAL_WIDTH;
        
        // Adjust initial canvas size
        _canvas.width = _INITIAL_WIDTH;
        _canvas.height = _INITIAL_HEIGHT;

        // Resize it according to device
        _resize();
       // window.addEventListener('resize', _resize, false);

        function _resize() {
            const ratio = _INITIAL_WIDTH / _INITIAL_HEIGHT;
            const addressBarHeight = 50;

            // Figure out if user device is android or ios
            const ua = navigator.userAgent.toLowerCase();
            const android = ua.indexOf('android') > -1 ? true : false;
            const ios = ( ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1  ) ? true : false; 

            let container = document.getElementsByClassName("container")[0];

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
            if (sprite.frameRate === 0 || (sprite.loopOnce && sprite.currentFrame >= sprite.frames)) {
                _context.drawImage(sprite.image,
                                    sprite.width*sprite.frames, 0,
                                    sprite.width, sprite.height,
                                    x, y,
                                    sprite.width, sprite.height);
            }
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
            let bgImg = new Sprite().tiled("build/sprites/grassland.png",
                                        _INITIAL_WIDTH, _INITIAL_HEIGHT,
                                        128, 128,
                                        4, 6,
                                        6, 10);

            return function () {
                _drawSprite(bgImg, 0, y-_INITIAL_HEIGHT);
                _drawSprite(bgImg, 0, y);

                if (game.accelerating() && !game.gameOver())
                    y += movingSpeed;

                if (y >= _INITIAL_HEIGHT)
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

                if (game.accelerating())
                    entity.sprite.update(dt);

                // Render enemy at its coords
                if (entity.draw && entity instanceof Enemy) {
                    if (entity.disappeared)
                        _drawSprite(entity.sprite, 0, entity.y-entity.height/2);
                    else
                        _drawSprite(entity.sprite, entity.x, entity.y-entity.height/2);
                }
                
                // Render player at its coords
                else if (entity.draw && entity instanceof Player)
                    _drawSprite(entity.sprite, entity.x, entity.y-entity.height/2);
            }

        }

        return {
            render: _render,
            INITIAL_WIDTH: _INITIAL_WIDTH,
            INITIAL_HEIGHT: _INITIAL_HEIGHT,
            currentWidth: _currentWidth,
            canvas: _canvas
        };

    })();

    // Game
    game = (function() {
        /* jshint validthis: true */
        let _playerWalkingUp = new Sprite().animated("build/sprites/animals.png", 60, 60, 26, 37, 2, 6, false, 3, 3);
        let _enemySprite = new Sprite().static("build/sprites/animals.png", 60, 60, 26, 36, 4, 7);
        let _playerExplode = new Sprite().animated("build/sprites/explosion.png", 60, 60, 223, 174, 21, 21, true, 0, 0);
        let _pileOfLeaves = new Sprite().tiled("build/sprites/grassland.png", renderer.INITIAL_WIDTH, 60, 128, 128, 15, 4, 6, 1);
        
        let _enemyPool = new CloneablePool(new Enemy(0, 0, 0, 0, null));
        let _entities, _entitiesToRemove, _enemies, _player;
        let _enemySpeed = 6;

        let _lastFrameTime;
        
        let _accelerating = false;
        let _inputBuffered = true;

        let _started = false;
        let _gameOver;

        let _updateFunc;

        let _score;
        let _highScores;

        // Spawn a wave of enemies
        let _spawnWave = (function () {
            let waveCounter = 0;
            // Initialize to something that enemies will never reach
            let invisTurningPoint = renderer.INITIAL_HEIGHT * 2;
            let invisTurningWave = 5;

            return function () {
                // Pick a spot to populate
                let enemySpot = (renderer.INITIAL_WIDTH / _player.rangeOfMovement) * 
                                randomInt(_player.rangeOfMovement) + 20;

                // make an enemy
                let enemy = _enemyPool.take();

                enemy.x = enemySpot;
                enemy.y = -10;
                enemy.speed = _enemySpeed;
                enemy.invisPointY = invisTurningPoint;
                enemy.sprite = _enemySprite;
                enemy.disappeared = false;

                _addEntity(enemy);

                // Increment spawned waves counter
                waveCounter++;

                // Tutorial waves are over, begin turning invisible
                if (waveCounter == invisTurningWave-1) {
                    //do some warning here
                }
                else if (waveCounter == invisTurningWave) {
                    invisTurningPoint = renderer.INITIAL_HEIGHT / 2;
                }

                // Every wave, enemies turn invisible a littler sooner
                // caps at y = 80
                if (invisTurningPoint >= 80)
                    invisTurningPoint -= 10;
            };
        })();

        // Add onto game score
        function _addScore(num) {
            _score += num;
            console.log(_score);
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

        // Game over
        function _setGameOver() {
            if (!_gameOver) {
                _gameOver = true;
                _player.sprite = _playerExplode;
                _insertScore(Math.round(_score));
            }
        }

        // Start game
        function _start() {
            _entities = [];
            _enemies = [];
            _entitiesToRemove = [];
            _gameOver = false;
            _score = 0;
            _highScores = [];
            _lastFrameTime = 0;

            // Access/store high scores in local storage
            if (typeof(Storage) !== "undefined") {
                try {
                    _highScores = JSON.parse(localStorage.sharkAttackScores);
                }
                catch(e) {
                    _highScores = [];
                }
            }

            // Spawn player & begin spawning enemies
            _addEntity(new Player(0, renderer.INITIAL_HEIGHT - 60, _playerWalkingUp));
            // Spawn initial wave
            _spawnWave();

            // Begin game loop
            if (!_started) {
                _started = true;
                _updateFunc = this.update.bind(this);
                requestAnimationFrame(_updateFunc);
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
            let stoppingThreshold = _player.y - _player.height;
            let newWaveThreshold = renderer.INITIAL_HEIGHT / 4;
            let alertZone;
            let i;

            // Smooth FPS
            let dt = Math.min((time - _lastFrameTime) / 1000, 3/60);

            _lastFrameTime = time;

            // Stop game if game over is reached
            if (_gameOver) {
                _started = false;
                renderer.render(dt);
                requestAnimationFrame(_updateFunc);
                return;
            }

            // Update all entities
            for (i = 0; i < _entities.length; i++) {
                entity = _entities[i];
                alertZone = entity.invisPointY-newWaveThreshold;

                if (_accelerating)
                    entity.update(dt);

                // Entity offscreen? Delet
                if (entity.y > renderer.INITIAL_HEIGHT) {
                    _entitiesToRemove.push(entity);

                    if (entity instanceof Enemy) {
                        _player.loseLife();
                        
                        if (_inputBuffered)
                            _toggleInputBuffer();
                    }
                }

                // Check collisions with player
                else if (entity instanceof Enemy && _isColliding(entity, _player)) {
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
                            entity.sprite = _pileOfLeaves;

                            entity.draw = true;
                            entity.disappeared = true;
                }

                // Spawn a new wave?
                if (entity instanceof Enemy &&
                    entity.y >= newWaveThreshold &&
                    entity.y < newWaveThreshold + entity.speed) {
                        _spawnWave();
                }

                // Is it hammertime?
                if (entity instanceof Enemy &&
                    _accelerating && 
                    !_inputBuffered &&
                    entity.y >= stoppingThreshold &&
                    entity.y < stoppingThreshold + entity.speed) {
                        _toggleAcceleration();
                        _toggleInputBuffer();
                }
            }

            // Delete offscreen or absorbed enemies
            _removeEntities(_entitiesToRemove);
            _entitiesToRemove.length = 0;

            // Render frame
            renderer.render(dt);

            // Loop
            requestAnimationFrame(_updateFunc);
        }

         return {
            start: _start,
            update: _update,
            setGameOver: _setGameOver,
            addScore: _addScore,
            toggleAcceleration: _toggleAcceleration,
            toggleInputBuffer: _toggleInputBuffer,
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

    ///////////////////////////////////////
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

        // Move player to spot according to key pressed
        if(keybinds[key] !== undefined && game.player() && !game.gameOver()) {
            e.preventDefault();
            
            game.player().move(keybinds[key]);

            if (!game.accelerating())
                game.toggleAcceleration();
            else if (!game.inputBuffered())
                game.toggleInputBuffer();
        }
    }

    document.body.addEventListener('keydown', keyDown);

    ///////////////////////////////////////
    // Touch input
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

    // Return object with touch location 
    // x and y in game coords
    function getRelativeTouchCoords(touch) {
        // Scale touch coords correctly
        let scale = renderer.currentWidth / renderer.INITIAL_WIDTH;
        let x = touch.pageX - getOffsetLeft(renderer.canvas);
        let y = touch.pageY - getOffsetTop(renderer.canvas);
    
        return {
            x: x/scale,
            y: y/scale
        };
    }
    
    function touchStart(e) {
        let touches = e.changedTouches;
        let touchLocation;
        let spot;
    
        e.preventDefault();

        if (!game.gameOver()) {
            for (let i = touches.length - 1; i >= 0; i--) {
                touchLocation = getRelativeTouchCoords(touches[i]);
        
                if (touchLocation.x < renderer.INITIAL_WIDTH * (1/4)) {
                    spot = 0;
                }
                else if (touchLocation.x < renderer.INITIAL_WIDTH * (2/4)) {
                    spot = 1;
                }
                else if (touchLocation.x < renderer.INITIAL_WIDTH * (3/4)) {
                    spot = 2;
                }
                else {
                    spot = 3;
                }
                
                game.player().move(spot);

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

    game.start();

    
    
})();