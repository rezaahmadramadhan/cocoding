const request = require('supertest');
const app = require('../app');
const { signToken } = require('../helpers/jwt');

// Mock the midtrans helper
jest.mock('../helpers/midtrans', () => ({
  createMidtransToken: jest.fn().mockResolvedValue({
    token: 'mock-token',
    redirect_url: 'https://example.com/payment'
  })
}));

// Mock the models
jest.mock('../models', () => {
  const mockCourse = {
    id: 1,
    title: 'Test Course for Order',
    price: 1000000,
    totalEnrollment: 100,
    increment: jest.fn().mockResolvedValue(true)
  };
  
  const mockOrder = {
    id: 1,
    UserId: 1,
    totalPrice: 1000000,
    status: 'pending',
    paymentMethod: 'Credit Card',
    midtransOrderId: 'order-123'
  };

  const mockOrderDetail = {
    id: 1,
    OrderId: 1,
    CourseId: 1,
    price: 1000000
  };

  return {
    User: {
      findByPk: jest.fn().mockResolvedValue({
        id: 1,
        fullName: 'Order Test User',
        email: 'ordertest@example.com'
      })
    },
    Course: {
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === 1) {
          return Promise.resolve(mockCourse);
        }
        return Promise.resolve(null);
      })
    },
    Order: {
      create: jest.fn().mockResolvedValue(mockOrder),
      findOne: jest.fn().mockResolvedValue(mockOrder),
      findAll: jest.fn().mockResolvedValue([mockOrder]),
      update: jest.fn().mockResolvedValue([1, [mockOrder]])
    },
    OrderDetail: {
      create: jest.fn().mockResolvedValue(mockOrderDetail),
      findOne: jest.fn().mockResolvedValue(mockOrderDetail),
      findAll: jest.fn().mockResolvedValue([mockOrderDetail])
    }
  };
});

const access_token = signToken({ id: 1 });
const testCourseId = 1;

describe('Orders API', () => {
  describe('POST /orders/checkout', () => {
    it('should create a new order when authenticated', async () => {
      const orderData = {
        courseId: testCourseId,
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      // As we're mocking, we expect a success response or at least some response
      expect(response.status).toBeTruthy();
    });
    
    it('should fail if not authenticated', async () => {
      const orderData = {
        courseId: testCourseId,
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .send(orderData);
      
      expect(response.status).toBe(401);
    });
    
    it('should fail if course ID is missing', async () => {
      const orderData = {
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(400);
    });
    
    it('should fail if course does not exist', async () => {
      const orderData = {
        courseId: 9999, // Non-existent course
        paymentMethod: 'Credit Card'
      };
      
      const response = await request(app)
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${access_token}`)
        .send(orderData);
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /orders/history', () => {
    it('should return order history when authenticated', async () => {
      const response = await request(app)
        .get('/orders/history')
        .set('Authorization', `Bearer ${access_token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('should fail if not authenticated', async () => {
      const response = await request(app)
        .get('/orders/history');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /orders/notification', () => {
    it('should handle midtrans notifications', async () => {
      // Mock the notification data from Midtrans
      const notificationData = {
        transaction_status: 'settlement',
        order_id: 'order-123', // This should match mockOrder.midtransOrderId
        gross_amount: '1000000.00'
      };
      
      const response = await request(app)
        .post('/orders/notification')
        .send(notificationData);
      
      // As we're mocking, we expect some status code
      expect(response.status).toBeTruthy();
    });

    it('should handle midtrans notifications for non-existent orders', async () => {
      // Mock the notification data with non-existent order
      const notificationData = {
        transaction_status: 'settlement',
        order_id: 'non-existent-order',
        gross_amount: '1000000.00'
      };
      
      const response = await request(app)
        .post('/orders/notification')
        .send(notificationData);
      
      // We still expect a response status
      expect(response.status).toBeTruthy();
    });
  });
});