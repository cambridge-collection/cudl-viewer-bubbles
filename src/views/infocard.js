import assert from 'assert';

import _ from 'lodash';

import View from './view';
import { SimilarityItemModel } from '../models/similarityitemmodel';
import * as cudlurls from '../util/urls';
import infoCardTemplate from '../../templates/infocard.jade';


export class InfoCardView extends View {

    constructor(options) {
        super(options);

        if(!(options.model instanceof SimilarityItemModel))
            throw new ValueError('Expected a SimilarityItemModel as ' +
                                 `items.model, got: ${options.model}`);

        this.model = options.model;
    }

    // TODO: define weighted importance values to dmd items to pick useful
    // subset to show.

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
