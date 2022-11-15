import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import nodeGlobalProxy from 'node-global-proxy'
import helmet from 'helmet'
import compression from 'compression'
import config from 'config'
import cors from 'cors'
import noFavicon from 'express-no-favicons'
import webconsole from '@remillc/web-console'
import { dev as devconsole } from 'consoles'

import formationsRouter from './routes/formations.route.js'
import listeRouter from './routes/liste.route.js'
import aProposRouter from './routes/a-propos.route.js'
import errorHandler from './middlewares/error-handler.js'
import console from './lib/console.js'

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url))
const proxy = nodeGlobalProxy.default

if (config.get('httpClient.proxy')) {
	console.log('Using proxy')
	proxy.setConfig(config.get('httpClient.proxy'))
	proxy.start()
}

// development only
if (process.env.NODE_ENV !== 'production') {
	// pretty print pour json
	app.set('json spaces', 2);
}

app.disable("x-powered-by");

/*
 * Middlewares
 */

app.use(compression())

// Protect requests against well-known web vulnerabilities
app.use(helmet());

if (process.env.NODE_ENV !== 'production') {
	app.use(devconsole);
}

app.use(webconsole({
	logDirectory: join(__dirname, '..', config.get('app.logDir'))
}));

app.use(noFavicon());

app.use((req, res, next) => {
	if (typeof req.query.pretty !== 'undefined') {
		// pretty print pour json
		app.set('json spaces', 2);
	} else {
		app.set('json spaces', 0)
	}
	next();
})

/*
 * Routes
 */

app.use(['/a-propos', '/about'], aProposRouter);

app.use(['/lisez-moi', '/lisez-moi.txt'], function (req, res) {
	res.sendFile(join(__dirname, '..', 'lisez-moi.txt'));
});

/*
 * Début de l'API rest
 */

app.use('/liste', cors(), listeRouter);

app.use('/', cors(), formationsRouter);

/*
 * Fin de l'API rest
 */

app.use(errorHandler);

app.listen(config.get('app.port'));

console.info('Server running at http://localhost:' + config.get('app.port') + '/ in ' + process.env.NODE_ENV + ' mode (node ' + process.version + ')');

export default app;