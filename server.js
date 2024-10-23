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

// Define a GET route to list all files in the "data" directory
app.get("/", (req, res) => {
  // Get all file names inside the data directory
  const fileNames = getFileNames();
  // Render homepage
  res.render("index", { files: fileNames });
});

// Middleware to check if file exist or not
const fileExists = (req, res, next) => {
  const files = getFileNames();
  if (files.indexOf(req.params.filename) == -1) {
    return res.status(404).json({
      message: "Invalid file",
      details:
        'Either the file name is incorrect, or the file does not exist in the "data" directory, please check again',
    });
  }
  next();
};

// Middleware to check whether the body data is in JSON format
const validateBodyData = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Invalid body data",
      details: "The request body should be in JSON format",
    });
  }
  next();
};

// Middleware to check whether the body data contains a file name
const validateFileNameInBody = (req, res, next) => {
  if (!req.body.hasOwnProperty("name")) {
    return res.status(400).json({
      message: "Invalid body data",
      details:
        "The request body should contain a 'name' property, which represents the file name you want to create",
    });
  } else if (!req.body.name) {
    return res.status(400).json({
      message: "Invalid file name",
      details:
        "You should provide 'name' property, which represents the file name you want to create",
    });
  }
};
const doesFileExist = (req, res, next) => {};
const validateFileContentInBody = (req, res, next) => {};

// Define a POST route to create a new file with a specified name and content
app.post(
  "/",
  [
    express.json(),
    validateBodyData,
    validateFileNameInBody,
    doesFileExist,
    validateFileContentInBody,
  ],
  (req, res) => {
    const data = fs.writeFileSync(`./data/${req.body.name}`, req.body.content);
    res
      .status(201)
      .json({ message: "Sucess", details: "File created successfully" });
  }
);

// Define a GET route to view the content of a specific file
app.get("/files/:filename", [fileExists], (req, res) => {
  const data = fs.readFileSync(`./data/${req.params.filename}`, "utf-8");
  res.render("detail", { fileContent: data });
});

// Middleware to handle invalid routes
app.use((req, res, next) => {
  res.status(404).json({
    message: "Invalid route",
    details:
      "Please use one of the available routes: /, /create, or /files/filename",
  });
});

// Make the server start listening
app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
});
