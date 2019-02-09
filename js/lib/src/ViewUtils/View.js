/**
 * @author: Martin Renou / martin.renou@isae.fr
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

let Mesh = require('./Mesh');

/**
 * View class
 */
class View {

  constructor (container, mesh, blocksDescription = {}, opts = {}) {
    // TODO: support of multiple meshes, with a new addDataBlock(mesh) method ??
    this.camera;
    this.controls;
    this.scene;
    this.renderer;

    // Get mesh
    if (mesh !== undefined) {
      this._mesh = mesh;
    } else {
      throw new Error('Mesh is undefined, nothing to display');
    }

    // Compute default value of blocksDescription
    if (Object.keys(blocksDescription).length === 0 &&
        blocksDescription.constructor === Object) {
      // Mesh is rendered gray
      this._blocksDescription = {main: {type: 'DataBlock'}};
    } else {
      this._blocksDescription = blocksDescription;
    }

    this.blocks = [];

    this.container = container;
    this.fixedWidth = opts['width'];
    this.fixedHeight = opts['height'];

    if (opts['backgroundColor'] !== undefined) {
      this.backgroundColor = opts['backgroundColor'];
    } else {
      this.backgroundColor = 0xeffaff;
    }

    this._initScene();
    this._animate();
  }

  /**
   * Function that load mesh and description
   */
  process () {
    return this._instanciateBlocks()
      .then(
        this._loadData.bind(this)
      )
      .then(
        this._processBlocks.bind(this)
      )
      .then(() => {
        // adapt camera position to size of meshes
        let norm = 0, newPos = 0;

        this.blocks.forEach((block) => {
          if (block._meshes[0]
              && block.blockType == 'DataBlock') {
            norm = Math.sqrt(
              Math.pow(block._meshes[0].geometry.boundingBox.max.x *
                       block.scale[0], 2) +
              Math.pow(block._meshes[0].geometry.boundingBox.max.y *
                       block.scale[1], 2) +
              Math.pow(block._meshes[0].geometry.boundingBox.max.z *
                       block.scale[2], 2)
            );
            if (2 * norm > newPos) { newPos = 2 * norm; }
          }
        });

        this.camera.position.set(0.0, 0.0, newPos);
        this.camera.rotation.set(0.0, 0.0, 0.0);
        this.camera.up.x = 0.0;
        this.camera.up.y = 1.0;
        this.camera.up.z = 0.0;

        // Reinitialize controls
        this.controls = new THREE.TrackballControls(
          this.camera,
          this.container
        );

        this.controls.rotateSpeed = 2.5;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.9;
        this.controls.dynamicDampingFactor = 0.9;

        return this;
      });
  }

  /**
   * Function that update scene
   * @param {Mesh} mesh - The new mesh that you want in the 3D view
   * @param {Dict} blocksDescription - The description of blocks and
   * parameters.
   * Example:
   * blockDescription = {
   *   "My mesh" : {
   *     "type" : "DataBlock",
   *     "colored" : True,
   *     "childrenBlocks": {
   *       "Threshold": {
   *         "type": "Threshold",
   *         "upperBound": 1.948
   *       }
   *     }
   *   }
   * }
   * @param {Dict} opts - Options of the visualization.
   * Examples:
   * opts = {'height': 625, 'width': 123, 'backgroundColor'='blue'}
   * opts = {'backgroundColor'='#cef442'}
   * @return {Promise} A promise of updating the view
   */
  update (mesh, blocksDescription = {}, opts = {}) {
    // Get mesh
    if (mesh !== undefined) {
      this._mesh = mesh;
    } else {
      throw new Error('Mesh is undefined, nothing to display');
    }

    // Compute value of blocksDescription
    if (Object.keys(blocksDescription).length === 0 &&
        blocksDescription.constructor === Object) {
      // Mesh is rendered gray
      this._blocksDescription = {main: {type: 'DataBlock'}};
    } else {
      this._blocksDescription = blocksDescription;
    }

    if (opts['backgroundColor']) {
      this.backgroundColor = opts['backgroundColor'];
      this.renderer.setClearColor(this.backgroundColor);
    }

    this.resize(opts);

    this.blocks.forEach((block) => {
      block._meshes.forEach((mesh) => {
        this.scene.remove(mesh);
      });
    });

    return this.process();
  }

