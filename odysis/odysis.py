from array import array

from traitlets import Unicode, List, Instance, Float, Int, Bool, Union
from traittypes import Array
from ipywidgets import (
    widget_serialization,
    DOMWidget, Widget, register,
    Color,
    FloatRangeSlider, FloatSlider, FloatText, link, VBox
)

from .serialization import array_serialization
from .vtk_loader import load_vtk, FLOAT32, UINT32

odysis_version = '^0.1.0'


@register
class Component(Widget):
    """A data component widget."""
    # _view_name = Unicode('ComponentView').tag(sync=True)
    _model_name = Unicode('ComponentModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    name = Unicode().tag(sync=True)
    # TODO: validate data as being 1-D array, and validate dtype
    array = Array(default_value=array(FLOAT32)).tag(sync=True, **array_serialization)
    min = Float(allow_none=True, default_value=None).tag(sync=True)
    max = Float(allow_none=True, default_value=None).tag(sync=True)


@register
class Data(Widget):
    """A data widget."""
    # _view_name = Unicode('DataView').tag(sync=True)
    _model_name = Unicode('DataModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    name = Unicode().tag(sync=True)
    components = List(Instance(Component)).tag(sync=True, **widget_serialization)


@register
class Mesh(Widget):
    """A 3-D Mesh widget."""
    # _view_name = Unicode('MeshView').tag(sync=True)
    _model_name = Unicode('MeshModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    # TODO: validate vertices/faces/tetras as being 1-D array, and validate dtype
    vertices = Array(default_value=array(FLOAT32)).tag(sync=True, **array_serialization)
    faces = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    tetras = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    data = List(Instance(Data), default_value=[]).tag(sync=True, **widget_serialization)

    @staticmethod
    def from_vtk(path):
        mesh = load_vtk(path)

        grid_data = mesh['data']
        data = []
        for key, value in grid_data.items():
            data.append(Data(
                name=key,
                components=[
                    Component(name=comp_name, array=comp['array'], min=comp['min'], max=comp['max'])
                    for comp_name, comp in value.items()
                ]
            ))

        return Mesh(
            vertices=mesh['vertices'],
            faces=mesh['faces'],
            tetras=mesh['tetras'],
            data=data
        )


class BlockType():
    pass


@register
class Block(Widget, BlockType):
    _view_name = Unicode('BlockView').tag(sync=True)
    _model_name = Unicode('BlockModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    _blocks = List(Instance(BlockType)).tag(sync=True, **widget_serialization)

    visible = Bool(True).tag(sync=True)
    colored = Bool(True).tag(sync=True)
    # TODO position, rotation, scale, wireframe
    colormap_min = Float().tag(sync=True)
    colormap_max = Float().tag(sync=True)
    visualized_data = Unicode().tag(sync=True)
    visualized_components = List(Union(trait_types=(Unicode(), Int()))).tag(sync=True)

    def add(self, block):
        self._blocks = list([b for b in self._blocks] + [block])

    def remove(self, block):
        self._blocks = list([b for b in self._blocks if b.model_id != block.model_id])


@register
class PluginBlock(Block):
    _view_name = Unicode('PluginBlockView').tag(sync=True)
    _model_name = Unicode('PluginBlockModel').tag(sync=True)

    # TODO Validate data/components names and synchronise JavaScript -> Python
    input_data = Unicode().tag(sync=True)
    input_components = List(Union(trait_types=(Unicode(), Int()))).tag(sync=True)


@register
class Warp(PluginBlock):
    _view_name = Unicode('WarpView').tag(sync=True)
    _model_name = Unicode('WarpModel').tag(sync=True)

    factor = Float(0.0).tag(sync=True)
    factor_min = Float(-10.0)
    factor_max = Float(10.0)

    def interact(self):
        slider = FloatSlider(
            description='Warp factor',
            min=self.factor_min,
            max=self.factor_max,
            value=0.0
        )
        slider_min = FloatText(description='Min', value=self.factor_min)
        slider_max = FloatText(description='Max', value=self.factor_max)
        link((self, 'factor'), (slider, 'value'))
        link((self, 'factor_min'), (slider, 'min'))
        link((self, 'factor_min'), (slider_min, 'value'))
        link((self, 'factor_max'), (slider, 'max'))
        link((self, 'factor_max'), (slider_max, 'value'))
        return VBox((slider, slider_min, slider_max))


@register
class Clip(PluginBlock):
    _view_name = Unicode('ClipView').tag(sync=True)
    _model_name = Unicode('ClipModel').tag(sync=True)

    plane_position = Float(0.0).tag(sync=True)
    plane_position_min = Float(-10)
    plane_position_max = Float(10)
    plane_normal = List(Float()).tag(sync=True)

    def interact(self):
        slider = FloatSlider(
            description='Plane position',
            min=self.plane_position_min,
            max=self.plane_position_max,
            value=0.0
        )
        slider_min = FloatText(description='Min', value=self.plane_position_min)
        slider_max = FloatText(description='Max', value=self.plane_position_max)
        link((self, 'plane_position'), (slider, 'value'))
        link((self, 'plane_position_min'), (slider, 'min'))
        link((self, 'plane_position_min'), (slider_min, 'value'))
        link((self, 'plane_position_max'), (slider, 'max'))
        link((self, 'plane_position_max'), (slider_max, 'value'))
        return VBox((slider, slider_min, slider_max))


@register
class Threshold(PluginBlock):
    _view_name = Unicode('ThresholdView').tag(sync=True)
    _model_name = Unicode('ThresholdModel').tag(sync=True)

    lower_bound = Float().tag(sync=True)
    upper_bound = Float().tag(sync=True)

    def interact(self):
        slider = FloatRangeSlider(
            description='Bounds',
            min=self.lower_bound,
            max=self.upper_bound,
            value=[self.lower_bound, self.upper_bound]
        )
        slider.observe(self._on_slider_change, 'value')

        return VBox((slider, ))

    def _on_slider_change(self, change):
        self.lower_bound = change['new'][0]
        self.upper_bound = change['new'][1]


@register
class Scene(DOMWidget, Block):
    """A 3-D Scene widget."""
    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    mesh = Instance(Mesh).tag(sync=True, **widget_serialization)

    background_color = Color('#fff').tag(sync=True)
