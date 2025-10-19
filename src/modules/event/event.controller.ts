import { Request, Response, NextFunction } from 'express';
import { EventsService } from './event.service';
import { successResponse } from '../../utils/response';
import {
  createEventSchema,
  updateEventSchema,
  verifyEventSchema,
  verifyBatchSchema,
} from './event.validation';

const eventsService = new EventsService();

export class EventsController {
  // GET /api/events
  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventsService.getEvents();
      res.status(200).json(successResponse(events));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/events
  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createEventSchema.parse(req.body);
      const event = await eventsService.createEvent(validatedData);
      res.status(201).json(successResponse(event, 'Event created successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/events/:id
  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateEventSchema.parse(req.body);
      const event = await eventsService.updateEvent(id, validatedData);
      res.status(200).json(successResponse(event, 'Event updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/events/:id
  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await eventsService.deleteEvent(id);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/events/:id/verify
  async verifyEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { happened } = verifyEventSchema.parse(req.body);
      const event = await eventsService.verifyEvent(id, happened);
      res.status(200).json(successResponse(event, 'Event verified'));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/events/verify-batch
  async verifyBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = verifyBatchSchema.parse(req.body);
      const result = await eventsService.verifyBatch(validatedData);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/events/reorder
  async reorderEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventIds } = req.body;
      const result = await eventsService.reorderEvents(eventIds);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}