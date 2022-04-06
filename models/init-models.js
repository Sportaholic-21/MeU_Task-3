var DataTypes = require("sequelize").DataTypes;
var _UserRoleTbl = require("./user_role_tbl");
var _UserRoleTypeTbl = require("./user_role_type_tbl");
var _UserTbl = require("./user_tbl");

function initModels(sequelize) {
  var UserRoleTbl = _UserRoleTbl(sequelize, DataTypes);
  var UserRoleTypeTbl = _UserRoleTypeTbl(sequelize, DataTypes);
  var UserTbl = _UserTbl(sequelize, DataTypes);

  UserRoleTypeTbl.belongsToMany(UserTbl, { as: 'userIdUserTbls', through: UserRoleTbl, foreignKey: "roleId", otherKey: "userId" });
  UserTbl.belongsToMany(UserRoleTypeTbl, { as: 'roleIdUserRoleTypeTbls', through: UserRoleTbl, foreignKey: "userId", otherKey: "roleId" });
  UserRoleTbl.belongsTo(UserRoleTypeTbl, { as: "role", foreignKey: "roleId"});
  UserRoleTypeTbl.hasMany(UserRoleTbl, { as: "userRoleTbls", foreignKey: "roleId"});
  UserRoleTbl.belongsTo(UserTbl, { as: "user", foreignKey: "userId"});
  UserTbl.hasMany(UserRoleTbl, { as: "userRoleTbls", foreignKey: "userId"});

  return {
    UserRoleTbl,
    UserRoleTypeTbl,
    UserTbl,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
