from ._version import version_info, __version__

from .ipyvis import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'ipyvis',
        'require': 'ipyvis/extension'
    }]
