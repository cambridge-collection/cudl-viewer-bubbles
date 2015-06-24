'use strict';

import util from 'util';
import assert from 'assert';
import url from 'url';

import _ from 'lodash';
import seedrandom from 'seedrandom';

import View from '../view';
import { bubbleLayout } from './bubblelayout';
import template from '../../../templates/bubbles-svg.jade';
import { ApproximatedTiledImage } from './tiledimage';
import { randomSubregion } from './subregion';


const XLINK_NS = 'http://www.w3.org/1999/xlink',
      // The level in the .dzi tile tree that consistently fits our entire image
      THUMBNAIL_LVL = 8,
      // The highest resolution level available in the dzi tile tree
      MAX_LVL = 12;

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
        this.imageServerBaseUrl = options.imageServerBaseUrl || '';
        this.layout = null;
        this.svgNode = null;
        this.renderRequested = false;


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

    requestRender() {
        if(this.renderRequested === false) {
            this.renderRequested = setTimeout(
                this.render.bind(this), 0);
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
        // Allow another render to be requested
        this.renderRequested = false;

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

        let bubbles = svg.select('.bubbles');
        this.renderBubbles(bubbles);
    }

    renderBubbles(parent) {
        let bubble = parent.selectAll('g.bubble')
            .data(this.layout.circles);

        // UPDATE
        this.renderBubblesUpdate(bubble);

        // ENTER
        this.renderBubblesEnter(bubble);

        // EXIT
        bubble.exit().remove();

        // Nested data join to render each tile
        this.renderTiledPreviews(bubble);

        return this;
    }

    renderBubblesEnter(bubble) {
        let scale = this.scale;
        let self = this;

        let enter = bubble.enter();
        let a = enter.append('a')
            .attr('xlink:href', this._bubbleUrl.bind(this))
            .attr('target', '_parent')
        let g = a.append('g')
            // Offset the bubble group to the center of the bubble
            .attr('transform', (c) => `translate(${scale(c.x)}, ${scale(c.y)})`)
            .attr('class', 'bubble');

        // Create clips required for our circles
        let defs = g.append('defs');
        defs.append('clipPath')
            .attr('id', this._bubbleClipId.bind(this))
            .attr('class', 'bubble-stroke-clip')
            .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', this._bubbleClipRadius.bind(this));

        // Placeholder ? text to show something before the image is loaded
        // <text class="placeholder" x="50" y="50" font-size="100">?</text>
        g.append('text')
            .attr('class', 'placeholder')
            .attr('x', 0)
            .attr('y', 0)
            .attr('font-size', this._placeholderFontSize.bind(this))
            .text('?');

        // Create group to hold the image. Initially it contains the thumbnail
        // preview until the the thumbnail loads, allowing the main image to be
        // fetched.
        let imageG = g.append('g')
            .attr('class', 'preview-image')
            .attr('clip-path', (c, i) => `url(#${this._bubbleClipId(c, i)})`);
        imageG.append('image')
            .attr('class', 'thumbnail')
            .attr('preserveAspectRatio', 'xMidYMid slice')
            // re-render when the image loads. This will pick up the image
            // dimentions and insert the full res tiles.
            .on('load', function(c, i) {
                let elem = this;
                self._createTiledImageSampler(elem, c);
                self.requestRender();
            })
            .attr('xlink:href', this._previewImageThumbnailUrl.bind(this))
            .attr('x', this._previewImageThumbnailXY.bind(this))
            .attr('y', this._previewImageThumbnailXY.bind(this))
            .attr('width', this._previewImageThumbnailSize.bind(this))
            .attr('height', this._previewImageThumbnailSize.bind(this));

        // The group for the white border
        let borderG = g.append('g')
            .attr('class', 'bubble-border');
        borderG.append('rect')
                .attr('class', 'border-shadow-pad-hack')
                .attr('x', this._borderShadowPadHackXY.bind(this))
                .attr('y', this._borderShadowPadHackXY.bind(this))
                .attr('width', this._borderShadowPadHackSize.bind(this))
                .attr('height', this._borderShadowPadHackSize.bind(this))
        borderG.append('circle')
                // Our parent is offset, so we just need to position outself
                // our radius from the top/left of our
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', this._borderCircleRadius.bind(this));

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

        bubble.select('text.placeholder').transition()
            .attr('font-size', this._placeholderFontSize.bind(this));

        // Update bounds of preview thumbnail
        bubble.select('image.thumbnail')
            .attr('x', this._previewImageThumbnailXY.bind(this))
            .attr('y', this._previewImageThumbnailXY.bind(this))
            .attr('width', this._previewImageThumbnailSize.bind(this))
            .attr('height', this._previewImageThumbnailSize.bind(this));

        // Update the radius of the stoke clip
        bubble.select('defs .bubble-stroke-clip circle').transition()
            .attr('r', this._bubbleClipRadius.bind(this));

        // Update the radius of the stroke/border
        bubble.select('.border-shadow-pad-hack')
            .attr('x', this._borderShadowPadHackXY.bind(this))
            .attr('y', this._borderShadowPadHackXY.bind(this))
            .attr('width', this._borderShadowPadHackSize.bind(this))
            .attr('height', this._borderShadowPadHackSize.bind(this));

        bubble.select('.bubble-border circle').transition()
            .attr('r', this._borderCircleRadius.bind(this));

        // Update the debug circle
        bubble.select('.dbg-circle')
            .attr('r', (c) => scale(c.radius));
    }

    _borderCircleRadius(c) {
        // SVG strokes are half inside, half outside the shape, so we need to
        // shrink the circle radius by half the stroke width to avoid
        // overflowing our defined circle area.
        return this.scale(c.radius) - this.STROKE_WIDTH / 2
    }

    _bubbleClipId(c, i) {
        return `bubble-clip-${i}`;
    }

    _bubbleClipRadius(c) {
        return this.scale(c.radius) - this.STROKE_WIDTH - this.PREVIEW_IMAGE_OVERLAP;
    }

    _placeholderFontSize(c) {
        return (this.scale(c.radius) * 2 - this.STROKE_WIDTH) / 2;
    }

    _borderShadowPadHackSize(c) {
        return this.scale(c.radius) * 2 + this.BORDER_SHADOW_PADDING * 2;
    }

    _borderShadowPadHackXY(c) {
        return 0 - this._borderShadowPadHackSize(c) / 2;
    }

    _previewImageThumbnailUrl(c) {
        let imageUrl = c.data.firstPage.thumbnailImageURL;
        if(!imageUrl) {
            console.warn('Similarity hit has no image', c);
            return null;
        }
        return url.resolve(this.imageServerBaseUrl, imageUrl);
    }

    _previewImageThumbnailSize(c) {
        return this.scale(c.radius) * 2 * this.PREVIEW_THUMB_SCALE;
    }

    _previewImageThumbnailXY(c) {
        return 0 - this._previewImageThumbnailSize(c) / 2;
    }

    _bubbleUrl(c) {
        return [
            '', 'view', encodeURIComponent(c.data.ID),
            encodeURIComponent(c.data.firstPage.sequence)
        ].join('/');
    }

    _createTiledImageSampler(thumbnailImageEl, c) {
        let [thumbW, thumbH] = getSvgImageDimentions(thumbnailImageEl);
        c.data.tiledImage = new ApproximatedTiledImage(
            {w: thumbW, h: thumbH, lvl: THUMBNAIL_LVL, maxLevel: MAX_LVL});
    }

    renderTiledPreviews(bubble) {
        let tileGroup = bubble.select('g.preview-image').selectAll('g.tiles')
            .data((circle, i) => {
                // tiledImage is only created when the preview image is loaded.
                // Until then we can't render any tiles because we don't know
                // what they are yet.
                if(!circle.data.tiledImage)
                    return [];

                let sample = this._getFullResPreviewTileSample(circle, i);

                return [{circle: circle,
                         sample: sample}];
            });

        // Create the (initially empty) group to hold the full-res image tiles
        tileGroup.enter()
            .append('g')
                .attr('class', 'tiles')
                .attr('transform', this._getTileGroupTransform.bind(this));
        tileGroup.exit().remove();

        // UPDATE
        tileGroup
            .attr('transform', this._getTileGroupTransform.bind(this));

        // Create subselection to allow a nested data join under each bubble
        let tile = tileGroup.selectAll('image')
            .data(({sample, circle}) => {
                return _.map(sample.tilesList(),
                             tile => ({tile: tile, sample: sample,
                                       circle: circle}));
            });

        tile.enter()
            .append('image')
                .attr('class', ({tile, sample}) => {
                    console.log('rendering tile: ', tile, sample);
                    return 'tile';
                })
                .on('load', function() {
                    let imageEl = this;
                    let [w, h] = getSvgImageDimentions(imageEl);
                    imageEl.setAttribute('width', w);
                    imageEl.setAttribute('height', h);
                })
                .attr('xlink:href', this._getTileUrl.bind(this))
                .attr('x', this._getTileX.bind(this))
                .attr('y', this._getTileY.bind(this));

        // UPDATE
        tile.attr('xlink:href', this._getTileUrl.bind(this))
            .attr('x', this._getTileX.bind(this))
            .attr('y', this._getTileY.bind(this));

        tile.exit().remove();
    }

    _getTileUrl({tile, circle}) {
        let thumbnailUrl = this._previewImageThumbnailUrl(circle);
        return thumbnailUrl.replace(
            /\/\d+\/\d+_\d+\.([a-z]+)$/,
            `/${tile.level}/${tile.col}_${tile.row}.$1`);
    }

    _getTileImageDimention({sample}) {
        return sample.tileSize + this.TILE_OVERLAP;
    }

    _getTileGroupTransform({sample, circle}) {
            let scale = this.scale;
            return [
                // Scale first as region offsets are in scaled units.
                // Also scaling happens around (0, 0) so scaling has to
                // be done before offsetting into position under the
                // bubble.
                `scale(${sample.scale})`,
                // Offset the tiled area to place our sampled region at
                // (0,0)
                `translate(${-sample.region.x}, ${-sample.region.y})`,

                // The bubbles (0,0) is at the center, so need to offset
                // by the radius to place the image at the top-left
                `translate(${scale(-circle.radius)} ${scale(-circle.radius)})`
            ].join(' ');
        }

    _getTileX({tile, sample}) {
        return (tile.col - sample.tiles.left) * sample.tileSize;
    }

    _getTileY({tile, sample}) {
        return (tile.row - sample.tiles.top) * sample.tileSize;
    }

    /**
     * Assign a randomly chosen region of the full-res image for the bubble.
     */
     // TODO: Move scale dependant part of these calculations into the d3 update
     // call.
    _getFullResPreviewTileSample(c, i) {
        let tiledImage = c.data.tiledImage;

        // The minimum possible dimensions of the image at the highest
        // resolution level, given the size of the thubnail.
        let minimumWidthFull = tiledImage.width(MAX_LVL, true);
        let minimumHeightFull = tiledImage.height(MAX_LVL, true);

        let destWH = this.scale(c.radius * 2);

        // Using a consistent seed for each bubble ensures the same subregion
        // is selected each time.
        let rng = seedrandom(`${c.data.ID}/${c.data.firstPage.sequence}/${i}`);

        // Randomly choose a subregion of the highest res to show in the bubble
        let subregion = randomSubregion(minimumWidthFull, minimumHeightFull,
                                        destWH, destWH, rng);

        // destWH is the smallest the subregion will be, it may be larger, up to
        // the entire available image area.
        let scale = destWH / subregion.width;
        assert(scale <= 1);

        // Give me the tiles required to render the specified sub rectangle of
        // the image at the given scale (zoom) level.
        // i.e. if the region is 1000px wide and scale is 0.1 then we'd get the
        // tiles to render a 100px wide area (no the 1000px area).
        return tiledImage.sample(subregion, scale);
    }
};
_.assign(BubbleView.prototype, {
    className: 'bubble-view',

    STROKE_WIDTH: 10,
    // The amount the preview image overlaps with the stroke to avoid gaps at
    // the border with the stroke
    PREVIEW_IMAGE_OVERLAP: 0,
    BORDER_SHADOW_PADDING: 5,
    // Amount to scale the preview thumbnail by, relative to the size of the
    // bubble. Used to avoid rendering the border around the item in the image.
    PREVIEW_THUMB_SCALE: 1.3,
    // The amount tiles overlap by on their right and bottom edges
    TILE_OVERLAP: 1
})

function getSvgImageDimentions(imageEl) {
    // The imageEl must have dispatched a "load" event before this is called
    let imageUrl = imageEl.getAttributeNS(XLINK_NS, 'href');

    // SVG's image el doesn't provide an API for accessing the dimensions of the
    // loaded image. The HTML img element does though, and because the SVG image
    // has already loaded the URL, the browser shouldn't request it again if we
    // create an image el with the same URL, allowing us to access the
    // dimensions.
    let htmlImg = new Image();
    htmlImg.src = imageUrl;
    assert(htmlImg.width);
    assert(htmlImg.height);

    return [htmlImg.width, htmlImg.height];
}
