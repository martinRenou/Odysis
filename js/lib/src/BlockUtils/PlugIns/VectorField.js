/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let PlugInBlock = require('../PlugInBlock');

/**
 * VectorField class
 *
 * Represent the input vector data with arrow glyphs
 * For example this input vector can be:
 * ['myComponent1', 'myComponent2', '0']
 *
 * @extends PlugInBlock
 */
class VectorField extends PlugInBlock {

  /**
   * Validate a parent
   * return {Boolean} true if the parent is a potential parent for a
   * VectorField Block, false otherwise
   */
  static validate (parent) {
    let valid = true;
    // Check if one parent is a VectorField or a Points
    while (parent !== undefined) {
      if (parent.blockType === 'VectorField' ||
          parent.blockType === 'Points') { return false; }
      parent = parent.parentBlock;
    }
    return valid;
  }

  /**
   * Constructor for VectorField block
   *
   * @param {Block} parentBlock - The block before this VectorField
   * one
   * @param {number} lengthFactor - factor for length of vectors
   * @param {number} pcVectors - percentage of displayed vectors,
   * between 0 and 1
   * @param {string} distribution - ordered or random distribution
   * @param {string} mode - volume or surface mode
   */
  constructor (parentBlock, lengthFactor = 1, pcVectors = 1,
        distribution = 'ordered', mode = 'volume') {
    let setters = {
      'lengthFactor': () => { this.updateGeometry(); },
      // LineWidth will have no effect for some GPU, as it's an obsolete
      // feature of GLSL
      'vectorsWidth': (width) => { this.updateLineWidth(width); },
      'distribution': (distribution) => {
        this._checkDistribution(distribution);
        this.updateGeometry();
      },
      'pcVectors': (pcVectors) => {
        this._checkPcVectors(pcVectors);
        this.updateGeometry();
      },
      'mode': (mode) => {
        this._checkMode(mode);
        this.updateGeometry();
      }
    };

    super(parentBlock, setters);

    this._lengthFactor = lengthFactor;
    this._vectorsWidth = 1;

    this._checkPcVectors(pcVectors);
    this._pcVectors = pcVectors;

    this._checkDistribution(distribution);
    this._distribution = distribution;

    this._checkMode(mode);
    this._mode = mode;

    this.inputDataDim = 3;
  }

  _checkDistribution (distribution) {
    if (!(distribution == 'random' || distribution == 'ordered')) {
      throw new Error(`Allowed values for VectorField distribution ` +
        `are "random" and "ordered" but you gave "${distribution}"`);
    }
  }

  _checkPcVectors (pcVectors) {
    if (!(0 <= pcVectors && pcVectors <= 1)){
      throw new Error(`pcVectors must be ranged in [0, 1] but you ` +
        `gave ${pcVectors}`);
    }
  }

  _checkMode (mode) {
    if (!(mode == 'surface' || mode == 'volume')) {
      throw new Error(`Allowed values for VectorField mode are ` +
        `"surface" and "volume" but you gave "${mode}"`);
    }
  }

  _process () {
    // Check input parameters
    this._checkDistribution(this._distribution);
    this._checkPcVectors(this._pcVectors);
    this._checkMode(this._mode);

    // Compute geometry
    this._vectorsBufferGeometry = new THREE.BufferGeometry();
    this._updateGeometry();

    // Get material material
    this._vectorsMaterial = this.getCurrentMaterial();

    // Set mesh
    let vectorsField = new THREE.LineSegments(
      this._vectorsBufferGeometry,
      this._vectorsMaterial
    );

    // Remove all other meshes from scene
    this.removeMeshes();

    // Add new vector field mesh
    this._vectorFieldIndex = this.addMesh(vectorsField);

    // Set default linewidth
    this._vectorsMaterial.linewidth = this._vectorsWidth;
  }

  _setInput (dataName, componentNames=[undefined]) {
    super._setInput(dataName, componentNames);

    if (this._processed && this._vectorsBufferGeometry) {
      this.updateGeometry();
    }
  }

