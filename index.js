// index.js (Backend) - Safe Space App with Enhanced Features
require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Hash passwords
const jwt = require('jsonwebtoken'); // Secure authentication
const multer = require('multer'); // File upload handling
const path = require('path');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// User Schema with Password Hashing and Notifications
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // Store hashed passwords
  lastPostedAt: { type: Date, default: null },
  notifications: [{
    type: { type: String, enum: ['tag', 'reply'], required: true },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    fromUser: String,
    message: String,
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }]
});
const User = mongoose.model('User', userSchema);

// Enhanced Comment Schema with Replies, Media, and Tags
const commentSchema = new mongoose.Schema({
  username: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikedBy: { type: [String], default: [] },
  // NEW: Media support
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, enum: ['image', 'gif'], default: null },
  // NEW: Reply support
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  // NEW: Tagged users
  taggedUsers: { type: [String], default: [] }
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
    console.error('Registration error:', err);
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
    console.error('Login error:', err);
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

// Helper function to extract tagged users from comment text
function extractTaggedUsers(commentText) {
  const tagRegex = /@(\w+)/g;
  const tags = [];
  let match;
  while ((match = tagRegex.exec(commentText)) !== null) {
    tags.push(match[1]);
  }
  return [...new Set(tags)]; // Remove duplicates
}

// Helper function to create notifications for tagged users
async function createTagNotifications(taggedUsers, commentId, fromUser) {
  for (const username of taggedUsers) {
    try {
      await User.findOneAndUpdate(
        { username },
        {
          $push: {
            notifications: {
              type: 'tag',
              commentId,
              fromUser,
              message: `${fromUser} tagged you in a comment`,
              timestamp: new Date()
            }
          }
        }
      );
    } catch (err) {
      console.error(`Error creating notification for ${username}:`, err);
    }
  }
}

// Fetch All Comments with Replies
app.get('/comments', async (req, res) => {
  try {
    // Get top-level comments (no parent) with their replies
    const comments = await Comment.find({ parentCommentId: null })
      .populate('replies')
      .sort({ timestamp: -1 });
    
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get replies for a specific comment
app.get('/comments/:commentId/replies', async (req, res) => {
  try {
    const replies = await Comment.find({ parentCommentId: req.params.commentId })
      .sort({ timestamp: 1 });
    res.json(replies);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Add a New Comment or Reply (with optional media upload)
app.post('/comments', authenticateToken, upload.single('media'), async (req, res) => {
  const { comment, parentCommentId } = req.body;
  const username = req.user.username;

  if (!comment) {
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    // Extract tagged users
    const taggedUsers = extractTaggedUsers(comment);
    
    // Prepare comment data
    const commentData = {
      username,
      comment,
      taggedUsers
    };

    // Add media if uploaded
    if (req.file) {
      commentData.mediaUrl = `/uploads/${req.file.filename}`;
      commentData.mediaType = req.file.mimetype.includes('gif') ? 'gif' : 'image';
    }

    // Add parent comment ID if this is a reply
    if (parentCommentId) {
      commentData.parentCommentId = parentCommentId;
    }

    const newComment = new Comment(commentData);
    await newComment.save();

    // If this is a reply, add it to the parent's replies array
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: newComment._id }
      });

      // Notify the parent comment author
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment && parentComment.username !== username) {
        await User.findOneAndUpdate(
          { username: parentComment.username },
          {
            $push: {
              notifications: {
                type: 'reply',
                commentId: newComment._id,
                fromUser: username,
                message: `${username} replied to your comment`,
                timestamp: new Date()
              }
            }
          }
        );
      }
    }

    // Create notifications for tagged users
    if (taggedUsers.length > 0) {
      await createTagNotifications(taggedUsers, newComment._id, username);
    }

    // Update user's last posted time
    await User.findOneAndUpdate(
      { username },
      { lastPostedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Comment added!', comment: newComment });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// Like a Comment (Prevents Duplicate Likes and Removes Dislike if Present)
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

    // If user previously disliked, remove the dislike
    if (comment.dislikedBy.includes(username)) {
      comment.dislikes = Math.max(0, comment.dislikes - 1);
      comment.dislikedBy = comment.dislikedBy.filter(user => user !== username);
    }

    // Add the like
    comment.likes += 1;
    comment.likedBy.push(username);
    await comment.save();

    res.json({ 
      message: 'Comment liked!', 
      likes: comment.likes,
      dislikes: comment.dislikes 
    });
  } catch (err) {
    console.error('Error liking comment:', err);
    res.status(500).json({ error: 'Failed to like comment.' });
  }
});

// Dislike a Comment (Prevents Duplicate Dislikes and Removes Like if Present)
app.post('/dislike-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.dislikedBy.includes(username)) {
      return res.status(400).json({ error: 'You have already disliked this comment.' });
    }

    // If user previously liked, remove the like
    if (comment.likedBy.includes(username)) {
      comment.likes = Math.max(0, comment.likes - 1);
      comment.likedBy = comment.likedBy.filter(user => user !== username);
    }

    // Add the dislike
    comment.dislikes += 1;
    comment.dislikedBy.push(username);
    await comment.save();

    res.json({ 
      message: 'Comment disliked!', 
      likes: comment.likes,
      dislikes: comment.dislikes 
    });
  } catch (err) {
    console.error('Error disliking comment:', err);
    res.status(500).json({ error: 'Failed to dislike comment.' });
  }
});

// Remove Like from a Comment
app.post('/unlike-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!comment.likedBy.includes(username)) {
      return res.status(400).json({ error: 'You have not liked this comment.' });
    }

    comment.likes = Math.max(0, comment.likes - 1);
    comment.likedBy = comment.likedBy.filter(user => user !== username);
    await comment.save();

    res.json({ 
      message: 'Like removed!', 
      likes: comment.likes,
      dislikes: comment.dislikes 
    });
  } catch (err) {
    console.error('Error removing like:', err);
    res.status(500).json({ error: 'Failed to remove like.' });
  }
});

