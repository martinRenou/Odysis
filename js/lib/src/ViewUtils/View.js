/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let THREE = require('../three');

let blockTypeRegister = {};

/**
 * Function that register a PlugInBlock in order
 * to be able to instanciate it
 * */
function registerBlockType (block) {
  blockTypeRegister[block.name] = block;
}

let DataBlock = require('../BlockUtils/DataBlock');

let Threshold = require('../BlockUtils/PlugIns/Threshold');
registerBlockType(Threshold);

let ClipPlane = require('../BlockUtils/PlugIns/ClipPlane');
registerBlockType(ClipPlane);

let Warp = require('../BlockUtils/PlugIns/Warp');
registerBlockType(Warp);

let Slice = require('../BlockUtils/PlugIns/Slice');
registerBlockType(Slice);

let VectorField = require('../BlockUtils/PlugIns/VectorField');
registerBlockType(VectorField);

let Points = require('../BlockUtils/PlugIns/Points');
registerBlockType(Points);

let IsoSurface = require('../BlockUtils/PlugIns/IsoSurface');
registerBlockType(IsoSurface);

/**
 * View class
 */
class View {

  constructor (container, opts = {}) {
    this.camera;
    this.controls;
    this.scene;
    this.renderer;

    this.blocks = [];

    this.container = container;

    if (opts['backgroundColor'] !== undefined) {
      this.backgroundColor = opts['backgroundColor'];
    } else {
      this.backgroundColor = 0xeffaff;
    }

    this._initScene();
    this._animate();
  }

  /**
   * Function that initialize the 3D scene
   */
  _initScene () {
    let {width, height} = this._getDimensions();

    this.camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.001,
      999999999
    );
    this.camera.position.z = 0.2;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // light
    let ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambientLight);

    let pointLight1 = new THREE.PointLight(0xffffff, 0.4, 0);
    pointLight1.position.set(50, 50, 50);
    this.scene.add(pointLight1);

    // Renderer
    this.renderer = new THREE.WebGLRenderer(
      { antialias: true },
      this.container
    );

    this.renderer.setSize(width, height);
    this.renderer.setClearColor(this.backgroundColor);
    this.renderer.localClippingEnabled = true;

    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new THREE.TrackballControls(
      this.camera,
      this.container
    );

    this.controls.screen.width = width;
    this.controls.screen.height = height;

    this.controls.rotateSpeed = 2.5;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.9;
    this.controls.dynamicDampingFactor = 0.9;

    window.addEventListener('resize', this._onResize.bind(this), false);
  }

  /**
   * Function that refresh the rendering
   */
  _animate () {
    this.animationID = requestAnimationFrame(this._animate.bind(this));

    this.renderer.render(this.scene, this.camera);

    this.controls.update();
  }

  /**
   * Event listener on resize
   */
  _onResize () {
    let {width, height} = this._getDimensions();

    this.renderer.setSize(width, height);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.controls.handleResize();

    this.controls.screen.width = width;
    this.controls.screen.height = height;
  }

  /**
   * Getter for dimensions
   */
  _getDimensions () {
    return this.container.getBoundingClientRect();
  }

  /**
   * Create datablock method
   */
  addDataBlock (vertices, faces, data, tetras) {
    let block = new DataBlock(this.scene, vertices, faces, data, tetras);
    return block.process().then(
      () => {
        // On fulfilled
        this.blocks.push(block);
        return block;
      },
      () => {
        // On reject
        return false;
      }
    );
  }

  /**
   * Create block method
   * @param {string} blockType - Type of the block that you want to
   * create
   * @param {Block} parent - parent block on which you want to add the
   * new block
   * @return {Block} - The new block
   */
  addBlock (blockType, parent) {
    if (blockTypeRegister[blockType]) {
      let newBlock = new blockTypeRegister[blockType](parent);

      return newBlock.process().then(
        () => {
          // On fulfilled
          this.blocks.push(newBlock);
          return newBlock;
        },
        () => {
          // On reject
          return false;
        }
      );
    } else {
      throw new Error('Unknown type ' + blockType);
    }
  }

  /**
   * Remove block method
   * @param {Block} block - The block which you want to remove
   */
  removeBlock (block) {
    // Remove block and its children from blocks
    if (this.blocks.indexOf(block) != -1) {
      this.blocks.splice(this.blocks.indexOf(block), 1);
      this._removeChildren(block);
    }

    block.remove();
  }

  /**
   * Remove children blocks from this.blocks
   */
  _removeChildren (block) {
    block.childrenBlocks.forEach((child) => {
      if (this.blocks.indexOf(child) != -1) {
        this.blocks.splice(this.blocks.indexOf(child), 1);
      }
      this._removeChildren(child);
    });
  }

  /**
   * Remove method that remove the view
   */
  remove () {
    window.removeEventListener('resize', this._onResizeEvent, false);
    cancelAnimationFrame(this.animationID);
    this.renderer.domElement.addEventListener('dblclick', null, false);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.container.removeChild(this.renderer.domElement);

    return true;
  }

}

module.exports = {
  View: View,
  registerBlockType: registerBlockType,
  blockTypeRegister: blockTypeRegister
};
