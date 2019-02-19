<p align="center"><img width="300" src="images/icon.PNG"></p>
<h1 align="center">Odysis</h1>
<h2 align="center"> Jupyter interactive widgets library for 3-D mesh analysis and post-processing of 3-D data </h1>

Installation
------------

With conda:

    $ conda install -c conda-forge odysis

With pip:

    $ pip install odysis
    $ jupyter nbextension enable --py --sys-prefix odysis


For a development installation (requires npm),

    $ git clone https://github.com/martinRenou/Odysis.git
    $ cd Odysis
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix odysis
    $ jupyter nbextension enable --py --sys-prefix odysis
