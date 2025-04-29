"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsTo(models.Profile);
      Cart.belongsTo(models.Course);
    }
  }
  Cart.init(
    {
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Quantity is required",
          },
          notEmpty: {
            msg: "Quantity cannot be empty",
          },
          isInt: {
            msg: "Quantity must be an integer",
          },
        },
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Price is required",
          },
          notEmpty: {
            msg: "Price cannot be empty",
          },
          isInt: {
            msg: "Price must be an integer",
          },
        },
      },
      total_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Total price is required",
          },
          notEmpty: {
            msg: "Total price cannot be empty",
          },
          isInt: {
            msg: "Total price must be an integer",
          },
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Status is required",
          },
          notEmpty: {
            msg: "Status cannot be empty",
          },
        },
      },
      CourseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Courses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        validate: {
          notNull: {
            msg: "Course ID is required",
          },
          notEmpty: {
            msg: "Course ID cannot be empty",
          },
          isInt: {
            msg: "Course ID must be an integer",
          },
        },
      },
      ProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Profiles",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        validate: {
          notNull: {
            msg: "Profile ID is required",
          },
          notEmpty: {
            msg: "Profile ID cannot be empty",
          },
          isInt: {
            msg: "Profile ID must be an integer",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Cart",
    }
  );
  return Cart;
};
