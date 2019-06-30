from IPython.display import display

from .odysis import (
    Scene, DataBlock,
    Warp,
    ColorMapping, Grid,
    VectorField, PointCloud,
    Clip, Slice,
    Threshold, IsoSurface
)


_current_scene = None
_current_datablock = None


def scene(mesh):
    global _current_scene
    global _current_datablock

    _current_datablock = DataBlock(mesh=mesh)
    _current_scene = Scene(datablocks=[_current_datablock])

    return _current_scene


def color_mapping(**kwargs):
    global _current_datablock

    effect = ColorMapping(**kwargs)
    _current_datablock.apply(effect)
    return effect


def grid(**kwargs):
    global _current_datablock

    effect = Grid(**kwargs)
    _current_datablock.apply(effect)
    return effect


def warp(**kwargs):
    global _current_datablock

    effect = Warp(**kwargs)
    _current_datablock.apply(effect)
    return effect


def vector_field(**kwargs):
    global _current_datablock

    effect = VectorField(**kwargs)
    _current_datablock.apply(effect)
    return effect


def point_cloud(**kwargs):
    global _current_datablock

    effect = PointCloud(**kwargs)
    _current_datablock.apply(effect)
    return effect


def clip(**kwargs):
    global _current_datablock

    effect = Clip(**kwargs)
    _current_datablock.apply(effect)
    return effect


def slice(**kwargs):
    global _current_datablock

    effect = Slice(**kwargs)
    _current_datablock.apply(effect)
    return effect


def threshold(**kwargs):
    global _current_datablock

    effect = Threshold(**kwargs)
    _current_datablock.apply(effect)
    return effect


def iso_surface(**kwargs):
    global _current_datablock

    effect = IsoSurface(**kwargs)
    _current_datablock.apply(effect)
    return effect


def plot():
    global _current_scene

    display(_current_scene)

def get_current_scene():
    global _current_scene

    return _current_scene
