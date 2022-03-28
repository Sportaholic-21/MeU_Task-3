const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserRoleTbl', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: "user_role_tbl_role_key"
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
          { name: "id" },
        ]
      },
      {
        name: "user_role_tbl_role_key",
        unique: true,
        fields: [
          { name: "role" },
        ]
      },
    ]
  });
};
