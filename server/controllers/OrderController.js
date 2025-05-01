const { User, Course, Order, OrderDetail } = require("../models");
const { createSnapTransaction } = require("../helpers/midtrans");

class OrderController {
  static async checkout(req, res, next) {
    try {
      const userId = req.user.id;

      const courseId = req.body?.courseId || req.body?.CourseId || req.query?.courseId || req.params?.courseId;
      const paymentMethod = req.body?.paymentMethod || req.query?.paymentMethod || "Credit Card";
      

      if (!courseId) {
        throw { name: "BadRequest", message: "Course ID is required" };
      }

      const course = await Course.findByPk(courseId);
      
      if (!course) {
        throw { name: "NotFound", message: "Course not found" };
      }
      
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      const order = await Order.create({
        orderAt: new Date(),
        paymentMethod,
        paymentStatus: "pending",
        totalPrice: course.price,
        UserId: userId
      });

      await OrderDetail.create({
        quantity: 1,
        price: course.price,
        OrderId: order.id,
        CourseId: courseId
      });

      // Format transaction untuk Midtrans
      const transaction = {
        orderId: `ORDER-${order.id}-${Date.now()}`,
        amount: course.price,
        name: user.fullName,
        email: user.email,
        items: [
          {
            id: course.id,
            name: course.title,
            price: course.price,
            quantity: 1
          }
        ]
      };

      // Dapatkan token transaksi dari Midtrans
      let snapResponse;
      try {
        snapResponse = await createSnapTransaction(transaction);
        
        // Update orderId di database dengan orderId yang digunakan di Midtrans
        await order.update({ 
          midtransOrderId: transaction.orderId 
        });
      } catch (midtransError) {
        console.error("Midtrans Error:", midtransError);
        throw { name: "PaymentGatewayError", message: "Failed to create payment transaction" };
      }

      res.status(201).json({
        message: "Checkout successful",
        order: {
          id: order.id,
          orderAt: order.orderAt,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          totalPrice: order.totalPrice,
          courseName: course.title
        },
        payment: {
          token: snapResponse.token,
          redirectUrl: snapResponse.redirect_url
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleNotification(req, res, next) {
    try {
      const { verifyNotification } = require("../helpers/midtrans");
      
      const notification = req.body;
      const statusResponse = await verifyNotification(notification);
      
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;
      
      // Ambil order ID dari orderId format "ORDER-{id}-{timestamp}"
      const dbOrderId = orderId.split('-')[1];
      
      console.log(`Notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`);
      
      // Cari order di database
      const order = await Order.findOne({
        where: { midtransOrderId: orderId }
      });
      
      if (!order) {
        throw { name: "NotFound", message: `Order with Midtrans ID ${orderId} not found` };
      }
      
      // Update status pembayaran berdasarkan callback dari Midtrans
      let paymentStatus;
      
      if (transactionStatus == 'capture') {
        if (fraudStatus == 'challenge') {
          paymentStatus = 'challenge';
        } else if (fraudStatus == 'accept') {
          paymentStatus = 'success';
        }
      } else if (transactionStatus == 'settlement') {
        paymentStatus = 'success';
      } else if (transactionStatus == 'cancel' || 
                transactionStatus == 'deny' || 
                transactionStatus == 'expire') {
        paymentStatus = 'failure';
      } else if (transactionStatus == 'pending') {
        paymentStatus = 'pending';
      }
      
      await order.update({ paymentStatus });
      
      // Jika pembayaran berhasil, update juga total enrollment course
      if (paymentStatus === 'success') {
        const orderDetail = await OrderDetail.findOne({
          where: { OrderId: order.id }
        });
        
        if (orderDetail) {
          const course = await Course.findByPk(orderDetail.CourseId);
          if (course) {
            await course.update({
              totalEnrollment: course.totalEnrollment + orderDetail.quantity
            });
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Notification Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [{
          model: OrderDetail,
          include: [Course]
        }]
      });
      
      if (!order) {
        throw { name: "NotFound", message: "Order not found" };
      }
      
      // Check if this is the user's order
      if (order.UserId !== req.user.id) {
        throw { name: "Forbidden", message: "You don't have permission to view this order" };
      }
      
      res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;