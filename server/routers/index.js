const express = require("express");
const authentication = require("../middlewares/authentication");
const router = express.Router();

router.use('/', require('./auth'));
router.use('/courses', require('./courses'));
router.use('/orders', authentication, require('./orders'));
router.use('/gemini', authentication, require('./gemini'));

module.exports = router;