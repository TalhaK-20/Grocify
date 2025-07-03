# API Documentation with Swagger UI

This project includes interactive API documentation using Swagger UI. This guide will help you set up and use the Swagger documentation for your Node.js application.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Accessing Swagger UI](#accessing-swagger-ui)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🔍 Overview

Swagger UI provides a user-friendly interface to interact with your API endpoints. It automatically generates documentation based on your API specifications and allows you to test endpoints directly from the browser.

## ✅ Prerequisites

Before setting up Swagger UI, ensure you have the following installed:

- **Node.js** (version 14.x or higher)
- **npm** or **yarn** package manager
- Basic knowledge of REST APIs
- Text editor (VS Code recommended)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/TalhaK-20/Grocify.git
cd Version 02
```

### 2. Install Dependencies

```bash
npm install
```

The following Swagger-related packages should be included in your `package.json`:

```json
{
  "dependencies": {
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^4.6.3",
    "express": "^4.18.2"
  }
}
```

If not already installed, add them manually:

```bash
npm install swagger-jsdoc swagger-ui-express
```

## ⚙️ Configuration

### 1. Swagger Configuration File

The Swagger configuration is located in `/server/swagger.js`. This file contains:

- API information (title, version, description)
- Server configuration
- API specification paths
- Security definitions

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development
API_VERSION=1.0.0
```

### 3. Basic Swagger Setup

Your `swagger.js` file should look similar to this:

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'A comprehensive API documentation for your application',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Using Nodemon (Recommended for Development)

```bash
npm install -g nodemon
nodemon index.js
```

## 🌐 Accessing Swagger UI

Once your application is running, you can access the Swagger UI documentation at:

```
http://localhost:3000/api-docs
```

### Default Endpoints

- **API Documentation**: `http://localhost:3000/api-docs`
- **API JSON**: `http://localhost:3000/api-docs.json`
- **Main Application**: `http://localhost:3000`

## 📖 API Documentation

### Writing API Documentation Comments

Use JSDoc comments in your route files to document endpoints:

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 */
router.get('/users', (req, res) => {
  // Your route logic here
});
```

### Common Swagger Annotations

#### GET Request
```javascript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 */
```

#### POST Request
```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 */
```

## 📁 Project Structure

```
├── .vscode/
├── client/
├── node_modules/
├── server/
│   ├── config/
│   ├── constants/
│   ├── middleware/
│   ├── models/
│   ├── node_modules/
│   ├── routes/           # API routes with Swagger documentation
│   ├── services/
│   ├── socket/
│   ├── utils/
│   └── swagger.js        # Swagger configuration
├── .env
├── Dockerfile
├── index.js              # Main application entry point
├── nodemon.json
├── package-lock.json
├── package.json
├── swagger.js            # Additional Swagger setup
├── docker-compose.yml
├── package-lock.json
└── package.json
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Swagger UI Not Loading

**Problem**: Swagger UI shows blank page or 404 error

**Solution**:
- Verify the `/api-docs` route is properly configured in your main app file
- Check that swagger.js is correctly imported
- Ensure all dependencies are installed

```javascript
// In your main index.js or app.js
const { swaggerUi, specs } = require('./server/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

#### 2. API Routes Not Appearing

**Problem**: Swagger UI loads but doesn't show your API routes

**Solution**:
- Check the `apis` path in your swagger configuration
- Ensure JSDoc comments are properly formatted
- Verify route files are in the correct directory

#### 3. Invalid Swagger Specification

**Problem**: Swagger shows specification errors

**Solution**:
- Validate your YAML/JSON syntax
- Check for missing required fields
- Use proper indentation in JSDoc comments

### 4. Port Issues

**Problem**: Application won't start due to port conflicts

**Solution**:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm start
```

## 🎯 Best Practices

### Documentation Guidelines

1. **Consistent Tagging**: Group related endpoints using tags
2. **Detailed Descriptions**: Provide clear, concise descriptions for all endpoints
3. **Request/Response Examples**: Include example payloads
4. **Error Responses**: Document all possible error responses
5. **Authentication**: Clearly specify authentication requirements

### Example Complete Endpoint Documentation

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             name: "John Doe"
 *             email: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
```

## 🔐 Security Considerations

### Authentication Documentation

If your API uses authentication, document it in Swagger:

```javascript
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/protected-route:
 *   get:
 *     summary: Protected endpoint
 *     security:
 *       - bearerAuth: []
 */
```

## 🤝 Contributing

When adding new API endpoints:

1. Add proper Swagger documentation comments
2. Include request/response examples
3. Test the endpoint in Swagger UI
4. Update this README if necessary

### Documentation Standards

- Use clear, descriptive summaries
- Include all possible response codes
- Add examples for complex request bodies
- Group related endpoints with consistent tags

## 📝 Additional Resources

- [Swagger Documentation](https://swagger.io/docs/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Express.js Documentation](https://expressjs.com/)

## 📞 Support

If you encounter any issues with the API documentation:

1. Check the console for error messages
2. Verify your Swagger annotations syntax
3. Ensure all dependencies are properly installed
4. Review the troubleshooting section above

---

**Happy coding! 🚀**

> **Note**: This documentation is automatically generated and updated. For the most current API information, always refer to the live Swagger UI interface.