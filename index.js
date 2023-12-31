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

app.get("/", (req, res) => {
  res.status(200).send("Running Server");
});

const run = async () => {
  try {
    const serviceCollection = client.db("bookable").collection("products");
    const reviewCollection = client.db("bookable").collection("reviews");
    const wishlistCollection = client.db("bookable").collection("wishlist");
    const currentlyReadingCollection = client
      .db("bookable")
      .collection("currentlyReading");

    app.get("/books", async (req, res) => {
      try {
        const query = {};
        const cursor = await serviceCollection.find(query).toArray();
        res.send(cursor);
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

    app.delete("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const existingItem = await serviceCollection.findOne(query);

        if (!existingItem) {
          return res.status(404).json({ message: "Wishlist item not found" });
        }
        const result = await serviceCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.put("/book/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: data,
        };
        const result = await serviceCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/book-search", async (req, res) => {
      try {
        const queries = req.query;
        const { search } = queries;

        const andCondition = [
          {
            $or: [
              { title: { $regex: search, $options: "i" } },
              { author: { $regex: search, $options: "i" } },
              { genre: { $regex: search, $options: "i" } },
            ],
          },
        ];

        const query = andCondition.length > 0 ? { $and: andCondition } : {};

        // Make sure you have a MongoDB database connection established here
        const result = await serviceCollection.find(query).toArray();

        if (result.length > 0) {
          res.send({ status: true, data: result });
        } else {
          res.send({ staus: true, message: "Sorry, No Book Found!" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          status: false,
          message: "An error occurred while processing your request.",
        });
      }
    });

    app.get("/book-filter", async (req, res) => {
      try {
        const queries = req.query;
        const { genre, publication_date } = queries;

        const productQuery = {
          $and: [
            {
              $and: [
                { genre: { $regex: genre?.toString(), $options: "i" } }, // Matching genre
                {
                  publication_date: {
                    $regex: publication_date?.toString(),
                    $options: "i",
                  },
                },
              ],
            },
          ],
        };

        // Make sure you have a MongoDB database connection established here
        const result = await serviceCollection.find(productQuery).toArray();

        if (result.length > 0) {
          res.send({ status: true, data: result });
        } else {
          res.send({ status: true, message: "Sorry, No Book Found!" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          status: false,
          message: "An error occurred while processing your request.",
        });
      }
    });

    app.get("/reviews/:bookId", async (req, res) => {
      try {
        const id = req.params.bookId;
        const query = { bookId: id };
        const cursor = reviewCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/reviews", async (req, res) => {
      try {
        const data = req.body;
        const result = await reviewCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/wishlist", async (req, res) => {
      try {
        const data = req.body;
        const result = await wishlistCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/wishlist", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).json({ error: "Email parameter is required" });
        }

        const query = { email };
        const result = await wishlistCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.delete("/wishlist/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { productId: id };
        const existingItem = await wishlistCollection.findOne(query);

        if (!existingItem) {
          return res.status(404).json({ message: "Wishlist item not found" });
        }
        const result = await wishlistCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.post("/currently-reading", async (req, res) => {
      try {
        const data = req.body;
        const query = { email: data.email, productId: data.productId };
        const queryResult = await wishlistCollection.findOne(query);
        if (queryResult) {
          const deleteResult = await wishlistCollection.deleteOne(query);
        }
        const result = await currentlyReadingCollection.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/currently-reading", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).json({ error: "Email parameter is required" });
        }

        const query = { email };
        const result = await currentlyReadingCollection.find(query).toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.put("/finish-reading/:id", async (req, res) => {
      const id = req.params.id;
      const query = { productId: id };
      const queryResult = await currentlyReadingCollection.findOne(query);
      if (!queryResult) {
        return res.status(400).json({ message: "Product not found" });
      }

      const updatedDocument = await currentlyReadingCollection.updateOne(
        query,
        { $set: { finishedReading: true } },
        { upsert: true }
      );
      res.send(updatedDocument);
    });
  } finally {
  }
};

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log("Server running on port", port);
});
