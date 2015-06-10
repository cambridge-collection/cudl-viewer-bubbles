import assert from 'assert';
import $ from 'jquery';

/**
 * A minimal view class based on those created for cudl-embedded
 */
export default class View {
    constructor(options) {
        this.el = options.el || document.createElement("div");
        assert(this.el instanceof Element, "el must be an Element", this.el);
        this.setEl(options.el);
    }

    setEl: function setEl(el) {
        this.$el = $(el).first();
        this.el = this.$el[0];
    }
}
