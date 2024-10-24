// Import express module
const express = require("express");

// Import path module
const path = require("path");

// Import fs module
const fs = require("fs");

// Import body-parser module
const bodyParser = require("body-parser");

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

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define a GET route to list all files in the "data" directory
app.get("/", (req, res) => {
  // Get all file names inside the data directory
  const fileNames = getFileNames();
  // Render homepage
  res.render("index", { files: fileNames });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Function to check if file name valid or not
function isFileNameValid(fileName) {
  // Check if the string is non-empty
  if (!fileName) {
    return false;
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  if (invalidChars.test(fileName)) {
    return false;
  }

  // Check if the file name has a valid extension
  const extensionPattern = /\.[^\\/.]+$/; // Checks for a dot followed by at least one character
  if (!extensionPattern.test(fileName)) {
    return false;
  }

  return true;
}

// Middleware to check if file name valid or not

const isValidFileName = (source) => {
  return (req, res, next) => {
    const fileName =
      source === "params" ? req.params.filename : req.body.fileName;

    // Check if the filename contains illegal characters, is too long, or lacks a valid extension
    if (!isFileNameValid(fileName)) {
      // Invalid file name
      return res.status(400).json({
        message: "Error",
        details: "Invalid file name",
      });
    }

    next();
  };
};

// Middleware to check if file exist or not
const isFileExists = (req, res, next) => {
  const files = getFileNames();
  if (files.indexOf(req.params.filename) == -1) {
    return res.status(404).json({
      message: "Error",
      details:
        'The file does not exist in the "data" directory, please check again',
    });
  }
  next();
};

// Define a GET route to view the content of a specific file
app.get(
  "/files/:filename",
  [isValidFileName("params"), isFileExists],
  (req, res) => {
    const data = fs.readFileSync(`./data/${req.params.filename}`, "utf-8");
    res.render("detail", { fileContent: data });
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define a GET route to render create file page
app.get("/create", (req, res) => {
  res.render("create");
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Middleware to check whether the body data contains a file name
const validateFileNameInBody = (req, res, next) => {
  if (!req.body.hasOwnProperty("fileName")) {
    return res.status(400).json({
      message: "Error",
      details:
        "The request body should contain a 'fileName' property, which represents the file name you want to create",
    });
  }
  next();
};

// Middleware to check the content of file
const validateFileContentInBody = (req, res, next) => {
  if (!req.body.hasOwnProperty("fileContent")) {
    return res.status(400).json({
      message: "Error",
      details:
        "The request body should contain a 'fileContent' property, which represents the file content you want to create",
    });
  }
  next();
};

// Middleware to check if file already exist or not
const doesFileAlreadyExist = (req, res, next) => {
  const files = getFileNames();
  if (files.indexOf(req.body.fileName) === -1) {
    return res.status(409).json({
      message: "Error",
      details:
        "The file that you are trying to create it is already exist please enter different name",
    });
  }
  next();
};

// Middleware to check the content of file
const isValidFileContent = (req, res, next) => {
  if (req.body.fileContent === null) {
    return res.status(400).json({
      message: "Error",
      details: "Invalid file content",
    });
  }

  next();
};

// Define a POST route to create a new file with a specified name and content
app.post(
  "/create",
  [
    bodyParser.urlencoded({ extended: true }),
    express.json(),
    validateFileNameInBody,
    validateFileContentInBody,
    isValidFileName("body"),
    doesFileAlreadyExist,
    isValidFileContent,
  ],
  (req, res) => {
    const data = fs.writeFileSync(
      `./data/${req.body.fileName}`,
      req.body.fileContent
    );
    res
      .status(201)
      .json({ message: "Sucess", details: "File created successfully" });
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Middleware to check if body request contains either new file name or new content
const validateFileAndContent = (req, res, next) => {
  if (
    !req.body.hasOwnProperty("newFileName") &&
    !req.body.hasOwnProperty("newFileContent")
  ) {
    return res.status(400).json({
      message: "Error",
      details:
        "Your body request should be in JSON format and contains either 'newFileName' property or 'newFileContent' property or both",
    });
  }
  next();
};

// Middleware to check if new file name valid or not if it exists
const validateNewFileName = (req, res, next) => {
  if (req.body.hasOwnProperty("newFileName")) {
    if (!isFileNameValid(req.body.newFileName)) {
      return res.status(400).json({
        message: "Error",
        details: "Invalid new file name",
      });
    }
  }
  next();
};

// Middleware to check if new file name same as file that alreay exist
const isFileNameTaken = (req, res, next) => {
  if (req.body.hasOwnProperty("newFileName")) {
    const files = getFileNames();
    if (files.indexOf(req.body.newFileName) !== -1) {
      return res.status(400).json({
        message: "Error",
        details:
          "You are trying to change the file name to one that already exists",
      });
    }
  }
  next();
};

// Middleware to check the new content of file
const validateNewFileContentInBody = (req, res, next) => {
  if (req.body.hasOwnProperty("newFileContent")) {
    if (req.body.newFileContent === null) {
      return res.status(400).json({
        message: "Error",
        details: "Invalid new file content",
      });
    }
  }
  next();
};

// Define a PATCH route to modify file name or/and file content
app.patch(
  "/files/:filename",
  [
    isValidFileName("params"),
    isFileExists,
    express.json(),
    validateFileAndContent,
    validateNewFileName,
    isFileNameTaken,
    validateNewFileContentInBody,
  ],
  (req, res) => {
    if (req.body.hasOwnProperty("newFileName")) {
      fs.renameSync(
        `./data/${req.params.filename}`,
        `./data/${req.body.newFileName}`
      );
    }
    if (
      req.body.hasOwnProperty("newFileContent") &&
      req.body.hasOwnProperty("newFileName")
    ) {
      fs.writeFileSync(
        `./data/${req.body.newFileName}`,
        String(req.body.newFileContent)
      );
    }
    if (
      req.body.hasOwnProperty("newFileContent") &&
      !req.body.hasOwnProperty("newFileName")
    ) {
      fs.writeFileSync(
        `./data/${req.params.filename}`,
        String(req.body.newFileContent)
      );
    }
    res
      .status(200)
      .json({ message: "Sucess", details: "File updated successfully" });
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define a DELETE route to delete file
app.delete("/files/:filename", [isValidFileName("params")], (req, res) => {
  const files = getFileNames();
  if (files.indexOf(req.params.filename) === -1) {
    return res.status(400).json({
      message: "Error",
      details:
        "The file that you are trying to delete it not exist in 'data' folder",
    });
  }
  fs.unlinkSync(`./data/${req.params.filename}`);
  res
    .status(200)
    .json({ message: "Sucess", details: "File deleted successfully" });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Middleware to handle invalid routes
app.use((req, res) => {
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
