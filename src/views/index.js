import View from './view';
import BubbleView from './bubbles';

import failedTemplate from '../../templates/failed.jade';


/**
 * The root View controlling the similarity tab. It's responsible for switching
 * between the top level views showing loading, error and idle (loaded) states.
 */
export class RootSimilarityView extends View {
    constructor(options) {
        super(options);
        this.model = options.model;

        $(this.model).on('change:state', this.render.bind(this));
    }

    render() {
        var state = this.model.getState();
        var view = null;

        if(state === 'idle') {
            view = new BubbleView({
                model: this.model
            })
        }
        else if(state === 'loading') {
            view = new LoadingStateView({
                model: this.model
            });
        }
        else if(state === 'failed') {
            view = new FailedStateView({
                model: this.model
            });
        }
        else {
            assert.equal(state, 'uninitialised');
        }

        this.$el.empty();
        if(view) {
            this.$el.append(view.render().el);
        }
        return this;
    }
}


class FailedStateView extends View {
    render() {
        this.$el.html(failedTemplate());
        return this;
    }
}


class LoadingStateView extends View {
    constructor(options) {
        super(options);

        this.spinOpts = options.spinOpts || {
            scale: 2,
            opacity: 0.1,
            shadow: true,
            top: '50%',
            left: '50%',
            className: 'blah-spinner'
        };
    }

    render() {
        this.spinner = new Spinner(this.spinOpts).spin(this.el);
        return this;
    }
}
_.assign(LoadingStateView.prototype, {
    className: 'loading'
});
