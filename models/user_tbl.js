const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('UserTbl', {
    userId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id'
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
    userRoleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_role_tbl',
        key: 'user_role_id'
      },
      field: 'user_role_id'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
      field: 'created_at'
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
          { name: "user_id" },
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
