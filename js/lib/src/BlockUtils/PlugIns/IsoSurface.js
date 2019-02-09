/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let PlugInBlock = require('../PlugInBlock');
let IsoSurfaceUtils = require('./IsoSurfaceUtils');

/**
 * IsoSurface class
 *
 * Create an iso-surface based on a variable's value
 *
 * @extends PlugInBlock
 */
class IsoSurface extends PlugInBlock {

  /**
   * Validate a parent
   * return {Boolean} true if the parent is a potential parent for an
   * IsoSurface Block, false otherwise
   */
  static validate (parent) {
    return (parent.tetraArray !== undefined);
  }

  /**
   * Constructor for IsoSurface block
   * @param {Block} parentBlock - The block before this IsoSurface one
   */
  constructor (parentBlock) {
    let setters = {
      'value': () => {
        if (this._isoSurfaceUtils !== undefined) {
          this.updateGeometry();
        }
      }
    };

    super(parentBlock, setters);

    this._value = 0;
    this._isoSurfaceUtils = undefined;

    this._surfaceMesh = undefined;

    this.inputDataDim = 1;
  }

  _process () {
    // Remove inherited meshes
    this.removeMeshes();

    this._isoSurfaceUtils = new IsoSurfaceUtils(this);

    // Set input for iso-surface
    this._isoSurfaceUtils.updateInput(
      this._inputComponentArrays[0],
      this.inputDataMin,
      this.inputDataMax
    );

    // Create iso-surface geometry
    let isoSurface = this._isoSurfaceUtils.createIsoSurface(this._value);

    // Create iso-surface mesh
    this._surfaceMesh = new THREE.Mesh(
      isoSurface.geometry, isoSurface.material);

    // Disable frustum to fix display issues...
    this._surfaceMesh.frustumCulled = false;

    // Update coordArray, facesArray, data
    this.data = isoSurface.data;
    this.coordArray = isoSurface.coordArray;
    this.facesArray = isoSurface.facesArray;
    this.tetraArray = undefined;

    this.addMesh(this._surfaceMesh);
  }

  /**
   * Initialize input for IsoSurface effect
   * @param {string} dataName - Name of the input data of which you want
   * to set input components for this plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input.
   */
  _setInput (dataName, componentNames) {
    super._setInput(dataName, componentNames);

    // Will be useful for users or GUI
    this.inputDataMin = this.getComponentMin(this._inputDataName,
      this._inputComponentNames);
    this.inputDataMax = this.getComponentMax(this._inputDataName,
      this._inputComponentNames);

    if (this._isoSurfaceUtils !== undefined) {
      this._isoSurfaceUtils.updateInput(
        this._inputComponentArrays[0],
        this.inputDataMin,
        this.inputDataMax
      );

      this.updateGeometry();
    }
  }

  _updateGeometry () {
    // Create a new iso-surface geometry
    let isoSurface = this._isoSurfaceUtils.createIsoSurface(this._value);

    // Update the geometry
    this._surfaceMesh.geometry.copy(isoSurface.geometry);

    // Update coordArray, facesArray, data
    this.data = isoSurface.data;
    this.coordArray = isoSurface.coordArray;
    this.facesArray = isoSurface.facesArray;
  }
}

module.exports = IsoSurface;
