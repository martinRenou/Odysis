from array import array

from traitlets import (
    Unicode, List, Instance, Float,
    Int, Bool, Union, Enum, observe
)
from traittypes import Array
from ipywidgets import (
    widget_serialization,
    DOMWidget, Widget, register,
    Color,
    Dropdown, FloatText, IntSlider, Label,
    ToggleButtons,
    link,
    VBox, HBox
)

from .serialization import array_serialization
from .vtk_loader import (
    load_vtk, FLOAT32, UINT32,
    get_ugrid_vertices, get_ugrid_faces, get_ugrid_tetras, get_ugrid_data
)
from .slider import FloatSlider, FloatRangeSlider

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

    def apply(self, block):
        block._validate_parent(self)

        if block._parent_block is not None:
            raise RuntimeError('Cannot apply the same effect at different places')

        block._parent_block = self
        self._blocks = list([b for b in self._blocks] + [block])

    def remove(self, block):
        block._parent_block = None
        self._blocks = list([b for b in self._blocks if b.model_id != block.model_id])

    def color_mapping(self, *args, **kwargs):
        effect = ColorMapping(*args, **kwargs)
        self.apply(effect)
        return effect

    def warp(self, *args, **kwargs):
        effect = Warp(*args, **kwargs)
        self.apply(effect)
        return effect

    def vector_field(self, *args, **kwargs):
        effect = VectorField(*args, **kwargs)
        self.apply(effect)
        return effect

    def point_cloud(self, *args, **kwargs):
        effect = PointCloud(*args, **kwargs)
        self.apply(effect)
        return effect

    def clip(self, *args, **kwargs):
        effect = Clip(*args, **kwargs)
        self.apply(effect)
        return effect

    def slice(self, *args, **kwargs):
        effect = Slice(*args, **kwargs)
        self.apply(effect)
        return effect

    def threshold(self, *args, **kwargs):
        effect = Threshold(*args, **kwargs)
        self.apply(effect)
        return effect

    def iso_surface(self, *args, **kwargs):
        effect = IsoSurface(*args, **kwargs)
        self.apply(effect)
        return effect

    def __init__(self, *args, **kwargs):
        super(Block, self).__init__(*args, **kwargs)
        self.colormap_wid = None
        self.colormapslider_wid = None

    def _validate_parent(self, parent):
        pass


def _grid_data_to_data_widget(grid_data):
    data = []
    for key, value in grid_data.items():
        d = Data(
            name=key,
            components=[
                Component(name=comp_name, array=comp['array'], min=comp['min'], max=comp['max'])
                for comp_name, comp in value.items()
            ]
        )
        data.append(d)

    return data


@register
class Mesh(Block):
    """A 3-D Mesh widget."""
    _view_name = Unicode('MeshView').tag(sync=True)
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
    bounding_box = List().tag(sync=True)

    @staticmethod
    def from_vtk(path):
        grid = load_vtk(path)

        grid.ComputeBounds()
        bounding_box = grid.GetBounds()

        return Mesh(
            vertices=get_ugrid_vertices(grid),
            faces=get_ugrid_faces(grid),
            tetras=get_ugrid_tetras(grid),
            data=_grid_data_to_data_widget(get_ugrid_data(grid)),
            bounding_box=bounding_box
        )

    def reload(self, path,
               reload_vertices=False, reload_faces=False,
               reload_data=True, reload_tetras=False):
        grid = load_vtk(path)

        with self.hold_sync():
            if reload_vertices:
                self.vertices = get_ugrid_vertices(grid)
            if reload_faces:
                self.faces = get_ugrid_faces(grid)
            if reload_tetras:
                self.tetras = get_ugrid_tetras(grid)
            if reload_data:
                self.data = _grid_data_to_data_widget(get_ugrid_data(grid))


