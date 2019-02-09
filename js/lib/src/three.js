// ThreeJS
let THREE = require('three');

window.THREE = THREE;

// Controls
require('three/examples/js/controls/TrackballControls.js');

// Nodes for material
require('three/examples/js/nodes/GLNode.js');
require('three/examples/js/nodes/RawNode.js');
require('three/examples/js/nodes/TempNode.js');
require('three/examples/js/nodes/InputNode.js');
require('three/examples/js/nodes/ConstNode.js');
require('three/examples/js/nodes/VarNode.js');
require('three/examples/js/nodes/FunctionNode.js');
require('three/examples/js/nodes/FunctionCallNode.js');
require('three/examples/js/nodes/AttributeNode.js');
require('three/examples/js/nodes/NodeBuilder.js');
require('three/examples/js/nodes/NodeLib.js');
require('three/examples/js/nodes/NodeMaterial.js');

require('three/examples/js/nodes/accessors/PositionNode.js');
require('three/examples/js/nodes/accessors/NormalNode.js');
require('three/examples/js/nodes/accessors/UVNode.js');
require('three/examples/js/nodes/accessors/ScreenUVNode.js');
require('three/examples/js/nodes/accessors/ColorsNode.js');
require('three/examples/js/nodes/accessors/CameraNode.js');
require('three/examples/js/nodes/accessors/ReflectNode.js');
require('three/examples/js/nodes/accessors/LightNode.js');

require('three/examples/js/nodes/inputs/IntNode.js');
require('three/examples/js/nodes/inputs/FloatNode.js');
require('three/examples/js/nodes/inputs/ColorNode.js');
require('three/examples/js/nodes/inputs/Vector2Node.js');
require('three/examples/js/nodes/inputs/Vector3Node.js');
require('three/examples/js/nodes/inputs/Vector4Node.js');
require('three/examples/js/nodes/inputs/TextureNode.js');
require('three/examples/js/nodes/inputs/CubeTextureNode.js');

require('three/examples/js/nodes/math/Math1Node.js');
require('three/examples/js/nodes/math/Math2Node.js');
require('three/examples/js/nodes/math/Math3Node.js');
require('three/examples/js/nodes/math/OperatorNode.js');

require('three/examples/js/nodes/utils/SwitchNode.js');
require('three/examples/js/nodes/utils/JoinNode.js');
require('three/examples/js/nodes/utils/TimerNode.js');
require('three/examples/js/nodes/utils/RoughnessToBlinnExponentNode.js');
require('three/examples/js/nodes/utils/VelocityNode.js');
require('three/examples/js/nodes/utils/LuminanceNode.js');
require('three/examples/js/nodes/utils/ColorAdjustmentNode.js');
require('three/examples/js/nodes/utils/NoiseNode.js');
require('three/examples/js/nodes/utils/ResolutionNode.js');
require('three/examples/js/nodes/utils/BumpNode.js');
require('three/examples/js/nodes/utils/BlurNode.js');

require('three/examples/js/nodes/materials/PhongNode.js');
require('three/examples/js/nodes/materials/PhongNodeMaterial.js');

require('three/examples/js/nodes/materials/StandardNode.js');
require('three/examples/js/nodes/materials/StandardNodeMaterial.js');

module.exports = THREE;
