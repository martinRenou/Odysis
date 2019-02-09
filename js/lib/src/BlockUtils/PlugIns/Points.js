/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let PlugInBlock = require('../PlugInBlock');

/**
 * Points class
 *
 * Represent the data with points
 *
 * @extends PlugInBlock
 */
class Points extends PlugInBlock {

  /**
   * Validate a parent
   * return {Boolean} true if the parent is a potential parent for a
   * Points Block, false otherwise
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
   * Constructor for Points block
   * @param {Block} parentBlock - The block before this Points one
   * @param {number} pcPoints - percentage of max number of points,
   * ranged in [0, 1]
   * @param {number} pointsSize - size of points in pixel
   * @param {string} distribution - ordered or random distribution
   * @param {string} mode - volume or surface mode
   */
  constructor (parentBlock, pcPoints = 1, pointsSize = 3,
        distribution = 'ordered', mode = 'volume') {
    let setters = {
      'pointsSize': (pointsSize) => {
        this._checkPointsSize(pointsSize);
        this._sizeNode.number = pointsSize;
      },
      'distribution': (distribution) => {
        this._checkDistribution(distribution);
        this.updateGeometry();
      },
      'pcPoints': (pcPoints) => {
        this._checkPcPoints(pcPoints);
        this.updateGeometry();
      },
      'mode': (mode) => {
        this._checkMode(mode);
        this.updateGeometry();
      }
    };

    super(parentBlock, setters);

    this._pointsSize = pointsSize;
    this._sizeNode = undefined;

    this._checkPcPoints(pcPoints);
    this._pcPoints = pcPoints;

    this._checkDistribution(distribution);
    this._distribution = distribution;

    this._checkMode(mode);
    this._mode = mode;
  }

  _checkPointsSize (pointsSize) {
    if (!(typeof pointsSize === 'number')) {
      throw new TypeError(`pointsSize must be of type "number" but ` +
        `given pointsSize is of type "${typeof pointsSize}"`);
    }
    if (pointsSize < 0) {
      throw new TypeError(`pointsSize must be positive number, be ` +
        `given pointsSize is "${pointsSize}"`);
    }
  }

  _checkDistribution (distribution) {
    if (!(distribution == 'random' || distribution == 'ordered')) {
      throw new Error(`Allowed values for Points distribution are ` +
        `"random" and "ordered" but you gave "${distribution}"`);
    }
  }

  _checkPcPoints (pcPoints) {
    if (!(0 <= pcPoints && pcPoints <= 1)){
      throw new Error(`pcPoints must be ranged in [0, 1] but you gave` +
        ` ${pcPoints}`);
    }
  }

  _checkMode (mode) {
    if (!(mode == 'surface' || mode == 'volume')) {
      throw new Error(`Allowed values for Points mode are "surface" ` +
        `and "volume" but you gave "${mode}"`);
    }
  }

  _process () {
    // Check input parameters
    this._checkDistribution(this._distribution);
    this._checkPcPoints(this._pcPoints);
    this._checkMode(this._mode);

    // Compute geometry
    this._pointsBufferGeometry = new THREE.BufferGeometry();
    this.updateGeometry();

    // Get current material
    this._pointsMaterial = this.getCurrentMaterial();

    // Set mesh
    let points = new THREE.Points(
      this._pointsBufferGeometry,
      this._pointsMaterial
    );

    // Remove all other meshes from scene
    this.removeMeshes();

    // Add new point mesh
    this.addMesh(points);

    // Set point size
    this._sizeNode = new THREE.FloatNode(this._pointsSize);
    super.addPointSizeNode(this._sizeNode);
  }

  /**
   * Update geometry when needed
   */
  _updateGeometry () {
    // Initialize geometry
    let coordArray = this.parentBlock.coordArray;
    let facesArray = this.parentBlock.facesArray;

    if (facesArray === undefined && this.mode == 'surface') {
      throw new Error('Cannot compute Points in surface mode without ' +
        'faces indices.');
    }

    // Delete duplicate indices
    let surfaceIndexes = new Set(facesArray);
    surfaceIndexes = Array.from(surfaceIndexes);

    let vertex, x, y, z;

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

    // Compute the number of displayed points
    this._nbPoints = Math.round(this._pcPoints * nbVertices);

    let pointsCoordArray = [];

    // Get input arrays and create pointsDataArrays
    let inputDataArrays = [];
    Object.values(this.data).forEach((data) => {
      Object.keys(data).forEach((componentName) => {
        if (componentName !== 'Magnitude') {
          inputDataArrays.push(data[componentName].array);
        }
      });
    });
    let len = inputDataArrays.length;
    let pointsDataArrays = new Array(len);
    while (len--) {
      pointsDataArrays[len] = [];
    }

    for (let i = 0; i < this._nbPoints; i++) {
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

      // Add point
      pointsCoordArray.push(x);
      pointsCoordArray.push(y);
      pointsCoordArray.push(z);

      // Fill vectorsDataArrays
      pointsDataArrays.forEach((dataArray, dataIndex) => {
        let dataValue = inputDataArrays[dataIndex][vertex];
        dataArray.push(dataValue);
      });
    }

    let coordAttributes = new THREE.BufferAttribute(
      new Float32Array(pointsCoordArray),
      3
    );
    this._pointsBufferGeometry.removeAttribute('position');
    this._pointsBufferGeometry.addAttribute(
      'position',
      coordAttributes
    );

    // One buffer per data
    let dataIndex = 0;
    Object.values(this.data).forEach((data) => {
      Object.values(data).forEach((component) => {
        if (!component.shaderName.endsWith('Magnitude')) {
          let bufferArray = new Float32Array(
            pointsDataArrays[dataIndex]);
          let dataAttribute = new THREE.BufferAttribute(
            bufferArray,
            1
          );
          this._pointsBufferGeometry.removeAttribute(
            component.shaderName);
          this._pointsBufferGeometry.addAttribute(
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

module.exports = Points;
