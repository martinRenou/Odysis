/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let THREE = require('../three');
let Block = require('./Block');

/**
 * PlugInBlock class
 * @extends Block
 */
class PlugInBlock extends Block {

  /**
   * Constructor for PlugInBlock
   * @param {THREE.Scene} scene - ThreeJS scene
   * @param {PlugInBlock} parentBlock - block before this one
   */
  constructor (parentBlock, setters = {}, getters = {}) {
    super(parentBlock._scene);
    this.blockType = this.__proto__.constructor.name;

    this._plugInID = getID();

    this._processed = false;

    this.inputDataDim = undefined;

    this.data = undefined;
    this.tetraArray = undefined;
    this.coordArray = undefined;
    this.facesArray = undefined;

    this._inputDataNode = undefined;
    this._inputDataName = undefined;
    this._inputComponentNames = undefined;

    this.parentBlock = parentBlock;

    // Hide parentBlock
    this.parentBlock.visible = false;

    // Fill tree of blocks
    this.parentBlock.addChildBlock(this);

    // Catch previous block color
    //this._colored = this.parentBlock._colored;
    this._colorMap = this.parentBlock._colorMap;
    this._colorMapMin = this.parentBlock._colorMapMin;
    this._colorMapMax = this.parentBlock._colorMapMax;

    // Catch previous block transformations
    this._position = [
      this.parentBlock._position[0],
      this.parentBlock._position[1],
      this.parentBlock._position[2]];
    this._rotation = [
      this.parentBlock._rotation[0],
      this.parentBlock._rotation[1],
      this.parentBlock._rotation[2]];
    this._scale = [
      this.parentBlock._scale[0],
      this.parentBlock._scale[1],
      this.parentBlock._scale[2]];

    // Compute setters
    this.setters = setters;
    this.getters = getters;
    this.installSetters();
    this.installGetters();
  }

  /**
   * Install setters
   *
   * Will automatically create setters with an object containing
   * functions
   */
  installSetters () {
    let that = this;
    Object.keys(this.setters).forEach(function (attrName) {
      let processingMethod = that.setters[attrName];
      Object.defineProperty(that, attrName, {
        set: function (value) {
          this['_' + attrName] = value;
          if (this._processed) {
            processingMethod.call(that, value);
          }
        },
        configurable: true
      });
    });
  }

  /**
   * Install getters
   *
   * Will automatically create getters with an object containing
   * functions
   */
  installGetters () {
    let that = this;
    Object.keys(this.setters).forEach(function (attrName) {
      let processingMethod = that.getters[attrName];
      Object.defineProperty(that, attrName, {
        get: function () {
          if (this._processed &&
              processingMethod !== undefined) {
            processingMethod.call(that);
          }
          return this['_' + attrName];
        }
      });
    });
  }

  /**
   * Process method
   */
  process () {
    return new Promise((resolve, reject) => {
      this.initBlock();

      // If process is not successful, parentBlock is set to visible
      let successfulProcess = this._process();
      if (successfulProcess || successfulProcess === undefined) {
        resolve();
      } else {
        this.parentBlock.visible = true;
        this.remove();
        reject();
      }
    });
  }

  _process () {
    throw new Error(this.blockType +
      ' must implement the "_process" method');
  }

