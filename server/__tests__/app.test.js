const request = require('supertest');
const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

describe('App configuration', () => {
  // Store original NODE_ENV and DATABASE_URL
  const originalEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  
  afterEach(() => {
    // Restore original environment variables after each test
    process.env.NODE_ENV = originalEnv;
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
    
    // Clear the module cache to ensure app.js is reloaded with the new NODE_ENV
    jest.resetModules();
  });
  
  it('should load dotenv in non-production environment', async () => {
    // Set NODE_ENV to development
    process.env.NODE_ENV = 'development';
    
    // Mock dotenv to verify it's called
    jest.mock('dotenv', () => ({
      config: jest.fn()
    }));
    
    // Clear cache and import the app
    jest.resetModules();
    const app = require('../app');
    const dotenv = require('dotenv');
    
    // Make a simple request to verify the app works
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    
    // Verify dotenv.config was called
    expect(dotenv.config).toHaveBeenCalled();
  });
  
  it('should not load dotenv in production environment', async () => {
    // Set NODE_ENV to production
    process.env.NODE_ENV = 'production';
    
    // Set a test DATABASE_URL for production environment
    process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake_db';
    
    // Mock dotenv to verify it's not called
    jest.mock('dotenv', () => ({
      config: jest.fn()
    }));
    
    // Clear cache and import the app
    jest.resetModules();
    const app = require('../app');
    const dotenv = require('dotenv');
    
    // Make a simple request to verify the app still works
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    
    // Verify dotenv.config was not called in production mode
    expect(dotenv.config).not.toHaveBeenCalled();
  });
});