///////////////////////////////////////
// Resources
///////////////////////////////////////
let resources = (function () {
    // Sprites
    const _SPRITE_SIZE = 128;
    const _STANDARD_SIZE = 90;
    const _GHOST_SIZE = 72;

    let _spritePool = new CloneablePool(new Sprite(null, 0, 0, 0, 0));

    // let sprites = {
    //     enemy: _spritePool.take().eventDriven("build/sprites/ghost.png", _GHOST_SIZE, _GHOST_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0),
    //     tiledGrass: _spritePool.take().tiled("build/sprites/grassland-tile.jpg", GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT, 414, 307, 0, 0, 1, 2),
    //     bigX: _spritePool.take().eventDriven("build/sprites/bigx.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0),
    //     checkMark: _spritePool.take().eventDriven("build/sprites/check.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0),
    //     grave: _spritePool.take().eventDriven("build/sprites/grave.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0),
    //     fog: _spritePool.take().eventDriven("build/sprites/fog2.png", GAME_FIELD_WIDTH, _STANDARD_SIZE*2, 438, 266, 1, 0, 0, 0),
    //     tapIcon: _spritePool.take().eventDriven("build/sprites/tap.png", _STANDARD_SIZE, _STANDARD_SIZE, 64, 64, 2, 3, 0, 0),
    // };
    // sprites.tapIcon.animationEndEvent = _tapIcon.resetAnimation;

    let _enemySprite = _spritePool.take().eventDriven("build/sprites/ghost.png", _GHOST_SIZE, _GHOST_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0);
    let _tiledGrass = _spritePool.take().tiled("build/sprites/grassland-tile.jpg", GAME_FIELD_WIDTH, GAME_FIELD_HEIGHT, 414, 307, 0, 0, 1, 2);
    let _bigX = _spritePool.take().eventDriven("build/sprites/bigx.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0);
    let _check = _spritePool.take().eventDriven("build/sprites/check.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0);
    // let _grave = _spritePool.take().eventDriven("build/sprites/grave.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0);
    let _graveShapes = {
        original: _spritePool.take().eventDriven("build/sprites/grave.png", _STANDARD_SIZE, _STANDARD_SIZE, _SPRITE_SIZE, _SPRITE_SIZE, 1, 0, 0, 0),
        // cross: ...,
        // ...
    };

    let _fog = _spritePool.take().eventDriven("build/sprites/fog.png", GAME_FIELD_WIDTH, _STANDARD_SIZE*2, 438, 266, 1, 0, 0, 0);

    let _tapIcon = _spritePool.take().eventDriven("build/sprites/tap.png", _STANDARD_SIZE, _STANDARD_SIZE, 64, 64, 2, 3, 0, 0);
    _tapIcon.animationEndEvent = _tapIcon.resetAnimation;

    // Audio
    let _audioContext;

    let _musicGainNode;
    let _sfxGainNode;

    let _masterVolume, _musicVolume, _sfxVolume;
    let _previousVolume;

    // Context
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    _audioContext = new AudioContext();
    
    // Volume control (1 = 100%)
    _masterVolume = 1;
    _musicVolume = 0.1;
    _sfxVolume = 0.15;

    // Music volume
    _musicGainNode = _audioContext.createGain();
    _musicGainNode.gain.value = _musicVolume;

    // Sound Effects volume
    _sfxGainNode = _audioContext.createGain();
    _sfxGainNode.gain.value = _sfxVolume;

    // SFX
    let _valid = new Sound("audio/ding", _audioContext, _sfxGainNode);
    let _error = new Sound("audio/error", _audioContext, _sfxGainNode);
    let _bgm = new Sound("audio/bgm", _audioContext, _musicGainNode, true);

    function _initVolume() {
        let lastVol;

        // Retrieve previous session's volume
        if (typeof(Storage) !== "undefined") {
            try {
                lastVol = JSON.parse(localStorage.getItem("nback_masterVolume"));
            }
            catch(e) {
                console.log("Previous volume data is corrupted or missing.");
            }


            // Restore volume if loaded successfully
            if (lastVol || lastVol === 0) {
                _masterVolume = lastVol;
                this.setMasterVolume(lastVol);

                return lastVol;
            }
        }

        // Failed. Return null
        return null;
    }
    
    function _setMasterVolume(vol) {
        _masterVolume = vol;
            
        _sfxGainNode.gain.value = _sfxVolume * vol;
        _musicGainNode.gain.value = _musicVolume * vol;

        // Save the latest volume data
        if (typeof(Storage) !== "undefined") {
            try {
                localStorage.setItem('nback_masterVolume', JSON.stringify(_masterVolume));
            }
            catch (e) {
                console.log("Error: an issue occurred when saving volume data.");
            }
        }
    }

    function _mute() {
        _previousVolume = _masterVolume;
        _setMasterVolume(0);
    }

    function _unmute() {
        _setMasterVolume(_previousVolume);
    }

    function _putSpriteBack(spr) {
        let i;

        for (i = spr.layers.length; i >= 0; i--) {
            _spritePool.putBack(spr.layers[i]);
            //spr.layers.length--;
        }

        _spritePool.putBack(spr);
    }

    return {
        //spr_playerWalkingUp: function() { return _spritePool.take().copyAttributes(_playerWalkingUp); },
        spr_enemy: function() { return _spritePool.take().copyAttributes(_enemySprite); },
        //spr_explosion: function() { return _spritePool.take().copyAttributes(_playerExplode); },
        //spr_leafPile: function() { return _spritePool.take().copyAttributes(_pileOfLeaves); },
        spr_tapIcon: function() { return _spritePool.take().copyAttributes(_tapIcon); },
        spr_tiledGrass: function() { return _spritePool.take().copyAttributes(_tiledGrass); },
        spr_bigX: function() { return _spritePool.take().copyAttributes(_bigX); },
        //spr_life: function() { return _spritePool.take().copyAttributes(_life); },
        spr_check: function() { return _spritePool.take().copyAttributes(_check); },
        spr_fog: function() { return _spritePool.take().copyAttributes(_fog); },
        spr_grave: function(shape) {
            shape = shape || "original";
            return _spritePool.take().copyAttributes(_graveShapes[shape]);
        },

        snd_valid: _valid,
        snd_error: _error,
        snd_bgm: _bgm,

        initVolume: _initVolume,
        setMasterVolume: _setMasterVolume,

        mute: _mute,
        unmute: _unmute,

        putSpriteBack: _putSpriteBack,

        STANDARD_SIZE: _STANDARD_SIZE,
        GHOST_SIZE: _GHOST_SIZE
    };
})();