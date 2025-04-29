"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {
      Course.belongsTo(models.Category);
      Course.hasMany(models.OrderDetail);
      Course.hasMany(models.Review);
    }
    get priceInRupiah() {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(this.price);
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
        },
      },
      totalEnrollment: {
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
        },
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Start date is required",
          },
          notEmpty: {
            msg: "Start date cannot be empty",
          },
          isDate: {
            msg: "Start date must be a valid date",
          },
        },
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Description is required",
          },
          notEmpty: {
            msg: "Description cannot be empty",
          },
        },
      },
      courseImg: {
        type: DataTypes.STRING,
        validate: {
          isUrl: {
            msg: "Course image must be a valid URL",
          },
        },
      },
      durationHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Duration in hours is required",
          },
          notEmpty: {
            msg: "Duration in hours cannot be empty",
          },
          isInt: {
            msg: "Duration in hours must be an integer",
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
        },
      },
    },
    {
      sequelize,
      modelName: "Course",
    }
  );
  Course.beforeCreate((course) => {
    course.code = `${course.title
      .toLowerCase()
      .slice(0, 5)}_${course.startDate.replace(/-/g, "")}`;
  });
  return Course;
};
