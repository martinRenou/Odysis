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
  constructor (parentBlock) {
    let setters = {
      // 'spacing': (value) => {
      // }
    };

    super(parentBlock, setters);
  }

  _process () {
    this._gridFunction = new THREE.FunctionNode(
      'vec3 gridFunc(vec3 oldcolor, vec3 gridcolor, vec3 position, float gridstep, float gridwidth){ \
         if (mod(position.x, gridstep) < gridwidth)                                                  \
         {                                                                                           \
           return gridcolor;                                                                         \
         }                                                                                           \
         return oldcolor;                                                                            \
       }'
    );

    this._gridCall = new THREE.FunctionCallNode(this._gridFunction);

    this._gridCall.inputs.oldcolor = this.getCurrentColorNode();
    this._gridCall.inputs.gridcolor = new THREE.ColorNode(0x000000);
    this._gridCall.inputs.position = this.getCurrentPositionNode();
    this._gridCall.inputs.gridstep = new THREE.FloatNode(500);
    this._gridCall.inputs.gridwidth = new THREE.FloatNode(20);

    this.addColorNode('REPLACE', this._gridCall);
  }
}

module.exports = Grid;
