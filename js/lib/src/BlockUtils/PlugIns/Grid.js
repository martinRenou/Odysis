/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');
let THREE = require('../../three');

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
        let oldNode = this._gridCall;
        this._setGridNode();
        this.replaceColorNode(oldNode, this._gridCall);
      },
      'color': (value) => {
        this._gridCall.inputs.gridcolor.value = new THREE.Color(value);
        this.buildMaterials();
      },
      'step': (value) => {
        this._gridCall.inputs.gridstep.number = value;
      },
      'width': (value) => {
        this._gridCall.inputs.width.number = value;
      },
    };

    super(parentBlock, setters);

    this._axis = axis;
    this._color = color;
    this._step = step;
    this._width = width;
  }

  _process () {
    this._setGridNode();

    this.addColorNode('REPLACE', this._gridCall);
  }

  _setGridNode () {
    this._gridFunction = new THREE.FunctionNode(
      `vec3 gridFunc${this._plugInID}(vec3 oldcolor, vec3 gridcolor, vec3 position, float gridstep, float width){
         float factor = step(0.0, mod(position.${this._axis} + width * 0.5, gridstep) - width);
         return factor * oldcolor + (1.0 - factor) * gridcolor;
       }`
    );

    this._gridCall = new THREE.FunctionCallNode(this._gridFunction);

    this._gridCall.inputs.oldcolor = this.getCurrentColorNode();
    this._gridCall.inputs.gridcolor = new THREE.ColorNode(this._color);
    this._gridCall.inputs.position = this.getCurrentPositionNode();
    this._gridCall.inputs.gridstep = new THREE.FloatNode(this._step);
    this._gridCall.inputs.width = new THREE.FloatNode(this._width);
  }
}

module.exports = Grid;
