/**
 * This module provides access to subsections of a multi-resolution tiled image
 * at a desired resolution.
 *
 * Here's a quick overview of what I've determined about the structure of the
 * images.
 *
 * Images a are represented in increasing resolution levels from 0 upwards.
 * The dimensions of an image at a given resolution level are given by:
 * 2^l where l is the level. Therefore:
 *
 * level 0: 1x1
 * level 1: 2*2
 * level 2: 4*4
 * ...
 * level 8: 256*256
 * level 13: 8192x8192
 *
 * The resampled image at each level is split into square tiles, say 256x256.
 * So level 13 would be represented as a 32x32 grid of 256x256 tiles.
 *
 * An image can take up less space than the available area in a given level.
 * Perhaps because it has a non-square aspect ratio, or because the source image
 * does not have a dimension which is a power of 2. In this case, tiles without
 * image content can be ignored.
 *
 * Rows and columns of tiles in a resolution level are counted from 0, where 0,0
 * is the top-left tile.
 *
 *
 * Our encoder places images at the top-left of the available area of a
 * resolution level, so tiles at the right and bottom edges may be unused.
 * It appears to encode/tile the source images by determining the highest
 * resolution level required to fit the source image without resampling, and
 * then work down from there. The resolution level needed for an image of a
 * given width and height is given by ceil(log2(max(width, height))).
 *
 * The dimensions of a level below the full resolution level can be calculated
 * by: w * 2**(t-f)  where w is the width or height, t is the target level and f
 * is the full-resolution level.
 *
 * For example, say we have an image 7880px wide and high.
 * The max level = 13 = math.ceil(math.log2(7800))
 * The size at level 8 = 243.75 = 7800 * 2^(8-13)
 *
 * Note that our encoder rounds up the scaled dimension, so level 8 would be
 * 244*244 here.
 *
 * --------------
 * For our bubble similarity viewer I need to load tiles to show randomly chosen
 * subsections of images in the circular bubbles. I could load the dzi XML for
 * each image, which contains the exact dimensions of the image at the highest
 * resolution available. That would mean lots of requests. Instead, because I
 * know that our images all fit into level 13 at max res, they'll all fit into
 * a single 256x256 tile at level 8. As such, I can fetch the level8 tile for
 * each image and:
 *   a) use it as a preview of the full res image
 *   b) use the dimensions of the image to calculate upper and lower bounds on
 *      the dimensions of the full resolution (level 13) image.
 */

export class ApproximatedTiledImage {
    constructor(options) {
        options = _.assign({}, options, {
            tileSize: 256,
            maxLevel: 13
        });

        // The known dimensions at a given level.
        this.w = options.w;
        this.h = options.h;
        this.lvl = options.lvl;

        this.tileSize = options.tileSize;
        this.maxLevel = options.maxLevel;
    }

    _extrapolateDimension(dimen, targetLevel, min) {
        min = min === undefined ? true : min;
        targetLevel = targetLevel === undefined ? this.maxLevel : targetLevel;

        let offset = min ? 1 : 0;

        let scaleFactor = Math.pow(2, targetLevel - this.lvl);
        return (dimen - offset) * scaleFactor;
    }

    width(targetLevel, min) {
        return this._extrapolateDimension(this.w, targetLevel, min);
    }

    height(targetLevel, min) {
        return this._extrapolateDimension(this.h, targetLevel, min);
    }

    /**
     * Get the tiles required to render the source rectangle at the given scale
     * factor.
     */
    sample(source, scale) {
        let target = source.scale(scale).roundOut();
        let targetLvl = minLevel(Math.max(this.width(), this.height()) * scale);

        let rows = _.range(Math.floor(target.left / this.tileSize),
                           Math.floor(target.right / this.tileSize) + 1);
        let cols = _.range(Math.floor(target.top / this.tileSize),
                           Math.floor(target.bottom / this.tileSize) + 1);

        let tiles = [];
        for(let row of rows) {
            for(let col of cols) {
                tiles.push(new Tile(row, col, targetLvl));
            }
        }
        return tiles;
    }
}

/**
 * Get the minimum resolution level that is required to represent the dimensions
 * of x. x is either a Rect or number.
 */
function minLevel(x) {
    if(x instanceof Rect)
        x = Math.max(x.width, x.height);

    return Math.ceil(log2(x));
}

/**
 * The base 2 logarithm of x.
 */
function log2(x) {
    return Math.log(x) / Math.LN2;
}


export class Tile {
    constructor(row, col, level) {
        this.row = row;
        this.col = col;
        this.level = level;
    }
}


export class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    /**
     * Scale (multiply) the rect by the given factor. e.g. s=2 would double the
     * size.
     */
    scale(s) {
        return new Rect(this.x * s, this.y * s, this.w * s, this.h * s);
    }

    /**
     * Round the rect's boundries to integers by enlarging the rect.
     */
    roundOut() {
        return new Rect(
            Math.floor(this.x), Math.floor(this.y),
            Math.ceil(this.w), Math.ceil(this.h));
    }

    get width() { return this.w; }
    get height() { return this.h; }
    get top() { return this.y; }
    get bottom() { return this.y + this.h; }
    get left() { return this.x; }
    get right() { return this.x + this.w; }
}
