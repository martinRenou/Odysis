/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');
let IsoSurfaceUtils = require('./IsoSurfaceUtils');
let {THREE, Nodes} = require('../../three');

/**
 * Threshold class
 *
 * Hide areas of your mesh based on a variable's value and bound
 * parameters
 *
 * @extends PlugInBlock
 */
class Threshold extends PlugInBlock {

  /**
   * Constructor for threshold block
   *
   * @param {Block} parentBlock - The block before this threshold one
   */
  constructor (parentBlock) {
    let setters = {
      'lowerBound': (lowerBound) => {
        this._checkLowerBound(lowerBound);
        this._lowerBoundNode.number = lowerBound;

        if (this._CPUCompute) { this._updateGeometryLowerBound(); }
      },
      'upperBound': (upperBound) => {
        this._checkUpperBound(upperBound);
        this._upperBoundNode.number = upperBound;

        if (this._CPUCompute) { this._updateGeometryUpperBound(); }
      }
    };

    super(parentBlock, setters);

    this._lowerBound = undefined;
    this._upperBound = undefined;

    this._lowerBoundNode = undefined;
    this._upperBoundNode = undefined;

    this._lbSurfaceMesh = undefined;
    this._ubSurfaceMesh = undefined;

    this.thresholdAlpha = undefined;

    this._isoSurfaceUtils = undefined;

    this._CPUCompute = false;

    this.inputDataDim = 1;
  }

  _checkLowerBound (lowerBound) {
    if (lowerBound > this._upperBound) {
      throw new Error(`lowerBound must be lower than upperBound, ` +
        `here upperBound is ${this._upperBound} while lowerBound ` +
        `is ${lowerBound}`);
    }
  }

  _checkUpperBound (upperBound) {
    if (upperBound < this._lowerBound) {
      throw new Error(`upperBound must be upper than lowerBound, ` +
        `here lowerBound is ${this._lowerBound} while upperBound is ` +
        `${upperBound}`);
    }
  }

  _process () {
    // Min/max values of the input
    this.inputDataMin = this.getComponentMin(this._inputDataName,
      this._inputComponentNames);
    this.inputDataMax = this.getComponentMax(this._inputDataName,
      this._inputComponentNames);

    if (this._lowerBound === undefined) {
      this._lowerBound = this.inputDataMin;
    }
    if (this._upperBound === undefined) {
      this._upperBound = this.inputDataMax;
    }

    // Create lowerbound and upperbound float nodes
    this._lowerBoundNode = new Nodes.FloatNode(this._lowerBound);
    this._upperBoundNode = new Nodes.FloatNode(this._upperBound);

    // GLSL's STEP function is more optimized than an if statement
    // It will returns 0 if inputData > upperBound, 1 otherwise
    this.isUnderUpperThreshold = new Nodes.MathNode(
      this._inputDataNode,
      this._upperBoundNode,
      Nodes.MathNode.STEP
    );

    // It will returns 0 if inputData < lowerBound, 1 otherwise
    this.isOverLowerThreshold = new Nodes.MathNode(
      this._lowerBoundNode,
      this._inputDataNode,
      Nodes.MathNode.STEP
    );

    // Create alpha node
    this.thresholdAlpha = new Nodes.OperatorNode(
      this.isUnderUpperThreshold,
      this.isOverLowerThreshold,
      Nodes.OperatorNode.MUL
    );

    this._CPUCompute = this.parentBlock.tetraArray !== undefined;

    // Add alpha node to mesh materials
    this.addAlphaNode('MUL', this.thresholdAlpha);

    // If there is tetrahedrons, compute new iso-surface skin
    if (this._CPUCompute) {
      this._isoSurfaceUtils = new IsoSurfaceUtils(this);

      // Set input for iso-surface
      this._isoSurfaceUtils.updateInput(
        this._inputComponentArrays[0],
        this.inputDataMin,
        this.inputDataMax
      );

      // Create lowerbound/upperBound iso-surface geometry
      let lbIsoSurface =
        this._isoSurfaceUtils.createIsoSurface(this._lowerBound);
      let ubIsoSurface =
        this._isoSurfaceUtils.createIsoSurface(this._upperBound);

      // Create lowerbound/upperBound iso-surface mesh
      this._lbSurfaceMesh = new THREE.Mesh(
        lbIsoSurface.geometry, lbIsoSurface.material);
      this._ubSurfaceMesh = new THREE.Mesh(
        ubIsoSurface.geometry, ubIsoSurface.material);

      // Disable frustum to fix display issues...
      this._lbSurfaceMesh.frustumCulled = false;
      this._ubSurfaceMesh.frustumCulled = false;

      this.addMesh(this._lbSurfaceMesh);
      this.addMesh(this._ubSurfaceMesh);
    }
  }

  /**
   * Initialize input for threshold effect
   * @param {string} dataName - Name of the input data of which you want
   * to set input components for this plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input.
   */
  _setInput (dataName, componentNames) {
    super._setInput(dataName, componentNames);

    if (this._processed && this.thresholdAlpha) {
      // Update material
      this.isUnderUpperThreshold.a = this._inputDataNode;
      this.isOverLowerThreshold.b = this._inputDataNode;

      this.updateMaterial();

      // Update geometry
      if (this._CPUCompute) {
        this._isoSurfaceUtils.updateInput(
          this._inputComponentArrays[0],
          this.inputDataMin,
          this.inputDataMax
        );

        this._updateGeometryLowerBound();
        this._updateGeometryUpperBound();
      }
    }
  }

  _updateGeometryLowerBound () {
    // Create a new iso-surface geometry
    let isoSurface =
      this._isoSurfaceUtils.createIsoSurface(this._lowerBound);

    // Update the geometry
    this._lbSurfaceMesh.geometry.copy(isoSurface.geometry);
  }

  _updateGeometryUpperBound () {
    // Create a new iso-surface geometry
    let isoSurface =
      this._isoSurfaceUtils.createIsoSurface(this._upperBound);

    // Update the geometry
    this._ubSurfaceMesh.geometry.copy(isoSurface.geometry);
  }
}

module.exports = Threshold;
