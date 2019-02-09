/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let vec3 = require('gl-matrix-vec3');
let Geometry = require('./octree/geometry');
let BinaryTree = require('binary-search-tree');

/**
 * IsoSurfaceUtils class
 */
class IsoSurfaceUtils {

  /**
   * Constructor for IsoSurfaceUtils
   * @param {Block} block - The block which create this IsoSurfaceUtils
   */
  constructor (block) {
    if (block.parentBlock.tetraArray === undefined) {
      throw new Error('Cannot compute isoSurface without tetrahedrons');
    }

    this._block = block;

    this._value = undefined;
    this._previousValue = undefined;
    this._isoSurfaceInputDataArray = undefined;

    this._treeMin = undefined;
    this._treeMax = undefined;

    this._Emin = undefined;
    this._Emax = undefined;

    this.surfaceMaterial = block.getCurrentMaterial();
    this.surfaceMaterial.side = THREE.DoubleSide;
  }

  _createTree (array, value = 'min') {
    let binaryTree = new BinaryTree.BinarySearchTree();
    let tetras = this._block.parentBlock.tetraArray;
    let tetralen = this._block.parentBlock.tetraArray.length;

    let getValue;
    if (value === 'min') {
      getValue = ((...vals) => {
        return Math.min(...vals);
      });
    } else if (value === 'max') {
      getValue = ((...vals) => {
        return Math.max(...vals);
      });
    } else {
      throw new Error('IsoSurfaceUtils._createTree, expected value: ' +
        '\'min\' or \'max\', given value is ' + value);
    }

    // Fill binary tree
    for (let i = 0; i < tetralen; i += 4) {
      binaryTree.insert(
        getValue(
          array[tetras[i]],
          array[tetras[i + 1]],
          array[tetras[i + 2]],
          array[tetras[i + 3]]
        ),
        i
      );
    }

    return binaryTree;
  }

  updateInput (inputDataArray, minValue, maxValue) {
    this._treeMin = this._createTree(inputDataArray, 'min');
    this._treeMax = this._createTree(inputDataArray, 'max');

    this._value = (minValue + maxValue) / 2;
    this._previousValue = undefined;

    this._isoSurfaceInputDataArray = inputDataArray;
  }

