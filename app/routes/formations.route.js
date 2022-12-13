import { Router } from 'express'
import Boom from '@hapi/boom'
import config from 'config'
import EventService from '../lib/event-service.js'
import console from '../lib/console.js'

const formationsRouter = new Router();

const eventService = new EventService({
  calendarId: config.get('libCalApi.calendarId'),
});

formationsRouter.param('type', (request, response, next, type) => {
  if (!['bib', 'discipline'].includes(type)) {
    return next(Boom.notFound())
  }
  next()
})

formationsRouter.get('/:type/:id', async (request, response, next) => {
  console.debug(request.params)
  // const type = req.params.type === 'discipline' ? 'category' : 'campus';
  // const id = EventService.translateLibCalIdToApi(type, req.params.id);

  const type = request.params.type;
  const id = request.params.id;
  const uid = `${type}:${id}`
  console.log(uid)

  if (id) {
    return eventService
      .getEventsFor(type, id)
      .then(events => response.send(events))
      .catch(error => next(error))
  }

  next(Boom.notFound())
})

export default formationsRouter;