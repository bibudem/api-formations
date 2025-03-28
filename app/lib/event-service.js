import { inspect } from 'node:util'
import axios from 'axios'
import moment from 'moment'
import Cache from 'ttl'
import config from 'config'
import bibCodes from 'code-bib' assert { type: 'json' }
import { AccessToken } from './access-token.js'
import console from './console.js'

const categories = config.get('categoriesMapping')

moment.locale('fr-ca')

const categoryMapping = new Map()

for (const category of Object.keys(categories)) {
  for (const item of Object.keys(categories[category])) {
    const id = getId(category, categories[category][item])
    categoryMapping.set(id, item)
  }
}

function getId() {
  return `${[...arguments].join(':')}`
}

function bibLabelFromLibCalCampusId(id) {
  const bibCode = categories.bib[id]

  return bibCodes[bibCode].long || ''
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

      const returnValue = {
        // url: `https://bib.umontreal.ca/formations?no=${event.id}`,
        url: event.url.public,
        titre: event.title,
        date: moment(event.start).format('D MMM YYYY'),
        debut: moment(event.start).format('H:mm'),
        fin: moment(event.end).format('H:mm'),
        disciplines: event.category.map(cat => categories.discipline[cat.id]).filter(Boolean).join(','),
        typeLocalisation: 'online_join_url' in event ? 'en-ligne' : 'physique',
        imageVedette: event.featured_image || null,
      }

      if (typeof event.campus.id !== 'undefined') {
        try {
          returnValue.lieu = bibLabelFromLibCalCampusId(`${event.campus.id}`)
        } catch {
          console.error(`Can't find the campus id = ${event.campus.id} (${event.campus.name})`)
          console.trace(event)
        }
      }

      return returnValue
    })
  }

  static translateLibCalNameToApi(name) {
    if (!['discipline', 'bib'].includes(name)) {
      throw new Error(`Name parameter must be either 'discipline' or 'bib'. Got ${name}`)
    }

    return {
      'discipline': 'category',
      'bib': 'campus',
    }[name]
  }

  static translateLibCalIdToApi(type, id) {

    if (!['discipline', 'bib'].includes(type)) {
      throw new Error(`Type parameter must be either 'discipline' or 'bib'. Got ${type}`)
    }

    return categoryMapping.get(`${type}:${id}`)
  }

  constructor({ calendarId } = {}) {

    this.calendarId = calendarId || config.get('libCalApi.calendarId')

    const serviceUrl = new URL(config.get('libCalApi.serviceUrl'))
    serviceUrl.searchParams.set('cal_id', this.calendarId)
    this.serviceUrl = serviceUrl.href

    this._cache = new Cache({
      ttl: config.get('libCalApi.responseCacheTtl'),
    })

    this._accessToken = new AccessToken({
      host: config.get('libCalApi.oAuth2.host'),
      path: config.get('libCalApi.oAuth2.path'),
      clientId: config.get('libCalApi.key.clientId'),
      clientSecret: config.get('libCalApi.key.clientSecret'),
    })
  }

  async getEvents({ limit = 15, days = 60 } = {}) {
    if (limit < 1 || limit > 500) {
      throw new Error('limit parameter must be >= 1 and <= 500')
    }

    if (days > 365 || days < 0) {
      throw new Error(`days parameter must be >= 0 and <= 365. Got ${days}`)
    }

    let bearerToken
    const id = getId('getEvents', limit, days)

    if (this._cache.get(id)) {
      return this._cache.get(id)
    }

    try {
      bearerToken = await this._accessToken.requestToken()
    } catch (error) {
      throw error
    }

    const resultPromise = new Promise((resolve, reject) => {
      const url = new URL(this.serviceUrl)
      url.searchParams.set('limit', limit)
      url.searchParams.set('days', days)

      axios(url.href, {
        headers: {
          Authorization: `Bearer ${bearerToken.accessToken}`,
        },
        proxy: false,
      })
        .then(response => response.data)
        .then(data => {
          try {
            resolve(EventService.translateLibCalDataToApi(data.events))
          } catch (error) {
            reject(error)
          }
        })
        .catch(error => {
          reject(error)
        })
    })

    if (config.get('useCache') && !this._cache.get(id)) {
      this._cache.put(id, resultPromise)
    }

    return resultPromise

  }

  async getEventsFor(oldType, oldName) {

    if (!['bib', 'discipline'].includes(oldType)) {
      throw new Error(`Type parameter must be either 'bib' or 'discipline'. Got ${oldType}`)
    }

    const name = EventService.translateLibCalIdToApi(oldType, oldName)
    const type = EventService.translateLibCalNameToApi(oldType)

    const id = getId('getEventsFor', type, name)
    let bearerToken

    if (this._cache.get(id)) {
      return this._cache.get(id)
    }

    try {
      bearerToken = await this._accessToken.requestToken()
    } catch (error) {
      throw error
    }

    const resultPromise = new Promise((resolve, reject) => {
      const url = new URL(this.serviceUrl)
      url.searchParams.set(type, name)

      axios(url.href, {
        headers: {
          Authorization: `Bearer ${bearerToken.accessToken}`,
        },
        proxy: false,
      })
        .then(response => response.data)
        .then(data => {
          try {
            resolve(EventService.translateLibCalDataToApi(data.events))
          } catch (error) {
            reject(error)
          }
        })
        .catch(error => {
          reject(error)
        })
    })

    if (config.get('useCache') && !this._cache.get(id)) {
      this._cache.put(id, resultPromise)
    }

    return resultPromise

  }
}