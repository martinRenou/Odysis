/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let jBinary = require('jbinary');

class Mesh {

  /**
   * Constructor of a Mesh
   * @param meshDescription: description of the mesh data,
   * for example :
   * meshDescription = {
   *  name = 'myMesh',
   *  vertices = {path = 'url'},
   *  tetras = {path = 'url'},
   *  faces = ...,
   *  data = {
   *    'velocity': {
   *      'vX': {
   *        path: 'urlToMyBinaryFile.bin',
   *        min: 93,
   *        max: ...
   *      },
   *      'vY': {
   *        ...
   *      }
   *    },
   *    ...
   *  }
   * }
   * **/
  constructor (meshDescription = {}) {
    this.meshDescription = meshDescription;

    this.loaded = false;
  }

  _load () {
    if (this.loaded) {
      return new Promise((resolve) => { resolve(); });
    }

    let loadData = [];

    function _loadData(obj, dtype, warn) {
      if (obj && obj.array) {
        return;
      }
      if (obj && obj.path) {
        loadData.push(jBinary.loadData(obj.path)
          .then((bufferArray) => {
            let array = new dtype(bufferArray);
            obj.array = array;
          })
        );
      } else {
        if (warn !== undefined) {
          throw new Error(`${warn}`);
        }
      }
    }

    // Load vertices
    _loadData(
      this.meshDescription.vertices,
      Float32Array, // TODO: Float64 for better precision?
      'No vertices specified'
    );

    // Load faces
    _loadData(
      this.meshDescription.faces,
      Uint32Array,
      'No faces specified' // TODO: If faces not specified, compute them
    );

    // Load tetras (not required)
    _loadData(
      this.meshDescription.tetras,
      Uint32Array
    );

    // Load data
    if (this.meshDescription.data) {
      Object.keys(this.meshDescription.data).forEach((dataName) => {
        Object.keys(this.meshDescription.data[dataName]).forEach(
          (componentName) => {
            loadData.push(
              _loadData(
                this.meshDescription.data[dataName][componentName],
                Float32Array, `Component '${componentName}' of data '${dataName}' can't be loaded, you must specify a path or a typed array.`)
            );
          });
      });
    } else {
      throw new Error('No data specified');
    }

    return Promise.all(loadData)
    .then(() => {
      this.loaded = true;
    });
  }

  getArrays () {
    if (this.loaded) {
      return {
        coordArray: this.meshDescription.vertices.array,
        data: this.meshDescription.data,
        facesArray: this.meshDescription.faces.array,
        tetraArray: this.meshDescription.tetras.array
      };
    } else {
      throw new Error('Mesh must be loaded before getArrays method call');
    }
  }

}

module.exports = Mesh;

