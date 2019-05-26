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
        this._gridCall.inputs.step.number = value;
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
      `vec3 gridFunc(vec3 oldcolor, vec3 gridcolor, vec3 position, float step, float width){ \
         if (mod(position.${this._axis} + width * 0.5, step) < width)                        \
         {                                                                                   \
           return gridcolor;                                                                 \
         }                                                                                   \
         return oldcolor;                                                                    \
       }`
    );

    this._gridCall = new THREE.FunctionCallNode(this._gridFunction);

    this._gridCall.inputs.oldcolor = this.getCurrentColorNode();
    this._gridCall.inputs.gridcolor = new THREE.ColorNode(this._color);
    this._gridCall.inputs.position = this.getCurrentPositionNode();
    this._gridCall.inputs.step = new THREE.FloatNode(this._step);
    this._gridCall.inputs.width = new THREE.FloatNode(this._width);
  }
}

module.exports = Grid;
