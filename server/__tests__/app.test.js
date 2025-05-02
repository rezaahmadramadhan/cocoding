const request = require('supertest');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const app = require('../app');

// Mock the models to avoid database connections which can cause timeouts
jest.mock('../models', () => {
  return {
    User: {
      findByPk: jest.fn().mockResolvedValue(null)
    },
    Course: {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(null)
    }
  };
});

describe('App configuration', () => {
  // Store original NODE_ENV
  const originalEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    // Restore original environment variables after each test
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should load correctly and respond to base route', async () => {
    // Make a simple request to verify the app works
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    
    // Check if there is a response body, but don't rely on specific structure
    expect(response.body).toBeTruthy();
  });
  
  it('should handle 404 routes properly', async () => {
    // Test a non-existent route to trigger the 404 handler
    const response = await request(app).get('/non-existent-route');
    expect(response.status).toBe(404);
    
    // Check if there is a response body, but don't rely on specific structure
    expect(response.body).toBeTruthy();
  });
});