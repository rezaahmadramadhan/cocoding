const { generateContent } = require("../helpers/gemini");

class GeminiController {
  static async generateQuiz(req, res, next) {
    try {
      const { topic, difficulty, numberOfQuestions = 10 } = req.body;
      
      if (!topic) {
        throw { name: "BadRequest", message: "Topic is required" };
      }
      
      const prompt = `Create a ${difficulty || 'medium'} difficulty quiz with ${numberOfQuestions} multiple-choice questions about ${topic}.
      For each question, provide 4 options (labeled A, B, C, D) and indicate the correct answer.
      Format your response as a valid JSON array with this structure:
      [
        {
          "question": "Question text here?",
          "options": {
            "A": "First option",
            "B": "Second option",
            "C": "Third option",
            "D": "Fourth option"
          },
          "correctAnswer": "A",
          "explanation": "Brief explanation why this is the correct answer"
        }
      ]
      Make sure the response is valid JSON with no additional text before or after.`;
      
      const quizResponse = await generateContent(prompt);
      
      // Parse the response to ensure it's valid JSON
      let quizData;
      try {
        quizData = JSON.parse(quizResponse);
        
        // Validate the structure
        if (!Array.isArray(quizData)) {
          throw new Error("Response is not an array");
        }
        
        // Store the quiz data in a session or database if needed
        // For now, we'll just return it with the correct answers removed
        const quizForUser = quizData.map(q => ({
          question: q.question,
          options: q.options,
          id: Math.random().toString(36).substring(2, 15) // simple ID for reference
        }));
        
        // Save the full quiz with answers for later verification
        // In production, store this securely in a database or session
        req.app.locals.quizzes = req.app.locals.quizzes || {};
        const quizId = Date.now().toString();
        req.app.locals.quizzes[quizId] = quizData;
        
        res.status(200).json({ 
          success: true,
          data: { 
            quizId,
            quiz: quizForUser 
          } 
        });
      } catch (error) {
        console.error("Failed to parse quiz:", error);
        res.status(500).json({
          success: false,
          message: "Failed to generate a properly formatted quiz. Please try again."
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async checkAnswers(req, res, next) {
    try {
      // Log the request body to help diagnose issues
      console.log('Request body:', req.body);
      
      // Check if req.body exists
      if (!req.body) {
        throw { name: "BadRequest", message: "Request body is missing. Make sure to send JSON data with Content-Type: application/json" };
      }
      
      const { quizId, answers } = req.body || {};
      
      if (!quizId || !answers || !Array.isArray(answers)) {
        throw { name: "BadRequest", message: "Quiz ID and answers array are required" };
      }
      
      // Retrieve the stored quiz
      const storedQuizzes = req.app.locals.quizzes || {};
      const quizData = storedQuizzes[quizId];
      
      if (!quizData) {
        throw { name: "NotFound", message: "Quiz not found. It may have expired." };
      }
      
      // Calculate the score and provide feedback
      let correctCount = 0;
      const results = answers.map((userAnswer, index) => {
        if (index >= quizData.length) {
          return { valid: false, message: "Question does not exist" };
        }
        
        const question = quizData[index];
        const isCorrect = userAnswer.toUpperCase() === question.correctAnswer.toUpperCase();
        
        if (isCorrect) {
          correctCount++;
        }
        
        return {
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        };
      });
      
      const score = (correctCount / quizData.length) * 100;
      
      res.status(200).json({
        success: true,
        data: {
          score: score.toFixed(2),
          correctCount,
          totalQuestions: quizData.length,
          results
        }
      });
      
      // Optionally, remove the quiz from storage after checking
      // delete req.app.locals.quizzes[quizId];
      
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeminiController;