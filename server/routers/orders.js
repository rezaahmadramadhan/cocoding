const express = require("express");
const OrderController = require("../controllers/OrderController");
const router = express.Router();
const authentication = require("../middlewares/authentication");

// Route untuk checkout - memerlukan autentikasi
router.post("/checkout", authentication, OrderController.checkout);

// Route untuk menerima notification dari Midtrans - tidak memerlukan autentikasi
router.post("/notification", OrderController.handleNotification);

// Route untuk mendapatkan status pesanan - memerlukan autentikasi
router.get("/:id", authentication, OrderController.getOrderStatus);

module.exports = router;