  /**
   * Method that initialize your block
   */
  initBlock () {
    this._processed = true;

    // Get data description
    this.data = this.parentBlock.data;

    // Get tetras, coord, faces
    this.tetraArray = this.parentBlock.tetraArray;
    this.coordArray = this.parentBlock.coordArray;
    this.facesArray = this.parentBlock.facesArray;

    // Duplicate materials of previous block (not geometries)
    this._meshes = [];
    this.parentBlock._meshes.forEach((previousMesh) => {
      let _transformNodes =
        previousMesh.material._transformNodes.slice(0);
      let _alphaNodes = previousMesh.material._alphaNodes.slice(0);
      let _colorNodes = previousMesh.material._colorNodes.slice(0);

      let _positionVaryingNodes =
        previousMesh.material._positionVaryingNodes.slice(0);
      let _colorVaryingNodes =
        previousMesh.material._colorVaryingNodes.slice(0);
      let _alphaVaryingNodes =
        previousMesh.material._alphaVaryingNodes.slice(0);

      let material = new THREE.StandardNodeMaterial();

      material._transformNodes = _transformNodes;
      material._colorNodes = _colorNodes;
      material._alphaNodes = _alphaNodes;

      material._positionVaryingNodes = _positionVaryingNodes;
      material._colorVaryingNodes = _colorVaryingNodes;
      material._alphaVaryingNodes = _alphaVaryingNodes;

      material.linewidth = previousMesh.material.linewidth;

      let mesh;
      switch (previousMesh.type) {
        case 'Mesh':
          mesh = new THREE.Mesh(previousMesh.geometry, material);
          break;
        case 'LineSegments':
          mesh = new THREE.LineSegments(previousMesh.geometry, material);
          break;
        case 'Points':
          mesh = new THREE.Points(previousMesh.geometry, material);
          break;
      }

      this.addMesh(mesh);
    });

    // Set visualized data
    if (this.parentBlock._visualizedData && !this._visualizedData) {
      this._visualizedData = this.parentBlock._visualizedData;
    }

    // Set visualized component
    if (this.parentBlock._visualizedComponent &&
        !this._visualizedComponent) {
      this._visualizedComponent =
        this.parentBlock._visualizedComponent;
    }

    // Init isocolor
    this.initIsocolor();

    // Color meshes
    this.colored = this._colored || this.parentBlock.colored;

    // Set if meshes are visible or not
    if (this.isVisible !== undefined) {
      this._visible = this.isVisible;
    }
    this.visible = this._visible;

    // Set if meshes are rendered wireframe or not
    if (this.dispWireframe !== undefined) {
      this._wireframe = this.dispWireframe;
    } else {
      this._wireframe = this.parentBlock._wireframe;
    }
    this.wireframe = this._wireframe;

    // Function that returns components respecting the input data
    // dimension
    let safeGetComponents = (dataName) => {
      let components = Object.keys(this.data[dataName]);

      if (this.inputDataDim === undefined) {
        return [components[0]];
      }

      if (this.inputDataDim > 4) {
        throw new Error('inputDataDim must be less than 4');
      }

      let inputComponents;
      switch (this.inputDataDim) {
        case 1:
          inputComponents = components.slice(0, 1);
          break;
        case 2:
          inputComponents = components.slice(0, 2);
          inputComponents[1] = inputComponents[1] || 0;
          break;
        case 3:
          inputComponents = components.slice(0, 3);
          inputComponents[1] = inputComponents[1] || 0;
          inputComponents[2] = inputComponents[2] || 0;
          break;
        case 4:
          inputComponents = components.slice(0, 4);
          inputComponents[1] = inputComponents[1] || 0;
          inputComponents[2] = inputComponents[2] || 0;
          inputComponents[3] = inputComponents[3] || 0;
          break;
      }

      // Delete Magnitude as it is not supported yet
      if (inputComponents.includes('Magnitude')) {
        inputComponents[inputComponents.indexOf('Magnitude')] = 0;
      }
      return inputComponents;
    }

    // Initialize input node and arrays
    if (this._inputDataName === undefined) {
      let inputData = Object.keys(this.data)[0];
      let inputComponents = safeGetComponents(inputData);

      this.setInput(inputData, inputComponents);
    } else {
      if (this._inputComponentNames !== undefined) {
        this.setInput(this._inputDataName, this._inputComponentNames);
      } else {
        let inputComponents = safeGetComponents(this._inputDataName);
        this.setInput(this._inputDataName, inputComponents);
      }
    }
  }

  /**
   * Check input
   */
  _checkInput (inputComponents) {
    if (this.inputDataDim !== undefined &&
      inputComponents.length !== this.inputDataDim) {
      throw new Error(this.blockType + ' block needs a ' +
        this.inputDataDim + ' dimension(s) input but your input is [' +
        inputComponents + ']');
    }
  }

  /**
   * Set input method
   * It will create inputs (node and arrays) that you specified with
   * dataName and componentNames for this plug-in
   * @param {string} dataName - Name of the input data of which you want
   * to set input components for this plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input
   */
  _setInput(dataName, componentNames=[undefined]) {
    // Set inputDataNode
    let nodes = componentNames.map((componentName) => {
      // If user wants a number as input, return a THREE.FloatNode
      if (typeof componentName === 'number') {
        let number = componentName;
        return new THREE.FloatNode(number);
      }

      // Else return a the THREE.AttributeNode
      return this.parentBlock.getComponentNode(dataName, componentName);
    });

    if (nodes.length > 4) { throw 'Maximum vector size is 4'; }

    // If input is a vector, create a vector in shaders with a
    // THREE.JoinNode which will create a vector composed of components
    // passed in arguments
    if (nodes.length > 1) {
      this._inputDataNode = new THREE.JoinNode(...nodes);
    } else { this._inputDataNode = nodes[0]; }

    // Set inputComponentArrays
    let arrays = componentNames.map((componentName) => {
      if (typeof componentName === 'number') { return componentName; }

      return this.parentBlock.getComponentArray(dataName, componentName);
    });

    if (arrays.length > 4) { throw 'Maximum vector size is 4'; }

    this._inputComponentArrays = arrays;
  }

