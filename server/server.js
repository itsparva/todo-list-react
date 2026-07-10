// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();

app.use(express.json()); 
app.use(cors()); 

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// --- 1. Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  groupId: { type: String, default: "group-01" } 
});
const User = mongoose.model("User", userSchema);

const todoSchema = new mongoose.Schema({
  todo: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
  creatorName: { type: String, required: true }, 
  listType: { type: String, enum: ['personal', 'group'], default: 'personal' } 
}, { timestamps: true }); 
const Todo = mongoose.model("Todo", todoSchema);

// --- 2. Authentication Routes ---
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Username already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword, groupId: "group-01" });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error during signup" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

    const token = jwt.sign(
      { userId: user._id, username: user.username, groupId: user.groupId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } 
    );
    res.json({ token, user: { username: user.username, groupId: user.groupId } });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});


// ==========================================
//        PHASE 3: THE BOUNCER (MIDDLEWARE)
// ==========================================
const authenticateToken = (req, res, next) => {
  // 1. Look for the wristband in the request headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extracts token from "Bearer <token>"

  // 2. If no wristband, kick them out
  if (!token) return res.status(401).json({ message: "Access Denied: No VIP wristband!" });

  // 3. Check if the wristband is real and not forged
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired wristband!" });
    
    // 4. It's real! Attach the user's name/group to the request so the next route knows who they are
    req.user = user; 
    next(); // Step aside and let them in!
  });
};

// ==========================================
//        SECURED WISHLIST ROUTES
// ==========================================

// GET: Fetch all todos (Secured)
app.get("/todos", authenticateToken, async (req, res) => {
  // For now, we will return all tasks. We will filter them in React!
  const todos = await Todo.find();
  res.json(todos);
});

// POST: Add a new todo (Secured)
app.post("/todos", authenticateToken, async (req, res) => {
  const newTodo = new Todo({
    todo: req.body.todo,
    isCompleted: false,
    
    // NEW: The bouncer knows exactly who this is! We use their real name now.
    creatorName: req.user.username, 
    
    // NEW: We will send this from React when we build the switcher toggle
    listType: req.body.listType || 'personal' 
  });
  const savedTodo = await newTodo.save();
  res.json(savedTodo);
});

// DELETE: Remove a todo (Secured)
app.delete("/todos/:id", authenticateToken, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Task not found" });

    // THE GOLDEN RULE: Only the creator can delete it!
    if (todo.creatorName !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own tasks!" });
    }

    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update a todo (Secured)
app.put("/todos/:id", authenticateToken, async (req, res) => {
  const updatedTodo = await Todo.findByIdAndUpdate(
    req.params.id, 
    req.body,
    { new: true } 
  );
  res.json(updatedTodo);
});

// Start the server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});