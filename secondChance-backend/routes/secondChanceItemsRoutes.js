const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const connectToDatabase = require("../models/db");
const logger = require("../logger");

// Define the upload directory path
const directoryPath = "public/images";

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get("/", async (req, res, next) => {
  logger.info("/ called");
  try {
    //Step 2: task 1 - insert code here
    const db = await connectToDatabase();
    //Step 2: task 2 - insert code here
    const collection = db.collection("secondChanceItems");
    //Step 2: task 3 - insert code here
    const secondChanceItems = await collection.find({}).toArray();
    //Step 2: task 4 - insert code here
    res.json(secondChanceItems);
  } catch (e) {
    logger.console.error("oops something went wrong", e);
    next(e);
  }
});

// Add a new item
router.post("/", upload.single("file"), async (req, res, next) => {
  //   try {
  //     //Step 3: task 1 - insert code here
  //     const db = await connectToDatabase();
  //     //Step 3: task 2 - insert code here
  //     const collection = db.collection("secondChanceItems");
  //     //Step 3: task 3 - insert code here
  //     const newItem = req.body;
  //     //Step 3: task 4 - insert code here
  //     const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1);
  //     await lastItemQuery.forEach((item) => {
  //       secondChanceItem.id = (parseInt(item.id) + 1).toString();
  //     });
  //     //Step 3: task 5 - insert code here
  //     const date_added = Math.floor(new Date().getTime() / 1000);
  //     secondChanceItem.date_added = date_added;
  //     //Task 6: Add the new item to the database
  //     secondChanceItem = await collection.insertOne(secondChanceItem);
  //     //const result = await collection.insertOne(newItem);

  //     //Task 7: Upload image (already handled by multer middleware)
  //     //     if (req.file) {
  //     //       console.log(`🖼️ Image uploaded: ${req.file.originalname}`);
  //     //       newItem.image = `/images/${req.file.originalname}`; // optional: store image path
  //     //     } else {
  //     //       console.warn("⚠️ No image uploaded");
  //     //     }

  //     //     res.status(201).json(result.ops ? result.ops[0] : newItem); // compatible with both MongoDB v3 and v4+
  //     //   } catch (e) {
  //     //     next(e);
  //     //   }

  //     res.status(201).json(secondChanceItem.ops[0]);
  //   } catch (e) {
  //     next(e);
  //   }
  try {
    // ✅ Step 1: Connect to DB
    const db = await connectToDatabase();

    // ✅ Step 2: Get the collection
    const collection = db.collection("secondChanceItems");

    // ✅ Step 3: Create item from request body
    const newItem = req.body;

    // ✅ Step 4: Get last item's ID and increment
    const lastItem = await collection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const newId = lastItem.length > 0 ? parseInt(lastItem[0].id) + 1 : 1;
    newItem.id = newId.toString(); // Store as string to match your usage

    // ✅ Step 5: Add current Unix timestamp
    newItem.date_added = Math.floor(Date.now() / 1000);

    // ✅ Step 6: Save to DB
    const result = await collection.insertOne(newItem);

    // ✅ Step 7: Handle image upload
    if (req.file) {
      console.log(`🖼️ Image uploaded: ${req.file.originalname}`);
      newItem.image = `/images/${req.file.originalname}`;
    } else {
      console.warn("⚠️ No image uploaded");
    }

    // ✅ Response with inserted item (compatible with MongoDB v3/v4)
    res.status(201).json(result.ops ? result.ops[0] : newItem);
  } catch (e) {
    console.error("❌ Error adding item:", e.message);
    next(e);
  }
});

// Get a single secondChanceItem by ID
router.get("/:id", async (req, res, next) => {
  try {
    //Step 4: task 1 - insert code here
    const db = await connectToDatabase();
    //Step 4: task 2 - insert code here
    const collection = db.collection("secondChanceItems");
    //Step 4: task 3 - insert code here
    const itemId = req.params.id;
    const secondChanceItem = await collection.findOne({ id: itemId });
    //Step 4: task 4 - insert code here
    if (!secondChanceItem) {
      return res.status(404).json({ error: "Item not found" });
    }
  } catch (e) {
    console.error("❌ Error retrieving item by ID:", e.message);
    next(e);
  }
});

// Update and existing item
router.put("/:id", async (req, res, next) => {
  try {
    //Step 5: task 1 - insert code here
    const db = await connectToDatabase();
    //Step 5: task 2 - insert code here
    const collection = db.collection("secondChanceItems");
    //Step 5: task 3 - insert code here
    const id = req.params.id;
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      logger.error("secondChanceItem not found");
      return res.status(404).json({ error: "Item not found" });
    }
    //Step 5: task 4 - insert code here
    secondChanceItem.category = req.body.category;
    secondChanceItem.condition = req.body.condition;
    secondChanceItem.age_days = req.body.age_days;
    secondChanceItem.description = req.body.description;
    secondChanceItem.age_years = Number(
      (secondChanceItem.age_days / 365).toFixed(1)
    );
    secondChanceItem.updatedAt = new Date();

    const updatepreloveItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: "after" } // This ensures the updated document is returned
    );
    //Step 5: task 5 - insert code here
    if (updatepreloveItem && updatepreloveItem.value) {
      res.json({ uploaded: "success", updatedItem: updatepreloveItem.value });
    } else {
      res.json({ uploaded: "failed" });
    }
  } catch (e) {
    console.error("❌ Error updating item:", e.message);
    next(e);
  }
});

// Delete an existing item
router.delete("/:id", async (req, res, next) => {
  try {
    //Step 6: task 1 - insert code here
    const db = await connectToDatabase();
    //Step 6: task 2 - insert code here
    const collection = db.collection("secondChanceItems");
    //Step 6: task 3 - insert code here
    const id = req.params.id;
    const secondChanceItem = await collection.findOne({ id });

    if (!secondChanceItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    //Step 6: task 4 - insert code here
    await collection.deleteOne({ id });
    res.json({ deleted: "success" });
  } catch (e) {
    console.error("❌ Error deleting item:", e.message);
    next(e);
  }
});

module.exports = router;
