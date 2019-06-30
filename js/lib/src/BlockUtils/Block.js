/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let {THREE, Nodes} = require('../three');


let getOperatornode = function(a, b, operator) {
  if (operator == 'REPLACE') {
    return b;
  }

  let operation;

  switch (operator) {
    case 'SUB':
      operation = Nodes.OperatorNode.SUB;
      break;
    case 'ADD':
      operation = Nodes.OperatorNode.ADD;
      break;
    case 'DIV':
      operation = Nodes.OperatorNode.DIV;
      break;
    case 'MUL':
      operation = Nodes.OperatorNode.MUL;
      break;
    default:
      throw new Error(`"${operator}" is not a known shader operator`);
      break;
  }

  return new Nodes.OperatorNode(a, b, operation);
}

/**
 * Purely abstract class, base for DataBlock and PlugInBlock
 *
 * Contains all general-purpose features related to:
 * - mesh simple transformations
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

      Object.values(data).forEach((component) => {
        c++;
        // In shaders, component 3 of data 4 will be named 'scivid4c3'
        let shaderName = 'scivid'+d+'c'+c;

        component.shaderName = shaderName;

        component.node = new Nodes.AttributeNode(
          shaderName,
          'float'
        );
      });

      // Get Magnitude min and max
      let dataSize = Object.keys(data).length;
      if (dataSize > 1) {
        data.Magnitude = data.Magnitude || {};

        data.Magnitude.shaderName = 'd' + d + 'Magnitude';

        let powt = new Nodes.FloatNode(2);
        let sumNode = new Nodes.FloatNode(0);
        let powNode;

        Object.keys(data).forEach((componentName) => {
          if (componentName !== 'Magnitude') {
            powNode = new Nodes.Math2Node(
              data[componentName].node,
              powt,
              Nodes.Math2Node.POW
            );
            sumNode = new Nodes.OperatorNode(
              powNode,
              sumNode,
              Nodes.OperatorNode.ADD
            );
          }
        });

        data.Magnitude.node = new Nodes.Math1Node(
          sumNode,
          Nodes.Math1Node.SQRT
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

      let position = new Nodes.PositionNode();
      let alpha = new Nodes.FloatNode(1.0);
      let color = new Nodes.ColorNode(0xEEEEEE);

      // Compute transformations
      material._positionVaryingNodes.forEach((varNode) => {
        position = new Nodes.OperatorNode(
          position,
          varNode,
          Nodes.OperatorNode.ADD
        );
      });

      let operator;
      material._transformNodes.forEach((transNode) => {
        position = getOperatornode(
          position,
          transNode.get('node'),
          transNode.get('operator')
        );
      });

      // Compute alpha
      material._alphaVaryingNodes.forEach((alphaVarNode) => {
        alpha = new Nodes.OperatorNode(
          alpha,
          alphaVarNode,
          Nodes.OperatorNode.ADD
        );
      });

      material._alphaNodes.forEach((alphaNode) => {
        alpha = getOperatornode(
          alpha,
          alphaNode.get('node'),
          alphaNode.get('operator')
        );
      });

      // Compute color
      material._colorVaryingNodes.forEach((colorVarNode) => {
        color = new Nodes.OperatorNode(
          color,
          colorVarNode,
          Nodes.OperatorNode.ADD
        );
      });

      material._colorNodes.forEach((colorNode) => {
        color = getOperatornode(
          color,
          colorNode.get('node'),
          colorNode.get('operator')
        );
      });

      // To display surfaces like 2D planes or iso-surfaces whatever
      // the point of view
      mesh.material.side = THREE.DoubleSide;

      // Set wireframe status and shading
      if (mesh.type !== 'LineSegments' && mesh.type !== 'Points') {
        mesh.material.wireframe = this._wireframe;
        mesh.material.flatShading = !this._wireframe;
      } else {
        mesh.material.wireframe = false;
        // Why ?
        // mesh.material.shading = THREE.SmoothShading;
      }

      // Get isoColor node
      mesh.material.transform = position;
      mesh.material.alpha = alpha;
      mesh.material.color = color;
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
