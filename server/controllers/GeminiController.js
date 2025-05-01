const { generateContent } = require("../helpers/gemini");

class GeminiController {
  static async generateQuiz(req, res, next) {
    try {
      const { topic, difficulty = 'medium', numberOfQuestions = 5 } = req.body;
      
      if (!topic) {
        throw { name: "BadRequest", message: "Topic is required" };
      }
      
      // Validate difficulty level
      const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
      const selectedDifficulty = validDifficulties.includes(difficulty.toLowerCase()) 
        ? difficulty.toLowerCase() 
        : 'medium';

      // Validate number of questions (between 1 and 20)
      const questionsCount = Math.min(Math.max(1, numberOfQuestions), 20);
      
      const prompt = `Create a ${selectedDifficulty} difficulty quiz with ${questionsCount} multiple-choice questions about ${topic}.
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
        const quizForUser = quizData.map((q, index) => ({
          id: index, // Use index as ID for easier reference
          question: q.question,
          options: q.options,
        }));
        
        // Save the full quiz with answers for later verification
        // In production, store this securely in a database or session
        req.app.locals.quizzes = req.app.locals.quizzes || {};
        const quizId = Date.now().toString();
        req.app.locals.quizzes[quizId] = quizData;
        
        // Add expiration after 30 minutes
        setTimeout(() => {
          if (req.app.locals.quizzes && req.app.locals.quizzes[quizId]) {
            delete req.app.locals.quizzes[quizId];
            console.log(`Quiz ${quizId} expired and removed from memory`);
          }
        }, 30 * 60 * 1000);
        
        res.status(200).json({ 
          success: true,
          message: "Quiz generated successfully",
          data: { 
            quizId,
            topic,
            difficulty: selectedDifficulty,
            questionCount: quizData.length,
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
      const { quizId, answers } = req.body || {};
      
      if (!quizId || !answers) {
        throw { name: "BadRequest", message: "Quiz ID and answers are required" };
      }
      
      // Ensure answers is an array
      const userAnswers = Array.isArray(answers) ? answers : [answers];
      
      // Retrieve the stored quiz
      const storedQuizzes = req.app.locals.quizzes || {};
      const quizData = storedQuizzes[quizId];
      
      if (!quizData) {
        throw { name: "NotFound", message: "Quiz not found. It may have expired or been completed already." };
      }
      
      // Calculate the score and provide detailed feedback
      let correctCount = 0;
      const results = userAnswers.map((userAnswer, index) => {
        if (index >= quizData.length) {
          return { valid: false, message: "Question does not exist" };
        }
        
        const question = quizData[index];
        const isCorrect = userAnswer.toUpperCase() === question.correctAnswer.toUpperCase();
        
        if (isCorrect) {
          correctCount++;
        }
        
        return {
          questionId: index,
          question: question.question,
          userAnswer,
          isCorrect,
          correctAnswer: question.correctAnswer,
          correctOption: question.options[question.correctAnswer],
          explanation: question.explanation
        };
      });
      
      const score = (correctCount / quizData.length) * 100;
      
      // Generate performance message based on score
      let performanceMessage = "";
      if (score >= 90) {
        performanceMessage = "Excellent! You've mastered this topic.";
      } else if (score >= 70) {
        performanceMessage = "Very good! You have a solid understanding of this topic.";
      } else if (score >= 50) {
        performanceMessage = "Good effort! Review the explanations to improve your understanding.";
      } else {
        performanceMessage = "Keep practicing! Review the explanations to strengthen your knowledge.";
      }
      
      res.status(200).json({
        success: true,
        message: "Quiz answers checked successfully",
        data: {
          score: score.toFixed(1),
          correctCount,
          totalQuestions: quizData.length,
          performanceMessage,
          results,
          answeredAll: userAnswers.length === quizData.length
        }
      });
      
      // Optionally, keep the quiz in memory in case the user wants to review it again
      // Set a longer timeout for cleanup after checking (additional 15 minutes)
      setTimeout(() => {
        if (req.app.locals.quizzes && req.app.locals.quizzes[quizId]) {
          delete req.app.locals.quizzes[quizId];
          console.log(`Quiz ${quizId} completed and removed from memory after review period`);
        }
      }, 15 * 60 * 1000);
      
    } catch (error) {
      next(error);
    }
  }

  static async getHint(req, res, next) {
    try {
      const { quizId, questionIndex } = req.body;
      
      if (!quizId || questionIndex === undefined) {
        throw { name: "BadRequest", message: "Quiz ID and question index are required" };
      }
      
      // Retrieve the stored quiz
      const storedQuizzes = req.app.locals.quizzes || {};
      const quizData = storedQuizzes[quizId];
      
      if (!quizData) {
        throw { name: "NotFound", message: "Quiz not found. It may have expired." };
      }
      
      if (questionIndex >= quizData.length || questionIndex < 0) {
        throw { name: "BadRequest", message: "Invalid question index." };
      }
      
      const question = quizData[questionIndex];
      
      // Generate a hint based on the correct answer but without giving it away
      const hint = await generateContent(`
        I need a hint for this question without revealing the answer directly:
        Question: ${question.question}
        Options:
        A: ${question.options.A}
        B: ${question.options.B}
        C: ${question.options.C}
        D: ${question.options.D}
        
        The correct answer is ${question.correctAnswer}: ${question.options[question.correctAnswer]}.
        
        Please provide a subtle hint that guides the user towards the correct answer without explicitly stating it. 
        The hint should be one or two sentences maximum.
      `);
      
      res.status(200).json({
        success: true,
        data: {
          questionIndex,
          question: question.question,
          hint
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GeminiController;