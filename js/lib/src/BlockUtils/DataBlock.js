/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let {THREE, Nodes} = require('../three');
let Block = require('./Block');

/**
 * Class that load mesh and initialize nodes
 * @extends Block
 */
class DataBlock extends Block {

  /**
   * Constructor for DataBlock
   * @param {THREE.Scene} scene - ThreeJS scene
   * @param {Float32Array} vertices - list of 3-D coordinates of the mesh points
   * @param {Uint32Array} faces - list of indices for the triangle faces
   * @param {Uint32Array} tetras - list of indices for the tetrahedrons
   * @param {Object} data - object containing the data. e.g. {'x': [0.1, 0.23, 1.23...], 'y':..., ...}
   */
  constructor (scene, vertices, faces, data, tetras) {
    super(scene);
    this.blockType = 'DataBlock';

    this._processed = false;
    this._bufferGeometry = undefined;
    this._material = undefined;

    this.coordArray = vertices;
    this.facesArray = faces;
    this.data = data;
    this.tetraArray = tetras || [];
  }

  /**
   * Method that initialize DataBlock
   */
  process () {
    return new Promise((resolve, reject) => {
      this._processed = true;

      // Init attribute nodes for plug-in blocks node inputs
      this.initAttributeNodes();

      // Create bufferGeometry of the "main" mesh
      this._bufferGeometry = new THREE.BufferGeometry();
      this.initBufferGeometry();

      // Create basic material and build it
      this._material = new Nodes.StandardNodeMaterial();
      this._material.FlatShading = true;
      this._material.build();

      // Nodes for computing effects
      this._material._transformNodes = [];
      this._material._colorNodes = [];
      this._material._alphaNodes = [];

      // Varying nodes to save positions/color/alpha values of vertex
      this._material._positionVaryingNodes = [];
      this._material._colorVaryingNodes = [];
      this._material._alphaVaryingNodes = [];

      // Initialize mesh position/rotation/scale
      this._meshes.push(
        new THREE.Mesh(this._bufferGeometry, this._material)
      );
      this._meshes[0].position.set(
        this._position[0],
        this._position[1],
        this._position[2]
      );
      this._meshes[0].rotation.set(
        this._rotation[0],
        this._rotation[1],
        this._rotation[2]
      );
      this._meshes[0].scale.set(
        this._scale[0],
        this._scale[1],
        this._scale[2]
      );

      // Add mesh to 3D scene
      this._scene.add(this._meshes[0]);

      // Set if mesh is visible or not
      if (this.isVisible !== undefined) {
        this._visible = this.isVisible ? true : false;
      }
      this.visible = this._visible;

      // Set if mesh is rendered wireframe or not
      if (this.dispWireframe !== undefined) {
        this._wireframe = this.dispWireframe ? true : false;
      }
      this.wireframe = this._wireframe;

      resolve();
    });
  }

  /**
   * Initialization of buffer geometry
   */
  initBufferGeometry () {
    this.coordAttribute = new THREE.BufferAttribute(this.coordArray, 3);
    this.facesAttribute = new THREE.BufferAttribute(this.facesArray, 1);

    // Add dataAttributes
    // For each data
    Object.values(this.data).forEach((data) => {
      // For each component
      Object.values(data).forEach((component) => {
        if (!component.shaderName.endsWith('Magnitude')) {
          // InitialArray will be used in computeMinMax of Block
          // And must never change in PlugInBlocks
          component.initialArray = component.array;

          let dataAttribute = new THREE.BufferAttribute(
            component.array,
            1
          );
          this._bufferGeometry.addAttribute(
            component.shaderName, dataAttribute);
        }
      });
    });

    this._bufferGeometry.addAttribute('position', this.coordAttribute);
    this._bufferGeometry.setIndex(this.facesAttribute);
    this._bufferGeometry.center();
  }

  /**
   * Update of buffer geometry
   */
  updateVertices (newValue) {
    this.coordAttribute.set(newValue);
    this.coordAttribute.needsUpdate = true;
    this._bufferGeometry.center();
    this.updateChildrenGeometry();
  }

  updateData (newValue) {
      Object.keys(this.data).forEach((dataName) => {
        // For each component
        Object.keys(this.data[dataName]).forEach((componentName) => {
          let component = this.data[dataName][componentName];

          if (!component.shaderName.endsWith('Magnitude')) {
            let newComponent = newValue[dataName][componentName];
            component.initialArray = newComponent.array;
            component.min = newComponent.min;
            component.min = newComponent.max;

            let dataAttr = this._bufferGeometry.getAttribute(component.shaderName);
            dataAttr.set(newComponent.array);
            dataAttr.needsUpdate = true;
          }
        });
      });
      this.updateChildrenGeometry();
  }

  updateChildrenGeometry () {
    this.childrenBlocks.forEach((child) => {
      child.updateGeometry();
    });
  }
}

module.exports = DataBlock;
