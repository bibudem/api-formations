import { Router } from 'express'
import Boom from '@hapi/boom'
import config from 'config'
import EventService from '../lib/event-service.js'
import console from '../lib/console.js'

const formationsRouter = new Router();

const eventService = new EventService({
  calendarId: config.get('libCalApi.calendarId')
});

formationsRouter.param('type', (req, res, next, type) => {
  if (!['bib', 'discipline'].includes(type)) {
    return next(Boom.notFound())
  }
  next()
})

formationsRouter.get('/:type/:id', async (req, res, next) => {
  console.debug(req.params)
  // const type = req.params.type === 'discipline' ? 'category' : 'campus';
  // const id = EventService.translateLibCalIdToApi(type, req.params.id);

  const type = req.params.type;
  const id = req.params.id;
  const uid = `${type}:${id}`
  console.log(uid)

  if (id) {
    return eventService
      .getEventsFor(type, id)
      .then(events => res.send(events))
      .catch(err => next(err))
  }

  next(Boom.notFound())
})

export default formationsRouter;