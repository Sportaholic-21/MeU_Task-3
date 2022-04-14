const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserRoleTbl', {
    userRoleId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_role_id'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_role_type_tbl',
        key: 'role_id'
      },
      field: 'role_id'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'user_role_tbl',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_role_tbl_pkey",
        unique: true,
        fields: [
          { name: "user_role_id" },
        ]
      },
    ]
  });
};
