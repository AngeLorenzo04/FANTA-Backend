import prisma from '../../utils/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateEventInput, UpdateEventInput, VerifyBatchInput } from './event.validation';

export class EventsService {
  // Lista eventi della sessione corrente
  async getEvents() {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    const events = await prisma.event.findMany({
      where: { sessionId: session.id },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    });

    // Aggiungi conteggio predizioni
    return events.map((event) => ({
      ...event,
      predictionCount: event._count.predictions,
    }));
  }

  // Crea evento (ADMIN only)
  async createEvent(data: CreateEventInput) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato SETUP
    if (session.state !== 'SETUP') {
      throw new AppError(
        400,
        'Can only add events when session is in SETUP state',
        'INVALID_STATE'
      );
    }

    // Ottieni ultimo displayOrder
    const lastEvent = await prisma.event.findFirst({
      where: { sessionId: session.id },
      orderBy: { displayOrder: 'desc' },
    });

    const nextOrder = lastEvent ? lastEvent.displayOrder + 1 : 1;

    // Crea evento
    const event = await prisma.event.create({
      data: {
        description: data.description,
        points: data.points,
        displayOrder: nextOrder,
        sessionId: session.id,
      },
    });

    return event;
  }

  // Aggiorna evento (ADMIN only)
  async updateEvent(eventId: string, data: UpdateEventInput) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato SETUP
    if (session.state !== 'SETUP') {
      throw new AppError(
        400,
        'Can only update events when session is in SETUP state',
        'INVALID_STATE'
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data,
    });

    return updatedEvent;
  }

  // Elimina evento (ADMIN only)
  async deleteEvent(eventId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato SETUP
    if (session.state !== 'SETUP') {
      throw new AppError(
        400,
        'Can only delete events when session is in SETUP state',
        'INVALID_STATE'
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { message: 'Event deleted successfully' };
  }

  // Verifica singolo evento (ADMIN only)
  async verifyEvent(eventId: string, happened: boolean) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato ACTIVE o CLOSED
    if (session.state !== 'ACTIVE' && session.state !== 'CLOSED') {
      throw new AppError(
        400,
        'Can only verify events when session is ACTIVE or CLOSED',
        'INVALID_STATE'
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { happened },
    });

    return updatedEvent;
  }

  // Verifica multipli eventi (batch) (ADMIN only)
  async verifyBatch(data: VerifyBatchInput) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato ACTIVE o CLOSED
    if (session.state !== 'ACTIVE' && session.state !== 'CLOSED') {
      throw new AppError(
        400,
        'Can only verify events when session is ACTIVE or CLOSED',
        'INVALID_STATE'
      );
    }

    // Aggiorna tutti gli eventi
    const updates = data.events.map((event) =>
      prisma.event.update({
        where: { id: event.id },
        data: { happened: event.happened },
      })
    );

    await prisma.$transaction(updates);

    return {
      updated: data.events.length,
      message: `${data.events.length} events verified successfully`,
    };
  }

  // Riordina eventi (ADMIN only)
  async reorderEvents(eventIds: string[]) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato SETUP
    if (session.state !== 'SETUP') {
      throw new AppError(
        400,
        'Can only reorder events when session is in SETUP state',
        'INVALID_STATE'
      );
    }

    // Aggiorna displayOrder per ogni evento
    const updates = eventIds.map((eventId, index) =>
      prisma.event.update({
        where: { id: eventId },
        data: { displayOrder: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    return { message: 'Events reordered successfully' };
  }
}