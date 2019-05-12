let widgets = require('@jupyter-widgets/base');
let widgets_ctrl = require('@jupyter-widgets/controls');
let _ = require('lodash');

let odysis_version = '0.1.0';


let FixedFloatRangeSliderModel = widgets_ctrl.FloatRangeSliderModel.extend({
    defaults: _.extend({}, widgets_ctrl.FloatRangeSliderModel.prototype.defaults, {
        _model_name : 'FixedFloatRangeSliderModel',
        _view_name : 'FixedFloatRangeSliderView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version
    })
});

let FixedFloatRangeSliderView = widgets_ctrl.FloatRangeSliderView.extend({
    render() {
        FixedFloatRangeSliderView.__super__.render.apply(this, arguments);

        this.$slider.slider('option', 'min', 0);
        this.$slider.slider('option', 'max', 1);
    },

    update: function(options) {
        // FixedFloatRangeSliderView.__super__.update.apply(this, options);
        if (options === undefined || options.updated_view !== this) {
            let jquery_slider_keys = ['step', 'disabled'];
            let that = this;
            that.$slider.slider({});

            jquery_slider_keys.forEach(function(key) {
                let model_value = that.model.get(key);
                if (model_value !== undefined) {
                    that.$slider.slider('option', key, model_value);
                }
            });

            if (this.model.get('disabled')) {
                this.readout.contentEditable = 'false';
            } else {
                this.readout.contentEditable = 'true';
            }

            let orientation = this.model.get('orientation');
            this.$slider.slider('option', 'orientation', orientation);

            // Use the right CSS classes for vertical & horizontal sliders
            if (orientation==='vertical') {
                this.el.classList.remove('widget-hslider');
                this.el.classList.add('widget-vslider');
                this.el.classList.remove('widget-inline-hbox');
                this.el.classList.add('widget-inline-vbox');
            } else {
                this.el.classList.remove('widget-vslider');
                this.el.classList.add('widget-hslider');
                this.el.classList.remove('widget-inline-vbox');
                this.el.classList.add('widget-inline-hbox');
            }

            let readout = this.model.get('readout');
            if (readout) {
                this.readout.style.display = '';
                this.displayed.then(function() {
                    if (that.readout_overflow()) {
                        that.readout.classList.add('overflow');
                    } else {
                        that.readout.classList.remove('overflow');
                    }
                });
            } else {
                this.readout.style.display = 'none';
            }
        }

        this.$slider.slider('option', 'range', true);
        // values for the range case are validated python-side in
        // _Bounded{Int,Float}RangeWidget._validate
        let value = this.model.get('value');

        this.readout.textContent = this.valueToString(value);

        value = value.map(x => this.scale(x));
        this.$slider.slider('option', 'values', value);
    },

    handleSliderChange: function(e, ui) {
        let actual_value = ui.values.map(x => this._validate_slide_value(x));
        this.readout.textContent = this.valueToString(actual_value);

        // Only persist the value while sliding if the continuous_update
        // trait is set to true.
        if (this.model.get('continuous_update')) {
            this.handleSliderChanged(e, ui);
        }
    },

    handleSliderChanged: function(e, ui) {
        let actual_value = ui.values.map(x => this._validate_slide_value(x));
        this.model.set('value', actual_value, {updated_view: this});
        this.touch();
    },

    _validate_slide_value: function(x) {
        return this.unscale(x);
    },

    scale: function(x) {
        let min = this.model.get('min');
        let max = this.model.get('max');

        return (x - min) / (max - min);
    },

    unscale: function(x) {
        let min = this.model.get('min');
        let max = this.model.get('max');

        return min + x * (max - min);
    }
});

module.exports = {
    FixedFloatRangeSliderModel: FixedFloatRangeSliderModel,
    FixedFloatRangeSliderView: FixedFloatRangeSliderView
};
