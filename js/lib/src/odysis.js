let widgets = require('@jupyter-widgets/base');
let _ = require('lodash');
let object_values = require('object.values');
require('./three');
require('./odysis.css');
let serialization = require('./serialization');


if (!Object.values) {
  object_values.shim();
}

let {View, blockTypeRegister} = require('./ViewUtils/View');

let views = new Map();

let odysis_version = '0.1.0';

/**
 * Getter for view
 * @param container : container of the view that you want
 * @return : the view which is in this container, undefined if there's
 * no view in this container
 * **/
function get_view (container) {
  if (views.has(container)) {
    return views.get(container);
  }

  return undefined;
}

/**
 * Resize the canvas when container is resized
 * @param container : container of the view that you want to resize
 * @param opts : optional options of your resize, if no options is given
 * the view will fill the container. Options can be for example
 * { width: 800, height: 600, backgroundColor: '#f4c842' }
 * **/
function resize_view (container, opts) {
  let view = get_view(container);

  if (view !== undefined) { view.resize(opts); }
}

/**
 * Remove a view
 * @param container : container in which you want to remove the view
 * **/
function remove_view (container) {
  let view = views.get(container);

  if (view !== undefined) {
    views.delete(container);

    return view.remove();
  }

  return false;
}

let SceneModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend({}, widgets.DOMWidgetModel.prototype.defaults, {
        _model_name : 'SceneModel',
        _view_name : 'SceneView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version,
        mesh: undefined,
        background_color: '#fff'
    })
}, {
    serializers: _.extend({
        mesh: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let SceneView = widgets.DOMWidgetView.extend({
    render: function() {
        this.displayed.then(() => {
            this.el.classList.add('odysis-scene');
            this.view = new View(this.el);

            this.view.renderer.setClearColor(this.model.get('background_color'));

            views.set(this.el, this.view);

            this.create_child_view(this.model.get('mesh'), {
                scene_view: this,
                parent_view: this
            }).then(() => {
                this.model_events();
            });
        });
    },


    model_events: function() {
        this.model.on('change:background_color', () => {
            this.view.renderer.setClearColor(this.model.get('background_color'));
        });
    }
});

let ComponentModel = widgets.WidgetModel.extend({
    defaults: _.extend({}, widgets.WidgetModel.prototype.defaults, {
        _model_name : 'ComponentModel',
        // _view_name : 'ComponentView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version,
        name: '',
        array: [],
        min: undefined,
        max: undefined
    })
}, {
    serializers: _.extend({
        array: serialization.float32array
    }, widgets.WidgetModel.serializers)
});

let DataModel = widgets.WidgetModel.extend({
    defaults: _.extend({}, widgets.WidgetModel.prototype.defaults, {
        _model_name : 'DataModel',
        // _view_name : 'DataView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version,
        name: '',
        components: []
    })
}, {
    serializers: _.extend({
        components: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let BlockModel = widgets.WidgetModel.extend({
    defaults: _.extend({}, widgets.WidgetModel.prototype.defaults, {
        _model_name : 'BlockModel',
        _view_name : 'BlockView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version,
        visible: true,
        colored: true,
        _blocks: []
    })
}, {
    serializers: _.extend({
        _blocks: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let BlockView = widgets.WidgetView.extend({
    initialize: function (parameters) {
        BlockView.__super__.initialize.apply(this, arguments);
        this.scene_view = this.options.scene_view;
        this.parent_view = this.options.parent_view;

        this.block_views = new widgets.ViewList(this.add_block, this.remove_block, this);
    },

    render: function () {
        return Promise.resolve(this.create_block()).then(() => {
            if (this.model.get('visualized_data')) {
                this.block.visualizedData = this.model.get('visualized_data');
            } else {
                this.model.set('visualized_data', this.block.visualizedData || '');
            }
            if (this.model.get('visualized_components').length) {
                this.block.visualizedComponents = this.model.get('visualized_components');
            } else {
                this.model.set('visualized_components', this.block.visualizedComponents || []);
            }
            if (this.model.get('colormap_min')) {
                this.block.colorMapMin = this.model.get('colormap_min');
            } else {
                this.model.set('colormap_min', this.block.colorMapMin);
            }
            if (this.model.get('colormap_max').length) {
                this.block.colorMapMax = this.model.get('colormap_max');
            } else {
                this.model.set('colormap_max', this.block.colorMapMax);
            }
            this.model.save_changes();

            this.model_events();

            this.block_views.update(this.model.get('_blocks'));
        });
    },

    model_events: function () {
        this.model.on('change:visible', () => {
            this.block.visible = this.model.get('visible');
        });
        this.model.on('change:colored', () => {
            this.block.colored = this.model.get('colored');
        });
        this.model.on('change:visualized_data', () => {
            this.block.visualizedData = this.model.get('visualized_data');
        });
        this.model.on('change:visualized_components', () => {
            this.block.visualizedComponents = this.model.get('visualized_components');
        });
        this.model.on('change:colormap_max', () => {
            this.block.colorMapMax = this.model.get('colormap_max');
        });
        this.model.on('change:colormap_min', () => {
            this.block.colorMapMin = this.model.get('colormap_min');
        });
        this.model.on('change:_blocks', () => {
            this.block_views.update(this.model.get('_blocks'));
        });
    },

    add_block: function (block_model) {
        return this.create_child_view(block_model, {
            scene_view: this.scene_view,
            parent_view: this
        });
    },

    remove_block: function (block_view) {
        block_view.remove();
    },

    remove: function () {
        BlockView.__super__.remove.apply(this, arguments);
        this.scene_view.remove(this.block);
    }
});

let MeshModel = BlockModel.extend({
    defaults: _.extend({}, BlockModel.prototype.defaults, {
        _model_name : 'MeshModel',
        _view_name : 'MeshView',
        _model_module : 'odysis',
        _view_module : 'odysis',
        _model_module_version : odysis_version,
        _view_module_version : odysis_version,
        vertices: [],
        faces: [],
        tetras: [],
        data: [],
        bounding_box: []
    })
}, {
    serializers: _.extend({
        vertices: serialization.float32array,
        faces: serialization.uint32array,
        tetras: serialization.uint32array,
        data: { deserialize: widgets.unpack_models }
    }, BlockModel.serializers)
});

let MeshView = BlockView.extend({
    create_block: function () {
        return this.scene_view.view.addDataBlock(
            this.model.get('vertices'),
            this.model.get('faces'),
            this.get_data(),
            this.model.get('tetras')
        ).then(((block) => {
            this.block = block;
            block.colored = true;

            // Compute scale
            let bb = this.model.get('bounding_box');
            let dx = bb[1] - bb[0];
            let dy = bb[3] - bb[2];
            let dz = bb[5] - bb[4];
            let scale = 3 / (dx + dy + dz);
            block.scale = [scale, scale, scale];
        }));
    },

    model_events: function () {
        MeshView.__super__.model_events.apply(this, arguments);
        this.model.on('change:vertices', () => {
            this.block.updateVertices(this.model.get('vertices'));
        });
        this.model.on('change:data', () => {
            this.block.updateData(this.get_data());
        });
        // TODO Update tetras, update faces?
        // TODO Try to update vertices and data at the same time?
    },

    get_data: function() {
        let mesh_data = this.model.get('data');
        let data = {};
        mesh_data.forEach((data_model) => {
            let data_name = data_model.get('name');
            data[data_name] = {};
            data_model.get('components').forEach((component_model) => {
                let component_name = component_model.get('name');
                data[data_name][component_name] = {
                    array: component_model.get('array'),
                    min: component_model.get('min'),
                    max: component_model.get('max')
                };
            });
        });

        return data;
    }
});

let PluginBlockModel = BlockModel.extend({
    defaults: _.extend({}, BlockModel.prototype.defaults, {
        _model_name : 'PluginBlockModel',
        _view_name : 'PluginBlockView',
        input_data: '',
        input_components: [],
        _blocks: []
    })
}, {
    serializers: _.extend({
        _blocks: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let PluginBlockView = BlockView.extend({
    render: function () {
        return PluginBlockView.__super__.render.apply(this, arguments).then(() => {
            if (this.model.get('input_data')) {
                this.block.inputData = this.model.get('input_data');
            } else {
                this.model.set('input_data', this.block.inputData || '');
            }
            if (this.model.get('input_components').length) {
                this.block.inputComponents = this.model.get('input_components');
            } else {
                this.model.set('input_components', this.block.inputComponents || []);
            }
            this.model.save_changes();
        });
    },

    model_events: function () {
        PluginBlockView.__super__.model_events.apply(this, arguments);
        this.model.on('change:input_data', () => {
            this.block.inputData = this.model.get('input_data');
        });
        this.model.on('change:input_components', () => {
            this.block.inputComponents = this.model.get('input_components');
        });
    },
});

let WarpModel = PluginBlockModel.extend({
    defaults: _.extend({}, PluginBlockModel.prototype.defaults, {
        _model_name : 'WarpModel',
        _view_name : 'WarpView',
        factor: 0.0
    })
});

let WarpView = PluginBlockView.extend({
    create_block: function () {
        return this.scene_view.view.addBlock('Warp', this.parent_view.block).then((block) => {
            this.block = block;
            this.block.warpFactor = this.model.get('factor');
        });
    },

    model_events: function () {
        WarpView.__super__.model_events.apply(this, arguments);
        this.model.on('change:factor', () => {
            this.block.warpFactor = this.model.get('factor');
        });
    }
});

let ClipModel = PluginBlockModel.extend({
    defaults: _.extend({}, PluginBlockModel.prototype.defaults, {
        _model_name : 'ClipModel',
        _view_name : 'ClipView',
        plane_position: 0.0,
        plane_normal: [1, 0, 0]
    })
});

let ClipView = PluginBlockView.extend({
    create_block: function () {
        return this.scene_view.view.addBlock('ClipPlane', this.parent_view.block).then((block) => {
            this.block = block;
            this.block.planePosition = this.model.get('plane_position');
            this.block.planeNormal = this.model.get('plane_normal');
        });
    },

    model_events: function () {
        ClipView.__super__.model_events.apply(this, arguments);
        this.model.on('change:plane_position', () => {
            this.block.planePosition = this.model.get('plane_position');
        });
        this.model.on('change:plane_normal', () => {
            this.block.planeNormal = this.model.get('plane_normal');
        });
    }
});

let ThresholdModel = PluginBlockModel.extend({
    defaults: _.extend({}, PluginBlockModel.prototype.defaults, {
        _model_name : 'ThresholdModel',
        _view_name : 'ThresholdView',
        lower_bound: undefined,
        upper_bound: undefined
    })
});

let ThresholdView = PluginBlockView.extend({
    create_block: function () {
        return this.scene_view.view.addBlock('Threshold', this.parent_view.block).then((block) => {
            this.block = block;

            if (this.model.get('lower_bound')) {
                this.block.lowerBound = this.model.get('lower_bound');
            } else {
                this.model.set('lower_bound', this.block.lowerBound);
            }
            if (this.model.get('upper_bound').length) {
                this.block.upperBound = this.model.get('upper_bound');
            } else {
                this.model.set('upper_bound', this.block.upperBound);
            }
            this.model.save_changes();
        });
    },

    model_events: function () {
        ThresholdView.__super__.model_events.apply(this, arguments);
        this.model.on('change:lower_bound', () => {
            this.block.lowerBound = this.model.get('lower_bound');
        });
        this.model.on('change:upper_bound', () => {
            this.block.upperBound = this.model.get('upper_bound');
        });
    }
});

module.exports = {
    SceneModel: SceneModel,
    SceneView: SceneView,
    DataModel: DataModel,
    ComponentModel: ComponentModel,
    MeshModel: MeshModel,
    MeshView: MeshView,
    BlockModel: BlockModel,
    BlockView: BlockView,
    PluginBlockModel: PluginBlockModel,
    PluginBlockView: PluginBlockView,
    WarpModel: WarpModel,
    WarpView: WarpView,
    ClipModel: ClipModel,
    ClipView: ClipView,
    ThresholdModel: ThresholdModel,
    ThresholdView: ThresholdView,
};
