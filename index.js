require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const run = async () => {
  try{}
  finally{}
}

run().catch(err => console.log(err));

app.get("/", (req, res) => {
  res.status(400).send("Running Server")
})

app.listen(port, () => {
  console.log("Server running on port", port);
})