const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({ secret: 'supersecretkey', resave: false, saveUninitialized: true }));

mongoose.connect('mongodb+srv://devenbhattacharya:deven123@app-comment.583cy.mongodb.net/commentsApp', {
  useNewUrlParser: true, useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({ username: { type: String, unique: true, required: true } });
const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({ username: String, comment: String, timestamp: { type: Date, default: Date.now } });
const Comment = mongoose.model('Comment', commentSchema);

app.post('/login', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });
  if (!user) user = await new User({ username }).save();
  req.session.username = username;
  res.json({ message: 'Login successful!', username });
});

app.post('/logout', (req, res) => { req.session.destroy(); res.json({ message: 'Logged out' }); });

app.get('/comments', async (req, res) => res.json(await Comment.find().sort({ timestamp: -1 })));

app.post('/comments', async (req, res) => {
  if (!req.session.username) return res.status(401).json({ error: 'Login required' });
  res.status(201).json(await new Comment({ username: req.session.username, comment: req.body.comment }).save());
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
