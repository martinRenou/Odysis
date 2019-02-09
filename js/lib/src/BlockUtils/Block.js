/**
 * @author: Martin Renou / martin.renou@isae.fr
 * **/

let THREE = require('../three');

/**
 * Load texture files as color maps
 */
let loadTextureMapsNodes = function() {
  let textureMaps = new Map();
  let textureLoader = new THREE.TextureLoader();
  textureMaps.set('rainbow',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9oKEwY5OSJhDDkAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAEDElEQVQ4EQEBBP77AQAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAz4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACOAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB7NAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACNSAkAtNjbjAAAAABJRU5ErkJggg==')));
  textureMaps.set('gray',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAABCAYAAAAxWXB3AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AIPDxkwTrYsnQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABzSURBVDjLtdCxDYURAEXh+09gAjPobKCV0GhNIEYRE2g1JFob6IxigvemuGeArziflPInhACj9x6stRR7rYVSCsXOOWOMAVbee/TeKXYIAa01ih1jxN6bYhtjcM6hPddaY85JsZ1zSClR7ForlFIU+96LP3wfIlgefubKAAAAAElFTkSuQmCC')));
  return textureMaps;
};

let textureMapsNodes = loadTextureMapsNodes();


/**
 * Purely abstract class, base for DataBlock and PlugInBlock
 *
 * Contains all general-purpose features related to:
 * - mesh simple transformations
 * - isocolor handling
 * - material assembly
 * - block tree management
 */
class Block {

  /**
   * Constructor for block
   * @param {THREE.Scene} scene - ThreeJS scene
   */
  constructor (scene) {
    this.id = THREE.Math.generateUUID();

    this._scene = scene;

    this._meshes = [];

    this._visible = true;
    this._processed = false;
    this._wireframe = false;
    this._colored = false;
    this._colorMap = 'rainbow';

    this._position = [0.0, 0.0, 0.0];
    this._rotation = [0.0, 0.0, 0.0];
    this._scale = [1.0, 1.0, 1.0];

    this.childrenBlocks = [];
  }

  /**
   * Get visible status of meshes
   * @return {boolean} True if meshes are visible, false otherwise
   */
  get visible () { return this._visible; }

  /**
   * Set visible status of meshes
   * @param {boolean} visible - True if meshes are visible, false
   * otherwise
   */
  set visible (visible) {
    this._visible = visible;
    this._meshes.forEach((mesh) => {
      mesh.visible = visible;
    });
  }

  /**
   * Get meshes position
   * @return {number[]} Position of Block's meshes [tx, ty, tz]
   */
  get position () { return this._position; }

  /**
   * Set meshes position
   * @param {number[]} position - Position of Block's meshes
   * [tx, ty, tz]
   */
  set position (position) {
    this._position = position;
    this._meshes.forEach((mesh) => {
      mesh.position.set(
        position[0],
        position[1],
        position[2]
      );
    });
  }

  /**
   * Translate meshes with a given vector
   * @param {number} tx - Translation on X axis
   * @param {number} ty - Translation on Y axis
   * @param {number} tz - Translation on Z axis
   */
  translate (tx, ty, tz) {
    this.position = [
      this.position[0] + tx,
      this.position[1] + ty,
      this.position[2] + tz];
  }

  /**
   * Get meshes rotation
   * @return {number[]} Rotation of Block's meshes [rx, ry, rz]
   * (radian)
   */
  get rotation () { return this._rotation; }

  /**
   * Set meshes rotation
   * @param {number[]} rotation - Rotation of Block's meshes
   * [rx, ry, rz] (radian)
   */
  set rotation (rotation) {
    this._rotation = rotation;
    this._meshes.forEach((mesh) => {
      mesh.rotation.set(
        rotation[0],
        rotation[1],
        rotation[2]
      );
    });
  }

  /**
   * Rotate meshes with a given vector
   * @param {number} rx - Rotation through X axis (radian)
   * @param {number} ry - Rotation through Y axis (radian)
   * @param {number} rz - Rotation through Z axis (radian)
   */
  rotate (rx, ry, rz) {
    this.rotation = [
      this.rotation[0] + rx,
      this.rotation[1] + ry,
      this.rotation[2] + rz];
  }

  /**
   * Get meshes scale
   * @return {number[]} Scale of Block's meshes [s1, s2, s3]
   */
  get scale () { return this._scale; }

  /**
   * Set meshes scale
   * @param {number[]} scale - Scale of Block's meshes [s1, s2, s3]
   */
  set scale (scale) {
    this._scale = scale;
    this._meshes.forEach((mesh) => {
      mesh.scale.set(scale[0], scale[1], scale[2]);
    });
  }

  /**
   * Get wireframe status
   * @return {boolean} True if meshes are rendered wireframe style,
   * false otherwise
   */
  get wireframe () { return this._wireframe; }

  /**
   * Set wireframe status
   * @param {boolean} bool - True if meshes are rendered wireframe
   * style, false otherwise
   */
  set wireframe (wireframe) {
    if (this._processed) {
      this._wireframe = wireframe;

      this.buildMaterials();
    }
  }

  /**
   * Initialization of isocolor node
   */
  initIsocolor () {
    // ColorMaps (textures used for iso-color)
    this._textureMapsNodes = textureMapsNodes;

    // IsoColor node (function used in shaders for iso-color)
    this._isoColor = new THREE.FunctionNode([
      'vec3 isoColorFunc(sampler2D texColorMap, \
        float colorMapMin, float colorMapMax,\
        float data){',
      '  return vec3(texture2D(\
          texColorMap,\
          vec2(( data - colorMapMin ) / ( colorMapMax - colorMapMin ),\
          0.0)));',
      '}'].join('\n')
    );

    this._isoColorCall = new THREE.FunctionCallNode(this._isoColor);

    // Set visualized data for iso-color
    if (this._visualizedData === undefined) {
      this._visualizedData = Object.keys(this.data)[0];
    }
    if (this._visualizedComponent === undefined) {
      if (this.data[this._visualizedData] !== undefined) {
        this._visualizedComponent = Object.keys(
          this.data[this._visualizedData])[0];
      } else {
        throw new Error(`"${this._visualizedData}" is not a known data`);
      }
    }

    // Set dataMin dataMax (bounds for colorMapMin and colorMapMax)
    // Set colorMapMin and colorMapMax nodes (bounds for iso-color)
    this._dataMin = this.getComponentMin(
      this._visualizedData,
      this._visualizedComponent
    );
    this._dataMax = this.getComponentMax(
      this._visualizedData,
      this._visualizedComponent
    );
    this._colorMapMinNode = new THREE.FloatNode(this._dataMin);
    this._colorMapMaxNode = new THREE.FloatNode(this._dataMax);

    if (!this._colorMapMin) {
      this._colorMapMin = this._dataMin;
    }
    if (!this._colorMapMax) {
      this._colorMapMax = this._dataMax;
    }
    // Check validity of _colorMapMin and _colorMapMax
    this.colorMapMin = this._colorMapMin;
    this.colorMapMax = this._colorMapMax;

    // Attribute node ('data' input in shader iso-color function)
    this._isoColorInputData = this.getComponentNode(
      this._visualizedData,
      this._visualizedComponent
    );

    this._isoColorCall.inputs.data = this._isoColorInputData;
    this._isoColorCall.inputs.colorMapMin = this._colorMapMinNode;
    this._isoColorCall.inputs.colorMapMax = this._colorMapMaxNode;

    // Check validity of _colorMap
    this.colorMap = this._colorMap;

    this._isoColorCall.inputs.texColorMap =
      this._textureMapsNodes.get(this._colorMap);
  }

  /**
   * Get colored status
   * @return {boolean} True if meshes are colored using isoColor, false
   * if meshes are rendered gray
   */
  get colored () { return this._colored; }

  /**
   * Set colored status
   * @param {boolean} colorStatus - True if meshes are colored using
   * isoColor, false if meshes are rendered gray
   */
  set colored (colorStatus) {
    if (this._processed) {
      if (this._colored != colorStatus) {
        this._colored = colorStatus;

        this.buildMaterials();
      }
    } else {
      this._colored = colorStatus;
    }
  }

  /**
   * Get colorMapMin
   * @return {number} Minimum bound for color mapping
   */
  get colorMapMin () { return this._colorMapMin; }

  /**
   * Set colorMapMin
   * @param {number} value - Value of minimum bound for color mapping,
   * it must be in [dataMin, colorMapMax], otherwise it will be setted
   * to dataMin
   */
  set colorMapMin (value) {
    if (this._processed) {
      if (value <= this._colorMapMax && value >= this._dataMin) {
        this._colorMapMin = value;

        // Update uniform value in shaders (will update the view)
        this._colorMapMinNode.number = value;
      } else {
        this._colorMapMin = this._dataMin;

        // Update uniform value in shaders (will update the view)
        this._colorMapMinNode.number = this._dataMin;
      }
    } else {
      // This value will be validated in this.initIsocolor()
      this._colorMapMin = value;
    }
  }

  /**
   * Get colorMapMax
   * @return {number} Maximum bound for color mapping
   */
  get colorMapMax () { return this._colorMapMax; }

  /**
   * Set colorMapMax
   * @param {number} value - Value of maximum bound for color mapping,
   * it must be in [colorMapMin, dataMax], otherwise it will be setted
   * to dataMax
   */
  set colorMapMax (value) {
    if (this._processed) {
      if (value >= this._colorMapMin && value <= this._dataMax) {
        this._colorMapMax = value;

        // Update uniform value in shaders (will update the view)
        this._colorMapMaxNode.number = value;
      } else {
        this._colorMapMax = this._dataMax;

        // Update uniform value in shaders (will update the view)
        this._colorMapMaxNode.number = this._dataMax;
      }
    } else {
      // This value will be validated in this.initIsocolor()
      this._colorMapMax = value;
    }
  }

  /**
   * Add new colorMap
   * @param {string} url - url of the new color map, can be a data url
   * @param {string} name - Name of your new color map, url by default
   */
  addColorMap (url, name = '') {
    let textureLoader = new THREE.TextureLoader();
    let texture = new THREE.TextureNode(textureLoader.load(url));

    let colorMapName = name == '' ? url : name;
    textureMapsNodes.set(colorMapName, texture);
  }

  /**
   * Get color map
   * @return {string} The name of currently used color map for color
   * mapping
   */
  get colorMap () { return this._colorMap; }

  /**
   * Set color map
   * @param {string} name - Name of the color map that you want to use,
   * available values are 'rainbow' and 'gray'
   */
  set colorMap (name) {
    if (this._processed) {
      if (this._textureMapsNodes.get(name)) {
        this._isoColorCall.inputs.texColorMap =
          this._textureMapsNodes.get(name);
        this._colorMap = name;

        // Build materials
        this.buildMaterials();
      } else { throw new Error(`Color map "${name}" does not exist`); }
    } else {
      // This value will be validated in this.initIsocolor()
      this._colorMap = name;
    }
  }

  /**
   * Get visualized data
   * @return {string} The name of currently visualized data
   */
  get visualizedData () { return this._visualizedData; }

  /**
   * Get visualized component
   * @return {string} The name of currently visualized component
   */
  get visualizedComponent () { return this._visualizedComponent; }

  /**
   * Set visualized data
   * @param {string} dataName - Name of the data that you want to
   * visualize with color mapping
   */
  set visualizedData (dataName) {
    if (this._processed) {
      let componentName;

      Object.keys(this.data).forEach((_dataName) => {
        if (_dataName == dataName) {
          componentName = Object.keys(this.data[_dataName])[0];
        }
      });

      this._updateVisualizedDataComponent(dataName, componentName);
    } else { this._visualizedData = dataName; }
  }

  /**
   * Set visualized component
   * @param {string} componentName - Name of the component that you want
   * to visualize with color mapping
   */
  set visualizedComponent (componentName) {
    this._updateVisualizedDataComponent(
      this._visualizedData,
      componentName
    );
  }

  /**
   * Update color mapping with a new visualized component data
   */
  _updateVisualizedDataComponent (dataName, componentName) {
    if (this._processed) {
      let componentNode = this.getComponentNode(dataName, componentName);

      // Update colorMapMin and colorMapMax
      this._dataMin = this.getComponentMin(dataName, componentName);
      this._dataMax = this.getComponentMax(dataName, componentName);
      this._colorMapMin = this._dataMin;
      this._colorMapMax = this._dataMax;

      // Update uniform values in shaders (will update the view)
      this._colorMapMinNode.number = this._dataMin;
      this._colorMapMaxNode.number = this._dataMax;

      // Update data input (require to build materials, as we change the
      // shader)
      this._isoColorCall.inputs.data = componentNode;

      //
      this._visualizedData = dataName;
      this._visualizedComponent = componentName;

      // Build materials
      this.buildMaterials();
    } else {
      this._visualizedData = dataName;
      this._visualizedComponent = componentName;
    }
  }

  /**
   * Function that returns an component node
   * @param {string} dataName - Name of data of which you want to get a
   * component node. If dataName refers to a 1D data, you don't need to
   * scecify a componentName
   * @param {string} componentName - Name of the component of which you
   * want to get the component node
   * @return {THREE.AttributeNode} the component node that you specified
   * with dataName and componentName
   */
  getComponentNode (dataName, componentName) {
    return this._getComponent(dataName, componentName).node;
  }

  /**
   * Private method that return an component node if it exists 
   */
  _getComponent (dataName, componentName) {
    if (this.data[dataName] === undefined) {
      throw new Error(`"${dataName}" is not a known data`);
    }

    // if componentName is undefined, return the first component
    if (componentName === undefined) {
      if (Object.keys(this.data[dataName]).length === 1) {
        componentName = Object.keys(this.data[dataName])[0];
      } else {
        throw new Error(
          `Component name must be specified for data "${dataName}"`);
      }
    }

    if (this.data[dataName][componentName] === undefined) {
      throw new Error(
        `Component "${componentName}" of data "${dataName}" is not known`);
    }

    return this.data[dataName][componentName];
  }

  /**
   * Function that return a component mininmum value
   * @param {string} dataName - Name of data of which you want to get a
   * component minimum value. If dataName refers to a 1D data, you don't
   * need to scecify a componentName
   * @param {string} componentName - Name of the component of which you
   * want to get the minimum value
   * @return {number} the minimum value of component that you specified
   * with dataName and componentName
   */
  getComponentMin (dataName, componentName) {
    let component = this._getComponent(dataName, componentName);

    if (component.min === undefined) {
      let {min, max} = this._computeMinMax(component, dataName);
      component.min = min;
      component.max = max;
    }

    return component.min;
  }

  /**
   * Function that return a component maximum value
   * @param {string} dataName - Name of data of which you want to get a
   * component maximum value. If dataName refers to a 1D data, you don't
   * need to scecify a componentName
   * @param {string} componentName - Name of the component of which you
   * want to get the maximum value
   * @return {number} the maximum value of component that you specified
   * with dataName and componentName
   */
  getComponentMax (dataName, componentName) {
    let component = this._getComponent(dataName, componentName);

    if (component.max === undefined) {
      let {min, max} = this._computeMinMax(component, dataName);
      component.min = min;
      component.max = max;
    }

    return component.max;
  }

  /**
   * Function that return a component array
   * @param {string} dataName - Name of data of which you want to get a
   * component array. If dataName refers to a 1D data, you don't
   * need to scecify a componentName
   * @param {string} componentName - Name of the component of which you
   * want to get the array
   * @return {number[]} the array of component that you specified
   * with dataName and componentName
   */
  getComponentArray (dataName, componentName) {
    if (componentName !== 'Magnitude') {
      return this._getComponent(dataName, componentName).array;
    } else {
      throw new Error('Support of Magnitude as input component is not implemented yet');
    }
  }

  /**
   * Private function that compute min and max values of an component
   * @param {Object} component - The component returned by
   * this._getComponent
   * @param {string} dataName - The data name from which come the
   * component
   */
  _computeMinMax(component, dataName) {
    if (!component.shaderName.endsWith('Magnitude')) {
      let array = component.initialArray;
      let min = array[0], max = min;

      // Compute min and max
      array.forEach((value) => {
        if (value < min) { min = value; }
        if (value > max) { max = value; }
      });

      return {min: min, max: max};
    } else {
      let arrays = [], magMin, magMax = 0, mag;

      // Get data arrays of each component
      Object.values(this.data[dataName]).forEach((_component) => {
        if (!_component.shaderName.endsWith('Magnitude')) {
          arrays.push(_component.initialArray);
        }
      });

      // Compute magMin and magMax
      let componentsNumber = arrays.length;
      let valuesNumber = arrays[0].length;
      for (let iVal = 0; iVal < valuesNumber; iVal++) {
        mag = 0;
        for (let iComp = 0; iComp < componentsNumber; iComp++) {
          mag += Math.pow(arrays[iComp][iVal], 2);
        }
        mag = Math.sqrt(mag);
        if (magMin === undefined || mag < magMin) { magMin = mag; }
        if (magMax < mag) { magMax = mag; }
      }

      return {min: magMin, max: magMax};
    }
  }

  /**
   * Initialization of attribute nodes. Method used in DataBlock,
   * shouldn't be called in a PlugInBlock
   */
  initAttributeNodes(){
    let d = 0;
    Object.values(this.data).forEach((data) => {
      d++;
      let c = 0;

      let components = [];
      Object.values(data).forEach((component) => {
        c++;
        // In shaders, component 3 of data 4 will be named 'scivid4c3'
        let shaderName = 'scivid'+d+'c'+c;

        component.shaderName = shaderName;

        component.node = new THREE.AttributeNode(
          shaderName,
          'float'
        );

        components.push(component);
      });

      // Get Magnitude min and max
      let dataSize = Object.keys(data).length;
      if (dataSize > 1) {
        data.Magnitude = data.Magnitude || {};

        data.Magnitude.shaderName = 'd' + d + 'Magnitude';

        let powt = new THREE.FloatNode(2);
        let sumNode = new THREE.FloatNode(0);
        let powNode;

        Object.keys(data).forEach((componentName) => {
          if (componentName !== 'Magnitude') {
            powNode = new THREE.Math2Node(
              data[componentName].node,
              powt,
              THREE.Math2Node.POW
            );
            sumNode = new THREE.OperatorNode(
              powNode,
              sumNode,
              THREE.OperatorNode.ADD
            );
          }
        });

        data.Magnitude.node = new THREE.Math1Node(
          sumNode,
          THREE.Math1Node.SQRT
        );
      }
    });
  }

  /**
   * Build materials of meshes. If materials are not builded, meshes are
   * rendered red
   */
  buildMaterials () {
    this._meshes.forEach((mesh) => {
      let material = mesh.material;

      let position = new THREE.PositionNode();
      let alpha = new THREE.FloatNode(1.0);

      // Compute transformations
      material._positionVaryingNodes.forEach((varNode) => {
        position = new THREE.OperatorNode(
          position,
          varNode,
          THREE.OperatorNode.ADD
        );
      });

      let operator;
      material._transformNodes.forEach((transNode) => {
        switch (transNode.get('operator')) {
          case 'SUB':
            operator = THREE.OperatorNode.SUB;
            break;
          case 'MUL':
            operator = THREE.OperatorNode.MUL;
            break;
          case 'DIV':
            operator = THREE.OperatorNode.DIV;
            break;
          default:
            operator = THREE.OperatorNode.ADD;
            break;
        }

        position = new THREE.OperatorNode(
          position,
          transNode.get('node'),
          operator
        );
      });

      // Compute alphas
      material._alphaVaryingNodes.forEach((alpVarNode) => {
        alpha = new THREE.OperatorNode(
          alpha,
          alpVarNode,
          THREE.OperatorNode.ADD
        );
      });

      material._alphaNodes.forEach((alpNode) => {
        switch (alpNode.get('operator')) {
          case 'SUB':
            operator = THREE.OperatorNode.SUB;
            break;
          case 'ADD':
            operator = THREE.OperatorNode.ADD;
            break;
          case 'DIV':
            operator = THREE.OperatorNode.DIV;
            break;
          default:
            operator = THREE.OperatorNode.MUL;
            break;
        }

        alpha = new THREE.OperatorNode(
          alpha,
          alpNode.get('node'),
          operator
        );
      });

      // To display surfaces like 2D planes or iso-surfaces whatever
      // the point of view
      mesh.material.side = THREE.DoubleSide;

      // Set wireframe status and shading
      if (mesh.type !== 'LineSegments') {
        mesh.material.wireframe = this._wireframe;
        mesh.material.shading = this._wireframe
          ? THREE.SmoothShading
          : THREE.FlatShading;
      } else {
        mesh.material.wireframe = false;
        mesh.material.shading = THREE.SmoothShading;
      }

      // Get isoColor node
      mesh.material.color = this._colored
        ? this._isoColorCall
        : new THREE.ColorNode(0xEEEEEE);

      mesh.material.transform = position;
      mesh.material.alpha = alpha;
      mesh.material.build();
    });
  }

  /**
   * Add child block
   * @param {PlugInBlock} childBlock - a block that you want to plug in
   */
  addChildBlock (childBlock) {
    this.childrenBlocks.push(childBlock);
  }

  remove () {
    // Remove this from children of parentBlock
    if (this.parentBlock &&
        this.parentBlock.childrenBlocks.indexOf(this) != -1) {
      this.parentBlock.childrenBlocks.splice(
        this.parentBlock.childrenBlocks.indexOf(this),
        1
      );
    }

    // Delete children
    let i = this.childrenBlocks.length;
    while (i--) { this.childrenBlocks[i].remove(); }

    // Remove meshes from the scene
    this._meshes.forEach((mesh) => { this._scene.remove(mesh); });
  }
}

module.exports = Block;
