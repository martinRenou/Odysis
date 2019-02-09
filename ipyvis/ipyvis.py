import ipywidgets as widgets
from traitlets import Unicode


@widgets.register
class Scene(widgets.DOMWidget):
    """A 3-D Scene widget."""
    _view_name = Unicode('SceneView').tag(sync=True)
    _model_name = Unicode('SceneModel').tag(sync=True)
    _view_module = Unicode('ipyvis').tag(sync=True)
    _model_module = Unicode('ipyvis').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