  /**
   * Function that read the blocksDescription and instanciate each block
   * and set there parameters
   */
  _instanciateBlocks () {
    let instanciationPromise = new Promise((resolve) => {
      let parseChildren = ((children, parent) => {
        let block;

        for (let key in children) {
          let value = children[key];

          if (blockTypeRegister[value['type']]) {
            block = new blockTypeRegister[value['type']](parent);
            block._name = key;

            parseAttributes(value, block);

            let attributes = [
              'type', 'colored', 'visualizedData',
              'colorMap', 'colorMapMin', 'colorMapMax',
              'position', 'rotation', 'scale', 'childrenBlocks',
              'visible', 'wireframe', 'visualizedComponent',
              'inputData', 'inputComponents'];

            // Compute unknown attributes
            for (let subKey in value) {
              if (!attributes.includes(subKey)) {
                block[subKey] = value[subKey];
              }
            }

            this.blocks.push(block);

            if (value['childrenBlocks']) {
              parseChildren(value['childrenBlocks'], block);
            }
          } else {
            throw new Error('Unknown type ' + value['type'] + '.'); }
        }
      });

      let parseAttributes = ((value, block) => {
        if (value['colored'] !== undefined) {
          block.colored = value['colored'];
        }

        if (value['visualizedData'] !== undefined) {
          block.visualizedData = value['visualizedData'];
        }

        if (value['visualizedComponent'] !== undefined) {
          block.visualizedComponent = value['visualizedComponent'];
        }

        if (value['inputData'] !== undefined) {
          if (value['inputComponents'] !== undefined) {
            block.setInput(value['inputData'], value['inputComponents']);
          } else {
            block.inputData = value['inputData'];
          }
        } else {
          if (value['inputComponents'] !== undefined) {
            throw new Error('Please specify an inputData for ' +
              block._name);
          }
        }

        if (value['colorMap'] !== undefined) {
          block.colorMap = value['colorMap'];
        }

        if (value['colorMapMin'] !== undefined) {
          block.colorMapMin = value['colorMapMin'];
        }

        if (value['colorMapMax'] !== undefined) {
          block.colorMapMax = value['colorMapMax'];
        }

        if (value['position'] !== undefined) {
          block.position = value['position'];
        }

        if (value['rotation'] !== undefined) {
          block.rotation = value['rotation'];
        }

        if (value['scale'] !== undefined) {
          block.scale = value['scale'];
        }

        if (value['visible'] !== undefined) {
          block.isVisible = value['visible'];
        }

        if (value['wireframe'] !== undefined) {
          block.dispWireframe = value['wireframe'];
        }
      });

      this.blocks = [];

      let value;
      let block;

      let tree = this._blocksDescription;

      for (let key in tree) {
        value = tree[key];

        if (value['type'] == 'DataBlock') {
          block = new DataBlock(this.scene, this._mesh);
          block._name = key;

          parseAttributes(value, block);

          this.blocks.push(block);

          if (value['childrenBlocks']) {
            parseChildren(value['childrenBlocks'], block);
          }
        } else {
          throw new Error('Not well formed base block ' + key +
                        ', it must be of type DataBlock.');
        }
      }

      resolve();
    });

    return instanciationPromise;
  }

  /**
   * Function that call, for each DataBlock, loadData function
   */
  _loadData () {
    let promises = [];
    this.blocks.forEach((block) => {
      if (block.blockType == 'DataBlock') {
        promises.push(block.loadData());
      }
    });
    return Promise.all(promises);
  }

