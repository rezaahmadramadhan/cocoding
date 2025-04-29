const express = require('express');
const UserController = require('../controllers/UserController');
const user = express.Router()

user.get('/', UserController.home)
user.post('/register', UserController.register)
user.post('/login', UserController.login)


module.exports = user