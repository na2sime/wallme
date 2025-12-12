import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WallMe Gateway API',
      version: '1.0.0',
      description: 'API Gateway for WallMe - Proxies requests to microservices and provides SSE streaming for real-time updates',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        PostEvent: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['post.created'],
              description: 'Event type',
            },
            data: {
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
                  description: 'User ID',
                },
                username: {
                  type: 'string',
                  description: 'Username',
                },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation timestamp',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)