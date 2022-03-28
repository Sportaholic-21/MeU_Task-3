const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserTbl', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "user_tbl_username_key"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "user_tbl_email_key"
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_role_tbl',
        key: 'id'
      },
      field: 'role_id'
    }
  }, {
    sequelize,
    tableName: 'user_tbl',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "user_tbl_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "user_tbl_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "user_tbl_username_key",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
};