  /**
   * Update geometry when needed
   */
  _updateGeometry () {
    let nx, ny, nz;

    let vertex, v,
        x, y, z,
        dx, dy, dz,
        datax, datay, dataz;

    // Get arrays containing positions of points and index of skin
    // points
    let coordArray = this.parentBlock.coordArray;
    let facesArray = this.parentBlock.facesArray;

    if (facesArray === undefined && this.mode == 'surface') {
      throw new Error('Cannot compute VectorField in surface mode ' +
        'without faces indices.');
    }

    // Delete duplicate indices (to avoid duplication of vectors)
    let surfaceIndexes = new Set(facesArray);
    surfaceIndexes = Array.from(surfaceIndexes);

    let nbVertices;
    switch (this._mode) {
      case 'surface':
        nbVertices = surfaceIndexes.length;
        break;
      case 'volume':
        nbVertices = coordArray.length / 3;
        break;
      default:
        nbVertices = coordArray.length / 3;
        this._mode = 'volume';
        break;
    }

    // Compute the number of displayed vectors
    this._nbVectors = Math.round(this._pcVectors * nbVertices);

    // Get input arrays and create vectorsDataArrays
    let inputDataArrays = [];
    Object.values(this.parentBlock.data).forEach((data) => {
      Object.keys(data).forEach((componentName) => {
        if (componentName !== 'Magnitude') {
          inputDataArrays.push(data[componentName].array);
        }
      });
    });
    let len = inputDataArrays.length;
    let vectorsDataArrays = new Array(len);
    while (len--) {
      vectorsDataArrays[len] = [];
    }

    let vectorsCoordArray = [];
    let vectorsIndexArray = [];

    for (let i = 0; i < this._nbVectors; i++) {
      switch (this._distribution) {
        case 'ordered':
          switch (this._mode) {
            case 'volume':
              vertex = i;
              break;
            case 'surface':
              vertex = surfaceIndexes[i];
              break;
          }
          break;
        case 'random':
          switch (this._mode) {
            case 'volume':
              vertex = getRandomInt(nbVertices - 1);
              break;
            case 'surface':
              vertex = surfaceIndexes[getRandomInt(nbVertices - 1)];
              break;
          }
          break;
        default:
          switch (this._mode) {
            case 'volume':
              vertex = i;
              break;
            case 'surface':
              vertex = surfaceIndexes[i];
              break;
          }
          this._distribution = 'ordered';
          break;
      }

      x = coordArray[vertex * 3];
      y = coordArray[vertex * 3 + 1];
      z = coordArray[vertex * 3 + 2];

      datax = typeof this._inputComponentArrays[0] == 'number'
        ? this._inputComponentArrays[0]
        : this._inputComponentArrays[0][vertex];
      datay = typeof this._inputComponentArrays[1] == 'number'
        ? this._inputComponentArrays[1]
        : this._inputComponentArrays[1][vertex];
      dataz = typeof this._inputComponentArrays[2] == 'number'
        ? this._inputComponentArrays[2]
        : this._inputComponentArrays[2][vertex];

      dx = datax * this._lengthFactor;
      dy = datay * this._lengthFactor;
      dz = dataz * this._lengthFactor;

      // Dumb computation of a perpendicular vector
      if (dy + dz != 0) {
        nx = 0;
        ny = 0.2 * dz;
        nz = -0.2 * dy;
      } else {
        if (dx + dz != 0) {
          nx = -0.2 * dz;
          ny = 0;
          nz = 0.2 * dx;
        }
      }

      // Base of the vector
      vectorsCoordArray.push(x);
      vectorsCoordArray.push(y);
      vectorsCoordArray.push(z);

      // Head of the vector
      vectorsCoordArray.push(x + dx);
      vectorsCoordArray.push(y + dy);
      vectorsCoordArray.push(z + dz);

      // First branch of the head
      vectorsCoordArray.push(x + 0.8 * dx + nx);
      vectorsCoordArray.push(y + 0.8 * dy + ny);
      vectorsCoordArray.push(z + 0.8 * dz + nz);

      // Second branch of the head
      vectorsCoordArray.push(x + 0.8 * dx - nx);
      vectorsCoordArray.push(y + 0.8 * dy - ny);
      vectorsCoordArray.push(z + 0.8 * dz - nz);

      // Fill vectorsDataArrays
      vectorsDataArrays.forEach((dataArray, dataIndex) => {
        let dataValue = inputDataArrays[dataIndex][vertex];
        // For each point of the vector
        dataArray.push(dataValue, dataValue, dataValue, dataValue);
      });

      // Set indices
      v = 4 * i;
      vectorsIndexArray.push(v, v + 1, v + 1, v + 2, v + 1, v + 3);
    }

    // Create buffers
    let indexAttributes = new THREE.BufferAttribute(
      new Uint32Array(vectorsIndexArray),
      1
    );
    this._vectorsBufferGeometry.setIndex(indexAttributes);

    let coordAttributes = new THREE.BufferAttribute(
      new Float32Array(vectorsCoordArray),
      3
    );
    this._vectorsBufferGeometry.removeAttribute('position');
    this._vectorsBufferGeometry.addAttribute(
      'position',
      coordAttributes
    );

    // One buffer per data
    let dataIndex = 0;
    Object.values(this.data).forEach((data) => {
      Object.values(data).forEach((component) => {
        if (!component.shaderName.endsWith('Magnitude')) {
          let bufferArray = new Float32Array(
            vectorsDataArrays[dataIndex]);
          let dataAttribute = new THREE.BufferAttribute(
            bufferArray,
            1
          );
          this._vectorsBufferGeometry.removeAttribute(
            component.shaderName);
          this._vectorsBufferGeometry.addAttribute(
            component.shaderName, dataAttribute);

          dataIndex++;
        }
      });
    });

    this.facesArray = undefined;
    this.tetraArray = undefined;
  }
}

function getRandomInt (max) {
  let min = Math.ceil(0);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = VectorField;
