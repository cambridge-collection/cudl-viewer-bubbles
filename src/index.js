import url from 'url';

import $ from 'jquery';

import cudl from 'cudl';

import Metadata from './models/metadata';
import CudlService from './cudlservice';
import SimilarityModel from './models/similaritymodel';
import { RootSimilarityView } from './views';


export default function setupSimilarityTab(data, docId) {
    let metadata = new Metadata(data, docId);
    let cudlService = new CudlService(url.resolve(cudl.services, '/v1/'));
    let similarityModel = new SimilarityModel(metadata, cudlService);

    $(cudl).on('change.cudl.pagenum', (e, page) =>
        similarityModel.setPage(page - 1));

    $(similarityModel).on('change:state',
        () => console.log('change:state', similarityModel.getState()));

    // Load the first/current page
    similarityModel.setPage(cudl.pagenum - 1);  // We use 0-based page indexes

    var view = new RootSimilarityView({
        el: $('#similaritems .similarity-container')[0],
        model: similarityModel
    }).render();
}

/*
    var spinOpts = {
        scale: 2,
        opacity: 0.1,
        shadow: true,
        top: '50%',
        left: '50%',
        className: 'blah-spinner'
    };
    var containerEl = $('#similaritems .similarity-container')[0];
    console.assert(containerEl instanceof Element);
    new Spinner(spinOpts).spin(containerEl);
*/

// Export our entry point to cudl.
cudl.setupSimilarityTab = setupSimilarityTab;
