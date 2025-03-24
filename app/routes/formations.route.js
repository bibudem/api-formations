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
  console.debug(request.params)
  // const type = req.params.type === 'discipline' ? 'category' : 'campus';
  // const id = EventService.translateLibCalIdToApi(type, req.params.id);

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
  return eventService
    .getEvents()
    .then(events => response.send(events))
    .catch(error => next(error))
})

export default formationsRouter