///////////////////////////////////////
// Renderer
///////////////////////////////////////

let renderer = (function () {
    // Figure out if user device is android or ios
    const _ua = navigator.userAgent.toLowerCase();
    const _android = _ua.indexOf('android') > -1;
    const _ios = /ipad|iphone|ipod/i.test(_ua) && !window.MSStream;

    let _livesDiv;

    let _startBtn = document.getElementById("start_button");

    let _canvas = document.getElementById("gameWindow");
    let _context = _canvas.getContext("2d", { alpha: false });

    let _currentHeight = GAME_FIELD_HEIGHT;
    let _currentWidth = GAME_FIELD_WIDTH;

    let _fgObjects = [];
    
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
        let overlay = document.getElementById("overlay");
        let widebar = document.getElementById("widebar");

        // Get correct dimensions
        _currentHeight = window.innerHeight;
        _currentWidth = _currentHeight * ratio;

        // Cancel previous livesDiv settings
        //if(_livesDiv) {
        //    _livesDiv.parentNode.style.display = "none";
        //}

        // Overlay the lives if there's no room up top
        _livesDiv = document.getElementById("lives-overlay");
        overlay.style.display = "initial";
        overlay.style.position = "absolute";
        overlay.style.height = "8%";

        // Add enough size to scroll down 
        // past the address bar on ios or android
        if (_android || _ios) {
            document.body.style.height = (window.innerHeight + addressBarHeight) + 'px';
        }
        else {
            document.body.style.height = window.innerHeight+'px';
        }

        // Double check aspect ratio
        if ( Math.floor(_currentWidth) > window.innerWidth) {
            // resize to fit width
            ratio = GAME_FIELD_HEIGHT / GAME_FIELD_WIDTH;

            // Get correct  dimensions
            _currentWidth = window.innerWidth;
            _currentHeight = _currentWidth * ratio;

            //overlay.style.bottom = "0";
            overlay.style.height = (window.innerHeight - _currentHeight) + "px";
            overlay.style.position = "fixed";
            /* Fill extra space
            overlay.style.display = "none";
            widebar.style.display = "initial";
            widebar.style.height = (window.innerHeight - _currentHeight)+'px';
            _livesDiv = document.getElementById("lives-widebar");*/
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
        let layers = sprite.layers;
        let original = sprite;
        let i;

        // Draw the sprite and each layer
        for(i = 0; i <= layers.length; i++) {
            sprite = layers[i];

            if (i === layers.length) {
                sprite = original;
            }

            // If the image is static or the animation reached its end,
            // only draw the last frame (sometimes the only frame)
            if (sprite.draw &&
                (sprite.frameRate <= 0 || sprite.currentFrame >= sprite.frames)) {

                // Apply opacity
                _context.save();
                _context.globalAlpha = sprite.alpha;

                // Draw the image
                _context.drawImage(sprite.image,
                                    sprite.width*(sprite.frames-1), 0,
                                    sprite.width, sprite.height,
                                    x, y,
                                    sprite.width, sprite.height);

                // Restore to normal opacity for everything else
                _context.restore();
            }

            // Otherwise, draw the correct frame of the animated sprite
            else if (sprite.draw) {

                // Apply opacity
                _context.save();
                _context.globalAlpha = sprite.alpha;

                // Draw the image
                _context.drawImage(sprite.image,
                                    sprite.width*sprite.currentFrame, 0,
                                    sprite.width, sprite.height,
                                    x, y,
                                    sprite.width, sprite.height);

                // Restore to normal opacity for everything else
                _context.restore();
            }
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

            if (game.accelerating() && !game.gameOver()) {
                y = (y+movingSpeed) % GAME_FIELD_HEIGHT;
            }
        };
    })();

    let _updateUI = (function() {
        const LIFE_IMAGE = resources.spr_collar();
        const SCORE_ELEMENT = document.getElementById("score");

        let previousLives = 0;
        let previousScore = 0;

        return function(forceUpdate=false) {
            let numLives, score;
            let i;

            if (game && !game.started()) {
                // Hide lives
                //_livesDiv.style.display = "none";
                
                // Make start button disappear
                _startBtn.style.display = "block";
            }
            else if (game) {
                // Show lives
                //_livesDiv.style.display = "flex";

                // Make start button disappear
                _startBtn.style.display = "none";

                numLives = game.player().life;
                score = game.score();

                // Update score
                if (previousScore !== score || forceUpdate) {
                    previousScore = score;
                    SCORE_ELEMENT.textContent = "Score: " + score;
                }
                
                // Update Player Lives
                if( previousLives !== numLives || forceUpdate ) {

                    previousLives = numLives;

                    for (i = 0; i < _livesDiv.childNodes.length; i++) {
                        if (_livesDiv.childNodes[i] instanceof Image) {
                            _livesDiv.removeChild(_livesDiv.childNodes[i]);
                            i--;
                        }
                    }

                    // Add an image for each life
                    for (i = 0; i < numLives; i++) {
                        let img = document.createElement("img");
                        img.src = LIFE_IMAGE.image.src;
                        img.className = "life";

                        _livesDiv.appendChild(img);
                    }
                }
            }
        };
    })();

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

            //_context.fillStyle = "#000000";
            //if (clickBox !== null) {
            //   _context.fillRect(clickBox.x, clickBox.y, clickBox.width, clickBox.height);
            //}

            // Only render the enemy if it actually has a sprite to render
            if (entity.sprite) {
                // Update the sprite animation if the game is not paused
                // TempEntity objects should animate even when paused
                if (game.accelerating() || entity instanceof TempEntity || entity.sprite.fadeAmt !== 0) {
                    entity.sprite.update(dt);
                }

                // Save foreground sprites for drawing after everyone else
                if (entity.sprite.foreground) {
                    _fgObjects.push(entity);
                }

                // Use different positioning for temp entities
                else if (entity instanceof TempEntity) {
                    _drawSprite(entity.sprite, entity.x + entity.width/4, entity.y);
                }

                // Otherwise draw normally
                else {
                    _drawSprite(entity.sprite, entity.x/*-(entity.width/4)*/, entity.y/*-(entity.height/2)*/);
                }
            }
        }

        for (i = 0; i < _fgObjects.length; i++) {
            entity = _fgObjects[i];
            _drawSprite(entity.sprite, entity.x, entity.y);
        }
        _fgObjects.length = 0;
    }

    return {
        render: _render,
        //GAME_FIELD_WIDTH: GAME_FIELD_WIDTH,
        //GAME_FIELD_HEIGHT: GAME_FIELD_HEIGHT,
        canvas: _canvas,

        isIOS: function() { return _ios; },
        currentWidth: function () { return _currentWidth; }
    };

})();