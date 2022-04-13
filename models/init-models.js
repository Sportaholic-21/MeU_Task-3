var DataTypes = require("sequelize").DataTypes;
var _UserRoleTbl = require("./user_role_tbl");
var _UserRoleTypeTbl = require("./user_role_type_tbl");
var _UserTbl = require("./user_tbl");

function initModels(sequelize) {
  var UserRoleTbl = _UserRoleTbl(sequelize, DataTypes);
  var UserRoleTypeTbl = _UserRoleTypeTbl(sequelize, DataTypes);
  var UserTbl = _UserTbl(sequelize, DataTypes);

  UserTbl.belongsTo(UserRoleTbl, { as: "userRole", foreignKey: "userRoleId"});
  UserRoleTbl.hasMany(UserTbl, { as: "userTbls", foreignKey: "userRoleId"});
  UserRoleTbl.belongsTo(UserRoleTypeTbl, { as: "role", foreignKey: "roleId"});
  UserRoleTypeTbl.hasMany(UserRoleTbl, { as: "userRoleTbls", foreignKey: "roleId"});

  return {
    UserRoleTbl,
    UserRoleTypeTbl,
    UserTbl,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
