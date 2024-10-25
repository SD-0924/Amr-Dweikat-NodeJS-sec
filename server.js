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
  const fileNames = fs.readdirSync("./data", "utf-8");
  // Render homepage
  res.render("index", { files: fileNames });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Function to check if file name valid or not
function isValidFileName(fileName) {
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

const checkFileName = (source) => {
  return (req, res, next) => {
    const fileName =
      source === "params" ? req.params.filename : req.body.fileName;

    // Check if the filename contains illegal characters, is too long, or lacks a valid extension
    if (!isValidFileName(fileName)) {
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
const isFileExists = (source) => {
  return (req, res, next) => {
    let fileName;
    if (source === "post") {
      fileName = req.body.fileName;
    } else {
      fileName = req.params.filename;
    }
    const exist = fs.existsSync(`./data/${fileName}`);
    if (source === "post" && exist) {
      return res.status(404).json({
        message: "Error",
        details:
          "The file that you are trying to create it is already exist please enter different name",
      });
    } else if (source !== "post" && !exist) {
      let errorMessage;
      if (source === "get") {
        errorMessage =
          'The file that you are trying to fetch does not exist in the "data" directory, please check again';
      } else if (source === "patch") {
        errorMessage =
          'The file that you are trying to modfiy does not exist in the "data" directory, please check again';
      } else {
        errorMessage =
          "The file that you are trying to delete it does not exist in 'data' folder";
      }
      return res.status(404).json({
        message: "Error",
        details: errorMessage,
      });
    }
    next();
  };
};

// Define a GET route to view the content of a specific file
app.get(
  "/files/:filename",
  [checkFileName("params"), isFileExists("get")],
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
        "The request body should be in JSON format and contains a 'fileName' property, which represents the file name that you want to create",
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
        "The request body should be in JSON format and contains a 'fileContent' property, which represents the content of file that you want to create",
    });
  }
  next();
};

// Middleware to check the content of file
const isValidFileContent = (req, res, next) => {
  if (
    req.body.fileContent === null ||
    typeof req.body.fileContent !== "string"
  ) {
    return res.status(400).json({
      message: "Error",
      details:
        "Invalid file content , make sure that the file content is 'string'",
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
    checkFileName("body"),
    isFileExists("post"),
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
// app.post last route checked
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
        "Your body request should be in JSON format and contains either 'newFileName' property or 'newFileContent' property or both of them",
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
    if (fs.existsSync(`./data/${req.body.newFileName}`)) {
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
    if (
      req.body.newFileContent === null ||
      typeof req.body.newFileContent !== "string"
    ) {
      return res.status(400).json({
        message: "Error",
        details:
          "Invalid new file content , make sure that the new file content is 'string'",
      });
    }
  }
  next();
};

// Define a PATCH route to modify file name or/and file content
app.patch(
  "/files/:filename",
  [
    checkFileName("params"),
    isFileExists("patch"),
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
        req.body.newFileContent
      );
    }
    if (
      req.body.hasOwnProperty("newFileContent") &&
      !req.body.hasOwnProperty("newFileName")
    ) {
      fs.writeFileSync(
        `./data/${req.params.filename}`,
        req.body.newFileContent
      );
    }
    res
      .status(200)
      .json({ message: "Sucess", details: "File updated successfully" });
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Define a DELETE route to delete file
app.delete(
  "/files/:filename",
  [checkFileName("params"), isFileExists("delete")],
  (req, res) => {
    fs.unlinkSync(`./data/${req.params.filename}`);
    res
      .status(200)
      .json({ message: "Sucess", details: "File deleted successfully" });
  }
);

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Middleware to handle invalid routes
app.use((req, res) => {
  res.status(404).json({
    message: "Invalid route",
    details:
      "Please use one of the available routes: /, /create, or /files/filename",
  });
});

// Error handling middleware for syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON structure" });
  }
});

// Make the server start listening
app.listen(PORT, HOSTNAME, () => {
  console.log(`Server is running on http://${HOSTNAME}:${PORT}`);
});
