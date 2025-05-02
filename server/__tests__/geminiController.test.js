const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const GeminiController = require('../controllers/GeminiController');
const { generateContent } = require('../helpers/gemini');

// Mock the dependencies
jest.mock('../helpers/gemini', () => ({
  generateContent: jest.fn()
}));

describe('GeminiController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      app: {
        locals: {
          quizzes: {}
        }
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('generateQuiz', () => {
    it('should return 400 if topic is missing', async () => {
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Topic is required'
      }));
    });
    
    it('should return 400 if topic is not programming-related', async () => {
      // Arrange
      req.body = {
        topic: 'cooking recipes' // Not in programming topics list
      };
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Sorry, quizzes can only be generated for programming-related topics.'
      }));
    });
    
    it('should use default values for difficulty and number of questions', async () => {
      // Arrange
      req.body = {
        topic: 'javascript'
      };
      
      // Mock successful quiz generation
      const mockQuizData = [
        {
          question: 'What is JavaScript?',
          options: {
            A: 'A programming language',
            B: 'A markup language',
            C: 'A database',
            D: 'An operating system'
          },
          correctAnswer: 'A',
          explanation: 'JavaScript is a programming language.'
        }
      ];
      
      generateContent.mockResolvedValue(JSON.stringify(mockQuizData));
      jest.useFakeTimers();
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('medium'));
      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('5'));
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should validate and use provided difficulty and question count', async () => {
      // Arrange
      req.body = {
        topic: 'javascript',
        difficulty: 'hard',
        numberOfQuestions: 10
      };
      
      const mockQuizData = [
        {
          question: 'What is event delegation in JavaScript?',
          options: {
            A: 'Option A',
            B: 'Option B',
            C: 'Option C',
            D: 'Option D'
          },
          correctAnswer: 'A',
          explanation: 'Explanation here'
        }
      ];
      
      generateContent.mockResolvedValue(JSON.stringify(mockQuizData));
      jest.useFakeTimers();
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('hard'));
      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('10'));
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should limit too large numberOfQuestions to 20', async () => {
      // Arrange
      req.body = {
        topic: 'javascript',
        numberOfQuestions: 50 // More than the max of 20
      };
      
      const mockQuizData = [
        {
          question: 'Sample Question',
          options: {
            A: 'Option A',
            B: 'Option B',
            C: 'Option C',
            D: 'Option D'
          },
          correctAnswer: 'A',
          explanation: 'Explanation'
        }
      ];
      
      generateContent.mockResolvedValue(JSON.stringify(mockQuizData));
      jest.useFakeTimers();
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(generateContent).toHaveBeenCalledWith(expect.stringContaining('20'));
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should handle invalid JSON response from generateContent', async () => {
      // Arrange
      req.body = {
        topic: 'javascript'
      };
      
      generateContent.mockResolvedValue('This is not valid JSON');
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('Failed to generate')
      }));
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      req.body = {
        topic: 'javascript'
      };
      
      const error = new Error('API error');
      generateContent.mockRejectedValue(error);
      
      // Act
      await GeminiController.generateQuiz(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('checkAnswers', () => {
    const mockQuizData = [
      {
        question: 'What is JavaScript?',
        options: {
          A: 'A programming language',
          B: 'A markup language',
          C: 'A database',
          D: 'An operating system'
        },
        correctAnswer: 'A',
        explanation: 'JavaScript is a programming language.'
      },
      {
        question: 'Which is not a JavaScript framework?',
        options: {
          A: 'React',
          B: 'Vue',
          C: 'Angular',
          D: 'Flask'
        },
        correctAnswer: 'D',
        explanation: 'Flask is a Python framework.'
      }
    ];
    
    it('should throw BadRequest error if quizId or answers are missing', async () => {
      // Act
      await GeminiController.checkAnswers(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest'
      }));
    });
    
    it('should throw NotFound error if quiz does not exist', async () => {
      // Arrange
      req.body = {
        quizId: 'non-existent-quiz',
        answers: ['A', 'D']
      };
      
      // Act
      await GeminiController.checkAnswers(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound'
      }));
    });
    
    it('should correctly grade answers and calculate score', async () => {
      // Arrange
      const quizId = 'test-quiz-123';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        answers: ['A', 'D'] // All correct answers
      };
      
      jest.useFakeTimers();
      
      // Act
      await GeminiController.checkAnswers(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          score: '100.0',
          correctCount: 2,
          totalQuestions: 2
        })
      }));
    });
    
    it('should handle partially correct answers', async () => {
      // Arrange
      const quizId = 'test-quiz-456';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        answers: ['A', 'B'] // First correct, second wrong
      };
      
      jest.useFakeTimers();
      
      // Act
      await GeminiController.checkAnswers(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          score: '50.0',
          correctCount: 1,
          totalQuestions: 2
        })
      }));
    });
    
    it('should handle answers provided as objects with questionId', async () => {
      // Arrange
      const quizId = 'test-quiz-789';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        answers: [
          { questionId: 0, answer: 'A' },
          { questionId: 1, answer: 'D' }
        ]
      };
      
      jest.useFakeTimers();
      
      // Act
      await GeminiController.checkAnswers(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          score: '100.0'
        })
      }));
    });
  });
  
  describe('getHint', () => {
    const mockQuizData = [
      {
        question: 'What is JavaScript?',
        options: {
          A: 'A programming language',
          B: 'A markup language',
          C: 'A database',
          D: 'An operating system'
        },
        correctAnswer: 'A',
        explanation: 'JavaScript is a programming language.'
      }
    ];
    
    it('should throw BadRequest error if quizId or questionIndex are missing', async () => {
      // Act
      await GeminiController.getHint(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest'
      }));
    });
    
    it('should throw NotFound error if quiz does not exist', async () => {
      // Arrange
      req.body = {
        quizId: 'non-existent-quiz',
        questionIndex: 0
      };
      
      // Act
      await GeminiController.getHint(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound'
      }));
    });
    
    it('should throw BadRequest error if questionIndex is invalid', async () => {
      // Arrange
      const quizId = 'test-quiz-hint';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        questionIndex: 10 // Out of bounds
      };
      
      // Act
      await GeminiController.getHint(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest',
        message: expect.stringContaining('Invalid question index')
      }));
    });
    
    it('should generate and return a hint', async () => {
      // Arrange
      const quizId = 'test-quiz-hint';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        questionIndex: 0
      };
      
      const mockHint = 'This language runs in web browsers.';
      generateContent.mockResolvedValue(mockHint);
      
      // Act
      await GeminiController.getHint(req, res, next);
      
      // Assert
      expect(generateContent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          questionIndex: 0,
          hint: mockHint
        })
      }));
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const quizId = 'test-quiz-hint';
      req.app.locals.quizzes[quizId] = mockQuizData;
      
      req.body = {
        quizId,
        questionIndex: 0
      };
      
      const error = new Error('API error');
      generateContent.mockRejectedValue(error);
      
      // Act
      await GeminiController.getHint(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});