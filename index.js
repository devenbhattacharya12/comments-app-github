// index.js (Backend) - Safe Space App
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Hash passwords
const jwt = require('jsonwebtoken'); // Secure authentication

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// Debug: Ensure MONGO_URI is read correctly
const MONGO_URI = process.env.MONGO_URI || "";
console.log("🔍 Checking MONGO_URI:", MONGO_URI);

if (!MONGO_URI || MONGO_URI.trim() === "") {
  console.error("❌ MONGO_URI is missing or empty! Check Render environment variables.");
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// User Schema with Password Hashing
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Store hashed passwords
  lastPostedAt: { type: Date, default: null }
});
const User = mongoose.model('User', userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  username: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] } // Track users who liked
});
const Comment = mongoose.model('Comment', commentSchema);

// ================== AUTHENTICATION ROUTES ==================

// Register User with Hashed Password
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login User and Generate JWT Token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful!', token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Middleware to Verify JWT Token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });

    req.user = user;
    next();
  });
};

// ================== COMMENTS ROUTES ==================

// Fetch All Comments
app.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ timestamp: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a New Comment (Requires Authentication)
app.post('/comments', authenticateToken, async (req, res) => {
  const { comment } = req.body;
  const username = req.user.username;

  if (!comment) {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    const newComment = new Comment({ username, comment });
    await newComment.save();

    await User.findOneAndUpdate(
      { username },
      { lastPostedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Comment added!', comment: newComment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// Like a Comment (Prevents Duplicate Likes)
app.post('/like-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.likedBy.includes(username)) {
      return res.status(400).json({ error: 'You have already liked this comment.' });
    }

    comment.likes += 1;
    comment.likedBy.push(username);
    await comment.save();

    res.json({ message: 'Comment liked!', likes: comment.likes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment.' });
  }
});

// Check for new comments since the last checked time
app.get('/new-comments', authenticateToken, async (req, res) => {
  const { username, since } = req.query;

  if (!username || !since) {
    return res.status(400).json({ error: 'Username and last checked timestamp are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newComments = await Comment.find({
      timestamp: { $gt: new Date(since) }
    });

    res.json({ newComments, count: newComments.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check new comments.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Safe Space is running at http://localhost:${PORT}`);
});
