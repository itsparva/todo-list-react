// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();

// Middleware
app.use(express.json()); // Allows us to read JSON data
app.use(cors()); // Allows React to connect to this server

// Connect to MongoDB (Replace with your actual MongoDB Atlas connection string)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// --- 1. Create a Schema (Blueprint for your data) ---
const todoSchema = new mongoose.Schema({
  todo: String,
  isCompleted: Boolean,
});

const Todo = mongoose.model("Todo", todoSchema);

// --- 2. Create your API Routes ---

// GET: Fetch all todos
app.get("/todos", async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// POST: Add a new todo
app.post("/todos", async (req, res) => {
  const newTodo = new Todo({
    todo: req.body.todo,
    isCompleted: false,
  });
  const savedTodo = await newTodo.save();
  res.json(savedTodo);
});

// DELETE: Remove a todo
app.delete("/todos/:id", async (req, res) => {
  const result = await Todo.findByIdAndDelete(req.params.id);
  res.json(result);
});

// PUT: Update a todo (e.g., toggling isCompleted)
app.put("/todos/:id", async (req, res) => {
  const updatedTodo = await Todo.findByIdAndUpdate(
    req.params.id, 
    req.body, // This contains the new data (like { isCompleted: true })
    { new: true } // This tells Mongoose to return the updated version
  );
  res.json(updatedTodo);
});

// Start the server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
