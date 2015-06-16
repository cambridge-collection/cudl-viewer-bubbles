import View from '../view';


export default class BubbleView extends View {
    constructor(options) {
        super(options);

        if(!options.model) {
            throw new ValueError('Expected a model instance for options.model' +
                                 `, got: ${options.model}`);
        }

        this.model = options.model;
    }

    render() {
        var similarity = this.model.getSimilarity();
        console.log(similarity);
        this.$el.html('<p>Woot!</p>');

        return this;
    }
};
