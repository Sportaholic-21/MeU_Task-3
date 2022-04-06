const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserRoleTbl', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user_tbl',
        key: 'user_id'
      },
      field: 'user_id'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user_role_type_tbl',
        key: 'role_id'
      },
      field: 'role_id'
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
          { name: "user_id" },
          { name: "role_id" },
        ]
      },
    ]
  });
};
