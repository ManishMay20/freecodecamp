const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(
  "mongodb+srv://manishpatidar73289:ptVFfcdf7TYXtTz1@cluster0.cet6kcp.mongodb.net/exercise_tracker",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define Mongoose schema
const userSchema = new mongoose.Schema({
  username: String,
});
const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Routes
app.post("/api/users", (req, res) => {
  const { username } = req.body;
  User.create({ username })
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error creating user" });
    });
});

app.get("/api/users", (req, res) => {
  User.find({})
    .then((users) => {
      const userList = users.map((user) => ({
        username: user.username,
        _id: user._id,
      }));
      res.json(userList);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error fetching users" });
    });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const exercise = new Exercise({
    userId: _id,
    description,
    duration,
    date: date ? new Date(date) : new Date(),
  });
  exercise
    .save()
    .then((savedExercise) => {
      return User.findById(_id);
    })
    .then((user) => {
      res.json({
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: user._id,
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error saving exercise" });
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const query = { userId: _id };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  Exercise.find(query)
    .limit(limit ? parseInt(limit) : null)
    .then((exercises) => {
      return User.findById(_id).then((user) => {
        const log = exercises.map((exercise) => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
        }));
        res.json({
          username: user.username,
          count: exercises.length,
          _id: user._id,
          log,
        });
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error fetching exercises" });
    });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
