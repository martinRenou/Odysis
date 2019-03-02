from IPython.display import display

from .odysis import Scene, Warp, VectorField, Clip, Threshold


_current_scene = None
_current_mesh = None


def scene(**kwargs):
    global _current_scene
    global _current_mesh

    _current_mesh = kwargs.get('mesh')
    _current_scene = Scene(**kwargs)

    return _current_scene


def warp(**kwargs):
    global _current_mesh

    effect = Warp(**kwargs)
    _current_mesh.apply(effect)
    return effect


def vector_field(**kwargs):
    global _current_mesh

    effect = VectorField(**kwargs)
    _current_mesh.apply(effect)
    return effect


def points(**kwargs):
    global _current_mesh

    raise RuntimeError('Points effect not implemented yet')


def clip(**kwargs):
    global _current_mesh

    effect = Clip(**kwargs)
    _current_mesh.apply(effect)
    return effect


def slice(**kwargs):
    global _current_mesh

    raise RuntimeError('Slice effect not implemented yet')


def threshold(**kwargs):
    global _current_mesh

    effect = Threshold(**kwargs)
    _current_mesh.apply(effect)
    return effect


def iso_surface(**kwargs):
    global _current_mesh
    raise RuntimeError('IsoSurface effect not implemented yet')


def plot():
    global _current_scene

    display(_current_scene)
