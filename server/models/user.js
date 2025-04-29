"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order);
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
        },
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
          len: {
            args: [5],
            msg: "Password must be at least 5 characters long",
          },
        },
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Full name is required",
          },
          notEmpty: {
            msg: "Full name cannot be empty",
          },
        },
      },
      age: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: {
            msg: "Age must be an integer",
          },
          min: {
            args: 0,
            msg: "Age must be a positive number",
          },
        },
      },
      address: DataTypes.TEXT,
      phone: {
        type: DataTypes.STRING,
        validate: {
          is: {
            args: /^[0-9]+$/,
            msg: "Phone number must contain only digits",
          },
        },
      },
      about: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
