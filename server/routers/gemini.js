const express = require("express");
const GeminiController = require("../controllers/GeminiController");
const router = express.Router();

router.post("/generate-description", GeminiController.generateCourseDescription);
router.post("/generate-study-plan", GeminiController.generateStudyPlan);
router.post("/answer-question", GeminiController.answerQuestion);
router.post("/generate-quiz", GeminiController.generateQuiz);

module.exports = router;