const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { verifyGoogleToken } = require("../helpers/googleAuth");
const { User } = require("../models");

class UserController {
  static home(req, res) {
    return res.json("Welcome to the home page!");
  }

  static async register(req, res, next) {
    try {
      const user = await User.create(req.body);
      const result = user.toJSON();
      delete result.password;

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }

      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw { name: "Unauthorized", message: "Invalid email/password" };
      }

      const isValid = comparePassword(password, user.password);

      if (!isValid) {
        throw { name: "Unauthorized", message: "Invalid email/password" };
      }

      const access_token = signToken({ id: user.id });

      res.status(200).json({ access_token });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.body;
      
      if (!token) {
        throw { name: "BadRequest", message: "Google token is required" };
      }
      
      // Verify the Google token
      const googleUserInfo = await verifyGoogleToken(token);
      
      // Find existing user or create a new one
      let user = await User.findOne({ 
        where: { email: googleUserInfo.email } 
      });
      
      if (!user) {
        // Create a new user if they don't exist
        user = await User.create({
          email: googleUserInfo.email,
          fullName: googleUserInfo.name,
          // Generate a random secure password or set null if your model allows it
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10),
          role: 'customer'
        });
      }
      
      // Generate JWT token
      const access_token = signToken({ id: user.id });
      
      res.status(200).json({ 
        access_token,
        id: user.id,
        email: user.email,
        fullName: user.fullName
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }
      
      await User.destroy({
        where: { id: userId }
      });
      
      res.status(200).json({ message: "Your account has been successfully deleted" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
