import prisma from '../../utils/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreatePredictionsInput } from './predictions.validation';

export class PredictionsService {
  // Ottieni le mie predizioni per la sessione corrente
  async getMyPredictions(userId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Ottieni predizioni dell'utente
    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        event: {
          sessionId: session.id,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            description: true,
            points: true,
            happened: true,
            displayOrder: true,
          },
        },
      },
      orderBy: {
        event: {
          displayOrder: 'asc',
        },
      },
    });

    // Conta predizioni correnti e max consentite
    const currentCount = predictions.length;
    const maxAllowed = session.maxPredictionsPerUser;
    const canAddMore = currentCount < maxAllowed;

    // Calcola punteggio potenziale
    const potentialScore = predictions.reduce((sum, pred) => sum + pred.event.points, 0);

    // Calcola punteggio ottenuto (se eventi verificati)
    const actualScore = predictions
      .filter((pred) => pred.event.happened === true)
      .reduce((sum, pred) => sum + pred.event.points, 0);

    return {
      predictions: predictions.map((pred) => ({
        eventId: pred.event.id,
        description: pred.event.description,
        points: pred.event.points,
        happened: pred.event.happened,
        displayOrder: pred.event.displayOrder,
        predictedAt: pred.createdAt,
      })),
      count: currentCount,
      maxAllowed,
      canAddMore,
      remainingSlots: maxAllowed - currentCount,
      potentialScore,
      actualScore: session.state === 'CLOSED' ? actualScore : null,
    };
  }

  // Salva/aggiorna predizioni
  async savePredictions(userId: string, data: CreatePredictionsInput) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato OPEN
    if (session.state !== 'OPEN') {
      throw new AppError(
        400,
        'Predictions can only be made when session is OPEN',
        'INVALID_STATE'
      );
    }

    // Verifica numero eventi selezionati
    if (data.eventIds.length > session.maxPredictionsPerUser) {
      throw new AppError(
        400,
        `You can select maximum ${session.maxPredictionsPerUser} events`,
        'TOO_MANY_EVENTS'
      );
    }

    // Verifica che tutti gli eventi esistano e siano della sessione corrente
    const events = await prisma.event.findMany({
      where: {
        id: { in: data.eventIds },
        sessionId: session.id,
      },
    });

    if (events.length !== data.eventIds.length) {
      throw new AppError(400, 'One or more events not found', 'EVENTS_NOT_FOUND');
    }

    // Verifica che non ci siano duplicati
    const uniqueIds = new Set(data.eventIds);
    if (uniqueIds.size !== data.eventIds.length) {
      throw new AppError(400, 'Duplicate events detected', 'DUPLICATE_EVENTS');
    }

    // Transazione: elimina vecchie predizioni e crea nuove
    const result = await prisma.$transaction(async (tx) => {
      // 1. Elimina tutte le predizioni esistenti dell'utente per questa sessione
      await tx.prediction.deleteMany({
        where: {
          userId,
          event: {
            sessionId: session.id,
          },
        },
      });

      // 2. Crea nuove predizioni
      const predictions = await tx.prediction.createMany({
        data: data.eventIds.map((eventId) => ({
          userId,
          eventId,
        })),
      });

      return predictions;
    });

    // Ritorna predizioni aggiornate
    return {
      predictions: result.count,
      message: 'Predictions saved successfully',
    };
  }

  // Rimuovi una singola predizione
  async removePrediction(userId: string, eventId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato OPEN
    if (session.state !== 'OPEN') {
      throw new AppError(
        400,
        'Predictions can only be modified when session is OPEN',
        'INVALID_STATE'
      );
    }

    // Verifica che la predizione esista
    const prediction = await prisma.prediction.findFirst({
      where: {
        userId,
        eventId,
        event: {
          sessionId: session.id,
        },
      },
    });

    if (!prediction) {
      throw new AppError(404, 'Prediction not found', 'PREDICTION_NOT_FOUND');
    }

    // Elimina
    await prisma.prediction.delete({
      where: {
        id: prediction.id,
      },
    });

    return { message: 'Prediction removed successfully' };
  }

  // Aggiungi una singola predizione
  async addPrediction(userId: string, eventId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo in stato OPEN
    if (session.state !== 'OPEN') {
      throw new AppError(
        400,
        'Predictions can only be made when session is OPEN',
        'INVALID_STATE'
      );
    }

    // Verifica che l'evento esista
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        sessionId: session.id,
      },
    });

    if (!event) {
      throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
    }

    // Conta predizioni attuali
    const currentCount = await prisma.prediction.count({
      where: {
        userId,
        event: {
          sessionId: session.id,
        },
      },
    });

    // Verifica limite
    if (currentCount >= session.maxPredictionsPerUser) {
      throw new AppError(
        400,
        `Maximum ${session.maxPredictionsPerUser} predictions allowed`,
        'MAX_PREDICTIONS_REACHED'
      );
    }

    // Verifica che non esista già
    const existingPrediction = await prisma.prediction.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existingPrediction) {
      throw new AppError(400, 'Prediction already exists', 'PREDICTION_EXISTS');
    }

    // Crea predizione
    const prediction = await prisma.prediction.create({
      data: {
        userId,
        eventId,
      },
      include: {
        event: {
          select: {
            description: true,
            points: true,
          },
        },
      },
    });

    return {
      message: 'Prediction added successfully',
      prediction: {
        eventId: prediction.eventId,
        description: prediction.event.description,
        points: prediction.event.points,
      },
    };
  }

  // Statistiche predizioni (per tutti gli utenti)
  async getPredictionsStats() {
    const session = await prisma.gameSession.findFirst({
      include: {
        events: {
          select: {
            id: true,
            description: true,
            points: true,
            displayOrder: true,
            _count: {
              select: {
                predictions: true,
              },
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Conta totale utenti con predizioni
    const totalUsers = await prisma.user.count({
      where: {
        predictions: {
          some: {
            event: {
              sessionId: session.id,
            },
          },
        },
      },
    });

    // Eventi ordinati per popolarità
    const eventsByPopularity = session.events
      .map((event) => ({
        id: event.id,
        description: event.description,
        points: event.points,
        displayOrder: event.displayOrder,
        predictionCount: event._count.predictions,
        popularityPercentage:
          totalUsers > 0 ? Math.round((event._count.predictions / totalUsers) * 100) : 0,
      }))
      .sort((a, b) => b.predictionCount - a.predictionCount);

    return {
      totalUsers,
      totalEvents: session.events.length,
      mostPopularEvent: eventsByPopularity[0] || null,
      leastPopularEvent: eventsByPopularity[eventsByPopularity.length - 1] || null,
      eventsByPopularity,
    };
  }

  // Verifica se un utente ha completato le predizioni
  async hasCompletedPredictions(userId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      return false;
    }

    const count = await prisma.prediction.count({
      where: {
        userId,
        event: {
          sessionId: session.id,
        },
      },
    });

    return count === session.maxPredictionsPerUser;
  }
}