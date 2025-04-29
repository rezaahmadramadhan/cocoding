const { User, Course, Order, OrderDetail } = require("../models");

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

      await course.update({
        totalEnrollment: course.totalEnrollment + 1
      });

      res.status(201).json({
        message: "Checkout successful",
        order: {
          id: order.id,
          orderAt: order.orderAt,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          totalPrice: order.totalPrice,
          courseName: course.title
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;