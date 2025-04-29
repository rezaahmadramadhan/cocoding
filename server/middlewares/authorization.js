const { Course } = require("../models");

function onlyAdmin(req, res, next) {
  try {
    if (req.user.role !== "Admin")
      throw { name: "Forbidden", message: "You're not authorized" };

    next();
  } catch (error) {
    next(error);
  }
}

async function onlyAuthor(req, res, next) {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(+id);

    if (!course)
      throw { name: "NotFound", message: `Course with ${id} not found` };

    if (req.user.id !== course.authorId)
      throw { name: "Forbidden", message: "You're not authorized" };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { onlyAdmin, onlyAuthor };
