"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate(models) {
      Profile.belongsTo(models.User);
      Profile.hasMany(models.Transaction);
      Profile.hasMany(models.Cart);
    }
  }
  Profile.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Name is required",
          },
          notEmpty: {
            msg: "Name cannot be empty",
          },
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Username is required",
          },
          notEmpty: {
            msg: "Username cannot be empty",
          },
        },
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Age is required",
          },
          notEmpty: {
            msg: "Age cannot be empty",
          },
          isInt: {
            msg: "Age must be an integer",
          },
          min: {
            args: 0,
            msg: "Age must be a positive number",
          },
        },
      },
      address: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 500],
            msg: "Address cannot exceed 500 characters",
          },
        },
      },
      phone: {
        type: DataTypes.STRING,
        validate: {
          is: {
            args: /^[0-9]+$/,
            msg: "Phone number must contain only digits",
          },
        },
      },
      about: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 500],
            msg: "About section cannot exceed 500 characters",
          },
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        validate: {
          notNull: {
            msg: "UserId is required",
          },
          notEmpty: {
            msg: "UserId cannot be empty",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Profile",
    }
  );
  return Profile;
};
