/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');
let SliceUtils = require('./SliceUtils');
let {THREE, Nodes} = require('../../three');

/**
 * ClipPlane class
 *
 * Hide a part of the mesh by cutting it with a plane
 *
 * @extends PlugInBlock
 */
class ClipPlane extends PlugInBlock {

  /**
   * Validate a parent
   * return {Boolean} true if the parent is a potential parent for a
   * ClipPlane Block, false otherwise
   */
  static validate (parent) {
    return (
      parent._meshes[0].material._transformNodes.length === 0
    );
  }

  /**
   * Constructor for clipPlane block
   * @param {PlugInBlock} parentBlock - The block before this
   * clipPlane one
   * @param {number[]} planeNormal - 3D array, normal vector to the
   * clipPlane
   * @param {number} planePosition - position of the clipPlane
   */
  constructor (parentBlock, planeNormal = [1.0, 0.0, 0.0],
        planePosition = 0) {
    let setters = {
      'planeNormal': () => {
        if (this._planeNormal[0] == 0 &&
            this._planeNormal[1] == 0 &&
            this._planeNormal[2] == 0) {
          this._planeNormal = [1.0, 0.0, 0.0];
        }

        this._updateFillPlaneGeometry();

        // Get normalized normal
        this._planeNormal = this._sliceUtils.abc;

        this._planeNormalNode.x = this._planeNormal[0];
        this._planeNormalNode.y = this._planeNormal[1];
        this._planeNormalNode.z = this._planeNormal[2];

        // Get min and max values (unused but useful to
        // know bounds of the mesh)
        this.min = this._sliceUtils.posMin;
        this.max = this._sliceUtils.posMax;
      },
      'planePosition': () => {
        this._updateFillPlaneGeometry();

        this._planePositionNode.number = this._planePosition;
      }
    };

    super(parentBlock, setters);

    this._planeNormal = planeNormal;
    this._planePosition = planePosition;

    this._planeNormalNode = undefined;
    this._planePositionNode = undefined;

    this._sliceIndex = undefined;

    this.min = undefined;
    this.max = undefined;
  }

  _process () {
    // Node structure for clip plane effect
    this._planeNormalNode = new Nodes.Vector3Node(
      this._planeNormal[0],
      this._planeNormal[1],
      this._planeNormal[2]
    );
    this._planePositionNode = new Nodes.FloatNode(
      this._planePosition
    );

    let currentPosition = this.getCurrentPositionNode();

    let compute_dot = new Nodes.MathNode(
      currentPosition,
      this._planeNormalNode,
      Nodes.MathNode.DOT
    );

    let clipPlaneAlpha = new Nodes.MathNode(
      compute_dot,
      this._planePositionNode,
      Nodes.MathNode.STEP
    );

    this.addAlphaNode('MUL', clipPlaneAlpha);

    // Create a slice to fill the hole leaved by clip plane
    this._sliceUtils = new SliceUtils(this);

    // Add mesh to scene and get its position in the array
    let slice = this._sliceUtils.createSlice(
        this._planeNormal[0],
        this._planeNormal[1],
        this._planeNormal[2],
        this._planePosition
    ).mesh;
    if (slice !== undefined) {
      this._sliceIndex = this.addMesh(slice);
    }

    // Get normalized normal
    this._planeNormal = this._sliceUtils.abc;

    this._planeNormalNode.x = this._planeNormal[0];
    this._planeNormalNode.y = this._planeNormal[1];
    this._planeNormalNode.z = this._planeNormal[2];

    // Get min and max values (unused but useful to
    // know bounds of the mesh for planePosition)
    this.min = this._sliceUtils.posMin;
    this.max = this._sliceUtils.posMax;
  }

  _updateFillPlaneGeometry(){
    let slice = this._sliceUtils.createSlice(
      this._planeNormal[0],
      this._planeNormal[1],
      this._planeNormal[2],
      this._planePosition)
    .mesh;

    if (slice !== undefined) {
      this._meshes[this._sliceIndex].geometry.copy(slice.geometry);
    }
  }

}

module.exports = ClipPlane;
