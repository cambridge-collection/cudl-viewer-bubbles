import assert from 'assert';

import _ from 'lodash';

import View from './view';
import { SimilarityItemModel } from '../models/similarityitemmodel';

import infoCardTemplate from '../../templates/infocard.jade';


export class InfoCardView extends View {

    constructor(options) {
        super(options);

        if(!(options.model instanceof SimilarityItemModel))
            throw new ValueError('Expected a SimilarityItemModel as ' +
                                 `items.model, got: ${options.model}`);

        this.model = options.model;
    }

    render() {
        if(!this.$el.children().length) {
            this.$el.html(infoCardTemplate());
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
}
_.assign(InfoCardView.prototype, {
    className: 'infocard'
});