  createIsoSurface (value) {
    this._value = value;

    if (this._treeMin === undefined) {
      throw new Error('IsoSurfaceUtils needs updateInput call before ' +
        'createIsoSurface');
    }

    // Compute the collection Emin={t in tetras/ t.dataMin < _value}
    // and Emax={t in tetras/ _value < t.dataMax}
    // Tetras sliced by the iso-surface are those which are in Emin AND
    // Emax
    let Emin, Emax;
    if (this._previousValue !== undefined) {
      if (this._value > this._previousValue) {
        // If Emin(_previousValue) already computed then
        // Emin(_value) = Emin(_previousValue) Union
        //    {t in tetras/ _previousValue < t.dataMin < _value}
        this._Emin = this._Emin.concat(
          this._treeMin.betweenBounds(
            { $gte: this._previousValue, $lt: this._value })
        );
        this._Emax = this._treeMax.betweenBounds({ $gt: this._value });
      } else {
        this._Emin = this._treeMin.betweenBounds({ $lt: this._value });
        // If Emax(_previousValue) already computed then
        // Emax(_value) = Emax(_previousValue) Union
        //    {t in tetras/ _value < t.dataMin < _previousValue}
        this._Emax = this._Emax.concat(
          this._treeMax.betweenBounds(
            { $gt: this._value, $lte: this._previousValue })
        );
      }
    } else {
      this._Emin = this._treeMin.betweenBounds({ $lt: this._value });
      this._Emax = this._treeMax.betweenBounds({ $gt: this._value });
    }

    Emin = this._Emin;
    Emax = new Set(this._Emax);

    // Compute intersection of Emin and Emax
    let tetrasCandidates = Emin.filter(x => Emax.has(x));

    let inputCoordArray = this._block.parentBlock.coordArray;
    let inputTetraArray = this._block.parentBlock.tetraArray;
    let inpuDataArray = this._isoSurfaceInputDataArray;

    let surfaceCoordArray = [];

    // Get input arrays and create surfaceDataArrays
    let inputDataArrays = [];
    Object.values(this._block.parentBlock.data).forEach((data) => {
      Object.keys(data).forEach((componentName) => {
        if (componentName !== 'Magnitude') {
          inputDataArrays.push(data[componentName].array);
        }
      });
    });
    let dataLen = inputDataArrays.length;
    let surfaceDataArrays = new Array(dataLen);
    while (dataLen--) { surfaceDataArrays[dataLen] = []; }

    let interpolate = ((x1, val1, x2, val2) => {
      return (this._value - val1) * (x2 - x1) / (val2 - val1) + x1;
    });

    let bl, bu, interPoints, interDatas, i1, i2, v1, v2, v3, d1, d2,
      normal, i;

    // Loop on tetras
    for (let j = 0, len = tetrasCandidates.length; j < len; j++) {
      i = tetrasCandidates[j];

      // Booleans representing if vertex data are over this.value
      bl = [];
      bl.push(inpuDataArray[inputTetraArray[i]] >= this._value);
      bl.push(inpuDataArray[inputTetraArray[i + 1]] >= this._value);
      bl.push(inpuDataArray[inputTetraArray[i + 2]] >= this._value);
      bl.push(inpuDataArray[inputTetraArray[i + 3]] >= this._value);

      // Booleans representing if vertex data are under this.value
      bu = [];
      bu.push(inpuDataArray[inputTetraArray[i]] <= this._value);
      bu.push(inpuDataArray[inputTetraArray[i + 1]] <= this._value);
      bu.push(inpuDataArray[inputTetraArray[i + 2]] <= this._value);
      bu.push(inpuDataArray[inputTetraArray[i + 3]] <= this._value);

      // Uncomment those lines if you loop on tetras that are note
      // sliced by the iso-surface. Here we assume that tetrahedrons
      // sorting is efficient, and we don't need to check this.
      /*if (!(bl[0] || bl[1] || bl[2] || bl[3]) ||
          !(bu[0] || bu[1] || bu[2] || bu[3])) {
        continue;
      }*/

      interPoints = [];

      dataLen = inputDataArrays.length;
      interDatas = new Array(dataLen);
      while (dataLen--) { interDatas[dataLen] = []; }

      // For each edges find if there is one which is sliced
      for (let k = 0; k < 3; k++) { // Index of point 1
        for(let l = k + 1; l < 4 ; l++ ) { // Index of point 2
          if ((bl[k] && bu[l]) ||
              (bu[k] && bl[l])) {
            i1 = inputTetraArray[i + k]; // Index point 1
            i2 = inputTetraArray[i + l]; // Index point 2

            // Position point 1
            v1 = inputCoordArray.slice(3 * i1, 3 * i1 + 3);
            // Data point 1
            d1 = inpuDataArray[i1];

            // Position point 2
            v2 = inputCoordArray.slice(3 * i2, 3 * i2 + 3);
            // Data point 2
            d2 = inpuDataArray[i2];

            // Interpolate on positions
            interPoints.push(
              interpolate(v1[0], d1, v2[0], d2),
              interpolate(v1[1], d1, v2[1], d2),
              interpolate(v1[2], d1, v2[2], d2)
            );

            // Interpolate on each data
            inputDataArrays.forEach((inputDataArray, dataIndex) => {
              interDatas[dataIndex].push(interpolate(
                inputDataArray[i1], d1,
                inputDataArray[i2], d2)
              );
            });
          }
        }
      }

      // Create triangles where data is equal to this.value
      v1 = [interPoints[0], interPoints[1], interPoints[2]];
      v2 = [interPoints[3], interPoints[4], interPoints[5]];
      v3 = [interPoints[6], interPoints[7], interPoints[8]];

      normal = [];
      vec3.cross(
        normal,
        [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2]],
        [v3[0]-v2[0], v3[1]-v2[1], v3[2]-v2[2]]
      );

      // Create new triangles
      if (vec3.dot(Geometry.normalNonUnitV(
          [0, 0, 0], v1, v2, v3), normal) < 0.0) {
        // Create first triangle
        surfaceCoordArray.push(
          v1[0], v1[1], v1[2],
          v2[0], v2[1], v2[2],
          v3[0], v3[1], v3[2]
        );
        
        interDatas.forEach((interData, dataIndex) => {
          surfaceDataArrays[dataIndex].push(interData[0]);
          surfaceDataArrays[dataIndex].push(interData[1]);
          surfaceDataArrays[dataIndex].push(interData[2]);
        });

        // If we have 4 points (4*3 coordinates, so 2 triangles)
        if (interPoints.length === 12) {
          surfaceCoordArray.push(
            v2[0], v2[1], v2[2],
            interPoints[9], interPoints[10], interPoints[11],
            v3[0], v3[1], v3[2]
          );

          interDatas.forEach((interData, dataIndex) => {
            surfaceDataArrays[dataIndex].push(interData[1]);
            surfaceDataArrays[dataIndex].push(interData[3]);
            surfaceDataArrays[dataIndex].push(interData[2]);
          });
        }
      } else {
        // Create first triangle
        surfaceCoordArray.push(
          v1[0], v1[1], v1[2],
          v3[0], v3[1], v3[2],
          v2[0], v2[1], v2[2]
        );

        interDatas.forEach((interData, dataIndex) => {
          surfaceDataArrays[dataIndex].push(interData[0]);
          surfaceDataArrays[dataIndex].push(interData[2]);
          surfaceDataArrays[dataIndex].push(interData[1]);
        });

        // If we have 4 points (4*3 coordinates, so 2 triangles)
        if (interPoints.length === 12) {
          surfaceCoordArray.push(
            v2[0], v2[1], v2[2],
            v3[0], v3[1], v3[2],
            interPoints[9], interPoints[10], interPoints[11]
          );

          interDatas.forEach((interData, dataIndex) => {
            surfaceDataArrays[dataIndex].push(interData[1]);
            surfaceDataArrays[dataIndex].push(interData[2]);
            surfaceDataArrays[dataIndex].push(interData[3]);
          });
        }
      }
    }

