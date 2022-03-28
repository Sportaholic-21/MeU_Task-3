var DataTypes = require("sequelize").DataTypes;
var _UserRoleTbl = require("./user_role_tbl");
var _UserTbl = require("./user_tbl");

function initModels(sequelize) {
  var UserRoleTbl = _UserRoleTbl(sequelize, DataTypes);
  var UserTbl = _UserTbl(sequelize, DataTypes);

  UserTbl.belongsTo(UserRoleTbl, { as: "role", foreignKey: "roleId"});
  UserRoleTbl.hasMany(UserTbl, { as: "userTbls", foreignKey: "roleId"});

  return {
    UserRoleTbl,
    UserTbl,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
