let widgets = require('@jupyter-widgets/base');
let _ = require('lodash');
let object_values = require('object.values');
require('./three');
require('./ipyvis.css');

if (!Object.values) {
  object_values.shim();
}

let {View, Mesh} = require('./ViewUtils/View');

let views = new Map();

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
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0'
    })
});

let SceneView = widgets.DOMWidgetView.extend({
    render: function() {
        this.el.classList.add('ipyvis-scene');
        let view = new View(this.el);
        views.set(this.el, view);
    }
});

module.exports = {
    SceneModel: SceneModel,
    SceneView: SceneView
};
