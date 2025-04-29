const express = require("express");
const GeminiController = require("../controllers/GeminiController");
const router = express.Router();

router.post("/generate-quiz", GeminiController.generateQuiz);

module.exports = router;