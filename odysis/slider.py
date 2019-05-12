from traitlets import Unicode, CFloat, CaselessStrEnum, Bool

from ipywidgets import widget_serialization
from ipywidgets import FloatRangeSlider as _FloatRangeSlider
from ipywidgets.widgets.trait_types import NumberFormat, InstanceDict
from ipywidgets.widgets.widget_int import SliderStyle

odysis_version = '^0.1.0'


class FloatRangeSlider(_FloatRangeSlider.__base__):
    """ This is a fixed slider widget implementation, allowing values lower
    than 10^-6. This class should be removed at some point, when the slider
    implementation is fixed in ipywidgets. """
    _view_name = Unicode('FixedFloatRangeSliderView').tag(sync=True)
    _model_name = Unicode('FixedFloatRangeSliderModel').tag(sync=True)
    _view_module = Unicode('odysis').tag(sync=True)
    _model_module = Unicode('odysis').tag(sync=True)
    _view_module_version = Unicode(odysis_version).tag(sync=True)
    _model_module_version = Unicode(odysis_version).tag(sync=True)

    step = CFloat(0.01, help="Minimum step to increment the value").tag(sync=True)
    orientation = CaselessStrEnum(
        values=['horizontal', 'vertical'],
        default_value='horizontal', help="Vertical or horizontal.").tag(sync=True)
    readout = Bool(True, help="Display the current value of the slider next to it.").tag(sync=True)
    readout_format = NumberFormat(
        '.2e', help="Format for the readout").tag(sync=True)
    continuous_update = Bool(True, help="Update the value of the widget as the user is sliding the slider.").tag(sync=True)
    disabled = Bool(False, help="Enable or disable user changes").tag(sync=True)

    style = InstanceDict(SliderStyle).tag(sync=True, **widget_serialization)
