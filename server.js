// Import express module
const express = require("express");

// Import path module
const path = require("path");

// Import fs module
const fs = require("fs");

// Server hostname and port
const HOSTNAME = "localhost";
const PORT = 3000;

// This function to bring all file names inside data folder
const getFileNames = () => fs.readdirSync("./data", "utf-8");

// Initialize an Express application
const app = express();

// Configures an Express application to use EJS as the template engine
app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Define a GET route to list all files
app.get("/", (req, res) => {
  // Get all file names inside the data directory
  const fileNames = getFileNames();
  // Render homepage
  res.render("index", { files: fileNames });
});

// Validate file name before render page
app.use("/files/:filename", (req, res, next) => {
  const filename = req.params.filename;
  if (!filename) {
    return res
      .status(400)
      .send("Error: you should provide filename inside URL.");
  }
  const files = getFileNames();
  if (files.indexOf(filename) == -1) {
    return res
      .status(404)
      .send(
        'Error: either the file name is incorrect, or the file does not exist in the "data" directory, please check again.'
      );
  }
  next();
});

// Define a GET route to render a specific file
app.get("/files/:filename", (req, res) => {
  const data = fs.readFileSync(`./data/${req.params.filename}`, "utf-8");
  res.render("detail", { fileName: req.params.filename, fileContent: data });
});

// Make the server start listening
app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
});
