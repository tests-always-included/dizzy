'use strict';

var BulkProvider, DizzyProvider, path, util;

path = require('path');
util = require('./util');
BulkProvider = require('./bulk-provider')();
DizzyProvider = require('./dizzy-provider')(path, require);
module.exports = require('./dizzy')(BulkProvider, DizzyProvider, util);
module.exports.BulkProvider = BulkProvider;
module.exports.DizzyProvider = DizzyProvider;
