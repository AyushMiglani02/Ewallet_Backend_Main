const express = require("express");
const app = express();
require("dotenv").config();
app.use(express.json());
const cors = require("cors");

const dbConfig = require("./config/dbConfig");
const usersRoute = require("./routes/usersRoute");
const transactionsRoute = require("./routes/transactionsRoute");
const requestsRoute = require("./routes/requestsRoute");

app.use(
  cors({
    origin: [
      "https://ewallet-app-git-master-amalthomas1234s-projects.vercel.app",
    ],

    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use((req, res, next) => {
  console.log(`CORS headers applied for ${req.method} request to ${req.url}`);
  next();
});

app.use("/api/users", usersRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/requests", requestsRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
