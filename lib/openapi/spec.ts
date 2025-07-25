import { OpenAPIV3 } from 'openapi-types'

export async function getOpenAPISpec(): Promise<OpenAPIV3.Document> {
  const spec: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      title: 'Inbound API',
      description: 'Public API for Inbound email management service',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@inbound.new',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/api/v1/domains': {
        get: {
          summary: 'List domains',
          description: 'Retrieve a list of all domains for the authenticated user',
          tags: ['Domains'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of items per page',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of domains',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      domains: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Domain' },
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
        post: {
          summary: 'Create domain',
          description: 'Add a new domain for email receiving',
          tags: ['Domains'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['domain'],
                  properties: {
                    domain: {
                      type: 'string',
                      format: 'hostname',
                      example: 'example.com',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Domain created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Domain' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '409': {
              description: 'Domain already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
      '/api/v1/domains/{domainId}': {
        get: {
          summary: 'Get domain details',
          description: 'Retrieve detailed information about a specific domain',
          tags: ['Domains'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'domainId',
              in: 'path',
              required: true,
              description: 'Domain ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Domain details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DomainDetails' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
        delete: {
          summary: 'Delete domain',
          description: 'Remove a domain and all associated email addresses',
          tags: ['Domains'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'domainId',
              in: 'path',
              required: true,
              description: 'Domain ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            '204': {
              description: 'Domain deleted successfully',
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
      '/api/v1/emails': {
        get: {
          summary: 'List emails',
          description: 'Retrieve a list of received emails',
          tags: ['Emails'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of items per page',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
            {
              name: 'domain',
              in: 'query',
              description: 'Filter by domain',
              required: false,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of emails',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      emails: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Email' },
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
      '/api/v1/emails/{emailId}': {
        get: {
          summary: 'Get email details',
          description: 'Retrieve detailed information about a specific email',
          tags: ['Emails'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'emailId',
              in: 'path',
              required: true,
              description: 'Email ID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Email details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EmailDetails' },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '404': { $ref: '#/components/responses/NotFound' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
      '/api/v1/webhooks': {
        get: {
          summary: 'List webhooks',
          description: 'Retrieve a list of configured webhooks',
          tags: ['Webhooks'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of webhooks',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      webhooks: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Webhook' },
                      },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
        post: {
          summary: 'Create webhook',
          description: 'Create a new webhook endpoint',
          tags: ['Webhooks'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'url'],
                  properties: {
                    name: {
                      type: 'string',
                      example: 'My Webhook',
                    },
                    url: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://api.example.com/webhook',
                    },
                    description: {
                      type: 'string',
                      example: 'Webhook for processing emails',
                    },
                    timeout: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 300,
                      default: 30,
                    },
                    retryAttempts: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 10,
                      default: 3,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Webhook created successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Webhook' },
                },
              },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '500': { $ref: '#/components/responses/InternalServerError' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication endpoint',
        },
      },
      schemas: {
        Domain: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            domain: {
              type: 'string',
              format: 'hostname',
              example: 'example.com',
            },
            status: {
              type: 'string',
              enum: ['pending', 'verified', 'failed'],
              example: 'verified',
            },
            canReceiveEmails: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
          required: ['id', 'domain', 'status', 'canReceiveEmails', 'createdAt', 'updatedAt'],
        },
        DomainDetails: {
          allOf: [
            { $ref: '#/components/schemas/Domain' },
            {
              type: 'object',
              properties: {
                dnsRecords: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DnsRecord' },
                },
                emailAddresses: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/EmailAddress' },
                },
                stats: { $ref: '#/components/schemas/DomainStats' },
              },
            },
          ],
        },
        DnsRecord: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['TXT', 'MX'],
              example: 'TXT',
            },
            name: {
              type: 'string',
              example: '_amazonses.example.com',
            },
            value: {
              type: 'string',
              example: 'verification-token-here',
            },
            isVerified: {
              type: 'boolean',
              example: true,
            },
            isRequired: {
              type: 'boolean',
              example: true,
            },
          },
          required: ['type', 'name', 'value', 'isVerified', 'isRequired'],
        },
        EmailAddress: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            address: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            webhookId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
          required: ['id', 'address', 'isActive', 'createdAt'],
        },
        DomainStats: {
          type: 'object',
          properties: {
            totalEmailAddresses: {
              type: 'integer',
              example: 5,
            },
            activeEmailAddresses: {
              type: 'integer',
              example: 3,
            },
            totalEmailsLast24h: {
              type: 'integer',
              example: 42,
            },
          },
          required: ['totalEmailAddresses', 'activeEmailAddresses', 'totalEmailsLast24h'],
        },
        Email: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            from: {
              type: 'string',
              format: 'email',
              example: 'sender@example.com',
            },
            to: {
              type: 'string',
              format: 'email',
              example: 'recipient@yourdomain.com',
            },
            subject: {
              type: 'string',
              example: 'Hello World',
            },
            receivedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            size: {
              type: 'integer',
              description: 'Email size in bytes',
              example: 1024,
            },
          },
          required: ['id', 'from', 'to', 'subject', 'receivedAt', 'size'],
        },
        EmailDetails: {
          allOf: [
            { $ref: '#/components/schemas/Email' },
            {
              type: 'object',
              properties: {
                htmlBody: {
                  type: 'string',
                  nullable: true,
                  example: '<p>Hello World</p>',
                },
                textBody: {
                  type: 'string',
                  nullable: true,
                  example: 'Hello World',
                },
                headers: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                  example: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Message-ID': '<message-id@example.com>',
                  },
                },
                attachments: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Attachment' },
                },
              },
            },
          ],
        },
        Attachment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            filename: {
              type: 'string',
              example: 'document.pdf',
            },
            contentType: {
              type: 'string',
              example: 'application/pdf',
            },
            size: {
              type: 'integer',
              description: 'Attachment size in bytes',
              example: 2048,
            },
            downloadUrl: {
              type: 'string',
              format: 'uri',
              example: 'https://api.example.com/attachments/123e4567-e89b-12d3-a456-426614174000',
            },
          },
          required: ['id', 'filename', 'contentType', 'size', 'downloadUrl'],
        },
        Webhook: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'My Webhook',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://api.example.com/webhook',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Webhook for processing emails',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            timeout: {
              type: 'integer',
              example: 30,
            },
            retryAttempts: {
              type: 'integer',
              example: 3,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
            },
          },
          required: ['id', 'name', 'url', 'isActive', 'timeout', 'retryAttempts', 'createdAt', 'updatedAt'],
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              example: 1,
            },
            limit: {
              type: 'integer',
              minimum: 1,
              example: 20,
            },
            total: {
              type: 'integer',
              minimum: 0,
              example: 100,
            },
            totalPages: {
              type: 'integer',
              minimum: 0,
              example: 5,
            },
          },
          required: ['page', 'limit', 'total', 'totalPages'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Bad Request',
            },
            message: {
              type: 'string',
              example: 'The request could not be understood by the server',
            },
            code: {
              type: 'string',
              example: 'INVALID_REQUEST',
            },
            details: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
            },
          },
          required: ['error', 'message'],
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Domains',
        description: 'Domain management operations',
      },
      {
        name: 'Emails',
        description: 'Email retrieval and management operations',
      },
      {
        name: 'Webhooks',
        description: 'Webhook configuration and management operations',
      },
    ],
  }

  return spec
} 