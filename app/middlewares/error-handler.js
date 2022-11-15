import Boom from '@hapi/boom'
import console from '../lib/console.js'

/**
 * Error handler
 */

export default function errorHandler(err, req, res, next) {

  if (!Boom.isBoom(err)) {
    if (err instanceof SyntaxError && 'type' in err) {
      // Error created from the http-errors module
      err = new Boom(err, {
        statusCode: err.statusCode,
        data: err
      });
    } else {
      return next(err);
    }
  }

  if (err.isServer) {
    console.error(err.stack);
  }

  res.status(err.output.statusCode);

  if (err.data) {
    err.output.payload.data = err.data
  }

  if (req.accepts('json')) {
    return res.json(err.output.payload);
  }

  res.send(err.output.payload.message);
}