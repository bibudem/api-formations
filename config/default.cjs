const codeBibs = require('code-bib')
const codeChampsDisciplinaires = require('./champs-disciplinaires.cjs')
const categories = require('./categories-mapping.cjs')

module.exports = {
	app: {
		logDir: 'logs',
		cors: {
			origin: ['*'],
		},
		mountPath: '',
	},

	champsDisciplinaires: codeChampsDisciplinaires,

	bibs: codeBibs,

	categoriesMapping: categories,

	allowedFormats: {
		json: {
			ext: ['', '.json'],
			mime: 'application/json',
		},
		ics: {
			ext: ['.ics', '.ical', '.ifb', '.icalendar'],
			mime: 'text/calendar',
		},
	},

	useCache: true,

	libCalAPIBaseUrl: 'https://umontreal.libcal.com/1.1',
}