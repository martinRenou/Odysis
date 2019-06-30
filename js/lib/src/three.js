// ThreeJS
let THREE = require('three/build/three.module.js');

window.THREE = THREE;

// Controls
require('three/examples/js/controls/TrackballControls.js');

// Nodes for material
let Nodes = require('three/examples/js/nodes/Nodes.js');

module.exports = {THREE, Nodes};
