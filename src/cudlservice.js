import util from 'util';
import url from 'url';

import _ from 'lodash';
import $ from 'jquery';
import Q from 'q';

import { ValueError } from './util/exceptions';


export default class CudlService {
    constructor(cudlServicesBaseUrl) {
        if(!_.isString(cudlServicesBaseUrl) || _.isEmpty(cudlServicesBaseUrl))
            throw new ValueError(util.format(
                'cudlServicesBaseUrl was not a non-empty string: %s',
                cudlServicesBaseUrl));

        if(!cudlServicesBaseUrl.endsWith('/'))
            throw new ValueError(util.format(
                'cudlServicesBaseUrl should end with a / otherwise the last ' +
                'path component will be lost when calling url.resolve(). ' +
                'got: `%s`', cudlServicesBaseUrl));

        this.cudlServicesBaseUrl = cudlServicesBaseUrl;
    }

    getSimilarityUrl(itemId, similarityId) {
        let path = _(['similarity', itemId, similarityId])
                .map(encodeURIComponent).join('/');
        return url.resolve(this.cudlServicesBaseUrl, path);
    }

    /**
     * Query CUDL services for descriptive metadata sections similar to a
     * specified descriptive metadata section.
     *
     * @param itemId The main ID (classmark) of the item
     * @param dmdId The id of the descriptive metadata section in the item
     * @return A promise of the similarity response.
     */
    getSimilarItems(itemId, similarityId) {
        let url = this.getSimilarityUrl(itemId, similarityId);

        let jqxhr = $.ajax({
            url: url,
            type: 'GET'
        });

        return {
            similarity: Q(jqxhr),
            abort: jqxhr.abort.bind(jqxhr)
        };
    }
}
