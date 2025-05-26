// index.js (Backend) - Safe Space App - Step 2: Adding Replies and Tagging
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

// User Schema with notifications
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  lastPostedAt: { type: Date, default: null },
  // NEW: Add notifications
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

// Comment Schema with replies and tagging
const commentSchema = new mongoose.Schema({
  username: String,
  comment: String,
  timestamp: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikedBy: { type: [String], default: [] },
  // NEW: Add reply support
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  // NEW: Add tagging support
  taggedUsers: { type: [String], default: [] }
});
const Comment = mongoose.model('Comment', commentSchema);

// ================== AUTHENTICATION ROUTES ==================

// Register User with Hashed Password
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  console.log('Register attempt:', { username, passwordLength: password?.length });

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

    console.log('User registered successfully:', username);
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// Login User and Generate JWT Token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username });

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'User not found. Please register.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful:', username);
    res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Middleware to Verify JWT Token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('Auth check - Token present:', !!token);

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid token.' });
    }

    console.log('Token verified for user:', user.username);
    req.user = user;
    next();
  });
};

// ================== HELPER FUNCTIONS ==================

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
      // First ensure the user exists and has a notifications array
      const user = await User.findOne({ username });
      if (!user) {
        console.log(`User ${username} not found, skipping notification`);
        continue;
      }

      // Initialize notifications array if it doesn't exist
      if (!user.notifications) {
        user.notifications = [];
      }

      // Add the notification
      user.notifications.push({
        type: 'tag',
        commentId,
        fromUser,
        message: `${fromUser} tagged you in a comment`,
        timestamp: new Date()
      });

      await user.save();
      console.log(`Created tag notification for ${username}`);
    } catch (err) {
      console.error(`Error creating notification for ${username}:`, err);
    }
  }
}

// ================== COMMENTS ROUTES ==================

// Fetch All Comments with Replies
app.get('/comments', async (req, res) => {
  console.log('Fetching comments...');
  try {
    // Get top-level comments (no parent) and populate their replies
    const comments = await Comment.find({ parentCommentId: null })
      .populate('replies')
      .sort({ timestamp: -1 });
    console.log('Found top-level comments:', comments.length);
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get replies for a specific comment
app.get('/comments/:commentId/replies', async (req, res) => {
  console.log('Fetching replies for comment:', req.params.commentId);
  try {
    const replies = await Comment.find({ parentCommentId: req.params.commentId })
      .sort({ timestamp: 1 });
    console.log('Found replies:', replies.length);
    res.json(replies);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Add a New Comment or Reply
app.post('/comments', authenticateToken, async (req, res) => {
  const { comment, parentCommentId } = req.body;
  const username = req.user.username;

  console.log('Comment attempt:', { username, commentLength: comment?.length, isReply: !!parentCommentId });

  if (!comment || comment.trim() === '') {
    console.log('Empty comment rejected');
    return res.status(400).json({ error: 'Comment cannot be empty.' });
  }

  try {
    // Extract tagged users from the comment
    const taggedUsers = extractTaggedUsers(comment);
    console.log('Tagged users found:', taggedUsers);

    const newComment = new Comment({ 
      username, 
      comment: comment.trim(),
      parentCommentId: parentCommentId || null,
      taggedUsers
    });
    
    await newComment.save();
    console.log('Comment saved:', newComment._id);

    // If this is a reply, add it to the parent's replies array
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: newComment._id }
      });
      console.log('Added reply to parent comment');

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
        console.log(`Created reply notification for ${parentComment.username}`);
      }
    }

    // Create notifications for tagged users
    if (taggedUsers.length > 0) {
      await createTagNotifications(taggedUsers, newComment._id, username);
    }

    await User.findOneAndUpdate(
      { username },
      { lastPostedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log('User lastPostedAt updated:', username);
    res.status(201).json({ message: 'Comment added!', comment: newComment });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// Like a Comment
app.post('/like-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  
  console.log('Like attempt:', { commentId, username });

  if (!commentId) {
    console.log('No commentId provided');
    return res.status(400).json({ error: 'Comment ID is required.' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      console.log('Comment not found:', commentId);
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.likedBy.includes(username)) {
      console.log('User already liked this comment:', username, commentId);
      return res.status(400).json({ error: 'You have already liked this comment.' });
    }

    // If user previously disliked, remove the dislike
    if (comment.dislikedBy.includes(username)) {
      comment.dislikes = Math.max(0, comment.dislikes - 1);
      comment.dislikedBy = comment.dislikedBy.filter(user => user !== username);
      console.log('Removed previous dislike');
    }

    // Add the like
    comment.likes += 1;
    comment.likedBy.push(username);
    await comment.save();

    console.log('Comment liked successfully:', commentId, 'New likes:', comment.likes);
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

// Dislike a Comment
app.post('/dislike-comment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const username = req.user.username;
  
  console.log('Dislike attempt:', { commentId, username });

  if (!commentId) {
    return res.status(400).json({ error: 'Comment ID is required.' });
  }

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

    console.log('Comment disliked successfully:', commentId);
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

// ================== NOTIFICATION ROUTES ==================

// Get user notifications
app.get('/notifications', authenticateToken, async (req, res) => {
  const username = req.user.username;
  console.log('Fetching notifications for:', username);
  
  try {
    const user = await User.findOne({ username }).populate('notifications.commentId');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Handle users who don't have notifications field yet (backward compatibility)
    const notifications = user.notifications || [];
    const sortedNotifications = notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    console.log('Found notifications:', sortedNotifications.length);
    res.json(sortedNotifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark notification as read
app.post('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  const username = req.user.username;
  const notificationId = req.params.notificationId;
  
  console.log('Marking notification as read:', { username, notificationId });
  
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

    // Handle users who don't have notifications field yet (backward compatibility)
    const notifications = user.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;
    console.log('Unread notifications for', username, ':', unreadCount);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Safe Space is running at http://localhost:${PORT}`);
});