    // Create list of indices: [0, 1, 2, 3, 4, ..., i, i+1, ..., len-1]
    let len = surfaceCoordArray.length/3;
    let surfaceIndexArray = Array.from(Array(len).keys());

    let surfaceGeometry = new THREE.BufferGeometry();

    let coordAttributes = new THREE.BufferAttribute(
      new Float32Array(surfaceCoordArray),
      3
    );
    surfaceGeometry.removeAttribute('position');
    surfaceGeometry.addAttribute(
      'position',
      coordAttributes
    );

    let dataIndex = 0;
    let dataDesc = {};
    Object.keys(this._block.parentBlock.data).forEach((dataName) => {
      dataDesc[dataName] = {};
      Object.keys(this._block.parentBlock.data[dataName])
      .forEach((componentName) => {
        let component =
          this._block.parentBlock.data[dataName][componentName];

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
            surfaceDataArrays[dataIndex];
          dataDesc[dataName][componentName].path = component.path;

          // Create buffers for shaders
          let bufferArray = new Float32Array(
            surfaceDataArrays[dataIndex]);
          let dataAttribute = new THREE.BufferAttribute(
            bufferArray,
            1
          );
          surfaceGeometry.removeAttribute(
            component.shaderName);
          surfaceGeometry.addAttribute(
            component.shaderName, dataAttribute);

          dataIndex++;
        }
      });
    });

    this._previousValue = this._value;

    return {
      material: this.surfaceMaterial,
      geometry: surfaceGeometry,
      coordArray: surfaceCoordArray,
      facesArray: surfaceIndexArray,
      data: dataDesc
    }
  }
}

module.exports = IsoSurfaceUtils;
