"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Course);
    }
  }
  Category.init(
    {
      cat_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Category name is required",
          },
          notEmpty: {
            msg: "Category name cannot be empty",
          },
        },
      },
      prog_lang: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Programming language is required",
          },
          notEmpty: {
            msg: "Programming language cannot be empty",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Category",
    }
  );
  return Category;
};
