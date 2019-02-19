var odysis = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'odysis',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'odysis',
          version: odysis.version,
          exports: odysis
      });
  },
  autoStart: true
};