@register
class PluginBlock(Block):
    _view_name = Unicode('PluginBlockView').tag(sync=True)
    _model_name = Unicode('PluginBlockModel').tag(sync=True)

    _parent_block = Instance(BlockType, allow_none=True, default_value=None)

    _available_input_data = List([])
    _available_input_components = List([])
    _input_data_dim = Int(allow_none=True, default_value=None)

    # TODO Validate data/components names and synchronise JavaScript -> Python
    input_data = Unicode(allow_none=True, default_value=None).tag(sync=True)
    input_components = List(Union((Unicode(), Int()))).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(PluginBlock, self).__init__(*args, **kwargs)
        self.input_data_wid = None
        self.input_components_wid = None

    def _get_data(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            block = block._parent_block
        return block.data

    @observe('_parent_block')
    def _update_input_data(self, change):
        parent = change['new']
        if parent is None:
            return

        data = self._get_data(parent)

        self._available_input_data = [d.name for d in data]
        self.input_data = self._available_input_data[0]

    @observe('input_data')
    def _update_available_components(self, change):
        data = self._get_data(self._parent_block)
        for d in data:
            if d.name == change['new']:
                current_data = d
        self._available_input_components = [c.name for c in current_data.components] + [0]

    @observe('_available_input_components')
    def _update_input_components(self, change):
        if self._input_data_dim is None:
            return

        available_components = change['new']

        if self.input_components_wid is not None:
            for component_wid in self.input_components_wid:
                component_wid.options = available_components

        # Check current components validity
        components_are_valid = True
        if not len(self.input_components):
            components_are_valid = False
        for c in self.input_components:
            if c not in available_components:
                components_are_valid = False
        if components_are_valid:
            return

        new_components = []
        for dim in range(self._input_data_dim):
            if len(available_components) <= dim:
                new_components.append(0)
                continue
            new_components.append(available_components[dim])

        self.input_components = new_components

    def _link_dropdown(self, dropdown, dim):
        def handle_dropdown_change(change):
            copy = self.input_components.copy()
            copy[dim] = change['new']
            self.input_components = copy
        dropdown.observe(handle_dropdown_change, names=['value'])

        def handle_input_change(change):
            dropdown.value = self.input_components[dim]
        self.observe(handle_input_change, names=['input_components'])

        link((dropdown, 'options'), (self, '_available_input_components'))

    def _init_input_data_widgets(self):
        self.input_components_wid = [Label('Input components')]
        for dim in range(self._input_data_dim):
            dropdown = Dropdown(
                options=self._available_input_components,
                value=self.input_components[dim]
            )
            dropdown.layout.width = 'fit-content'
            self._link_dropdown(dropdown, dim)
            self.input_components_wid.append(dropdown)

        self.input_data_wid = Dropdown(
            description='Input data',
            options=self._available_input_data,
            value=self.input_data
        )
        self.input_data_wid.layout.width = 'fit-content'

        link((self.input_data_wid, 'value'), (self, 'input_data'))

    def _interact(self):
        if self._input_data_dim is not None:
            if self.input_data_wid is None:
                self._init_input_data_widgets()

            return (VBox((self.input_data_wid, HBox(self.input_components_wid))), )

        return ()

    def _get_component_min_max(self, data_name, component_name):
        data = self._get_data(self._parent_block)
        for d in data:
            if d.name == data_name:
                for c in d.components:
                    if c.name == component_name:
                        return (c.min, c.max)
        raise RuntimeError('Unknown component {}.{}'.format(
            data_name, component_name))


@register
class ColorMapping(PluginBlock):
    _view_name = Unicode('ColorMappingView').tag(sync=True)
    _model_name = Unicode('ColorMappingModel').tag(sync=True)

    _input_data_dim = Int(1)

    colormap = Enum(('viridis', 'plasma', 'magma', 'inferno'), default_value='viridis').tag(sync=True)
    colormap_min = Float().tag(sync=True)
    colormap_max = Float().tag(sync=True)

    def interact(self):
        if not self.initialized_widgets:
            self._init_colormapping_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.colormap_wid, self.colormapslider_wid)), )
        )

    def __init__(self, *args, **kwargs):
        super(ColorMapping, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.colormap_wid = None
        self.colormapslider_wid = None

    def _init_colormapping_widgets(self):
        self.colormap_wid = Dropdown(
            description='Colormap',
            options=['viridis', 'plasma', 'magma', 'inferno'],
            value=self.colormap
        )
        self.colormap_wid.layout.width = 'fit-content'

        min, max = self._get_component_min_max(
            self.input_data, self.input_components[0])

        self.colormapslider_wid = FloatRangeSlider(
            value=[self.colormap_min, self.colormap_max],
            min=min,
            max=max,
            description="Colormap bounds"
        )

        def on_range_change(change):
            self.colormap_min = change['new'][0]
            self.colormap_max = change['new'][1]

        self.colormapslider_wid.observe(on_range_change, 'value')

        link((self.colormap_wid, 'value'), (self, 'colormap'))

    @observe('input_components')
    def _on_input_components_change(self, change):
        min, max = self._get_component_min_max(
            self.input_data, self.input_components[0])
        self.colormap_min = min
        self.colormap_max = max

        if self.initialized_widgets:
            self.colormapslider_wid.min = min
            self.colormapslider_wid.max = max
            self.colormapslider_wid.value = [min, max]


@register
class Warp(PluginBlock):
    _view_name = Unicode('WarpView').tag(sync=True)
    _model_name = Unicode('WarpModel').tag(sync=True)

    _input_data_dim = Int(3)

    factor = Float(0.0).tag(sync=True)
    factor_min = Float(-10.0)
    factor_max = Float(10.0)

    def interact(self):
        if not self.initialized_widgets:
            self._init_warp_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.factor_wid, self.factor_min_wid, self.factor_max_wid)), )
        )

    def __init__(self, *args, **kwargs):
        super(Warp, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.factor_wid = None
        self.factor_min_wid = None
        self.factor_max_wid = None

    def _init_warp_widgets(self):
        self.factor_wid = FloatSlider(
            description='Warp factor',
            min=self.factor_min,
            max=self.factor_max,
            value=0.0
        )

        self.factor_min_wid = FloatText(description='Factor Min', value=self.factor_min)
        self.factor_max_wid = FloatText(description='Factor Max', value=self.factor_max)

        link((self, 'factor'), (self.factor_wid, 'value'))
        link((self, 'factor_min'), (self.factor_wid, 'min'))
        link((self, 'factor_min'), (self.factor_min_wid, 'value'))
        link((self, 'factor_max'), (self.factor_wid, 'max'))
        link((self, 'factor_max'), (self.factor_max_wid, 'value'))


@register
class Clip(PluginBlock):
    _view_name = Unicode('ClipView').tag(sync=True)
    _model_name = Unicode('ClipModel').tag(sync=True)

    plane_position = Float(0.0).tag(sync=True)
    plane_position_min = Float(-10)
    plane_position_max = Float(10)
    plane_normal = List(Float()).tag(sync=True)

    def interact(self):
        if not self.initialized_widgets:
            self._init_clip_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.plane_position_wid, self.plane_position_min_wid, self.plane_position_max_wid)), )
        )

    def __init__(self, *args, **kwargs):
        super(Clip, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.plane_position_wid = None
        self.plane_position_min_wid = None
        self.plane_position_max_wid = None

    def _init_clip_widgets(self):
        # TODO Update the step of the slider
        self.plane_position_wid = FloatSlider(
            description='Plane position',
            min=self.plane_position_min,
            max=self.plane_position_max,
            value=0.0
        )
        self.plane_position_min_wid = FloatText(description='Min', value=self.plane_position_min)
        self.plane_position_max_wid = FloatText(description='Max', value=self.plane_position_max)

        link((self, 'plane_position'), (self.plane_position_wid, 'value'))
        link((self, 'plane_position_min'), (self.plane_position_wid, 'min'))
        link((self, 'plane_position_min'), (self.plane_position_min_wid, 'value'))
        link((self, 'plane_position_max'), (self.plane_position_wid, 'max'))
        link((self, 'plane_position_max'), (self.plane_position_max_wid, 'value'))

    def _validate_parent(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            if isinstance(block, Warp):
                raise RuntimeError('Cannot apply a Clip after a Warp effect')
            block = block._parent_block


@register
class Slice(PluginBlock):
    _view_name = Unicode('SliceView').tag(sync=True)
    _model_name = Unicode('SliceModel').tag(sync=True)

    slice_position = Float(0.0).tag(sync=True)
    slice_position_min = Float(-10)
    slice_position_max = Float(10)
    slice_normal = List(Float()).tag(sync=True)

    def interact(self):
        if not self.initialized_widgets:
            self._init_slice_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.slice_position_wid, self.slice_position_min_wid, self.slice_position_max_wid)), )
        )

    def __init__(self, *args, **kwargs):
        super(Slice, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.slice_position_wid = None
        self.slice_position_min_wid = None
        self.slice_position_max_wid = None

    def _init_slice_widgets(self):
        # TODO Update the step of the slider
        self.slice_position_wid = FloatSlider(
            description='Plane position',
            min=self.slice_position_min,
            max=self.slice_position_max,
            value=0.0
        )
        self.slice_position_min_wid = FloatText(description='Min', value=self.slice_position_min)
        self.slice_position_max_wid = FloatText(description='Max', value=self.slice_position_max)

        link((self, 'slice_position'), (self.slice_position_wid, 'value'))
        link((self, 'slice_position_min'), (self.slice_position_wid, 'min'))
        link((self, 'slice_position_min'), (self.slice_position_min_wid, 'value'))
        link((self, 'slice_position_max'), (self.slice_position_wid, 'max'))
        link((self, 'slice_position_max'), (self.slice_position_max_wid, 'value'))

    def _validate_parent(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            if isinstance(block, Warp):
                raise RuntimeError('Cannot apply a Slice after a Warp effect')
            block = block._parent_block
        if len(block.tetras) == 0:
            raise RuntimeError('Cannot apply a Slice to non-volumetric mesh')


@register
class VectorField(PluginBlock):
    _view_name = Unicode('VectorFieldView').tag(sync=True)
    _model_name = Unicode('VectorFieldModel').tag(sync=True)

    _input_data_dim = Int(3)

    length_factor = Float(1.).tag(sync=True)
    width = Int(1).tag(sync=True)
    percentage_vectors = Float(1.).tag(sync=True)
    distribution = Enum(('ordered', 'random'), default_value='ordered').tag(sync=True)
    mode = Enum(('volume', 'surface'), default_value='volume').tag(sync=True)

    def interact(self):
        if not self.initialized_widgets:
            self._init_vectorfield_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((
                self.length_factor_wid, self.width_wid,
                self.percentage_vectors_wid,
                self.distribution_wid, self.mode_wid
            )), )
        )

    def __init__(self, *args, **kwargs):
        super(VectorField, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.length_factor_wid = None
        self.width_wid = None
        self.percentage_vectors_wid = None
        self.distribution_wid = None
        self.mode_wid = None

    def _init_vectorfield_widgets(self):
        self.length_factor_wid = FloatText(
            description='Length factor', value=self.length_factor
        )
        self.width_wid = IntSlider(
            description='Width',
            min=1, max=10, value=self.width
        )
        self.percentage_vectors_wid = FloatSlider(
            description='Nb vectors',
            step=0.01,
            min=0.0, max=1.0, value=self.percentage_vectors,
            readout_format='.2%'
        )
        self.distribution_wid = ToggleButtons(
            description='Distribution',
            options=['ordered', 'random'],
            value=self.distribution
        )
        self.mode_wid = ToggleButtons(
            description='Mode',
            options=['volume', 'surface'],
            value=self.mode
        )

        link((self, 'length_factor'), (self.length_factor_wid, 'value'))
        link((self, 'width'), (self.width_wid, 'value'))
        link((self, 'percentage_vectors'), (self.percentage_vectors_wid, 'value'))
        link((self, 'distribution'), (self.distribution_wid, 'value'))
        link((self, 'mode'), (self.mode_wid, 'value'))

    def _validate_parent(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            if isinstance(block, VectorField) or isinstance(block, PointCloud):
                raise RuntimeError('Cannot apply a VectorField after a VectorField effect or a PointCloud effect')
            block = block._parent_block


@register
class PointCloud(PluginBlock):
    _view_name = Unicode('PointCloudView').tag(sync=True)
    _model_name = Unicode('PointCloudModel').tag(sync=True)

    points_size = Float(3.).tag(sync=True)
    percentage_points = Float(1.).tag(sync=True)
    distribution = Enum(('ordered', 'random'), default_value='ordered').tag(sync=True)
    mode = Enum(('volume', 'surface'), default_value='volume').tag(sync=True)

    def interact(self):
        if not self.initialized_widgets:
            self._init_pointcloud_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((
                self.points_size_wid, self.percentage_points_wid,
                self.distribution_wid, self.mode_wid
            )), )
        )

    def __init__(self, *args, **kwargs):
        super(PointCloud, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.points_size_wid = None
        self.percentage_points_wid = None
        self.distribution_wid = None
        self.mode_wid = None

    def _init_pointcloud_widgets(self):
        self.points_size_wid = FloatSlider(
            description='Size',
            min=1., max=20., value=self.points_size
        )
        self.percentage_points_wid = FloatSlider(
            description='Nb points',
            step=0.01,
            min=0.0, max=1.0, value=self.percentage_points,
            readout_format='.2%'
        )
        self.distribution_wid = ToggleButtons(
            description='Distribution',
            options=['ordered', 'random'],
            value=self.distribution
        )
        self.mode_wid = ToggleButtons(
            description='Mode',
            options=['volume', 'surface'],
            value=self.mode
        )

        link((self, 'points_size'), (self.points_size_wid, 'value'))
        link((self, 'percentage_points'), (self.percentage_points_wid, 'value'))
        link((self, 'distribution'), (self.distribution_wid, 'value'))
        link((self, 'mode'), (self.mode_wid, 'value'))

    def _validate_parent(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            if isinstance(block, VectorField) or isinstance(block, PointCloud):
                raise RuntimeError('Cannot apply a PointCloud after a VectorField effect or a PointCloud effect')
            block = block._parent_block


@register
class Threshold(PluginBlock):
    _view_name = Unicode('ThresholdView').tag(sync=True)
    _model_name = Unicode('ThresholdModel').tag(sync=True)

    _input_data_dim = Int(1)

    lower_bound = Float().tag(sync=True)
    upper_bound = Float().tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(Threshold, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.bounds_wid = None

    def interact(self):
        if not self.initialized_widgets:
            self._init_threshold_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.bounds_wid, )), )
        )

    def _init_threshold_widgets(self):
        self.bounds_wid = FloatRangeSlider(
            description='Bounds',
            min=self.lower_bound,
            max=self.upper_bound,
            value=[self.lower_bound, self.upper_bound]
        )
        self.bounds_wid.observe(self._on_slider_change, 'value')

    def _on_slider_change(self, change):
        self.lower_bound = change['new'][0]
        self.upper_bound = change['new'][1]

    @observe('lower_bound', 'upper_bound')
    def _on_bound_change(self, change):
        if self.initialized_widgets:
            self.bounds_wid.value = [self.lower_bound, self.upper_bound]

    @observe('input_components')
    def _on_input_components_change(self, change):
        min, max = self._get_component_min_max(
            self.input_data, self.input_components[0])
        self.lower_bound = min
        self.upper_bound = max

        if self.initialized_widgets:
            self.bounds_wid.min = min
            self.bounds_wid.max = max
            self.bounds_wid.value = [min, max]


