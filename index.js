require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rencz4l.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const serviceCollection = client.db("bookable").collection("products");

    app.get("/books", async (req, res) => {
      try {
        const query = {};
        const cursor = serviceCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/books", async (req, res) => {
      try {
        const data = req.body;
        const result = await serviceCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    // API endpoint for searching books
    app.get("/books", async (req, res) => {
      // const regex = new RegExp(query, "i");
      const queries = req.query;
      console.log(queries);

      const modifiedQueries = {};
      Object.entries(queries).forEach((query) => {
        modifiedQueries[query[0]] = query[1];
      });

      const { searchTerm, genre, publicationYear } = modifiedQueries;

      let andCondition = [];

      if (searchTerm) {
        andCondition.push({
          $or: [
            {
              name: {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              seller_name: {
                $regex: searchTerm,
                $options: "i",
              },
            },
            {
              genre: {
                $regex: searchTerm,
                $options: "i",
              },
            },
          ],
        });
      }

      if (genre) {
        andCondition.push({
          $and: [{ genre: { $regex: genre, $options: "i" } }],
        });
      }

      if (publicationYear) {
        andCondition.push({
          $and: [
            { publicationDate: { $regex: publicationYear, $options: "i" } },
          ],
        });
      }

      const query = andCondition.length > 0 ? { $and: andCondition } : {};

      const result = await serviceCollection.find(query).toArray();

      res.send({ status: true, data: result });
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.status(400).send("Running Server");
});

app.listen(port, () => {
  console.log("Server running on port", port);
});
