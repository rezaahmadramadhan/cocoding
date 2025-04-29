if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/", require("./routers"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.use(errorHandler);

module.exports = app;
