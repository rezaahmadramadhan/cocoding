const { generateContent } = require("../helpers/gemini");

class GeminiController {
  static async generateCourseDescription(req, res, next) {
    try {
      const { topic, level, duration } = req.body;
      
      if (!topic) {
        throw { name: "BadRequest", message: "Topic is required" };
      }
      
      const prompt = `Create an engaging course description for a ${level || 'beginner'} level course about ${topic}.
      The course will be ${duration || '30'} hours long. 
      Include what participants will learn and why this course is valuable.
      Format the response to be professional and compelling for a course catalog.`;
      
      const description = await generateContent(prompt);
      
      res.status(200).json({ 
        success: true,
        data: { description } 
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async generateStudyPlan(req, res, next) {
    try {
      const { courseId, weeks } = req.body;
      
      if (!courseId) {
        throw { name: "BadRequest", message: "Course ID is required" };
      }
      
      // You could fetch the course details here to personalize the study plan
      // const course = await Course.findByPk(courseId);
      
      const prompt = `Create a detailed ${weeks || 4}-week study plan for a coding course.
      Break it down by week, with specific topics to cover each day.
      Include recommended practice exercises and projects.
      Format the response in a clear, structured way that's easy to follow.`;
      
      const studyPlan = await generateContent(prompt);
      
      res.status(200).json({ 
        success: true,
        data: { studyPlan },
        courseId
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async answerQuestion(req, res, next) {
    try {
      const { question, courseId } = req.body;
      
      if (!question) {
        throw { name: "BadRequest", message: "Question is required" };
      }
      
      // You could use the courseId to fetch course context and provide more relevant answers
      
      const prompt = `Answer the following programming or course-related question as a helpful coding instructor:
      
      ${question}
      
      Provide a clear, concise, and accurate response with code examples if appropriate.`;
      
      const answer = await generateContent(prompt);
      
      res.status(200).json({ 
        success: true,
        data: { question, answer } 
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async generateQuiz(req, res, next) {
    try {
      const { topic, difficulty, numberOfQuestions } = req.body;
      
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