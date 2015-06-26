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

    getSimilarityUrl(options) {
        let path = _(['similarity', options.itemId, options.similarityId])
                .map(encodeURIComponent).join('/');

        let query = {
            count: 10
        };
        if(options.embedMeta) {
            if(!_.contains(['partial', 'full'], options.embedMeta)) {
                throw new ValueError('Invalid value for options.embedMeta: ' +
                                     `${options.embedMeta}`);
            }
            query.embedMeta = options.embedMeta;
        }

        if(options.count) {
            query.count = parseInt(options.count) || query.count
        }

        let assembledQuery = url.format({query: query});

        return url.resolve(url.resolve(this.cudlServicesBaseUrl, path),
                           assembledQuery);
    }

    /**
     * Query CUDL services for descriptive metadata sections similar to a
     * specified descriptive metadata section.
     *
     * @param itemId The main ID (classmark) of the item
     * @param dmdId The id of the descriptive metadata section in the item
     * @return A promise of the similarity response.
     */
    getSimilarItems(options) {
        if(!_.isObject(options))
            throw new ValueError(`options was not an object: ${options}`);
        if(!options.itemId)
            throw new ValueError(`options.itemId is required`);
        if(!options.similarityId)
            throw new ValueError(`options.similarityId is required`);

        let url = this.getSimilarityUrl(options);

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