  /**
   * Function that call, for each block, process function
   */
  _processBlocks () {
    function processChildren (parent) {
      parent.childrenBlocks.forEach(function (block) {
        block.process().then(
          function () {
            processChildren(block);
            return block;
          }
        );
      });
    }

    let promises = [];
    this.blocks.forEach((block) => {
      let promise;
      if (block.blockType == 'DataBlock') {
        promise = block.process().then(function () {
          processChildren(block);
        });
      }
      promises.push(promise);
    });

    return Promise.all(promises);
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
      2000
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

    // landmark
    /* let landmarkSize = 0.2
    let landmarkColors = [1., 0., 0., 1., 0., 0.,
                        0., 1., 0., 0., 1., 0.,
                        0., 0., 1., 0., 0., 1.]
    let landmarkVertices = [0., 0., 0., landmarkSize, 0., 0.,
                            0., 0., 0., 0., landmarkSize, 0.,
                            0., 0., 0., 0., 0., landmarkSize]
    let landmarkPositionAttribute =
        new THREE.BufferAttribute(
            new Float32Array(landmarkVertices),
            3
        )
    let landmarkColorsAttribute =
        new THREE.BufferAttribute(
            new Float32Array(landmarkColors),
            3
        )
    let landmarkGeometry = new THREE.BufferGeometry()
    landmarkGeometry.addAttribute("position", landmarkPositionAttribute)
    landmarkGeometry.addAttribute("color", landmarkColorsAttribute)

    let landmarkUniforms = {
        ratio : {value: width / height}
    }

    let landmarkVS = "\
        attribute vec3 position;\n\
        attribute vec3 color;\n\
        \n\
        uniform float ratio;\n\
        \n\
        uniform mat4 modelViewMatrix;\n\
        \n\
        varying vec3 vColor;\n\
        \n\
        mat3 getRotationMatrix(mat4 m4) {\n\
          return mat3(\n\
              m4[0][0], m4[0][1], m4[0][2],\n\
              m4[1][0], m4[1][1], m4[1][2],\n\
              m4[2][0], m4[2][1], m4[2][2]);\n\
        }\n\
        \n\
        void main(){\n\
            vColor = color;\n\
            vec3 rotatedPosition = getRotationMatrix(modelViewMatrix) * position;\n\
            vec3 screenPosition = vec3(-0.55*ratio, -0.55, 0.) + rotatedPosition;\n\
            gl_Position = vec4(screenPosition.x, screenPosition.y*ratio, 0.002, 1.);\n\
        }\n"

    let landmarkFS = "precision mediump float;\n\
        \n\
        varying vec3 vColor;\n\
        \n\
        void main(){\n\
            gl_FragColor = vec4(vColor, 1.0);\n\
        }\n"

    let landmarkMaterial = new THREE.RawShaderMaterial({
        uniforms : landmarkUniforms,
        vertexShader: landmarkVS,
        fragmentShader: landmarkFS
    })
    this.scene.add(new THREE.LineSegments(landmarkGeometry, landmarkMaterial))
    */

    // Renderer
    this.renderer = new THREE.WebGLRenderer(
      { antialias: true },
      this.container
    );

    this.renderer.setSize(width, height);
    this.renderer.setClearColor(this.backgroundColor);
    this.renderer.localClippingEnabled = true;

    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.className = 'SciviJS';

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

    this._onResizeEvent = this._onResize.bind(this);
    window.addEventListener('resize', this._onResizeEvent, false);
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
   * Resize method
   * @param {Dict} opts - Options, for example
   * {'width': 120, 'height': 200}
   */
  resize (opts = {}) {
    if (!(this.fixedWidth && !opts['width'])) {
      this.fixedWidth = opts['width'];
    }

    if (!(this.fixedHeight && !opts['height'])) {
      this.fixedHeight = opts['height'];
    }

    this._onResize();
  }

  /**
   * Getter for dimensions
   */
  _getDimensions () {
    let width, height;
    let bcr = this.container.getBoundingClientRect();

    if (!this.fixedWidth) {
      width = bcr['width'];
    } else {
      width = this.fixedWidth;
    }

    if (!this.fixedHeight) {
      height = bcr['height'];
    } else {
      height = this.fixedHeight;
    }

    return {height: height, width: width};
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
  Mesh: Mesh,
  registerBlockType: registerBlockType,
  blockTypeRegister: blockTypeRegister
};

