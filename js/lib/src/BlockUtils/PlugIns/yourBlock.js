
let plugInBlock = require('../plugInBlock');

class yourBlock extends plugInBlock {

  /**
   * Constructor for yourBlock block
   * @param myFirstParameter : ...
   * @param ...
   * **/
  constructor (parentBlock, myFirstParameter = 123,
    mySecondParameter = 'Hello World !') {
    // Only initialize setters (maybe getters if you want), this,
    // and your custom parameters

    let setters = {
      'myFirstParameter': () => {
        // Do something with this._myFirstParameter
      },
      'mySecondParameter': () => {
        this.updateGeometry();
      }
    };

    super(parentBlock, setters);

    this._myFirstParameter = myFirstParameter;
    this._mySecondParameter = mySecondParameter;
  };

  /**
   * Method that initialize your node structures and geometries
   * **/
  _process () {
    // Creation of yourNode structure
    this._myFirstNode = new THREE.FloatNode(this._myFirstParameter);

    if (this._myFirstNode !== undefined) {
      console.log(this._mySecondParameter);
    }

    // Add an alpha node
    this.addAlphaNode('MUL', this._myFirstNode);

    // Create your geometry
    this.updateGeometry();

    // Build materials
    this.buildMaterials();
  };

  /**
   * Update geometry when needed
   * **/
  _updateGeometry () {

    // Update your geometry

  };
};

module.exports = yourBlock;
