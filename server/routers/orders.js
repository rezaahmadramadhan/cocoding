const express = require("express");
const OrderController = require("../controllers/OrderController");
const router = express.Router();

router.post("/checkout", OrderController.checkout);

module.exports = router;