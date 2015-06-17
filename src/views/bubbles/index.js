import util from 'util';

import _ from 'lodash';
import seedrandom from 'seedrandom';

import View from '../view';
import { bubbleLayout } from './bubblelayout';


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

        $(this.viewportModel).on('change:dimensions',
                                 this.createLayout.bind(this));
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

    render() {
        if(this.layout === null)
            return;

        if(this.svgNode === null) {
            this.svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.$el.append(this.svgNode);
        }

        let scale = this.scale;

        // Render the bubbles
        var circle = d3.select(this.svgNode)
            .attr('viewBox', util.format(
                '0 0 %d %d', this.viewportModel.getWidth(),
                this.viewportModel.getHeight()))
            .attr("width", '100%')
            .attr("height", '100%')
            .selectAll('circle')
                .data(this.layout.circles)
                .attr('cx', (c) => scale(c.x))
                .attr('cy', (c) => scale(c.y))
                .attr('r', (c) => scale(c.radius));
        circle.enter().append("circle")
            .attr('cx', (c) => scale(c.x))
            .attr('cy', (c) => scale(c.y))
            .attr('r', (c) => scale(c.radius))
            .attr('class', 'bubble');
        circle.exit().remove();

        return this;
    }
};
_.assign(BubbleView.prototype, {
    className: 'bubble-view'
})
