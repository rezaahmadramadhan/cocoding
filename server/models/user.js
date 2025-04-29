"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Profile);
    }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: "Email already in use",
        },
        validate: {
          notNull: {
            msg: "Email is required",
          },
          notEmpty: {
            msg: "Email cannot be empty",
          },
          isEmail: {
            msg: "Invalid email format",
          },
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Password is required",
          },
          notEmpty: {
            msg: "Password cannot be empty",
          },
        }
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "Staff",
        validate: {
          isIn: {
            args: [["Staff", "Admin"]],
            msg: "Role must be either 'Staff' or 'Admin'",
          },
        }
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
