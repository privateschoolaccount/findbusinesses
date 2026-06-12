import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Find Businesses API',
      version: '1.0.0',
      description: 'Search Google Maps for businesses without websites and verify via Google Search.',
    },
    components: {
      schemas: {
        Search: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            query: { type: 'string' },
            location: { type: 'string' },
            radius: { type: 'integer' },
            type: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            total_found: { type: 'integer' },
            with_website: { type: 'integer' },
            without_website: { type: 'integer' },
            pending_verification: { type: 'integer' },
            error: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Result: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            search_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            place_id: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true, description: 'Official website URL if found' },
            network_site: { type: 'string', nullable: true, description: 'Third-party site URL (e.g. Facebook, Yelp) if no official website' },
            website_verified: { type: 'boolean' },
            website_confirmed: { type: 'boolean' },
            status: { type: 'string', enum: ['has_website', 'no_website', 'pending_verification'] },
            verification_method: { type: 'string', enum: ['google_maps', 'google_search'] },
            rating: { type: 'number', nullable: true },
            total_ratings: { type: 'integer', nullable: true },
            categories: { type: 'array', items: { type: 'string' }, nullable: true },
            lat: { type: 'number', nullable: true },
            lng: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
