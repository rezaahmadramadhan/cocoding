const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { hashPassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const geminiHelper = require('../helpers/gemini');
const { GoogleGenerativeAI } = require("@google/generative-ai");

let access_token;
let userId;

// Mock the Gemini API helper
jest.mock('../helpers/gemini', () => {
  const original = jest.requireActual('../helpers/gemini');
  return {
    ...original,
    generateContent: jest.fn(),
    initGemini: jest.fn(),
    getGeminiModel: jest.fn()
  };
});

// Mock the GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: jest.fn().mockImplementation(() => {
              return {
                response: {
                  text: jest.fn().mockReturnValue('Mocked generated content')
                }
              };
            })
          };
        })
      };
    })
  };
});

beforeAll(async () => {
  // Clean up existing data
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
  
  // Create test user
  const testUser = await User.create({
    fullName: 'Gemini Test User',
    email: 'geminitest@example.com',
    password: 'password123',
    role: 'customer'
  });
  
  userId = testUser.id;
  access_token = signToken({ id: userId });
});

afterAll(async () => {
  await User.destroy({ truncate: true, cascade: true, restartIdentity: true });
});

describe('Gemini Helper Functions', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'fake-api-key' };
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('initGemini', () => {
    it('should initialize Gemini with API key', () => {
      // Set a fake API key
      process.env.GEMINI_API_KEY = 'fake-api-key';
      
      // Call the actual function
      const actualInitGemini = jest.requireActual('../helpers/gemini').initGemini;
      const genAI = actualInitGemini();
      
      // Verify it was initialized with the API key
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('fake-api-key');
    });
    
    it('should throw an error if API key is not set', () => {
      // Ensure API key is not set
      delete process.env.GEMINI_API_KEY;
      
      // Call the actual function and expect it to throw
      const actualInitGemini = jest.requireActual('../helpers/gemini').initGemini;
      expect(() => actualInitGemini()).toThrow('GEMINI_API_KEY is not set in the environment variables');
    });
  });
  
  describe('getGeminiModel', () => {
    it('should get model with default name if not provided', () => {
      // Set a fake API key
      process.env.GEMINI_API_KEY = 'fake-api-key';
      
      // Reset the mock implementation for this test
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue('mocked-model-instance')
      }));
      
      // Call the actual function
      const actualGetGeminiModel = jest.requireActual('../helpers/gemini').getGeminiModel;
      const model = actualGetGeminiModel();
      
      // Get the most recent instance
      const mockGenAI = GoogleGenerativeAI.mock.results[0].value;
      
      // Verify it used the default model name
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-pro' });
    });
    
    it('should get model with provided name', () => {
      // Set a fake API key
      process.env.GEMINI_API_KEY = 'fake-api-key';
      
      // Reset the mock implementation for this test
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue('mocked-model-instance')
      }));
      
      // Call the actual function with a custom model name
      const actualGetGeminiModel = jest.requireActual('../helpers/gemini').getGeminiModel;
      const model = actualGetGeminiModel('custom-model');
      
      // Get the most recent instance
      const mockGenAI = GoogleGenerativeAI.mock.results[0].value;
      
      // Verify it used the provided model name
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'custom-model' });
    });
  });
  
  describe('generateContent', () => {
    it('should generate content successfully', async () => {
      // Set up the mocks
      const mockText = jest.fn().mockReturnValue('Generated test content');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: { text: mockText }
      });
      
      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel
      }));
      
      // Call the actual function
      const actualGenerateContent = jest.requireActual('../helpers/gemini').generateContent;
      const result = await actualGenerateContent('Test prompt');
      
      // Verify results
      expect(result).toBe('Generated test content');
      expect(mockGenerateContent).toHaveBeenCalledWith('Test prompt');
    });
    
    it('should handle errors properly', async () => {
      // Create a spy on console.error to prevent actual logging during test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock the API to throw an error
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API error'));
      
      const mockGetGenerativeModel = jest.fn().mockReturnValue({
        generateContent: mockGenerateContent
      });
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel
      }));
      
      // Call the actual function and expect it to throw
      const actualGenerateContent = jest.requireActual('../helpers/gemini').generateContent;
      
      await expect(actualGenerateContent('Test prompt')).rejects.toThrow('API error');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled();
      
      // Restore console.error
      console.error.mockRestore();
    });
  });
});

describe('Gemini API', () => {
  describe('POST /gemini/generate-quiz', () => {
    beforeEach(() => {
      // Reset mock before each test
      geminiHelper.generateContent.mockReset();
    });

    it('should generate a quiz when authenticated', async () => {
      // Mock the Gemini API response
      const mockQuizContent = `
1. What is JavaScript?
A) A programming language
B) A markup language
C) A database
D) An operating system
Answer: A

2. What does HTML stand for?
A) Hyper Text Markup Language
B) High Tech Modern Language
C) Home Tool Markup Language
D) Hyper Technical Machine Learning
Answer: A
      `;
      
      geminiHelper.generateContent.mockResolvedValue(mockQuizContent);
      
      const quizData = {
        topic: 'Web Development',
        difficulty: 'medium',
        numberOfQuestions: 2
      };
      
      const response = await request(app)
        .post('/gemini/generate-quiz')
        .set('Authorization', `Bearer ${access_token}`)
        .send(quizData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('quiz', mockQuizContent);
      
      // Verify the mock was called with any parameters
      expect(geminiHelper.generateContent).toHaveBeenCalled();
      // Make sure the topic was included in the prompt
      expect(geminiHelper.generateContent.mock.calls[0][0]).toContain('Web Development');
    });
    
    it('should fail if not authenticated', async () => {
      const quizData = {
        topic: 'Web Development',
        difficulty: 'medium',
        numberOfQuestions: 2
      };
      
      const response = await request(app)
        .post('/gemini/generate-quiz')
        .send(quizData);
      
      expect(response.status).toBe(401);
    });
    
    it('should fail if topic is missing', async () => {
      const quizData = {
        difficulty: 'medium',
        numberOfQuestions: 2
      };
      
      const response = await request(app)
        .post('/gemini/generate-quiz')
        .set('Authorization', `Bearer ${access_token}`)
        .send(quizData);
      
      expect(response.status).toBe(400);
    });
    
    it('should use default values if difficulty and numberOfQuestions are not provided', async () => {
      // Mock the Gemini API response
      const mockQuizContent = 'Default quiz content';
      geminiHelper.generateContent.mockResolvedValue(mockQuizContent);
      
      const quizData = {
        topic: 'Web Development'
      };
      
      const response = await request(app)
        .post('/gemini/generate-quiz')
        .set('Authorization', `Bearer ${access_token}`)
        .send(quizData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify the mock was called
      expect(geminiHelper.generateContent).toHaveBeenCalled();
      // Make sure the prompt contains default values
      expect(geminiHelper.generateContent.mock.calls[0][0]).toContain('medium');
    });
    
    it('should handle errors from the Gemini API', async () => {
      // Mock the Gemini API to throw an error
      geminiHelper.generateContent.mockRejectedValue(new Error('Gemini API error'));
      
      const quizData = {
        topic: 'Web Development'
      };
      
      const response = await request(app)
        .post('/gemini/generate-quiz')
        .set('Authorization', `Bearer ${access_token}`)
        .send(quizData);
      
      expect(response.status).toBe(500);
    });
  });
});