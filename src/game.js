(function () {
    "use strict";

    
    ///////////////////////////////////////
    // Helper functions/objects
    ///////////////////////////////////////

    /* a timer that can pause and resume
    function IntervalTimer(callback, interval) {
        let timerId, startTime, remaining = 0;
        let state = 0; //  0 = idle, 1 = running, 2 = paused, 3= resumed

        // pause timer
        this.pause = function () {
            if (state != 1) return;

            remaining = interval - (new Date() - startTime);
            window.clearInterval(timerId);
            state = 2;
        };

        // resume timer
        this.resume = function () {
            if (state != 2) return;

            state = 3;
            window.setTimeout(this.timeoutCallback, remaining);
        };

        // callback
        this.timeoutCallback = function () {
            if (state != 3) return;

            callback();

            startTime = new Date();
            timerId = window.setInterval(callback, interval);
            state = 1;
        };

        startTime = new Date();
        timerId = window.setInterval(callback, interval);
        state = 1;
    }*/

    // Random Integer, 0 thru max - 1
    function randomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
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
        var x, y, width, height;
    
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
    Sprite.prototype.animated = function (imgPath, frameWidth, frameHeight,
                                          frames, frameRate, loopOnce, row, col) {
        let spriteImage = document.createElement("img");
        let image = document.createElement("img");

        spriteImage.addEventListener("error", function() {console.log("Image failed!");}, false);
        spriteImage.addEventListener("load",  function () {
            let spriteCanvas = document.createElement("canvas");
            let spriteContext = spriteCanvas.getContext('2d');
            
            spriteCanvas.width = frameWidth*frames;
            spriteCanvas.height = frameHeight;

            spriteContext.drawImage(spriteImage,
                                    col*frameWidth, row*frameHeight,
                                    frameWidth*frames, frameHeight,
                                    0, 0,
                                    frameWidth*frames, frameHeight);

            image.src = spriteCanvas.toDataURL('image/png');
        }, false);

        spriteImage.src = imgPath;

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
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
    Sprite.prototype.static = function (imgPath, frameWidth, frameHeight, row, col) {
        let spriteImage = document.createElement("img");
        let image = document.createElement("img");

        spriteImage.addEventListener("error", function() {console.log("Image failed!");}, false);
        spriteImage.addEventListener("load",  function () {
            let spriteCanvas = document.createElement("canvas");
            let spriteContext = spriteCanvas.getContext('2d');
            
            spriteCanvas.width = frameWidth;
            spriteCanvas.height = frameHeight;

            spriteContext.drawImage(spriteImage,
                                    col*frameWidth, row*frameHeight,
                                    frameWidth, frameHeight,
                                    0, 0,
                                    frameWidth, frameHeight);

            image.src = spriteCanvas.toDataURL('image/png');
        }, false);

        spriteImage.src = imgPath;

        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
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

                if (this.currentFrame <= this.frames);
                    this.currentFrame++;

                if (this.currentFrame >= this.frames && !this.loopOnce)
                    this.currentFrame = 0;
                //this.currentFrame = (this.currentFrame+1) % this.frames;
            }
        }
    };


    ///////////////////////////////////////
    // Game entities
    ///////////////////////////////////////
    
    // Entity superclass
    function Entity(x, y, width, height) {
        this.x = x;
        this.y = y;

        this.time = 0;

        this.width = width;
        this.height = height;
    }

    // Update time step
    Entity.prototype.update = function (dt) {
        this.time += dt;
    };
    
    // Entity rectangle collision
    Entity.prototype.collisionRect = function () {
        return new Rectangle(this.x - this.width/2,
                            this.y - this.height/2,
                            this.width,
                            this.height);
    };

    // Thin line for collision
    Entity.prototype.collisionLine = function () {
        return new Rectangle(this.x - this.width/2,
                            this.y - this.height/2,
                            this.width,
                            1);
    };

    // Player object
    function Player(x, y) {
        Entity.call(this, x, y, 40, 40);

        this.rangeOfMovement = 4;
        this.maxLife = 75;
        this.life = this.maxLife;
        this.move(0);
    }

    // Player extends Entity
    Player.prototype = Object.create(Entity.prototype);

    // Update time step
    Player.prototype.update = function (dt) {
        Entity.prototype.update.call(this, dt);
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
        this.x = (renderer.INITIAL_WIDTH() / this.rangeOfMovement) * spot + 20;
    };

    // Enemy object
    function Enemy(x, y, speed, invisPointY) {
        Entity.call(this, x, y, 40, 10);
        
        this.invisPointY = invisPointY;
        this.speed = speed;
    }

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
    let renderer, game, collisions;
    

    // Collisions handler
    collisions = (function () {
        let _entitiesToRemove = [];

        function _update(dt) {
            let enemies = game.enemies();
            let player = game.player();
            let playerHitbox = player.collisionLine();
            let i;

            // Collision Check
            for (i = enemies.length - 1; i >= 0; i-- ) {
                let enemy = enemies[i];
                let enemyHitbox = enemy.collisionLine();

                // Enemy hits player
                if (enemy && player && enemyHitbox.intersects(playerHitbox) ) {
                    // Resolve Collision (player gets life)
                    player.addLife();
                    _entitiesToRemove.push(enemy);
                }
                // Enemy goes off screen
                else if (enemy && (enemyHitbox.top() > renderer.INITIAL_HEIGHT())) {
                    _entitiesToRemove.push(enemy);
                    player.loseLife();
                }
            }
        }

        function _clearEntitiesToRemove() {
            if (!_entitiesToRemove) {
                return;
            }

            // Quick helper function to check if
            // a thing is not in entities array
            function isNotInEntities(item) {
                return !_entitiesToRemove.includes(item);
            }

            // Clear entities
            _entitiesToRemove = _entitiesToRemove.filter(isNotInEntities);
        }

        return {
            update: _update,
            clearEntitiesToRemove: _clearEntitiesToRemove,
            entitiesToRemove: function () { return _entitiesToRemove; }
        };
    })();

    // Renderer
    renderer = (function () {
        let _playerWalkingUp = new Sprite().animated("build/sprites/animals.png", 26, 36, 3, 6, false, 3, 3);
        //let _playerIdle = new Sprite().static("build/sprites/animals.png", 26, 36, 3, 4);
        let _playerExplode = new Sprite().animated("build/sprites/explosion.png", 223, 174, 22, 22, true, 0, 0);
        let _enemySprite = new Sprite().static("build/sprites/animals.png", 26, 36, 4, 7);
        let _bgImg = new Sprite().static("build/sprites/grassland.png", 128, 128, 4, 6);
        let _animatedSprites = [_playerWalkingUp];
        

        let _canvas = document.getElementById("gameWindow");
        let _context = _canvas.getContext("2d");

        const _INITIAL_HEIGHT = 720;
        const _INITIAL_WIDTH = 480;
        const _RATIO = _INITIAL_WIDTH / _INITIAL_HEIGHT;
        let _currentHeight = _INITIAL_HEIGHT;
        let _currentWidth = _INITIAL_WIDTH;

        // Figure out if user device is android or ios
        let ua = navigator.userAgent.toLowerCase();
        let android = ua.indexOf('android') > -1 ? true : false;
        let ios = ( ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1  ) ? true : false; 
        
        // Adjust initial canvas size
        _canvas.width = _INITIAL_WIDTH;
        _canvas.height = _INITIAL_HEIGHT;

        // Resize it according to device
        _resize();
        window.addEventListener('resize', _resize, false);

        function _resize() {
            const addressBarHeight = 50;

            // Get correct  dimensions
            _currentHeight = window.innerHeight;
            _currentWidth = _currentHeight * _RATIO;

            // Add enough size to scroll down 
            // past the address bar on ios or android
            if (android || ios) {
                document.body.style.height = (window.innerHeight + addressBarHeight) + 'px';
            }

            // Adjust canvas accordingly
            _canvas.style.width = _currentWidth + 'px';
            _canvas.style.height = _currentHeight + 'px';

            // Automagically scroll down to get rid
            // of address bar
            window.setTimeout(function() {
                    window.scrollTo(0,1);
            }, 1);
        }

        // Draw a sprite to the context
        function _drawSprite(sprite, x, y, width, height) {
            if (sprite.frameRate === 0 || (sprite.loopOnce && sprite.currentFrame >= sprite.frames)) {
                _context.drawImage(sprite.image,
                                    sprite.frameWidth*sprite.frames, 0,
                                    sprite.frameWidth, sprite.frameHeight,
                                    x, y,
                                    width, height);
            }
            else {
                _context.drawImage(sprite.image,
                                    sprite.frameWidth*sprite.currentFrame, 0,
                                    sprite.frameWidth, sprite.frameHeight,
                                    x, y,
                                    width, height);
            }
        }

        // Render enemy at its coords
        function _drawEnemy(enemy, sprite) {
            // Still visible
            if (enemy.y < enemy.invisPointY) {
                _drawSprite(sprite, enemy.x, enemy.y-enemy.height/2, 
                                    enemy.width*1.5, enemy.height*6);
            }
            // Invisible
            else {
                _context.fillStyle = "white";
                _context.fillRect(0, enemy.y+enemy.height, _INITIAL_WIDTH, 10);
            }
        }
        
        // Render player at its coords
        function _drawPlayer(player, sprite) {
            _drawSprite(sprite, player.x, player.y-player.height/2,
                        player.width*1.5, player.height*1.5);
        }

        // Draw moving background
        let _drawBG = (function () {
            let bgTileSize = 64;
            let y = 0;
            let movingSpeed = 6;

            return function () {
                let i, j;
                let horizontalTiles = _INITIAL_WIDTH/bgTileSize;
                let verticalTiles = _INITIAL_HEIGHT/bgTileSize;
                

                for (i = 0; i <= horizontalTiles; i++) {
                    for(j = -1; j <= verticalTiles; j++) {
                        _drawSprite(_bgImg, i*bgTileSize, j*bgTileSize+y,
                                    bgTileSize, bgTileSize);
                    }
                }

                if (game.accelerating() && !game.gameOver())
                    y += movingSpeed;

                if (y >= bgTileSize) {
                    y = 0;
                }
            };
        })();

        // Render game elements and entities
        function _render(dt) {
            let entity;
            let entities = game.entities();
            let i;

            // Fill background
            _drawBG();

            // Update Sprites
            if (game.accelerating()) {
                for(i = _animatedSprites.length-1; i >= 0; i--) {
                    _animatedSprites[i].update(dt);
                }
            }

            // Draw every game entity
            for(i = 0; i < entities.length; i++) {
                entity = entities[i];

                if (entity instanceof Enemy) {
                    _drawEnemy(entity, _enemySprite);
                }
                else if (entity instanceof Player) {
                    if (game.gameOver()) {
                        _playerExplode.update(dt);
                        _drawSprite(_playerExplode, entity.x, entity.y-entity.height/2,
                            entity.width*1.5, entity.height*1.5);
                    }
                    else
                        _drawPlayer(entity, _playerWalkingUp);
                }
            }

        }

        return {
            render: _render,
            INITIAL_WIDTH: function () { return _INITIAL_WIDTH; },
            INITIAL_HEIGHT: function () { return _INITIAL_HEIGHT; },
            currentWidth: function () { return _currentWidth; },
            currentHeight: function () { return _currentHeight; },
            canvas: function () { return _canvas; }
        };

    })();

    // Game
    game = (function() {
        /* jshint validthis: true */

        let _lastFrameTime;
        
        let _accelerating = false;
        let _inputBuffered = true;

        let _entities, _enemies, _player;
        let _defaultEnemySpeed = 0;
        let _enemySpeed = _defaultEnemySpeed;

        let _started = false;
        let _gameOver;

        let _score;
        let _highScores;

        // Spawn a wave of enemies
        let _spawnWave = (function () {
            let waveCounter = 0;
            // Initialize to something that enemies will never reach
            let invisTurningPoint = renderer.INITIAL_HEIGHT() * 2;
            let invisTurningWave = 5;

            return function () {
                let goodSpot = (renderer.INITIAL_WIDTH() / _player.rangeOfMovement) * 
                                randomInt(_player.rangeOfMovement) + 20;
                //let enemySpot;
                //let i;

                // Increment spawned waves counter
                waveCounter++;
                console.log("wave " + waveCounter);

                // Tutorial waves are over, begin turning invisible
                if (waveCounter == invisTurningWave-1) {
                    //console.log("Invisibility gene active on next wave!");
                }
                else if (waveCounter == invisTurningWave) {
                    invisTurningPoint = renderer.INITIAL_HEIGHT() / 2;
                    //console.log("Activating invisibilty gene...");
                }

                // Every wave, enemies turn invisible a littler sooner
                // caps at y = 80
                if (invisTurningPoint >= 80)
                    invisTurningPoint -= 10;
                
                // make an enemy
                _addEntity(new Enemy(goodSpot, -10, _enemySpeed, invisTurningPoint));

                /*for (i = 0; i < 4; i++) {
                    if (i !== goodSpot) {
                        enemySpot = (renderer.INITIAL_WIDTH() / 4) * i + 20;
                        _addEntity(new Enemy(enemySpot, -10, _enemySpeed, invisTurningPoint));
                    }
                }*/
            };
        })();

        // Add onto game score
        function _addScore(num) {
            _score += num;
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
                localStorage.invadersScores = JSON.stringify(_highScores);
            }
        }

        // Toggle buffer flag
        function _toggleInputBuffer() {
            if (_inputBuffered)
                _inputBuffered = false;
            else 
                _inputBuffered = true;

            console.log("input buffered: " + _inputBuffered);
        }


        // Speed up wave until past player; player cannot move during this time
        function _toggleAcceleration() {
            let i;
            if (_accelerating) {
                _enemySpeed = _defaultEnemySpeed;
                //console.log("STOP...");
                for (i = 0; i < _enemies.length; i++) {
                    _enemies[i].speed = _enemySpeed;
                }
                _accelerating = false;
            }
            else {
                //console.log("hammertime");
                _enemySpeed = 6;
                for (i = 0; i < _enemies.length; i++) {
                    _enemies[i].speed = _enemySpeed;
                }
                _accelerating = true;
            }
        }

        // Game over
        function _setGameOver() {
            if (!_gameOver) {
                console.log("game over");
                _gameOver = true;
                _insertScore(Math.round(game.score()));
            }
        }

        // Start game
        function _start() {
            console.log("game start");
            console.log("input buffered: " + _inputBuffered);
            _entities = [];
            _enemies = [];
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
            this.addEntity(new Player(0, renderer.INITIAL_HEIGHT() - 60));
            // Spawn initial wave
            _spawnWave();

            // Begin game loop
            if (!_started) {
                requestAnimationFrame(this.update.bind(this));
                _started = true;
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
            // Don't do anything if no entities to remove
            if (!entitiesToRemove) {
                return;
            }
            
            // Quick helper function to check if
            // a thing is not in entities array
            function isNotInEntities(item) {
                return !entitiesToRemove.includes(item);
            }

            // Clear entities
            _entities = _entities.filter(isNotInEntities);
            _enemies = _enemies.filter(isNotInEntities);
    
            // Wipe player off the face of the planet if
            // we must
            if (entitiesToRemove.includes(_player)) {
                _player = undefined;
            }
        }


        // Update game
        function _update(time) {
            let entity;
            let entitiesToRemove = [];
            let spawningWave = false;
            let stoppingThreshold = _player.y - _player.height;
            let newWaveThreshold = renderer.INITIAL_HEIGHT() / 4;
            let i;

            // Smooth FPS
            let dt = Math.min((time - _lastFrameTime) / 1000, 3/60);

            _lastFrameTime = time;

            // Stop game if game over is reached
            if (_gameOver) {
                _started = false;
                renderer.render(dt);
                requestAnimationFrame(this.update.bind(this));
                return;
            }

            // Check collisions
            collisions.update(dt);

            // Update all entities
            for (i = 0; i < _entities.length; i++) {
                entity = _entities[i];
                entity.update(dt);

                if (entity instanceof Enemy &&
                    !spawningWave &&
                    entity.y >= newWaveThreshold &&
                    entity.y < newWaveThreshold + entity.speed) {
                        _spawnWave();
                        spawningWave = true;
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

                // Delete offscreen or absorbed enemies
                // should be 1 wave at any point it's not empty
                if (collisions.entitiesToRemove().includes(entity)) {
                    entitiesToRemove.push(entity);

                    if (_inputBuffered)
                        _toggleInputBuffer();
                }
            }

            _removeEntities(entitiesToRemove);
            collisions.clearEntitiesToRemove();
            
            spawningWave = false;

            // Render frame
            renderer.render(dt);

            // Loop
            requestAnimationFrame(this.update.bind(this));
        }

         return {
            start: _start,
            update: _update,
            addEntity: _addEntity,
            setGameOver: _setGameOver,
            addScore: _addScore,
            toggleAcceleration: _toggleAcceleration,
            toggleInputBuffer: _toggleInputBuffer,
            accelerating: function() { return _accelerating; },
            inputBuffered: function() { return _inputBuffered; },
            score: function() { return _score; },
            highScores: function () { return _highScores; },
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
    function getRelativeTouchCoords(touch) {// Scale touch coords correctly
        let scale = renderer.currentWidth() / renderer.INITIAL_WIDTH();
        let x = touch.pageX - getOffsetLeft(renderer.canvas());
        let y = touch.pageY - getOffsetTop(renderer.canvas());
    
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
        
                if (touchLocation.x < renderer.INITIAL_WIDTH() * (1/4)) {
                    spot = 0;
                }
                else if (touchLocation.x < renderer.INITIAL_WIDTH() * (2/4)) {
                    spot = 1;
                }
                else if (touchLocation.x < renderer.INITIAL_WIDTH() * (3/4)) {
                    spot = 2;
                }
                else {
                    spot = 3;
                }
                
                game.player().move(spot);

                if (!game.accelerating())
                    game.toggleAcceleration();
                else if (!game.inputBuffered());
                    game.toggleInputBuffer();
            }
        }
    
    
    }

    renderer.canvas().addEventListener("touchstart", touchStart);

    ///////////////////////////////////////
    // Main Logic
    ///////////////////////////////////////

    game.start();

    
    
})();