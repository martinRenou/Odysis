var ipyvis = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'ipyvis',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'ipyvis',
          version: ipyvis.version,
          exports: ipyvis
      });
  },
  autoStart: true
};

