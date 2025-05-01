const express = require('express');
const UserController = require('../controllers/UserController');
const authentication = require('../middlewares/authentication');
const user = express.Router()

user.get('/', UserController.home)
user.post('/register', UserController.register)
user.post('/login', UserController.login)
user.post('/google-login', UserController.googleLogin)
user.get('/profile', authentication, UserController.getProfile)
user.put('/profile', authentication, UserController.updateProfile)
user.delete('/delete-account', authentication, UserController.deleteAccount)

module.exports = user