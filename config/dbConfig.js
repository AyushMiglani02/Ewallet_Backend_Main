const mongoose = require("mongoose");

mongoose.connect(process.env.mongo_url);

const connectionResult = mongoose.connection;

connectionResult.on("error", () => {
  console.log(console, "connection error:");
});
connectionResult.on("connected", () => {
  console.log("Mongo DB connected successfully");
});
