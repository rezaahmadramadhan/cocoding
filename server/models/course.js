"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      Course.belongsTo(models.Category);
      Course.hasMany(models.Cart);
      Course.hasMany(models.Review);
    }
  }
  Course.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Title is required",
          },
          notEmpty: {
            msg: "Title cannot be empty",
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
          min: {
            args: 0,
            msg: "Price must be a positive number",
          },
        },
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Rating is required",
          },
          notEmpty: {
            msg: "Rating cannot be empty",
          },
          isFloat: {
            msg: "Rating must be a float",
          },
          min: {
            args: 0,
            msg: "Rating must be a positive number",
          },
        },
      },
      total_enrollment: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Total enrollment is required",
          },
          notEmpty: {
            msg: "Total enrollment cannot be empty",
          },
          isInt: {
            msg: "Total enrollment must be an integer",
          },
          min: {
            args: 0,
            msg: "Total enrollment must be a positive number",
          },
        },
      },
      desc: {
        type: DataTypes.TEXT,
        validate: {
          len: {
            args: [0, 1000],
            msg: "Description cannot exceed 1000 characters",
          },
        },
      },
      course_img: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: "Course image must be a valid URL",
          },
        },
      },
      duration_hours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Duration hours is required",
          },
          notEmpty: {
            msg: "Duration hours cannot be empty",
          },
          isInt: {
            msg: "Duration hours must be an integer",
          },
          min: {
            args: 0,
            msg: "Duration hours must be a positive number",
          },
        },
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Code is required",
          },
          notEmpty: {
            msg: "Code cannot be empty",
          },
        },
      },
      CategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        validate: {
          notNull: {
            msg: "Category ID is required",
          },
          notEmpty: {
            msg: "Category ID cannot be empty",
          },
          isInt: {
            msg: "Category ID must be an integer",
          },
          min: {
            args: 1,
            msg: "Category ID must be a positive number",
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Course",
    }
  );
  return Course;
};
