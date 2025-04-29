const express = require("express");
const authentication = require("../middlewares/authentication");
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/courses', authentication, require('./courses'));
router.use('/orders', authentication, require('./orders'));

module.exports = router;