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
    }
}
_.assign(InfoCardView.prototype, {
    className: 'infocard'
});
