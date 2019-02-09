/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let object_values = require('object.values');

if (!Object.values) {
  object_values.shim();
}

require('./three');

let {View, Mesh, registerBlockType, blockTypeRegister} = require('./ViewUtils/View');

let views = new Map();

/**
 * Main function that display the 3D scene described in blocksDescription
 * @param container : DOM element where you want to display the scene,
 * only one view is allowed per container.
 * @param blocksDescription : description of the tree of blocks
 * @param opts : map containing some options,
 * for example { width: 800, height: 600 }
 * @return : Promise of creating the view
 * **/
function display (container, mesh, blocksDescription, opts) {
  if (views.has(container)) {
    return views.get(container).update(mesh, blocksDescription, opts);
  } else {
    let view = new View(container, mesh, blocksDescription, opts);

    views.set(
      container,
      view
      );

    return view.process();
  }
}

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

module.exports = {
  Mesh: Mesh,
  display: display,
  get_view: get_view,
  resize_view: resize_view,
  remove_view: remove_view,
  registerBlockType: registerBlockType,
  blockTypeRegister: blockTypeRegister
};