@register
class IsoSurface(PluginBlock):
    _view_name = Unicode('IsoSurfaceView').tag(sync=True)
    _model_name = Unicode('IsoSurfaceModel').tag(sync=True)

    _input_data_dim = Int(1)

    value = Float().tag(sync=True)

    def __init__(self, *args, **kwargs):
        super(IsoSurface, self).__init__(*args, **kwargs)
        self.initialized_widgets = False
        self.value_wid = None

    def interact(self):
        if not self.initialized_widgets:
            self._init_isosurface_widgets()
            self.initialized_widgets = True

        return HBox(
            self._interact() + (VBox((self.value_wid, )), )
        )

    def _init_isosurface_widgets(self):
        min, max = self._get_component_min_max(
            self.input_data, self.input_components[0])

        self.value_wid = FloatSlider(
            description='Value',
            min=min,
            max=max,
            value=self.value
        )

        link((self, 'value'), (self.value_wid, 'value'))

    @observe('input_components')
    def _on_input_components_change(self, change):
        min, max = self._get_component_min_max(
            self.input_data, self.input_components[0])

        self.value = (max + min) / 2.

        if self.initialized_widgets:
            self.value_wid.min = min
            self.value_wid.max = max

    def _validate_parent(self, parent):
        block = parent
        while not isinstance(block, Mesh):
            block = block._parent_block
        if len(block.tetras) == 0:
            raise RuntimeError('Cannot apply an IsoSurface to non-volumetric mesh')


@register
class Scene(DOMWidget):
    """A 3-D Scene widget."""
    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    mesh = Instance(Mesh).tag(sync=True, **widget_serialization)

    background_color = Color('#fff').tag(sync=True)
