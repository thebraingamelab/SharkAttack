(function () {
    "use strict";
    ///////////////////////////////////////
    // Helper functions/objects
    ///////////////////////////////////////

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

    function rectUnion(r1, r2) {
        let x, y, width, height;

        if( r1 === undefined ) {
            return r2;
        }
        if( r2 === undefined ) {
            return r1;
        }

        x = Math.min( r1.x, r2.x );
        y = Math.min( r1.y, r2.y );
        width = Math.max( r1.right(), r2.right() ) - Math.min( r1.left(), r2.left() );
        height = Math.max( r1.bottom(), r2.bottom() ) - Math.min( r1.top(), r2.top() );

        return new Rectangle(x, y, width, height);
    }


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
    
    // Entity collision
    Entity.prototype.collisionRect = function () {
        return new Rectangle(this.x - this.width/2,
                            this.y - this.height/2,
                            this.width,
                            this.height);
    };

    // Player object
    function Player(x, y) {
        Entity.call(this, x, y, 40, 40);

        this.rangeOfMovement = 4;
        this.move(0);
    }

    // Player extends Entity
    Player.prototype = Object.create(Entity.prototype);

    // Update time step
    Player.prototype.update = function (dt) {
        Entity.prototype.update.call(this, dt);
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
        let _offScreenEntities = [];

        function _update(dt) {
            let enemies = game.enemies();
            let player = game.player();
            let playerHitbox = player.collisionRect();
            let i;

            // Collision Check
            for (i = enemies.length - 1; i >= 0; i-- ) {
                let enemy = enemies[i];
                let enemyHitbox = enemy.collisionRect();

                // Enemy hits player
                if (enemy && player && enemyHitbox.intersects(playerHitbox) ) {
                    // Resolve Collision (player loses)
                    game.setGameOver();
                }
                // Enemy goes off screen
                else if (enemy && (enemyHitbox.top() > renderer.INITIAL_HEIGHT())) {
                    _offScreenEntities.push(enemy);
                    game.addScore(1);
                }
            }
        }

        function _clearOffScreenEntities() {
            if (!_offScreenEntities) {
                return;
            }

            // Quick helper function to check if
            // a thing is not in entities array
            function isNotInEntities(item) {
                return !_offScreenEntities.includes(item);
            }

            // Clear entities
            _offScreenEntities = _offScreenEntities.filter(isNotInEntities);
        }

        return {
            update: _update,
            clearOffScreenEntities: _clearOffScreenEntities,
            offScreenEntities: function () { return _offScreenEntities; }
        };
    })();

    // Renderer
    renderer = (function () {
        let _canvas = document.getElementById("gameWindow");
        let _context = _canvas.getContext("2d");

        const _INITIAL_HEIGHT = 480;
        const _INITIAL_WIDTH = 320;
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

        // Render enemy at its coords
        function _drawEnemy(context, enemy) {
            // Still visible
            if (enemy.y < enemy.invisPointY) {
                context.fillStyle = "red";
                context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
            // Under water
            else {
                // Visualize turning point
                context.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/
                context.beginPath();
                context.moveTo(0, enemy.invisPointY+enemy.height);
                context.lineTo(_INITIAL_WIDTH, enemy.invisPointY+enemy.height);
                context.stroke();

                context.fillStyle = "white";
                context.fillRect(0, enemy.y+enemy.height, _INITIAL_WIDTH, 10);
            }
        }
        
        // Render player at its coords
        function _drawPlayer(context, player) {
            context.fillStyle = "green";
            context.fillRect(player.x, player.y, player.width, player.height);
        }

        // Render game elements and entities
        function _render(dt) {
            let entity;
            let entities = game.entities();
            let i;

            // Fill background
            _context.fillStyle = "blue";
            _context.fillRect(0, 0, _canvas.width, _canvas.height);

            // Draw every game entity
            for(i = 0; i < entities.length; i++) {
                entity = entities[i];

                if (entity instanceof Enemy) {
                    _drawEnemy(_context, entity);
                }
                else if (entity instanceof Player) {
                    _drawPlayer(_context, entity);
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

        let _entities, _enemies, _player;
        let _spawner;
        let _enemySpawnRate;

        let _started = false;
        let _gameOver;

        let _score;
        let _highScores;

        // Spawn a wave of enemies
        var _spawnWave = (function () {
            let waveCounter = 0;
            let enemySpeed = 2;
            let invisTurningPoint = renderer.INITIAL_HEIGHT();

            return function () {
                let openSpot = randomInt(4);
                let enemySpot;
                let i;

                // Increment spawned waves counter
                waveCounter++;
                console.log("wave " + waveCounter);

                // Tutorial waves are over, begin turning invisible
                if (waveCounter == 3) {
                    invisTurningPoint = invisTurningPoint / 4;
                    console.log("Activating invisibilty gene...");
                }

                // Every wave, enemies turn invisible a littler sooner
                // caps at y = 80
                if (invisTurningPoint >= 80)
                    invisTurningPoint -= 5;

                for (i = 0; i < 4; i++) {
                    if (i !== openSpot) {
                        enemySpot = (renderer.INITIAL_WIDTH() / 4) * i + 20;
                        _addEntity(new Enemy(enemySpot, -40, enemySpeed, invisTurningPoint));
                    }
                }
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
        
        // Game over
        function _setGameOver() {
            if (!_gameOver) {
                console.log("game over");
                _gameOver = true;
                clearInterval(_spawner);
                _insertScore(Math.round(game.score()));
            }
        }

        // Start game
        function _start() {
            console.log("game start");
            _entities = [];
            _enemies = [];
            _gameOver = false;
            _score = 0;
            _highScores = [];
            _enemySpawnRate = 2000;
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
            _spawner = setInterval(_spawnWave, _enemySpawnRate);

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
            //let speedUpAfterXWaves, speedUpRate;
            let i;

            // Smooth FPS
            let dt = Math.min((time - _lastFrameTime) / 1000, 3/60);

            _lastFrameTime = time;

            // Stop game if game over is reached
            if (_gameOver) {
                _started = false;
                return;
            }

            // Check collisions
            collisions.update(dt);

            // Update all entities
            for (i = 0; i < _entities.length; i++) {
                entity = _entities[i];
                entity.update(dt);

                // Delete offscreen enemies
                if (collisions.offScreenEntities().includes(entity)) {
                    entitiesToRemove.push(entity);
                }
            }
            

            _removeEntities(entitiesToRemove);
            collisions.clearOffScreenEntities();
            

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
        if( keybinds[key] !== undefined ) {
            e.preventDefault();
            if (game.player()) {
                game.player().move(keybinds[key]);
            }
        }
    }

    document.body.addEventListener('keydown', keyDown);

    ///////////////////////////////////////
    // Touch input
    ///////////////////////////////////////

    // Return object with touch location 
    // x and y in game coords
    function getRelativeTouchCoords(touch) {

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
        
        // Scale touch coords correctly
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
        }
    }

    renderer.canvas().addEventListener("touchstart", touchStart);

    ///////////////////////////////////////
    // Main Logic
    ///////////////////////////////////////

    game.start();
    
})();