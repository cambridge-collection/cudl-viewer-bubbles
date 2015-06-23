import assert from 'assert';

import { Rect } from './tiledimage';
import { ValueError } from '../../util/exceptions';
import { getRectangle } from './bubblelayout';

const CROP_PERC = 0.15;

export function randomSubregion(srcWidth, srcHeight, destWidth, destHeight, rng) {
    if(destWidth > srcWidth)
        throw new ValueError(
            `destWidth > srcWidth. destWidth: ${destWidth}, srcWidth: ${srcWidth}`);
    if(destHeight > srcHeight)
        throw new ValueError(
            `destHeight > srcHeight. destHeight: ${destHeight}, srcHeight: ${srcHeight}`);

    if(!rng)
        rng = Math.random;

    // crop the borders off the src image as they typically contain black
    // nothingness.
    let src = new Rect(srcWidth * CROP_PERC, srcHeight * CROP_PERC,
                       srcWidth - (srcWidth * CROP_PERC) * 2,
                       srcHeight - (srcHeight * CROP_PERC) * 2);

    let aspectRatio = destWidth / destHeight;

    let minArea = destWidth * destHeight;
    let maxArea = area(maxRect(aspectRatio, src.width, src.height));
    assert(minArea < maxArea)
    let randomArea = lerp(minArea, maxArea, rng());

    let [w, h] = getRectangle(aspectRatio, randomArea);

    let x = lerp(src.left, src.right - w, rng());
    let y = lerp(src.top, src.bottom - h, rng());

    return new Rect(x, y, w, h);
}

function maxRect(aspect, width, height) {
    let whAspect = width / height;

    // target wider than source
    if(aspect > whAspect) {
        return [width, width / aspect];
    }
    return [height * aspect, height];
}

function area([width, height]) {
    return width * height;
}

function lerp(x, y, t) {
    return x + (y - x) * t;
}
