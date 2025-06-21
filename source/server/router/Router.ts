/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AvailableRoutes } from '../config/keys';
import buildResponse from '../helper/responseBuilder.helper';
import { StatusCodes } from 'outers';

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

  // Available routes List
  fastify.get('/routes', async (request, reply) => {
    return reply.status(200).send(buildResponse(StatusCodes.OK, 'Available routes', AvailableRoutes));
  });

  // Handle 404 Not Found
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send(buildResponse(StatusCodes.NOT_FOUND, `Route ${request.method}:${request.url} not found`));
  });

  done();
};
