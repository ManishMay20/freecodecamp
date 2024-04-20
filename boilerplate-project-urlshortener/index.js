require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const shortid = require("shortid");
const validator = require("validator");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Parse JSON bodies
app.use(bodyParser.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const urlDatabase = {};

app.post("/api/shorturl", function (req, res, next) {
  const original_url = req.body.url;
  if (!validator.isURL(original_url)) {
    return res.json({ error: "invalid url" });
  }
  console.log(original_url);

  const shortId = shortid.generate();

  urlDatabase[shortId] = original_url;
  res.json({
    original_url: original_url,
    short_url: shortId,
  });
});

app.get("/api/shorturl/:short_url", function (req, res, next) {
  const short_id = req.params.short_url;
  const original_url = urlDatabase[short_id];
  console.log(original_url);
  if (original_url) {
    res.redirect(original_url);
  } else {
    res.send("not found");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
