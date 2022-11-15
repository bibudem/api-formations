import { inspect } from 'node:util'
import axios from 'axios'
import moment from 'moment'
import Cache from 'ttl'
import config from 'config'
import bibCodes from 'code-bib' assert { type: 'json' }
import { AccessToken } from './access-token.js'
import console from './console.js'

const categories = config.get('categoriesMapping');

moment.locale('fr-ca')

const categoryMapping = new Map();

Object.keys(categories).forEach(category => {
  Object.keys(categories[category]).forEach((item) => {
    categoryMapping.set(id(category, categories[category][item]), item)
  })
})

function id(a, b) {
  return `${a}:${b}`;
}

function bibLabelFromLibCalCampusId(id) {
  const bibCode = categories.bib[id];

  return bibCodes[bibCode].long || '';
}

export default class EventService {

  static translateLibCalDataToApi(events) {
    // {
    //   "url": "https://bib.umontreal.ca/formations/formation?no=8686",
    //   "titre": "test formation discipline amenagement",
    //   "date": "17 juil. 2018",
    //   "debut": "15:00",
    //   "fin": "16:00",
    //   "lieu": "Bibliothèque de musique",
    //   "disciplines": "amenagement"
    // }

    return events.map(event => {

      const ret = {
        url: `https://bib.umontreal.ca/formations?no=${event.id}`,
        titre: event.title,
        date: moment(event.start).format('D MMM YYYY'),
        debut: moment(event.start).format('H:mm'),
        fin: moment(event.end).format('H:mm'),
        disciplines: event.category.map(cat => categories.discipline[cat.id]).join(',')
      }

      if (typeof event.campus.id !== 'undefined') {
        try {
          ret.lieu = bibLabelFromLibCalCampusId(`${event.campus.id}`)
        } catch (e) {
          console.error(`Can't find the campus id = ${event.campus.id} (${event.campus.name})`)
          console.trace(event)
        }
      }

      return ret;
    })
  }

  static translateLibCalNameToApi(name) {
    if (!['discipline', 'bib'].includes(name)) {
      throw new Error(`Name parameter must be either 'discipline' or 'bib'. Got ${name}`)
    }

    return {
      'discipline': 'category',
      'bib': 'campus'
    }[name]
  }

  static translateLibCalIdToApi(type, id) {
    console.debug(`type: ${type}, id: ${id}`)
    if (!['discipline', 'bib'].includes(type)) {
      throw new Error(`Type parameter must be either 'discipline' or 'bib'. Got ${type}`)
    }

    return categoryMapping.get(`${type}:${id}`)
  }

  constructor({ calendarId } = {}) {

    this.calendarId = calendarId || config.get('libCalApi.calendarId')

    const serviceUrl = new URL(config.get('libCalApi.serviceUrl'));
    serviceUrl.searchParams.set('cal_id', this.calendarId)
    this.serviceUrl = serviceUrl.href

    this._cache = new Cache({
      ttl: config.get('libCalApi.responseCacheTtl')
    })

    this._accessToken = new AccessToken({
      host: config.get('libCalApi.oAuth2.host'),
      path: config.get('libCalApi.oAuth2.path'),
      clientId: config.get('libCalApi.key.clientId'),
      clientSecret: config.get('libCalApi.key.clientSecret')
    });
  }

  async getEventsFor(oldType, oldName) {

    if (!['bib', 'discipline'].includes(oldType)) {
      throw new Error(`Type parameter must be either 'bib' or 'discipline'. Got ${oldType}`)
    }

    const name = EventService.translateLibCalIdToApi(oldType, oldName)
    const type = EventService.translateLibCalNameToApi(oldType);

    const id = `${type}:${name}`;
    let bearerToken;

    if (this._cache.get(id)) {
      return this._cache.get(id)
    }

    try {
      bearerToken = await this._accessToken.requestToken()
    } catch (e) {
      throw e
    }

    const resultPromise = new Promise((resolve, reject) => {
      const url = new URL(this.serviceUrl);
      url.searchParams.set(type, name)

      axios(url.href, {
        headers: {
          Authorization: `Bearer ${bearerToken.accessToken}`
        },
        proxy: false
      },)
        .then(response => response.data)
        .then(data => {
          console.log(inspect(data, { depth: 4, colors: true }))
          try {
            resolve(EventService.translateLibCalDataToApi(data.events))
          } catch (e) {
            reject(e)
          }
        })
        .catch(e => {
          // console.error(e)
          reject(e)
        })
    })

    if (config.get('useCache') && !this._cache.get(id)) {
      this._cache.put(id, resultPromise)
    }

    return resultPromise;

  }
}