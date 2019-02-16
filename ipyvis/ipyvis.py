from array import array

from traitlets import Unicode, List, Instance, Float
from traittypes import Array
from ipywidgets import widget_serialization, DOMWidget, Widget, register

from .serialization import array_serialization
from .vtk_loader import (
    load_file,
    get_faces, get_vertices, get_data,
    FLOAT32, UINT32
)

ipyvis_version = '^0.1.0'


@register
class Component(Widget):
    """A data component widget."""
    # _view_name = Unicode('ComponentView').tag(sync=True)
    _model_name = Unicode('ComponentModel').tag(sync=True)
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode(ipyvis_version).tag(sync=True)
    _model_module_version = Unicode(ipyvis_version).tag(sync=True)

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
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode(ipyvis_version).tag(sync=True)
    _model_module_version = Unicode(ipyvis_version).tag(sync=True)

    name = Unicode().tag(sync=True)
    components = List(Instance(Component)).tag(sync=True, **widget_serialization)


@register
class Mesh(Widget):
    """A 3-D Mesh widget."""
    # _view_name = Unicode('MeshView').tag(sync=True)
    _model_name = Unicode('MeshModel').tag(sync=True)
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode(ipyvis_version).tag(sync=True)
    _model_module_version = Unicode(ipyvis_version).tag(sync=True)

    # TODO: validate vertices/faces/tetras as being 1-D array, and validate dtype
    vertices = Array(default_value=array(FLOAT32)).tag(sync=True, **array_serialization)
    faces = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    tetras = Array(default_value=array(UINT32)).tag(sync=True, **array_serialization)
    data = List(Instance(Data), default_value=[]).tag(sync=True, **widget_serialization)

    @staticmethod
    def from_vtk(path):
        grid = load_file(path)

        grid_data = get_data(grid)
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
            vertices=get_vertices(grid),
            faces=get_faces(grid),
            tetras=array(UINT32),
            data=data
        )


@register
class Scene(DOMWidget):
    """A 3-D Scene widget."""
    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode(ipyvis_version).tag(sync=True)
    _model_module_version = Unicode(ipyvis_version).tag(sync=True)

    mesh = Instance(Mesh).tag(sync=True, **widget_serialization)