  /**
   * Set inputData. Must be used only if you are sure that the
   * specified data respects the plug-in specifications (for example,
   * Warp needs a 3D vector as input, you must be sure that your
   * specified inputData is a 3D vector, otherwise, use setInput method)
   * @param {string} dataName - Name of the input data used for this
   * plug-in
   */
  set inputData (dataName) {
    if (this._processed) {
      // Set default inputComponents (each component will be used)
      let componentNames;
      Object.keys(this.data).forEach((_dataName) => {
        if (dataName == _dataName) {
          componentNames = Object.keys(this.data[dataName]);

          if (componentNames.indexOf('Magnitude') !== -1) {
            componentNames.splice(
              componentNames.indexOf('Magnitude'), 1
            );
          }
        }
      });

      if (componentNames !== undefined) {
        this._inputDataName = dataName;
        this._inputComponentNames = componentNames.slice(0, 4);

        this._checkInput(this._inputComponentNames);

        this._setInput(this._inputDataName, this._inputComponentNames);
      } else {
        throw new Error(`"${dataName}" is not a known data`);
      }
    } else {
      this._inputDataName = dataName;
    }
  }

  get inputData () { return this._inputDataName; }

  /**
   * Set inputComponents
   * @param {string[]} componentNames - A list of components that you
   * want as input. You need to set inputData before using components of
   * a certain data.
   */
  set inputComponents (componentNames) {
    this._checkInput(componentNames);

    if (componentNames.length === 0) {
      throw new Error('inputComponents must contain at least one ' +
        'component or number');
    }

    if (this._processed) {
      this._inputComponentNames = componentNames;

      this._setInput(this._inputDataName, componentNames);
    } else {
      this._inputComponentNames = componentNames;
    }
  }

  get inputComponents () { return this._inputComponentNames; }

  /**
   * Public set input method
   * @param {string} dataName - Name of the input data used for this
   * plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input.
   */
  setInput (dataName, componentNames) {
    this._checkInput(componentNames);

    this._inputDataName = dataName;
    this._inputComponentNames = componentNames;

    if (this._processed) {
      this._setInput(this._inputDataName, componentNames);
    }
  }

  /**
   * Add a point size node to set size of gl_points
   * @param {THREE.GLNode} floatNode - A THREE.FloatNode (or
   * equivalent, it must be of type float in shaders. So a
   * THREE.Math1Node is allowed) containing the value of point size.
   */
  addPointSizeNode (floatNode) {
    let setPointSizeFunc = new THREE.FunctionNode([
      'vec3 setPointSizeFunc( float size ){',
      '    gl_PointSize = size;',
      '    return vec3(0., 0., 0.);',
      '}'].join('\n')
    );
    let setPointSizeFuncCall =
      new THREE.FunctionCallNode(setPointSizeFunc);
    setPointSizeFuncCall.inputs.size = floatNode;

    // TODO: request on ThreeJS for a THREE.PointSizeNode
    this.addTransformNode('ADD', setPointSizeFuncCall);
  }

  /**
   * Add alpha node for material, it will then update shaders
   * @param {string} operator - Operator that will be used to compute
   * alpha values together. Allowed values are 'ADD', 'SUB', 'MUL' or
   * 'DIV'.
   * @param {THREE.GLNode} alphaNode - A THREE.FloatNode (or
   * equivalent, it must be of type float in shaders. So a
   * THREE.Math1Node is allowed) containing the value of alpha.
   */
  addAlphaNode (operator, alphaNode) {
    let map = new Map();
    map.set('operator', operator);
    map.set('node', alphaNode);

    this._meshes.forEach((mesh) => {
      mesh.material._alphaNodes.push(map);
    });
    this.buildMaterials();
  }

  /**
   * Replace an old alpha node with a new one and update shaders
   * @param {THREE.GLNode} oldNode - The node that you want to replace
   * @param {THREE.GLNode} newNode - The node of substitution
   */
  replaceAlphaNode(oldNode, newNode){
    this._meshes.forEach((mesh) => {
      mesh.material._alphaNodes.forEach((alphaNode) => {
        if (alphaNode.get('node') === oldNode) {
          alphaNode.set('node', newNode);
        }
      });
    });
    this.buildMaterials();

    // Replace alpha node for children
    this.childrenBlocks.forEach((child) => {
      if (child._processed) {
        child.replaceAlphaNode(oldNode, newNode);
      }
    });
  }

