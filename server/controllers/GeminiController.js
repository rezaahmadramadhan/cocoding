const { generateContent } = require("../helpers/gemini");

class GeminiController {
  static async generateQuiz(req, res, next) {
    try {
      const { topic, difficulty, numberOfQuestions = 10 } = req.body;
      
      if (!topic) {
        throw { name: "BadRequest", message: "Topic is required" };
      }
      
      const prompt = `Create a ${difficulty || 'medium'} difficulty quiz with ${numberOfQuestions || 5} multiple-choice questions about ${topic}.
      For each question, provide 4 options and indicate the correct answer.
      Format the response in a structured way that can be easily parsed.`;
      
      const quiz = await generateContent(prompt);
      
      res.status(200).json({ 
        success: true,
        data: { quiz } 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeminiController;