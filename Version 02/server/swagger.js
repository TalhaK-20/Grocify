const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ba grocery APIs',
      version: '1.0.0',
      description: 'Talha Khalid - Full Stack Developer',
    },
    servers: [
      {
        url: 'https://ba-grocery.onrender.com/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/api/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };