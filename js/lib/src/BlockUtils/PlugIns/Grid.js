/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');
let {THREE, Nodes} = require('../../three');

/**
 * Grid class
 *
 @extends PlugInBlock
 */
class Grid extends PlugInBlock {

  /**
   * Constructor for grid block
   *
   * @param {PlugInBlock} parentBlock - The block before this grid one
   */
  constructor (parentBlock, axis='x', color=0x000000, step=500, width=20) {
    let setters = {
      'axis': (value) => {
        this._gridCall.value = this._getFunctionNode();
        this.updateMaterial();
      },
      'color': (value) => {
        this._gridCall.inputs.gridcolor.value = new THREE.Color(value);
        this.updateMaterial();
      },
      'step': (value) => {
        this._gridCall.inputs.gridstep.value = value;
      },
      'width': (value) => {
        this._gridCall.inputs.width.value = value;
      },
    };

    super(parentBlock, setters);

    this._axis = axis;
    this._color = color;
    this._step = step;
    this._width = width;
  }

  _process () {
    this._gridCall = new Nodes.FunctionCallNode(this._getFunctionNode());

    this._gridCall.inputs.oldcolor = this.getCurrentColorNode();
    this._gridCall.inputs.gridcolor = new Nodes.ColorNode(this._color);
    this._gridCall.inputs.position = this.getCurrentPositionNode();
    this._gridCall.inputs.gridstep = new Nodes.FloatNode(this._step);
    this._gridCall.inputs.width = new Nodes.FloatNode(this._width);

    this.addColorNode('REPLACE', this._gridCall);
  }

  _getFunctionNode () {
    return new Nodes.FunctionNode(
      `vec3 gridFunc${this._plugInID}(vec3 oldcolor, vec3 gridcolor, vec3 position, float gridstep, float width){
         float factor = step(0.0, mod(position.${this._axis} + width * 0.5, gridstep) - width);
         return factor * oldcolor + (1.0 - factor) * gridcolor;
       }`
    );
  }
}

module.exports = Grid;
