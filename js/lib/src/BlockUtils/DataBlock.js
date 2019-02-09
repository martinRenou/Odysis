/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let THREE = require('../three');
let Block = require('./Block');

/**
 * Class that load mesh and initialize nodes
 * @extends Block
 */
class DataBlock extends Block {

  /**
   * Constructor for DataBlock
   * @param {THREE.Scene} scene - ThreeJS scene
   * @param {Mesh} mesh - a mesh data object
   */
  constructor (scene, mesh) {
    super(scene);
    this.blockType = 'DataBlock';

    this.mesh = mesh;

    this._processed = false;
    this._bufferGeometry = undefined;
    this._material = undefined;

    this.coordArray = undefined;
    this.data = undefined;
    this.facesArray = undefined;
    this.tetraArray = undefined;
  }

  /**
   * Method that initialize DataBlock
   */
  process () {
    return this.loadData().then(() => {
      this._processed = true;

      // Init attribute nodes for plug-in blocks node inputs
      this.initAttributeNodes();

      // Create bufferGeometry of the "main" mesh
      this._bufferGeometry = new THREE.BufferGeometry();
      this.initBufferGeometry();

      // Init iso-color effect
      this.initIsocolor();

      // Create basic material with iso-color and build material
      this._material = new THREE.StandardNodeMaterial();
      this._material.shading = THREE.FlatShading;
      if (this._colored) {
        this._material.color = this._isoColorCall;
      }
      this._material.build();

      // Nodes for computing effects
      this._material._transformNodes = [];
      this._material._colorNodes = [];
      this._material._alphaNodes = [];

      // Varying nodes to save positions/color/alpha values of vertex
      this._material._positionVaryingNodes = [];
      this._material._colorVaryingNodes = [];
      this._material._alphaVaryingNodes = [];

      // Disable backface culling (to fix display issues with planes)
      this._material.side = THREE.DoubleSide;

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
    });
  }

  /**
   * Function that load data
   * @return {Promise} a promise of loading data
   */
  loadData () {
    if (!this.mesh.loaded) {
      // Load mesh data
      return this.mesh._load().then(() => {
        let {coordArray, data, facesArray, tetraArray} =
          this.mesh.getArrays();

        this.coordArray = coordArray;
        this.data = data;
        this.facesArray = facesArray;
        this.tetraArray = tetraArray;
      });
    } else {
      let {coordArray, data, facesArray, tetraArray} =
        this.mesh.getArrays();

      this.coordArray = coordArray;
      this.data = data;
      this.facesArray = facesArray;
      this.tetraArray = tetraArray;

      return Promise.resolve();
    }
  }

  /**
   * Initialization of buffer geometry
   */
  initBufferGeometry () {
    let coordAttribute = new THREE.BufferAttribute(this.coordArray, 3);
    let facesAttribute = new THREE.BufferAttribute(this.facesArray, 1);

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

    this._bufferGeometry.addAttribute('position', coordAttribute);
    this._bufferGeometry.setIndex(facesAttribute);
    this._bufferGeometry.center();
  }
}

module.exports = DataBlock;
