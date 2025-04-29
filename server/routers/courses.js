const express = require("express");
const CourseController = require("../controllers/CourseController");
const router = express.Router();

router.get("/", CourseController.getAllCourses);
router.get("/:id", CourseController.getCourseById);

module.exports = router;
