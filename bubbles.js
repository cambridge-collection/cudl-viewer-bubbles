import assert from 'assert';
import util from 'util';

import d3 from 'd3';
import lodash from 'lodash';
import seedrandom from 'seedrandom';

let rng = seedrandom('hello');

var width = 400,
    height = 600;

let scale = .6;
width *= scale;
height *= scale;

var circles = _.times(10, () => {
    return {
        r: 20 + rng() * 20
    }
});

circles = _.sortBy(circles, (circle) => -circle.r);

let circlesArea = _(circles).map(area).sum();
console.log(util.format('space used: %s%%', (circlesArea / (width * height)) * 100));

let layedCircles = layout(circles, width, height);

var chart = d3.select(".chart")
    .attr("width", width)
    .attr("height", height)
    .selectAll('circle')
        .data(layedCircles)
        .enter().append("circle")
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y)
            .attr('r', (d) => d.radius)
            .attr('class', 'bubble');


function normalize(circles) {
    let max = _(circles).map(c => c.r).max();
    return _.map(circles, c => _.assign({}, c, {r: c.r / max}));
}

function area(circle) {
    return Math.PI * circle.r * circle.r;
}

/**
 * Get the rectangle with the specified aspect ratio (width/height) and area as
 * an array of [width, height].
 *
 * i.e. width/height = aspectRatio, width*height = area
 */
function getRectangle(aspectRatio, area) {
    let w = aspectRatio;
    let h = 1 / aspectRatio;
    // w * h = 1
    let sqrtArea = Math.sqrt(area);
    return [w * sqrtArea, h * sqrtArea];
}

/**
 * Lay out circles in a rectangle of width and height.
 *
 * A random, greedy strategy is used for the layout: The circles are placed
 * in a random location, starting with the largest circle and progressing in
 * order of size until the smallest is placed last.
 *
 * @param [array] circles An array of objects representing the circles to lay out
 * @param  [object] options Additional layout options
 */
function layout(data, width, height, options) {
    options = _.assign({
        // Number of times to try to layout each circle
        attempts: 100,
        // Accessor function to get the radius of an input circle
        radius: data => data.r
    }, options);

    // Wrap each circle in our own layout object representing the position of
    // the circle in the layout.
    let circles = _(data).map(data => ({
        radius: options.radius(data),
        data: data
    })).value();

    // We layout from the largest to smallest
    circles = _.sortBy(circles, (circle) => -circle.radius);

    for(let i = 0; i < circles.length; i++) {
        let circle = circles[i];
        let radius = circle.radius;

        assert(width >= radius);
        assert(height >= radius);

        let placed = false;
        for(let attempt = 0; attempt < options.attempts; attempt++) {
            let x = radius + (rng() * (width - radius * 2));
            let y = radius + (rng() * (height - radius * 2));

            // Check for collisions
            let collision = false;
            for(let j = 0; j < i; j++) {
                let other = circles[j];
                let dist = Math.sqrt(
                    Math.pow(other.x - x, 2) + Math.pow(other.y - y, 2))
                if(dist < other.radius + radius) {
                    collision = true;
                    break;
                }
            }

            if(!collision) {
                circle.x = x;
                circle.y = y;
                placed = true;
                break;
            }
        }

        if(!placed) {
            throw new Error(util.format(
                'Unable to place circle %d (%d remaining)',
                i + 1, circles.length - i));
        }
    }

    return circles;
}
