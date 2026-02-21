(function(constants) {
    (function(flags) {
        flags.ROTATION_LEFT = 1;
        flags.ROTATION_RIGHT = 2;
        flags.ROTATION_180 = 4;
        flags.ROTATION_SPIN = 8;
        flags.ROTATION_MINI = 16;
        flags.ROTATION_SPIN_ALL = 32;
        flags.ROTATION_ALL = flags.ROTATION_LEFT | flags.ROTATION_RIGHT | flags.ROTATION_180 | flags.ROTATION_SPIN | flags.ROTATION_MINI | flags.ROTATION_SPIN_ALL;
        flags.STATE_WALL = 64;
        flags.STATE_SLEEP = 128;
        flags.STATE_FLOOR = 256;
        flags.STATE_NODRAW = 512;
        flags.STATE_ALL = flags.STATE_WALL | flags.STATE_SLEEP | flags.STATE_FLOOR | flags.STATE_NODRAW;
        flags.ACTION_IHS = 1024;
        flags.ACTION_FORCELOCK = 2048;
        flags.ACTION_SOFTDROP = 4096;
        flags.ACTION_MOVE = 8192;
        flags.ACTION_ROTATE = 16384;
        flags.FLAGS_COUNT = 15;
    })(constants.flags || (constants.flags = {}));
})(constants || (constants = {}));
export var constants;

//# sourceMappingURL=index.js.map