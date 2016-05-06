var DizzyProvider, util;

util = require("./util");
DizzyProvider = require("./dizzy-provider")();
module.exports = require("./dizzy")(DizzyProvider, util);
