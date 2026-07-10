// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const app = express();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Middleware
app.use(express.json()); // Allows us to read JSON data
app.use(cors()); // Allows React to connect to this server

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// --- 1. NEW: The User Blueprint ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Since you are the admin, we will default everyone to 'group-01' for now!
  groupId: { type: String, default: "group-01" } 
});

const User = mongoose.model("User", userSchema);

// --- 2. UPDATED: The Wishlist (Todo) Blueprint ---
const todoSchema = new mongoose.Schema({
  todo: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  
  // NEW: Track who made it and where it belongs
  creatorName: { type: String, required: true }, 
  listType: { type: String, enum: ['personal', 'group'], default: 'personal' } 
}, { timestamps: true }); 

const Todo = mongoose.model("Todo", todoSchema);


// --- 3. Create your API Routes ---

// ==========================================
//           AUTHENTICATION ROUTES
// ==========================================

// POST: Sign Up a new user
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 2. Scramble (Hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the new user and save to database
    const newUser = new User({
      username: username,
      password: hashedPassword,
      groupId: "group-01" // Default group for everyone for now
    });
    await newUser.save();

    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error during signup" });
  }
});


// POST: Log In an existing user
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user in the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // 2. Compare the typed password with the scrambled one in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // 3. Create the VIP Wristband (JWT)
    const token = jwt.sign(
      { userId: user._id, username: user.username, groupId: user.groupId },
      process.env.JWT_SECRET,
      { expiresIn: "36h" } // The user stays logged in for 36 hours
    );

    // 4. Send the wristband and user info back to the React app
    res.json({
      token: token,
      user: { username: user.username, groupId: user.groupId }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// ==========================================
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
    // TEMPORARY FIX: Hardcoding this so your React app doesn't break right now!
    // We will change this to the real logged-in user in Phase 3.
    creatorName: "DatabaseAdmin", 
    listType: "personal"
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