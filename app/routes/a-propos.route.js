import express from 'express'
import pkg from '../../package.json' assert { type: 'json' }

const aboutRouter = express.Router();

aboutRouter.get('/', function (request, response, next) {
	response.send(`API ${pkg.name} v${pkg.version} (${process.env.NODE_ENV})`);
});

export default aboutRouter;