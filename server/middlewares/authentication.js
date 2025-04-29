const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

async function authentication(req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw { name: "Unauthorized", message: "Invalid token" };
    }

    const rawToken = authorization.split(" ");
    const tokenType = rawToken[0];
    const tokenValue = rawToken[1];

    if (tokenType !== "Bearer" || !tokenValue) {
      throw { name: "Unauthorized", message: "Unauthorized Error" };
    }

    const payload = verifyToken(tokenValue);
    const userId = payload.id && typeof payload.id === 'object' ? payload.id.id : payload.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw { name: "Unauthorized", message: "Unauthorized Error" };
    }

    req.user = { id: user.id };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authentication;
