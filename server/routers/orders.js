const express = require("express");
const OrderController = require("../controllers/OrderController");
const router = express.Router();

// Route untuk checkout - memerlukan autentikasi
router.post("/checkout", OrderController.checkout);

// Route untuk menerima notification dari Midtrans - tidak memerlukan autentikasi
router.post("/notification", OrderController.handleNotification);

// Route untuk mendapatkan status pesanan - memerlukan autentikasi
router.get("/:id", OrderController.getOrderStatus);

module.exports = router;