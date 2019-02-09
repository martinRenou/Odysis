// Export widget models and views, and the npm package version number.
module.exports = require('./src/ipyvis.js');
module.exports['version'] = require('../package.json').version;
