import { Router } from 'express'
import config from 'config'
import console from '../lib/console.js'

const router = Router()

/*
 * Routes
 */

router.get('/disciplines', function (request, response, next) {
	// Retourne la liste des types de services
	response.send(config.get('champsDisciplinaires'));
});

router.get('/bibs', function (request, response, next) {
	// Retourne la liste des types de services
	response.send(config.get('bibs'));
});


export default router;