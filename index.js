const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // Import mongoose for MongoDB connection
const cors = require('cors'); // Allows cross-origin requests (optional)

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON and form data
app.use(cors()); // Enable CORS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB Atlas connection string
mongoose
  .connect('mongodb+srv://devenbhattacharya:deven123@app-comment.583cy.mongodb.net/commentsApp?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Failed to connect to MongoDB Atlas:', err));

// Define a Mongoose schema and model for comments
const commentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  comment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);

// Serve static files (frontend)
app.use(express.static('public'));

// Endpoint to fetch all comments from MongoDB
app.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ timestamp: -1 }); // Most recent first
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Endpoint to add a new comment to MongoDB
app.post('/comments', async (req, res) => {
  const { name, comment } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ error: 'Name and comment are required.' });
  }

  try {
    const newComment = new Comment({ name, comment });
    await newComment.save();
    res.status(201).json({ message: 'Comment added!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
