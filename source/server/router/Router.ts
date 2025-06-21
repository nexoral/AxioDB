import { FastifyInstance, FastifyPluginOptions } from 'fastify';

/**
 * Main router plugin for the AxioDB server
 * 
 * @param fastify - Fastify instance
 * @param _options - Plugin options
 * @param done - Callback to signal completion
 */
export default async function mainRouter(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
  done: () => void
): Promise<void> {

  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Handle 404 Not Found
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`,
      statusCode: 404
    });
  });

  done();
};
