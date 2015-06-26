import assert from 'assert';

import _ from 'lodash';
import $ from 'jquery';

import View from './view';
import { ValueError } from '../util/exceptions';
import { SimilarityItemModel } from '../models/similarityitemmodel';
import * as cudlurls from '../util/urls';
import infoCardTemplate from '../../templates/infocard.jade';


const MOUSE_LEAVE_GRACE_PERIOD = 150;


export class InfoCardView extends View {

    constructor(options) {
        super(options);

        if(!(options.model instanceof SimilarityItemModel))
            throw new ValueError('Expected a SimilarityItemModel as ' +
                                 `items.model, got: ${options.model}`);

        this.model = options.model;
        this.isUnderMouse = false;

        this.dismiss = this.dismiss.bind(this);
        this.onBubbleUnderMouseChange = this.onBubbleUnderMouseChange.bind(this);
        this.onUsUnderMouseChange = this.onUsUnderMouseChange.bind(this);

        this.bindEvents();
    }

    bindEvents() {
        $(this.model).on('change:isUnderMouse', this.onBubbleUnderMouseChange);
        this.$el.on('mouseenter mouseleave', this.onUsUnderMouseChange);
    }

    unbindEvents() {
        // unbind mouse listener
        $(this.model).off('change:isUnderMouse', this.onBubbleUnderMouseChange);
        this.$el.off('mouseenter mouseleave', this.onUsUnderMouseChange);
    }

    onBubbleUnderMouseChange() {
        if(!this.shouldBeVisible())
            this.scheduleDismiss();
        else
            this.cancelDismiss();
    }

    onUsUnderMouseChange(e) {
        this.isUnderMouse = e.type === 'mouseenter';

        if(!this.shouldBeVisible())
            this.scheduleDismiss();
        else
            this.cancelDismiss();
    }

    shouldBeVisible() {
        return this.isUnderMouse || this.model.isUnderMouse;
    }

    scheduleDismiss() {
        if(!this._scheduledDismiss) {
            this._scheduledDismiss = setTimeout(this.dismiss,
                                                MOUSE_LEAVE_GRACE_PERIOD);
        }
    }

    cancelDismiss() {
        if(this._scheduledDismiss) {
            clearTimeout(this._scheduledDismiss);
            this._scheduledDismiss = undefined;
        }
    }

    // TODO: define weighted importance values to dmd items to pick useful
    // subset to show.

    dismiss() {
        this.unbindEvents();

        $(this).trigger('dismissed');

        // TODO: transition/animate removal
        this.$el.remove();
    }

    render() {
        if(!this.$el.children().length) {
            this.$el.html(infoCardTemplate({
                title: this.getTitle(),
                subtitles: this.getSubTitles(),
                abstract: this.getAbstractExcerpt(),
                url: this.getItemUrl()
            }));
        }

        let svg = $(this.model.svgElement).closest('svg');
        let svgOffset = svg.offset();

        // let width = parent.width();

        this.$el.css({
            top: this.model.position.y + svgOffset.top,
            // right: width - this.model.position.x - this.model.position.r
            left: this.model.position.x + svgOffset.left
        });
    }

    getDmdHierachy() {
        let hit = this.getHit();
        let dmds = hit.descriptiveMetadata;
        return _(this.getHit().structurePath)
            .map(s => dmds[s.descriptiveMetadataID])
            .value();
    }

    getHit() {
        assert(this.model.hit);
        return this.model.hit;
    }

    getRootDmd() {
        return this.getDmdHierachy()[0];
    }

    getTitle() {
        let dmd = this.getRootDmd();
        return dmd.title && dmd.title.displayForm || null;
    }

    getSubTitles() {
        return _(this.getDmdHierachy())
            .slice(1)
            .map(dmd => dmd.title && dmd.title.displayForm)
            .filter()
            .join(' › ');
    }

    getAbstractExcerpt(dmd) {
        dmd = dmd || this.getRootDmd();

        if(!dmd.abstract)
            return null;

        let html = $($.parseHTML(dmd.abstract.displayForm));
        return html.find('p').addBack('p').first().text() || null;
    }

    getItemUrl() {
        let hit = this.getHit();
        return cudlurls.cudlItem(hit.ID, hit.firstPage.sequence);
    }
}
_.assign(InfoCardView.prototype, {
    className: 'infocard'
});
