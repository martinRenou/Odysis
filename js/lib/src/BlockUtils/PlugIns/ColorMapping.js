/**
 * @author: Martin Renou / martin.renou@gmail.com
 * **/

let PlugInBlock = require('../PlugInBlock');
let THREE = require('../../three');

/**
 * Load texture files as color maps
 */
let loadTextureMapsNodes = function() {
  let textureMaps = new Map();
  let textureLoader = new THREE.TextureLoader();
  textureMaps.set('viridis',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAABCAMAAAD92eD2AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAEsUExURUQCVUUGWUYKXUcNYEcRZEgVZ0gZa0gcbkgfcEgjdEgmdkgpeUcte0cvfUYzf0U2gUQ5g0M8hEI/hUFCh0BFiD9IiT5Lij1OijtRizpTizlWjDhajDZcjTVfjTRhjTJkjjFmjjBpji9sji5uji1xjixyjit1jip4jil6jih9jid/jiaCjiWEjiSGjiOJjiKLjSGOjSGRjCCSjB+Vix+Xix+aih6ciR+fiB+hhyCjhiGmhSOohCWrgietgSmvfy2yfTC0ezS2eTi5dzy7dUC9ckS/cErBbU/Da1TFaFnHZF7JYWTLXmrNW3DPV3bRU33ST4PUS4rVR5DXQ5fYP57ZOqTbNqvcMrLdLbneKMDfJcfgIM7hHdTiGtvjGOLkGOnlGu/lHPbmH/vnI////6dkNu4AAAABYktHRGNcvi2qAAAAB3RJTUUH4wISEh00Ha7gTwAAAIl6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAImVWO0Q3DMAhE/5kiI2DAB4xTRYnUDTp+cJzK7fuA0wkO6Pi8T9oGjYWseyABLiwt5VUieKLMTbiNXnXydG2lZNmkMgUynG0N2uN/6YrA6eaOjh27VLocKhpVa49GKo83coV43D/U2X//1j/QBUTJLDCZZckEAAAAbElEQVQI12NgYGRiZmFlY+fg5OLm4eXjFxAUEhYRFROXkJSSlpGVk1dQVFJWUVVT19DU0tbR1dM3MDQyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vH18w8IDAoOCQ0Lj4iMio6JjYtPSEwCAHgmEvTi4/F5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE4VDE4OjI5OjUyKzAxOjAwUKWXygAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xOFQxODoyOTo1MiswMTowMCH4L3YAAAAWdEVYdGV4aWY6RXhpZkltYWdlTGVuZ3RoADl2GPUTAAAAF3RFWHRleGlmOkV4aWZJbWFnZVdpZHRoADg4OE4hyKYAAAASdEVYdGV4aWY6RXhpZk9mZnNldAA2Njd3Z2EAAAAddEVYdGV4aWY6U29mdHdhcmUAU2hvdHdlbGwgMC4yOC40Lr5VtAAAAABJRU5ErkJggg==')));
  textureMaps.set('plasma',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAABCAMAAAD92eD2AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAEsUExURQ8HiBcHix0GjiMGkCgFki0FlTIFlzYEmTsEmz8EnEMDnkgDn0wCoVAColQCpFgBpVwBpmEAp2UAp2gAqG0AqHEAqHUBqHkBqHwDqIAEqIQFp4gHposKpY8NpJMPopYToZoWn50YnaEbm6Qemachl6okla0nk7EqkLMtjrYwi7kyibw1h785hME7gsQ+f8ZBfclEestHec1KdtBNc9JQcdVTb9ZVbdlYattcaN1eZt9iY+FkYuNoX+VrXeduW+hxWOp0Vux3VO57Uu9+UPGBTfKES/SISfWLRvaPRPeSQviWQPmZPvqdPPuhOfykN/yoNf2sM/2wMf20L/64Lf67K/6/Kf3EKP3IJ/3MJvzQJfvUJPrZJPndJfjhJfbmJvXqJ/PvJ/HzJvD3I/////FdOAUAAAABYktHRGNcvi2qAAAAB3RJTUUH4wISEh4nsj3yUgAAAIl6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAImVWO0Q3DMAhE/5kiI2DAB4xTRYnUDTp+cJzK7fuA0wkO6Pi8T9oGjYWseyABLiwt5VUieKLMTbiNXnXydG2lZNmkMgUynG0N2uN/6YrA6eaOjh27VLocKhpVa49GKo83coV43D/U2X//1j/QBUTJLDCZZckEAAAAbElEQVQI12NgYGRiZmFlY+fg5OLm4eXjFxAUEhYRFROXkJSSlpGVk1dQVFJWUVVT19DU0tbR1dM3MDQyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vH18w8IDAoOCQ0Lj4iMio6JjYtPSEwCAHgmEvTi4/F5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE4VDE4OjMwOjM5KzAxOjAwqVY+vQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xOFQxODozMDozOSswMTowMNgLhgEAAAAWdEVYdGV4aWY6RXhpZkltYWdlTGVuZ3RoADl2GPUTAAAAF3RFWHRleGlmOkV4aWZJbWFnZVdpZHRoADg4OE4hyKYAAAASdEVYdGV4aWY6RXhpZk9mZnNldAA2Njd3Z2EAAAAddEVYdGV4aWY6U29mdHdhcmUAU2hvdHdlbGwgMC4yOC40Lr5VtAAAAABJRU5ErkJggg==')));
  textureMaps.set('magma',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAABCAMAAAD92eD2AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAEsUExURQEABQEBCAICDQQDEwYFGAgGHQoIIg0KKBAMLhMNMxYPORkQQB0RRiARTCMSUigSWSwRXzARZDUQaTkPbj4PckIPdUYQd0sQeU8Se1MTfFcVflsWfl8Yf2MZgGcbgGsdgW8egXMggXcigXsjgn8lgoMmgYgngYwpgZAqgZQsgJgtgJwuf6Ewf6Uxfqkzfa00fLE1e7Y2ero4eL46d8I7dcY9c8s/cs9AcNNDbtdFbNpHat5JaOJNZuVQZOhTYutXYe1aX/BeXvJjXPRnXPVsXPdwXPh2XPl6Xfp/XvuEYPyJYfyNZP2TZv2Yaf6cbP6hbv6mcv6rdf6weP61fP65f/6+g/7Dh/7Ii/7NkP7RlP7WmP3anf3gof3kpv3pqvztr/zytPz3ufz7vf///0QblSkAAAABYktHRGNcvi2qAAAAB3RJTUUH4wISEh8m3CHzhQAAAIl6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAImVWO0Q3DMAhE/5kiI2DAB4xTRYnUDTp+cJzK7fuA0wkO6Pi8T9oGjYWseyABLiwt5VUieKLMTbiNXnXydG2lZNmkMgUynG0N2uN/6YrA6eaOjh27VLocKhpVa49GKo83coV43D/U2X//1j/QBUTJLDCZZckEAAAAbElEQVQI12NgYGRiZmFlY+fg5OLm4eXjFxAUEhYRFROXkJSSlpGVk1dQVFJWUVVT19DU0tbR1dM3MDQyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vH18w8IDAoOCQ0Lj4iMio6JjYtPSEwCAHgmEvTi4/F5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE4VDE4OjMxOjM4KzAxOjAw4ONeNwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xOFQxODozMTozOCswMTowMJG+5osAAAAWdEVYdGV4aWY6RXhpZkltYWdlTGVuZ3RoADl2GPUTAAAAF3RFWHRleGlmOkV4aWZJbWFnZVdpZHRoADg4OE4hyKYAAAASdEVYdGV4aWY6RXhpZk9mZnNldAA2Njd3Z2EAAAAddEVYdGV4aWY6U29mdHdhcmUAU2hvdHdlbGwgMC4yOC40Lr5VtAAAAABJRU5ErkJggg==')));
  textureMaps.set('inferno',
    new THREE.TextureNode(textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAABCAMAAAD92eD2AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAEsUExURQEABQEBCAICDgQDEwYEGQkGHgsHJQ4JKxIKMRULNhgMPRwMQyEMSSUMTykLVS4KWjMKXjcJYjsJZEAKZ0QKaUkLak0NbFEObFUPbVkRbl0SbmEUbmYVbmoXbm4YbnIabnYbbnodbX4ebYIgbIcha4siao8kaZMmZ5cnZpspZJ8qY6MsYactX6svXq8xW7MzWrc1V7s2VL85UsI7T8Y9TclASs1CSNBFRdRIQtdLP9pOPN1ROeBVNuNYM+VcMOhfLepjKuxnJ+5rI/BwIPJ0HPR4GfV8FveBEviFD/mKC/mOCfqUB/uYBvudB/yiCfynDPyrEPyxFfu2Gvu7IPrAJvrFLPnJM/jPOvfUQvXZSfTeUvPjWvLoZPHsb/HxefP0hPT4j/f7mfv+ov///xA1q/4AAAABYktHRGNcvi2qAAAAB3RJTUUH4wISEh8MB5o6UwAAAIl6VFh0UmF3IHByb2ZpbGUgdHlwZSBleGlmAAAImVWO0Q3DMAhE/5kiI2DAB4xTRYnUDTp+cJzK7fuA0wkO6Pi8T9oGjYWseyABLiwt5VUieKLMTbiNXnXydG2lZNmkMgUynG0N2uN/6YrA6eaOjh27VLocKhpVa49GKo83coV43D/U2X//1j/QBUTJLDCZZckEAAAAbElEQVQI12NgYGRiZmFlY+fg5OLm4eXjFxAUEhYRFROXkJSSlpGVk1dQVFJWUVVT19DU0tbR1dM3MDQyNjE1M7ewtLK2sbWzd3B0cnZxdXP38PTy9vH18w8IDAoOCQ0Lj4iMio6JjYtPSEwCAHgmEvTi4/F5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAyLTE4VDE4OjMxOjEyKzAxOjAwBrYGBAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0xOFQxODozMToxMiswMTowMHfrvrgAAAAWdEVYdGV4aWY6RXhpZkltYWdlTGVuZ3RoADl2GPUTAAAAF3RFWHRleGlmOkV4aWZJbWFnZVdpZHRoADg4OE4hyKYAAAASdEVYdGV4aWY6RXhpZk9mZnNldAA2Njd3Z2EAAAAddEVYdGV4aWY6U29mdHdhcmUAU2hvdHdlbGwgMC4yOC40Lr5VtAAAAABJRU5ErkJggg==')));
  return textureMaps;
};

let textureMapsNodes = loadTextureMapsNodes();

/**
 * ColorMapping class
 *
 @extends PlugInBlock
 */
class ColorMapping extends PlugInBlock {

  /**
   * Constructor for color block
   *
   * @param {PlugInBlock} parentBlock - The block before this color one
   * factor adapted to data order of magnitude)
   */
  constructor (parentBlock, colorMap = 'viridis') {
    let setters = {
      'colorMap': (name) => {
        if (this._textureMapsNodes.get(name)) {
          this._colorMappingCall.inputs.texColorMap =
            this._textureMapsNodes.get(name);
          this._colorMap = name;

          // Build materials
          this.buildMaterials();
        } else { throw new Error(`Color map "${name}" does not exist`); }
      },
      'colorMapMin': (value) => {
        if (value <= this._colorMapMaxNode.number && value >= this._dataMin) {
          this._colorMapMinNode.number = value;
        } else {
          this._colorMapMinNode.number = this._dataMin;
        }
      },
      'colorMapMax': (value) => {
        if (value >= this._colorMapMinNode.number && value <= this._dataMax) {
          this._colorMapMaxNode.number = value;
        } else {
          this._colorMapMaxNode.number = this._dataMax;
        }
      }
    };

    super(parentBlock, setters);

    this._textureMapsNodes = undefined;
    this._colorMapping = undefined;
    this._colorMappingCall = undefined;
    this._colorMap = colorMap;

    this.inputDataDim = 1;
  }

  _process () {
    this._setColorMappingNode();

    this.addColorNode('REPLACE', this._colorMappingCall);
  }

  /**
   * Function that create the color node
   */
  _setColorMappingNode(){
    this._textureMapsNodes = textureMapsNodes

    this._colorMapping = new THREE.FunctionNode(
      `vec3 colorMappingFunc${this._plugInID}(sampler2D texColorMap, float colorMapMin, float colorMapMax, float data){
        return vec3(texture2D(
          texColorMap,
          vec2(( data - colorMapMin ) / ( colorMapMax - colorMapMin ),
          0.0)));
      }`
    );

    this._colorMappingCall = new THREE.FunctionCallNode(this._colorMapping);

    this._dataMin = this.getComponentMin(
      this._inputDataName,
      this._inputComponentNames[0]
    );
    this._dataMax = this.getComponentMax(
      this._inputDataName,
      this._inputComponentNames[0]
    );
    this._colorMapMinNode = new THREE.FloatNode(this._dataMin);
    this._colorMapMaxNode = new THREE.FloatNode(this._dataMax);

    this._colorMappingCall.inputs.data = this._inputDataNode;
    this._colorMappingCall.inputs.colorMapMin = this._colorMapMinNode;
    this._colorMappingCall.inputs.colorMapMax = this._colorMapMaxNode;

    this._colorMappingCall.inputs.texColorMap =
      this._textureMapsNodes.get(this._colorMap);
  }

  /**
   * Change input for color effect
   * @param {string} dataName - Name of the input data of which you want
   * to set input components for this plug-in
   * @param {string[]} componentNames - A list of components that you
   * want as input.
   */
  _setInput (dataName, componentNames) {
    super._setInput(dataName, componentNames);

    if (this._processed && this._colorMappingCall) {
      let oldNode = this._colorMappingCall;

      // Update the Color Node
      this._setColorMappingNode();

      // Replace the old node with the new Color Node in materials
      this.replaceColorNode(oldNode, this._colorMappingCall);
    }
  }
}

module.exports = ColorMapping;
