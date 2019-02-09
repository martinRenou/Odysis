/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let PlugInBlock = require('../PlugInBlock');
let SliceUtils = require('./SliceUtils');

/**
 * Slice class
 *
 * Make a slice of your mesh
 *
 * @extends PlugInBlock
 */
class Slice extends PlugInBlock {

  /**
   * Validate a parent
   * return {Boolean} true if the parent is a potential parent for a
   * Slice Block, false otherwise
   */
  static validate (parent) {
    return (
      parent.tetraArray !== undefined &&
      parent._meshes[0].material._transformNodes.length === 0
    );
  }

  /**
   * Constructor for slice block
   * @param {PlugInBlock} parentBlock - The block before this slice
   * one
   * @param {number[]} sliceNormal - normal vector to the slice
   * @param {number} slicePosition - position of the slice
   */
  constructor (parentBlock, sliceNormal = [1.0, 0.0, 0.0],
        slicePosition = 0) {
    let setters = {
      'sliceNormal': () => {
        if (this._sliceNormal[0] +
            this._sliceNormal[1] +
            this._sliceNormal[2] == 0) {
          this._sliceNormal = [1.0, 0.0, 0.0];
        }

        this.updateGeometry();

        // Get normalized normal
        this._sliceNormal = this._sliceUtils.abc;

        // Get min and max values (unused but useful to
        // know bounds of the mesh)
        this.min = this._sliceUtils.posMin;
        this.max = this._sliceUtils.posMax;
      },
      'slicePosition': () => { this.updateGeometry(); }
    };

    super(parentBlock, setters);

    this._sliceNormal = sliceNormal;
    this._slicePosition = slicePosition;

    this._sliceUtils = undefined;
    this._sliceIndex = undefined;
  }

  _process () {
    // Creation of slice
    this._sliceUtils = new SliceUtils(this);

    // Remove all meshes from scene
    this.removeMeshes();

    // Add mesh to scene and get its position in the array
    let slice = this._sliceUtils.createSlice(
      this._sliceNormal[0],
      this._sliceNormal[1],
      this._sliceNormal[2],
      this._slicePosition,
      true
    );
    this._sliceIndex = this.addMesh(slice.mesh);

    // Update coordArray, facesArray, data and tetrasArray
    this.data = slice.data;
    this.coordArray = slice.coordArray;
    this.facesArray = slice.facesArray;
    this.tetraArray = undefined;

    // Get normalized normal
    this._sliceNormal = this._sliceUtils.abc;

    // Get min and max values (unused but useful to
    // know bounds of the mesh for slicePosition)
    this.min = this._sliceUtils.posMin;
    this.max = this._sliceUtils.posMax;

    // Promise of process is rejected if the slice can't be computed 
    return this._sliceUtils._enableSlice;
  }

  _updateGeometry(){
    let slice = this._sliceUtils.createSlice(
      this._sliceNormal[0],
      this._sliceNormal[1],
      this._sliceNormal[2],
      this._slicePosition
    );
    let sliceGeometry = slice.mesh.geometry;

    // Update coordArray, facesArray, data
    this.data = slice.data;
    this.coordArray = slice.coordArray;
    this.facesArray = slice.facesArray;

    if (this._sliceIndex != -1){
      this._meshes[this._sliceIndex].geometry.copy(sliceGeometry);
    }
  }

}

module.exports = Slice;
