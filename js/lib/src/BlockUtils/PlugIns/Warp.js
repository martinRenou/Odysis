/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');

/**
 * Warp class
 *
 * Deform the mesh along the direction of an input vector data
 *
 @extends PlugInBlock
 */
class Warp extends PlugInBlock {

  /**
   * Constructor for warp block
   *
   * @param {PlugInBlock} parentBlock - The block before this warp one
   * @param {number} warpFactor - factor for warp (be sure to have a
   * factor adapted to data order of magnitude)
   */
  constructor (parentBlock, warpFactor = 1) {
    let setters = {
      'warpFactor': (factor) => { this._warpFactorNode.number = factor;}
    };

    super(parentBlock, setters);

    this._warpFactor = warpFactor;
    this._warpFactorNode = undefined;
    this._warpTranslation = undefined;

    this.inputDataDim = 3;
  }

  _process () {
    // Create a FloatNode representing the warp factor in shaders
    this._warpFactorNode = new THREE.FloatNode(this._warpFactor);

    // Create the translation vector used in shaders
    this._warpTranslation = new THREE.OperatorNode(
      this._inputDataNode,
      this._warpFactorNode,
      THREE.OperatorNode.MUL
    );

    // Add the node to materials
    this.addTransformNode('ADD', this._warpTranslation);
  }

  /**
   * Change input for warp effect
   * @param {string} dataName - Name of the input data of which you want
   * to set input components for this plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input.
   */
  _setInput (dataName, componentNames) {
    super._setInput(dataName, componentNames);

    if (this._processed && this._warpTranslation) {
      this._warpTranslation.a = this._inputDataNode;
      this.updateMaterial();
    }
  }
}

module.exports = Warp;
