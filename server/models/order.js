"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User);
      Order.hasMany(models.OrderDetail);
    }
  }
  Order.init(
    {
      orderAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Order date is required",
          },
          notEmpty: {
            msg: "Order date cannot be empty",
          },
        },
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Payment method is required",
          },
          notEmpty: {
            msg: "Payment method cannot be empty",
          },
        },
      },
      paymentStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
        validate: {
          notNull: {
            msg: "Payment status is required",
          },
          notEmpty: {
            msg: "Payment status cannot be empty",
          },
        },
      },
      totalPrice: {
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
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        validate: {
          notNull: {
            msg: "User ID is required",
          },
          notEmpty: {
            msg: "User ID cannot be empty",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Order",
    }
  );
  return Order;
};
