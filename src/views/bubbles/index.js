'use strict';

import util from 'util';
import assert from 'assert';

import _ from 'lodash';
import seedrandom from 'seedrandom';

import View from '../view';
import { bubbleLayout } from './bubblelayout';
import template from '../../../templates/bubbles-svg.jade';


export default class BubbleView extends View {
    constructor(options) {
        super(options);

        if(!_.isObject(options.similarity)) {
            throw new ValueError(
                `Expected a similarity object for options.model, got: ` +
                `${options.model}`);
        }

        if(!_.isString(options.similarityIdentifier) ||
            _.isEmpty(options.similarityIdentifier)) {
            throw new ValueError(
                `options.similarityIdentifier must be a non-empty string: ` +
                `\`${options.similarityIdentifier}\``);
        }

        this.similarity = options.similarity;
        this.similarityIdentifier = options.similarityIdentifier;
        this.viewportModel = options.viewportModel;
        this.layout = null;
        this.svgNode = null;


        let throttledLayout = _.throttle(this.createLayout.bind(this), 50);
        $(this.viewportModel).on('change:dimensions', () => {
            throttledLayout();
            // Render immediatley to update the viewport coordinates
            this.render();
        });

        if(this.viewportModel.hasDimensions()) {
            this.createLayout();
        }
    }

    // getWidth() { return this.$el.width(); }
    // getHeight() { return this.$el.height(); }

    getRandomGenerator() {
        // The creation/seeding of the RNG is critical to consistently
        // generating the same layout for the same set of similarity data.
        // We seed the RNG with the similarity ID of the section we're
        // generating the layout for.

        return seedrandom(this.similarityIdentifier);
    }

    getLayoutOptions() {
        return {
            aspectRatio: this.viewportModel.getAspectRatio(),
            rng: this.getRandomGenerator(),
            radius: hit => hit.score,
            attempts: 2000,
            initialFreeSpaceRatio: 1.3,
            padding:  0.1
        };
    }

    getBubbleData() {
        // We're visualising the similarity query hits (results) as variable
        // size bubbles based on their score.
        return this.similarity.hits;
    }

    createLayout() {
        // TODO: Could run the layout on a worker thread to avoid janking the UI
        this.layout = bubbleLayout(this.getLayoutOptions())
                                  (this.getBubbleData());

        // Transform the layout's normalised coordinate space to screen space.
        // The x and y axis have the same scale.
        this.scale = d3.scale.linear()
            .domain([0, this.layout.width])
            .range([0, this.viewportModel.getWidth()]);

        this.render();
        return this.layout;
    }

    getBaseSvg() {
        let doc = $.parseXML(template());
        let svg = doc.getElementsByTagNameNS(
            'http://www.w3.org/2000/svg', 'svg')[0];
        assert(svg);
        return svg;
    }

    render() {
        if(this.layout === null)
            return;

        if(this.svgNode === null) {
            this.svgNode = this.getBaseSvg();
            this.$el.append(this.svgNode);
        }

        // Update the view area to match the sidebar resizing
        let svg = d3.select(this.svgNode)
            .attr('viewBox', `0 0 ${this.viewportModel.getWidth()} ${this.viewportModel.getHeight()}`)
            .attr("width", '100%')
            .attr("height", '100%');

        this.renderBubbles(svg.select('.bubbles'));
    }

    renderBubbles(parent) {
        let bubble = parent.selectAll('g')
            .data(this.layout.circles);

        // ENTER
        this.renderBubblesEnter(bubble);

        // UPDATE
        this.renderBubblesUpdate(bubble);

        // EXIT
        bubble.exit().remove();

        return this;
    }

    renderBubblesEnter(bubble) {
        let scale = this.scale;

        let enter = bubble.enter();
        let g = enter.append('g')
            // Offset the bubble group to the center of the bubble
            .attr('transform', (c) => `translate(${scale(c.x)}, ${scale(c.y)})`)
            .attr('class', 'bubble');

        // Create clips required for our circles
        let defs = g.append('defs');
        defs.append('clipPath')
            .attr('id', (c, i) => `bubble-stroke-${i}`)
            .attr('class', 'bubble-stroke-clip')
            .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', (c) => scale(c.radius));

        g.append('circle')
            // Our parent is offset, so we just need to position outself
            // our radius from the top/left of our
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', (c) => {
                return scale(c.radius) - this.STROKE_WIDTH / 2;
            })
            .attr('class', 'bubble-border');

        g.append('circle')
            .attr('class', 'dbg-circle')
            // Our parent is offset, so we just need to position outself
            // our radius from the top/left of our
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', (c) => scale(c.radius));
    }

    renderBubblesUpdate(bubble) {
        let scale = this.scale;

        bubble.transition()
            .attr('transform', (c) => `translate(${scale(c.x)}, ${scale(c.y)})`);

        // Update the radius of the stoke clip
        bubble.select('defs .bubble-stroke-clip circle').transition()
            .attr('r', (c) => scale(c.radius));

        // Update the radius of the stroke/border
        bubble.select('.bubble-border').transition()
            .attr('r', (c) => scale(c.radius) - this.STROKE_WIDTH / 2);

        // Update the debug circle
        bubble.select('.dbg-circle')
            .attr('r', (c) => scale(c.radius));
    }
};
_.assign(BubbleView.prototype, {
    className: 'bubble-view',

    STROKE_WIDTH: 10
})
