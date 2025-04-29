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
      catName: {
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
      progLang: {
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
