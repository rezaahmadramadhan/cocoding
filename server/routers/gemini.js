const express = require("express");
const GeminiController = require("../controllers/GeminiController");
const router = express.Router();

router.post("/generate-quiz", GeminiController.generateQuiz);
router.post("/check-answers", GeminiController.checkAnswers);
router.post("/get-hint", GeminiController.getHint);

module.exports = router;