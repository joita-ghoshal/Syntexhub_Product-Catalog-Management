/**
 * Minimal hand-written OpenAPI 3.0 specification for the Product Catalog
 * Management API. Served via swagger-ui-express at /api-docs.
 */
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Product Catalog Management API',
    version: '1.0.0',
    description:
      'A production-ready REST API for managing a product catalog, including CRUD operations, search, filtering, sorting, pagination, and aggregation analytics.',
    contact: { name: 'Joita Ghoshal' },
    license: { name: 'MIT' },
  },
  servers: [{ url: '/api/v1', description: 'Version 1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          brand: { type: 'string' },
          price: { type: 'number' },
          stockQuantity: { type: 'number' },
          sku: { type: 'string' },
          imageUrl: { type: 'string' },
          status: { type: 'string', enum: ['Available', 'Out Of Stock'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: { 200: { description: 'Service is healthy' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: { required: true },
        responses: { 201: { description: 'User registered' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login and receive a JWT',
        tags: ['Auth'],
        requestBody: { required: true },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/products': {
      get: {
        summary: 'Get all products (search, filter, sort, paginate)',
        tags: ['Products'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'List of products' } },
      },
      post: {
        summary: 'Create a new product',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/products/{id}': {
      get: {
        summary: 'Get a product by ID',
        tags: ['Products'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product found' }, 404: { description: 'Not found' } },
      },
      put: {
        summary: 'Update a product by ID',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product updated' } },
      },
      delete: {
        summary: 'Delete (soft-delete) a product by ID',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Product deleted' } },
      },
    },
    '/products/analytics/summary': {
      get: {
        summary: 'Aggregated analytics: totals, per-category counts, price stats',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Analytics summary' } },
      },
    },
  },
};

module.exports = swaggerSpec;