  /**
   * Remove alpha node of material
   * @param {THREE.GLNode} alphaNode - The node that you want to remove
   */
  removeAlphaNode (alphaNode) {
    this._meshes.forEach((mesh) => {
      for (let i = 0, len = mesh.material._alphaNodes.length; i<len; i++) {
        if (mesh.material._alphaNodes[i].get('node') == alphaNode) {
          mesh.material._alphaNodes.splice(i, 1);
          break;
        }
      }
    });
  }

  /**
   * Add transform node for material
   * @param {string} operator - Operator that will be used to compute
   * transform values together. Allowed values are 'ADD', 'SUB', 'MUL'
   * or 'DIV'.
   * @param {THREE.GLNode} transformNode - A node containing the second
   * operand of the operation.
   */
  addTransformNode (operator, transformNode) {
    let map = new Map();
    map.set('operator', operator);
    map.set('node', transformNode);

    this._meshes.forEach((mesh) => {
      mesh.material._transformNodes.push(map);
    });
    this.buildMaterials();
  }

  /**
   * Replace an old transform node with a new one
   * @param {THREE.GLNode} oldNode - The node that you want to replace
   * @param {THREE.GLNode} newNode - The node of substitution
   */
  replaceTransformNode(oldNode, newNode){
    this._meshes.forEach((mesh) => {
      mesh.material._transformNodes.forEach((transformNode) => {
        if (transformNode.get('node') === oldNode) {
          transformNode.set('node', newNode);
        }
      });
    });
    this.buildMaterials();

    // Replace transform node for children
    this.childrenBlocks.forEach((child) => {
      if (child._processed) {
        child.replaceTransformNode(oldNode, newNode);
      }
    });
  }

  /**
   * Remove transform node of material
   * @param {THREE.GLNode} transformNode - The node that you want to
   * remove
   */
  removeTransformNode (transformNode) {
    this._meshes.forEach((mesh) => {
      for (let i = 0, len = mesh.material._transformNodes.length; i<len; i++) {
        if (mesh.material._transformNodes[i].get('node') == transformNode) {
          mesh.material._transformNodes.splice(i, 1);
          break;
        }
      }
    });
  }

  /**
   * Create and add new mesh to scene with given geometry and material
   * @param {THREE.Geometry} geometry - Can be also a
   * THREE.BufferGeometry
   * @param {THREE.ShaderMaterial} material
   * @return {number} the position index of the meshes in this._meshes
   */
  createMesh (geometry, material) {
    if ((geometry.type == 'BufferGeometry' ||
            geometry.type == 'Geometry') &&
            material.type == 'ShaderMaterial') {
      let newMesh = new THREE.Mesh(geometry, material);

      return this.addMesh(newMesh);
    } else {
      return -1;
    }
  }

  /**
   * Add new mesh to scene
   * @param {THREE.Mesh} mesh
   * @return {number} the position index of the meshes in this._meshes
   */
  addMesh (mesh) {
    if (mesh.material !== undefined && mesh.geometry !== undefined) {
      if (!mesh.material._transformNodes) {
        mesh.material._transformNodes = [];
      }
      if (!mesh.material._colorNodes) {
        mesh.material._colorNodes = [];
      }
      if (!mesh.material._alphaNodes) {
        mesh.material._alphaNodes = [];
      }

      if (!mesh.material._positionVaryingNodes) {
        mesh.material._positionVaryingNodes = [];
      }
      if (!mesh.material._colorVaryingNodes) {
        mesh.material._colorVaryingNodes = [];
      }
      if (!mesh.material._alphaVaryingNodes) {
        mesh.material._alphaVaryingNodes = [];
      }

      mesh.position.set(
        this._position[0],
        this._position[1],
        this._position[2]);
      mesh.rotation.set(
        this._rotation[0],
        this._rotation[1],
        this._rotation[2]);
      mesh.scale.set(
        this._scale[0],
        this._scale[1],
        this._scale[2]);

      mesh.visible = this._visible;

      this._meshes.push(mesh);

      this.buildMaterials();

      this._scene.add(this._meshes[this._meshes.length - 1]);
      return this._meshes.length - 1;
    } else {
      return -1;
    }
  }

