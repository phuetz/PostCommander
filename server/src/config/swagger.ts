import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PostCommander API',
      version: '1.0.0',
      description: 'API for PostCommander, allowing external LLMs to interact with the platform.',
      contact: {
        name: 'PostCommander Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development Server',
      },
      {
        url: 'https://api.postcommander.com',
        description: 'Production Server',
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
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Scan for JSDoc annotations
};

export const swaggerSpec = swaggerJsdoc(options);