// Remove Dislike from a Comment
app.post('/undislike-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (!comment.dislikedBy.includes(username)) {
      return res.status(400).json({ error: 'You have not disliked this comment.' });
    }

    comment.dislikes = Math.max(0, comment.dislikes - 1);
    comment.dislikedBy = comment.dislikedBy.filter(user => user !== username);
    await comment.save();

    res.json({ 
      message: 'Dislike removed!', 
      likes: comment.likes,
      dislikes: comment.dislikes 
    });
  } catch (err) {
    console.error('Error removing dislike:', err);
    res.status(500).json({ error: 'Failed to remove dislike.' });
  }
});

// ================== NOTIFICATION ROUTES ==================

// Get user notifications
app.get('/notifications', authenticateToken, async (req, res) => {
  const username = req.user.username;
  
  try {
    const user = await User.findOne({ username }).populate('notifications.commentId');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const notifications = user.notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
app.post('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  const username = req.user.username;
  const notificationId = req.params.notificationId;
  
  try {
    await User.findOneAndUpdate(
      { username, 'notifications._id': notificationId },
      { $set: { 'notifications.$.read': true } }
    );
    
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// Get unread notification count
app.get('/notifications/unread-count', authenticateToken, async (req, res) => {
  const username = req.user.username;
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const unreadCount = user.notifications.filter(n => !n.read).length;
    res.json({ count: unreadCount });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

// Check for new comments since the user's last post
app.get('/new-comments', authenticateToken, async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get new comments since the last time the user posted a comment
    const lastPostedAt = user.lastPostedAt || new Date(0);
    const newComments = await Comment.find({
      timestamp: { $gt: lastPostedAt }
    });

    res.json({ newComments, count: newComments.length });
  } catch (err) {
    console.error('Error checking new comments:', err);
    res.status(500).json({ error: 'Failed to check new comments.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Safe Space is running at http://localhost:${PORT}`);
});