  /**
   * Create a varying of the current position
   * @return {THREE.VarNode} Varying node representing the current
   * position of each vertex
   */
  getCurrentPositionNode () {
    let currentPosition = new THREE.VarNode('vec3');

    // Change this when we'll be able to set void functions
    // or properly set varyings
    let setCustomVar = new THREE.FunctionNode([
      'float setPosVar' + this._plugInID + '(vec3 pos){',
      '    posVar' + this._plugInID + ' = pos;',
      '    return 0.;',
      '}'
    ].join('\n'));

    setCustomVar.keywords['posVar' + this._plugInID] = currentPosition;

    let setCustomVarCall = new THREE.FunctionCallNode(setCustomVar);

    if (this._meshes[0].material.transform) {
      setCustomVarCall.inputs.pos = this._meshes[0].material.transform;
    } else {
      setCustomVarCall.inputs.pos = new THREE.PositionNode();
    }

    this.addPositionVaryingSetter(setCustomVarCall);

    return currentPosition;
  }

  /**
   * Add position varying node
   * (can be used in vertex and fragment shaders)
   */
  addPositionVaryingSetter (varyingNode) {
    this._meshes.forEach((mesh) => {
      mesh.material._positionVaryingNodes.push(varyingNode);
    });
  }

  /**
   * Create a varying of the current alpha canal
   */
  getCurrentAlphaNode () {
    let currentAlpha = new THREE.VarNode('float');

    // Change this when we'll be able to set void functions
    // or properly set varyings
    let setCustomVar = new THREE.FunctionNode([
      'float setAlphaVar' + this._plugInID + '(float alpha){',
      '    alphaVar' + this._plugInID + ' = alpha;',
      '    return 0.;',
      '}'
    ].join('\n'));

    setCustomVar.keywords['alphaVar' + this._plugInID] = currentAlpha;

    let setCustomVarCall = new THREE.FunctionCallNode(setCustomVar);

    if (this._meshes[0].material.alpha) {
      setCustomVarCall.inputs.alpha = this._meshes[0].material.alpha;
    } else {
      setCustomVarCall.inputs.alpha = new THREE.FloatNode(1.0);
    }

    this.addAlphaVaryingSetter(setCustomVarCall);

    return currentAlpha;
  }

  /**
   * Add alpha varying node
   * (can be used in vertex and fragment shaders)
   */
  addAlphaVaryingSetter (varyingNode) {
    this._meshes.forEach((mesh) => {
      mesh.material._alphaVaryingNodes.push(varyingNode);
    });
  }

  /**
   * Getter for the current material
   */
  getCurrentMaterial () {
    // Clone basic material parameters
    let inputMaterial = this.parentBlock._meshes[0].material;
    let currentMaterial = inputMaterial.clone();

    // Clone transfom/alpha/color node lists
    let _transformNodes = inputMaterial._transformNodes.slice(0);
    let _alphaNodes = inputMaterial._alphaNodes.slice(0);
    let _colorNodes = inputMaterial._colorNodes.slice(0);

    // Clone varying node lists
    let _positionVaryingNodes =
      inputMaterial._positionVaryingNodes.slice(0);
    let _colorVaryingNodes =
      inputMaterial._colorVaryingNodes.slice(0);
    let _alphaVaryingNodes =
      inputMaterial._alphaVaryingNodes.slice(0);

    currentMaterial._transformNodes = _transformNodes;
    currentMaterial._colorNodes = _colorNodes;
    currentMaterial._alphaNodes = _alphaNodes;

    currentMaterial._positionVaryingNodes = _positionVaryingNodes;
    currentMaterial._colorVaryingNodes = _colorVaryingNodes;
    currentMaterial._alphaVaryingNodes = _alphaVaryingNodes;

    return currentMaterial;
  }

  /**
   * Remove meshes from scene
   */
  removeMeshes () {
    this._meshes.forEach((mesh) => {
      this._scene.remove(mesh);
    });
    this._meshes = [];
  }

  /**
   * Update line width
   */
  updateLineWidth (width) {
    // Update width of each material of this block
    this._meshes.forEach((mesh) => {
      mesh.material.linewidth = width;
    });

    // Update width of each subBlock
    this.childrenBlocks.forEach((mesh) => {
      mesh.updateLineWidth(width);
    });
  }

  /**
   * Update geometry
   */
  updateGeometry(updateInputArrays = false){
    // Update input data arrays
    if (updateInputArrays) {
      this._setInput(this._inputDataName, this._inputComponentNames);
    }

    // Update geometry of this block
    if (this._updateGeometry !== undefined){
      this._updateGeometry();
    }

    // Update geometry of each children block
    this._updateGeometryCall();
  }

  /**
   * Update geometry of each child
   */
  _updateGeometryCall () {
    this.childrenBlocks.forEach((child) => {
      child.updateGeometry(true);
    });
  }
}

/**
 * Return ID of this PlugInBlock object (to prevent conflicts in shaders)
 * **/
let getID = (function () {
  let i = 0;

  return function () {
    i++;
    return i;
  };
})();

module.exports = PlugInBlock;
