from ._version import version_info, __version__

from .odysis import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'odysis',
        'require': 'odysis/extension'
    }]
