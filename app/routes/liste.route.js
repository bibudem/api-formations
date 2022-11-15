import { Router } from 'express'
import config from 'config'
import console from '../lib/console.js'

const router = Router()

/*
 * Routes
 */

router.get('/disciplines', function (req, res, next) {
	// Retourne la liste des types de services
	res.send(config.get('champsDisciplinaires'));
});

router.get('/bibs', function (req, res, next) {
	// Retourne la liste des types de services
	res.send(config.get('bibs'));
});


export default router;