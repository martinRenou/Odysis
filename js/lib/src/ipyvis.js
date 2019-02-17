let widgets = require('@jupyter-widgets/base');
let _ = require('lodash');
let object_values = require('object.values');
require('./three');
require('./ipyvis.css');
let serialization = require('./serialization');


if (!Object.values) {
  object_values.shim();
}

let {View} = require('./ViewUtils/View');

let views = new Map();

let ipyvis_version = '0.1.0';

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
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'SceneModel',
        _view_name : 'SceneView',
        _model_module : 'ipyvis',
        _view_module : 'ipyvis',
        _model_module_version : ipyvis_version,
        _view_module_version : ipyvis_version,
        mesh: undefined
    })
}, {
    serializers: _.extend({
        mesh: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let SceneView = widgets.DOMWidgetView.extend({
    render: function() {
        this.el.classList.add('ipyvis-scene');
        this.view = new View(this.el);
        views.set(this.el, this.view);

        this.model_events();

        let mesh = this.model.get('mesh');
        return this.view.addDataBlock(
            mesh.get('vertices'),
            mesh.get('faces'),
            this.get_data()
        ).then(((block) => {
            this.dataBlock = block;
            block.colored = true;
        }));
    },

    model_events: function() {
        this.model.on('change:mesh', () => {
            this.view.removeBlock(this.dataBlock);

            let mesh = this.model.get('mesh');
            return this.view.addDataBlock(
                mesh.get('vertices'),
                mesh.get('faces'),
                this.get_data()
            ).then(((block) => {
                this.dataBlock = block;
                block.colored = true;
            }));
        })
    },

    get_data: function() {
        let mesh = this.model.get('mesh');
        let mesh_data = mesh.get('data');
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

let ComponentModel = widgets.WidgetModel.extend({
    defaults: _.extend(widgets.WidgetModel.prototype.defaults(), {
        _model_name : 'ComponentModel',
        // _view_name : 'ComponentView',
        _model_module : 'ipyvis',
        _view_module : 'ipyvis',
        _model_module_version : ipyvis_version,
        _view_module_version : ipyvis_version,
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
    defaults: _.extend(widgets.WidgetModel.prototype.defaults(), {
        _model_name : 'DataModel',
        // _view_name : 'DataView',
        _model_module : 'ipyvis',
        _view_module : 'ipyvis',
        _model_module_version : ipyvis_version,
        _view_module_version : ipyvis_version,
        name: '',
        components: []
    })
}, {
    serializers: _.extend({
        components: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

let MeshModel = widgets.WidgetModel.extend({
    defaults: _.extend(widgets.WidgetModel.prototype.defaults(), {
        _model_name : 'MeshModel',
        // _view_name : 'MeshView',
        _model_module : 'ipyvis',
        _view_module : 'ipyvis',
        _model_module_version : ipyvis_version,
        _view_module_version : ipyvis_version,
        vertices: [],
        faces: [],
        tetras: [],
        data: []
    })
}, {
    serializers: _.extend({
        vertices: serialization.float32array,
        faces: serialization.uint32array,
        tetras: serialization.uint32array,
        data: { deserialize: widgets.unpack_models }
    }, widgets.WidgetModel.serializers)
});

module.exports = {
    SceneModel: SceneModel,
    SceneView: SceneView,
    DataModel: DataModel,
    ComponentModel: ComponentModel,
    MeshModel: MeshModel
};
