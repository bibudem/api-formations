import { Router } from 'express'
import Boom from '@hapi/boom'
import config from 'config'
import EventService from '../lib/event-service.js'
import console from '../lib/console.js'

const formationsRouter = new Router()

const eventService = new EventService({
  calendarId: config.get('libCalApi.calendarId'),
})

function validateTypeParameter(request, response, next) {
  if (!['bib', 'discipline'].includes(request.params.type)) {
    return next(Boom.notFound())
  }
  next()
}

formationsRouter.get('/:type/:id', validateTypeParameter, async (request, response, next) => {

  const type = request.params.type
  const id = request.params.id

  if (id) {
    return eventService
      .getEventsFor(type, id)
      .then(events => response.send(events))
      .catch(error => next(error))
  }

  next(Boom.notFound())
})

formationsRouter.get('/', async (request, response, next) => {
  const { limit, days } = request.query
  return eventService
    .getEvents({ limit, days })
    .then(events => response.send(events))
    .catch(error => next(error))
})

export default formationsRouter