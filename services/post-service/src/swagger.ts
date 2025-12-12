import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WallMe Post Service API',
      version: '1.0.0',
      description: 'Post management service for WallMe - Handles creating and retrieving posts with Redis Pub/Sub integration',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Post: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Post ID',
            },
            content: {
              type: 'string',
              description: 'Post content',
            },
            user_id: {
              type: 'integer',
              description: 'ID of the user who created the post',
            },
            username: {
              type: 'string',
              description: 'Username of the post author',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Post creation timestamp',
            },
          },
        },
        CreatePostRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'Post content (max 500 characters)',
              maxLength: 500,
            },
          },
        },
        CreatePostResponse: {
          type: 'object',
          properties: {
            post: {
              $ref: '#/components/schemas/Post',
            },
          },
        },
        GetPostsResponse: {
          type: 'object',
          properties: {
            posts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Post',
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from auth service',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)