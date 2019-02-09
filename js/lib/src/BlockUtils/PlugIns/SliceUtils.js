/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let TetraMesh = require('./octree/tetraMesh');

/**
 * Class for creating of a slice
 */
class SliceUtils {

  /**
   * Constructor of sliceUtils
   * @param block : Input block, mesh must have a tetra array!
   */
  constructor (block) {
    // Previous mesh
    this._inputData = block.parentBlock.data;
    this._inputDataArrays = [];
    Object.values(this._inputData).forEach((data) => {
      Object.keys(data).forEach((componentName) => {
        if (componentName !== 'Magnitude') {
          this._inputDataArrays.push(data[componentName].array);
        }
      });
    });

    this._sliceMaterial = block.getCurrentMaterial();

    // Is your mesh containing tetras ?
    this._enableSlice = !!block.tetraArray;

    // Min and max positions of the slice
    this._posMin = -1;
    this._posMax = 1;

    // Remove those lines when it will be possible to compute slice
    // on a transformed mesh
    if (this._sliceMaterial._transformNodes.length != 0) {
      this._enableSlice = false;
      throw new Error('Not possible to compute slice after ' +
        'transformation for now');
    }

    if (this._enableSlice) {
      this._tetraMesh = new TetraMesh();
      this._tetraMesh.initTetraMesh(
        block.parentBlock.coordArray,
        block.parentBlock.tetraArray,
        this._inputDataArrays
      );

      // Get min and max
      this._min = this._tetraMesh.octree_.aabbLoose_.min_;
      this._max = this._tetraMesh.octree_.aabbLoose_.max_;
    } else {
      // At least compute min and max
      let coordArray = block.coordArray;
      let minX = coordArray[0], maxX = minX,
        minY = coordArray[1], maxY = minY,
        minZ = coordArray[2], maxZ = minZ;
      for (let i = 3, len = coordArray.length; i < len; i += 3) {
        if (minX > coordArray[i]){
          minX = coordArray[i];
        }
        if (maxX < coordArray[i]){
          maxX = coordArray[i];
        }

        if (minY > coordArray[i + 1]){
          minY = coordArray[i + 1];
        }
        if (maxY < coordArray[i + 1]){
          maxY = coordArray[i + 1];
        }

        if (minZ > coordArray[i + 2]){
          minZ = coordArray[i + 2];
        }
        if (maxZ < coordArray[i + 2]){
          maxZ = coordArray[i + 2];
        }
      }

      // Compute bound values
      this._min = [minX, minY, minZ];
      this._max = [maxX, maxY, maxZ];
    }
  }

  get posMin () { return this._posMin; }
  get posMax () { return this._posMax; }
  get abc () { return [this.a, this.b, this.c]; }

  /**
   * Function that create a slice
   * @param a, b, c, d : parameters of plane equation aX+bY+cZ+d=0
   * @return sliceMesh: mesh of the slice
   * **/
  createSlice (a = 1, b = 0, c = 0, d = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    // Compute new posMin new posMax
    let norm;
    norm = Math.sqrt(
      Math.pow(this.a, 2.0) +
      Math.pow(this.b, 2.0) +
      Math.pow(this.c, 2.0)
    );
    if (norm == 0) {
      throw new Error('Can\t create Slice if normal vector have a ' +
        'magnitude equal to 0');
    }
    this.a /= norm;
    this.b /= norm;
    this.c /= norm;

    this._posMin =
      this.a * this._min[0] +
      this.b * this._min[1] +
      this.c * this._min[2];

    this._posMax =
      this.a * this._max[0] +
      this.b * this._max[1] +
      this.c * this._max[2];

    if (this._posMin > this._posMax) {
      [this._posMin, this._posMax] = [this._posMax, this._posMin];
    }

    if (this._enableSlice) {
      // Compute slice
      let res = this._tetraMesh.makeSlice(
        this.a,
        this.b,
        this.c,
        -this.d
      );

      let planeCoordArray = new Float32Array(res['vertex']);
      let planeDataArrays = res['data'];

      // Create list of indices: [0, 1, 2, 3, 4, ..., i, i+1, ..., len-1]
      let len = planeCoordArray.length/3;
      let planeIndexArray = Array.from(Array(len).keys());

      let plane_coordAttributes = new THREE.BufferAttribute(
        planeCoordArray,
        3
      );

      let sliceBF = new THREE.BufferGeometry();
      sliceBF.addAttribute('position', plane_coordAttributes);

      // One buffer per data respecting data names
      let dataIndex = 0;

      let dataDesc = {};
      Object.keys(this._inputData).forEach((dataName) => {
        dataDesc[dataName] = {};
        Object.keys(this._inputData[dataName]).forEach((componentName) => {
          let component = this._inputData[dataName][componentName];

          // Create new data description
          dataDesc[dataName][componentName] = {};
          dataDesc[dataName][componentName].min = component.min;
          dataDesc[dataName][componentName].max = component.max;
          dataDesc[dataName][componentName].shaderName =
            component.shaderName;
          dataDesc[dataName][componentName].node = component.node;

          if (!component.shaderName.endsWith('Magnitude')) {
            dataDesc[dataName][componentName].initialArray =
              component.initialArray;
            dataDesc[dataName][componentName].array =
              planeDataArrays[dataIndex];
            dataDesc[dataName][componentName].path = component.path;

            // Create buffers for shaders
            let bufferArray = new Float32Array(
              planeDataArrays[dataIndex]);
            let dataAttribute = new THREE.BufferAttribute(
              bufferArray,
              1
            );
            sliceBF.addAttribute(component.shaderName, dataAttribute);

            dataIndex++;
          }
        });
      });

      let sliceMesh = new THREE.Mesh(sliceBF, this._sliceMaterial);

      return {
        mesh: sliceMesh,
        data: dataDesc,
        coordArray: planeCoordArray,
        facesArray: planeIndexArray
      };
    } else {
      return 0;
    }
  }

}

module.exports = SliceUtils;
