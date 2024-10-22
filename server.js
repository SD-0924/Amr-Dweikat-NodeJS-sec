// Import express module
const express = require("express");

// Import path module
const path = require("path");

// Import fs module
const fs = require("fs");

// Server hostname and port
const HOSTNAME = "localhost";
const PORT = 3000;

// Initialize an Express application
const app = express();

// Configures an Express application to use EJS as the template engine
app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Define a GET route
app.get("/", (req, res) => {
  // Get all file names inside the data directory
  const fileNames = fs.readdirSync("./data", "utf-8");
  // Render homepage
  res.render("index", { files: fileNames });
});

// Make the server start listening
app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
});
