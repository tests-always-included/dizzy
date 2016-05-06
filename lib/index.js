var DizzyProvider, path, util;

path = require("path");
util = require("./util");
DizzyProvider = require("./dizzy-provider")(path, require);
module.exports = require("./dizzy")(DizzyProvider, util);
