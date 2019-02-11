from traitlets import Unicode, List, Instance
from traittypes import Array
from ipywidgets import widget_serialization, DOMWidget, Widget, register

from .serialization import array_serialization

ipyvis_version = '^0.1.0'


class CommonTraits():
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode(ipyvis_version).tag(sync=True)
    _model_module_version = Unicode(ipyvis_version).tag(sync=True)


@register
class Scene(DOMWidget, CommonTraits):
    """A 3-D Scene widget."""
    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)


@register
class Component(Widget, CommonTraits):
    """A data component widget."""
    # _view_name = Unicode('ComponentView').tag(sync=True)
    _model_name = Unicode('ComponentModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    # TODO: validate data as being 1-D array, and validate dtype
    data = Array().tag(sync=True, **array_serialization)


@register
class Data(Widget, CommonTraits):
    """A data widget."""
    # _view_name = Unicode('DataView').tag(sync=True)
    _model_name = Unicode('DataModel').tag(sync=True)

    name = Unicode().tag(sync=True)
    components = List(Instance(Component)).tag(sync=True, **widget_serialization)


@register
class Mesh(Widget, CommonTraits):
    """A 3-D Mesh widget."""
    # _view_name = Unicode('MeshView').tag(sync=True)
    _model_name = Unicode('MeshModel').tag(sync=True)

    # TODO: validate vertices/faces/tetras as being 1-D array, and validate dtype
    vertices = Array().tag(sync=True, **array_serialization)
    faces = Array().tag(sync=True, **array_serialization)
    tetras = Array().tag(sync=True, **array_serialization)
    data = List(Instance(Data)).tag(sync=True, **widget_serialization)
