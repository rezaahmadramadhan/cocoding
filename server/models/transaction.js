"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Profile);
    }
  }
  Transaction.init(
    {
      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Total amount is required",
          },
          notEmpty: {
            msg: "Total amount cannot be empty",
          },
          isInt: {
            msg: "Total amount must be an integer",
          },          min: {
            args: 0,
            msg: "Total amount must be greater than or equal to 0",
          },
        }
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Payment method is required",
          },
          notEmpty: {
            msg: "Payment method cannot be empty",
          },
        }
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
        }
      },
      transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Transaction date is required",
          },
          notEmpty: {
            msg: "Transaction date cannot be empty",
          },
          isDate: {
            msg: "Transaction date must be a valid date",
          },
        }
      },
      items: {
        type: DataTypes.VARCHAR,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Items are required",
          },
          notEmpty: {
            msg: "Items cannot be empty",
          },
        }
      },
    },
    {
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
