require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path'); // Add this import
const fs = require('fs'); // Add this import

const keys = require('./config/keys');
const routes = require('./routes');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { specs, swaggerUi } = require('./swagger');
const { port } = keys;
const app = express();

// Create uploads directory for temporary file storage
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
  console.log(`${chalk.green('✓')} ${chalk.blue('Created uploads directory')}`);
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors());

setupDB();
require('./config/passport')(app);
app.use(routes);

// Add error handling middleware for file uploads
app.use((error, req, res, next) => {
  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size allowed is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field name for file upload.'
      });
    }
  }
  
  // Handle file type validation errors
  if (error.message && error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      error: 'Only image files are allowed (jpeg, png, gif, webp).'
    });
  }
  
  // Pass other errors to default error handler
  next(error);
});

// General error handler (keep your existing one if you have it)
app.use((error, req, res, next) => {
  console.error(`${chalk.red('✗')} Server error:`, error);
  
  // Don't send error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error. Please try again.'
    });
  } else {
    res.status(500).json({
      error: error.message || 'Internal server error. Please try again.',
      stack: error.stack
    });
  }
});

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
  console.log(
    `${chalk.green('✓')} ${chalk.blue('Google Drive upload system ready')}`
  );
});
socket(server);