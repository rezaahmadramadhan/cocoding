const { describe, it, expect, beforeEach } = require('@jest/globals');
const OrderController = require('../controllers/OrderController');
const { User, Course, Order, OrderDetail } = require('../models');
const { createSnapTransaction, verifyNotification } = require('../helpers/midtrans');

// Mock the dependencies
jest.mock('../models', () => {
  const mockOrder = {
    id: 1,
    orderAt: new Date(),
    paymentMethod: 'Credit Card',
    paymentStatus: 'pending',
    totalPrice: 1000000,
    UserId: 1,
    update: jest.fn().mockResolvedValue(true)
  };

  const mockCourse = {
    id: 1,
    title: 'JavaScript Basics',
    price: 1000000,
    totalEnrollment: 100,
    update: jest.fn().mockResolvedValue(true)
  };

  const mockUser = {
    id: 1,
    fullName: 'Test User',
    email: 'test@example.com'
  };

  const mockOrderDetail = {
    id: 1,
    quantity: 1,
    price: 1000000,
    OrderId: 1,
    CourseId: 1,
    Course: mockCourse
  };

  return {
    User: {
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === 1) return Promise.resolve(mockUser);
        return Promise.resolve(null);
      })
    },
    Course: {
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === 1) return Promise.resolve(mockCourse);
        return Promise.resolve(null);
      })
    },
    Order: {
      create: jest.fn().mockResolvedValue(mockOrder),
      findByPk: jest.fn().mockImplementation((id) => {
        if (id === 1) return Promise.resolve({...mockOrder, OrderDetails: [mockOrderDetail]});
        return Promise.resolve(null);
      }),
      findOne: jest.fn().mockImplementation((query) => {
        if (query.where.midtransOrderId === 'ORDER-1-123456789') return Promise.resolve(mockOrder);
        return Promise.resolve(null);
      })
    },
    OrderDetail: {
      create: jest.fn().mockResolvedValue(mockOrderDetail),
      findOne: jest.fn().mockResolvedValue(mockOrderDetail)
    }
  };
});

// Mock Midtrans helper
jest.mock('../helpers/midtrans', () => ({
  createSnapTransaction: jest.fn().mockResolvedValue({
    token: 'test-token-123',
    redirect_url: 'https://app.sandbox.midtrans.com/snap/v3/redirection/test-token-123'
  }),
  verifyNotification: jest.fn().mockResolvedValue({
    order_id: 'ORDER-1-123456789',
    transaction_status: 'settlement',
    fraud_status: 'accept'
  })
}));

describe('OrderController', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    req = {
      user: { id: 1 },
      body: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  describe('checkout', () => {
    it('should create an order successfully', async () => {
      // Arrange
      req.body = {
        courseId: 1,
        paymentMethod: 'Credit Card'
      };
      
      // Act
      await OrderController.checkout(req, res, next);
      
      // Assert
      expect(Course.findByPk).toHaveBeenCalledWith(1);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(Order.create).toHaveBeenCalled();
      expect(OrderDetail.create).toHaveBeenCalled();
      expect(createSnapTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Checkout successful',
        order: expect.any(Object),
        payment: expect.objectContaining({
          token: 'test-token-123'
        })
      }));
    });
    
    it('should get courseId from various locations', async () => {
      // Test various ways to pass courseId
      const testCases = [
        { body: { CourseId: 1 } },
        { query: { courseId: 1 } },
        { params: { courseId: 1 } }
      ];
      
      for (const testCase of testCases) {
        // Arrange
        req = {
          user: { id: 1 },
          body: testCase.body || {},
          query: testCase.query || {},
          params: testCase.params || {}
        };
        
        // Act
        await OrderController.checkout(req, res, next);
        
        // Assert
        expect(Course.findByPk).toHaveBeenCalledWith(1);
        expect(Order.create).toHaveBeenCalled();
      }
    });
    
    it('should throw BadRequest if courseId is missing', async () => {
      // Arrange - no courseId provided
      
      // Act
      await OrderController.checkout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'BadRequest',
        message: 'Course ID is required'
      }));
    });
    
    it('should throw NotFound if course does not exist', async () => {
      // Arrange
      req.body = { courseId: 999 }; // Non-existent course
      Course.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await OrderController.checkout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'Course not found'
      }));
    });
    
    it('should throw NotFound if user does not exist', async () => {
      // Arrange
      req.body = { courseId: 1 };
      req.user = { id: 999 }; // Non-existent user
      User.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await OrderController.checkout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'User not found'
      }));
    });
    
    it('should handle Midtrans API errors', async () => {
      // Arrange
      req.body = { courseId: 1 };
      const error = new Error('Midtrans API error');
      createSnapTransaction.mockRejectedValueOnce(error);
      
      // Spy on console.error to prevent actual logging
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await OrderController.checkout(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'PaymentGatewayError'
      }));
      
      // Clean up
      console.error.mockRestore();
    });
  });
  
  describe('handleNotification', () => {
    it('should update order status to success on settlement', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789',
        transaction_status: 'settlement'
      };
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(verifyNotification).toHaveBeenCalledWith(req.body);
      expect(Order.findOne).toHaveBeenCalledWith({
        where: { midtransOrderId: 'ORDER-1-123456789' }
      });
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'success' });
      expect(Course.findByPk).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
    
    it('should update order status to success on capture with accept fraud status', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'capture',
        fraud_status: 'accept'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'success' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should update order status to challenge on capture with challenge fraud status', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'capture',
        fraud_status: 'challenge'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'challenge' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should update order status to failure on cancel', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'cancel'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'failure' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should update order status to failure on deny', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'deny'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'failure' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should update order status to failure on expire', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'expire'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'failure' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should update order status to pending on pending', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-1-123456789',
        transaction_status: 'pending'
      });
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(Order.findOne().then(order => order.update)).toHaveBeenCalledWith({ paymentStatus: 'pending' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
    
    it('should handle error if order not found', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-999-123456789'
      };
      
      verifyNotification.mockResolvedValueOnce({
        order_id: 'ORDER-999-123456789',
        transaction_status: 'settlement'
      });
      
      Order.findOne.mockResolvedValueOnce(null);
      
      // Spy on console.error to prevent actual logging
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      
      // Clean up
      console.error.mockRestore();
    });
    
    it('should handle general errors', async () => {
      // Arrange
      req.body = {
        order_id: 'ORDER-1-123456789'
      };
      
      const error = new Error('Verification failed');
      verifyNotification.mockRejectedValueOnce(error);
      
      // Spy on console.error to prevent actual logging
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await OrderController.handleNotification(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      
      // Clean up
      console.error.mockRestore();
    });
  });
  
  describe('getOrderStatus', () => {
    it('should return order details for a valid order id and user', async () => {
      // Arrange
      req.params = { id: 1 };
      
      // Act
      await OrderController.getOrderStatus(req, res, next);
      
      // Assert
      expect(Order.findByPk).toHaveBeenCalledWith(1, expect.anything());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
    
    it('should throw NotFound if order does not exist', async () => {
      // Arrange
      req.params = { id: 999 };
      Order.findByPk.mockResolvedValueOnce(null);
      
      // Act
      await OrderController.getOrderStatus(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'NotFound',
        message: 'Order not found'
      }));
    });
    
    it('should throw Forbidden if user does not own the order', async () => {
      // Arrange
      req.params = { id: 1 };
      req.user = { id: 2 }; // Different user
      
      // Act
      await OrderController.getOrderStatus(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Forbidden',
        message: "You don't have permission to view this order"
      }));
    });
  });
});