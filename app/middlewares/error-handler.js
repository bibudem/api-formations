import Boom from '@hapi/boom'
import console from '../lib/console.js'

/**
 * Error handler
 */

export default function errorHandler(error, request, response, next) {

  if (!Boom.isBoom(error)) {
    if (error instanceof SyntaxError && 'type' in error) {
      // Error created from the http-errors module
      error = new Boom(error, {
        statusCode: error.statusCode,
        data: error,
      });
    } else {
      return next(error);
    }
  }

  if (error.isServer) {
    console.error(error.stack);
  }

  response.status(error.output.statusCode);

  if (error.data) {
    error.output.payload.data = error.data
  }

  if (request.accepts('json')) {
    return response.json(error.output.payload);
  }

  response.send(error.output.payload.message);
}