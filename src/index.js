import url from 'url';

import $ from 'jquery';

import cudl from 'cudl';

import Metadata from './models/metadata';
import CudlService from './cudlservice';
import SimilarityModel from './models/similaritymodel';
import LoadingModel from './models/loadingmodel';
import ViewportModel from './models/viewportmodel';
import { RootSimilarityView } from './views';


export default function setupSimilarityTab(data, docId) {
    let metadata = new Metadata(data, docId);
    let cudlService = new CudlService(url.resolve(cudl.services, '/v1/'));
    let loadingModel = new LoadingModel();
    let similarityModel = new SimilarityModel(metadata, cudlService, loadingModel);
    let viewportModel = new ViewportModel();

    $(cudl).on('change.cudl.pagenum', (e, page) =>
        similarityModel.setPage(page - 1));

    $(similarityModel).on('change:state',
        () => console.log('change:state', similarityModel.getState()));

    // Load the first/current page
    similarityModel.setPage(cudl.pagenum - 1);  // We use 0-based page indexes

    var view = new RootSimilarityView({
        el: $('#similaritems .similarity-container')[0],
        similarityModel: similarityModel,
        loadingModel: loadingModel,
        viewportModel: viewportModel
    }).render();

    // Watch for our tab being shown/hidden
    $('#similaritemstab').on('shown.bs.tab', e => {
        viewportModel.setDimensions(view.$el.width(), view.$el.height());
    });

    $(window).on('resize', function() {
        if(view.$el.is(':visible')) {
            viewportModel.setDimensions(view.$el.width(), view.$el.height());
        }
    });
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
