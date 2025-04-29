const { User, Course, Category } = require("../models");
const { Op } = require("sequelize");

class CourseController {
  static async getAllCourses(req, res, next) {
    try {
      const { search, sort, filter, page = 1, limit = 10 } = req.query;
      const paramsQuery = {
        where: {},
        limit: +limit,
        offset: +limit * (page - 1),
        include: [
          {
            model: Category,
          },
        ],
      };

      if (search) {
        paramsQuery.where.title = { [Op.iLike]: `%${search}%` };
      }

      if (sort) {
        const order = sort[0] === "-" ? "DESC" : "ASC";
        const colName = order === "DESC" ? sort.slice(1) : sort;
        paramsQuery.order = [[colName, order]];
      }

      if (filter) {
        paramsQuery.where.CategoryId = filter;
      }

      const { count, rows } = await Course.findAndCountAll(paramsQuery);

      res.status(200).json({
        page: +page,
        maxPage: Math.ceil(count / +limit),
        pageData: rows.length,
        totalData: count,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCourseById(req, res, next) {
    try {
      const { id } = req.params;
      
      const course = await Course.findByPk(id, {
        include: [
          {
            model: Category,
          }
        ]
      });
      
      if (!course) {
        throw { name: "NotFound", message: "Course not found" };
      }
      
      res.status(200).json(course);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CourseController;
