
import prisma from '../../utils/prisma';
import { AppError } from '../../middlewares/error.middleware';
import { CreateSessionInput } from './session.validation';
import { SessionState } from '@prisma/client';

export class SessionService {
  // Ottieni sessione corrente
  async getCurrentSession() {
    const session = await prisma.gameSession.findFirst({
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        events: {
          select: {
            id: true,
            description: true,
            points: true,
            happened: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Conta partecipanti (users con almeno una predizione)
    const participantsCount = await prisma.user.count({
      where: {
        predictions: {
          some: {},
        },
      },
    });

    return {
      ...session,
      stats: {
        totalEvents: session._count.events,
        totalParticipants: participantsCount,
      },
    };
  }

  // Crea nuova sessione (ADMIN only)
  async createSession(adminId: string, data: CreateSessionInput) {
    // Verifica che non esista già una sessione
    const existingSession = await prisma.gameSession.findFirst();

    if (existingSession) {
      throw new AppError(
        409,
        'A session already exists. Delete it before creating a new one.',
        'SESSION_EXISTS'
      );
    }

    // Crea sessione
    const session = await prisma.gameSession.create({
      data: {
        title: data.title,
        description: data.description,
        maxPredictionsPerUser: data.maxPredictionsPerUser,
        adminId,
        state: 'SETUP',
      },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return session;
  }

  // Aggiorna stato sessione (ADMIN only)
  async updateSessionState(newState: SessionState) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Valida transizioni di stato
    this.validateStateTransition(session.state, newState);

    // Prepara dati aggiornamento
    const updateData: any = {
      state: newState,
    };

    // Aggiungi timestamps per transizioni
    if (newState === 'OPEN') {
      updateData.openedAt = new Date();
    } else if (newState === 'ACTIVE') {
      updateData.closedPredictionsAt = new Date();
    } else if (newState === 'CLOSED') {
      updateData.concludedAt = new Date();
    }

    // Aggiorna
    const updatedSession = await prisma.gameSession.update({
      where: { id: session.id },
      data: updateData,
      include: {
        admin: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return updatedSession;
  }

  // Valida transizioni di stato
  private validateStateTransition(currentState: SessionState, newState: SessionState) {
    const validTransitions: Record<SessionState, SessionState[]> = {
      SETUP: ['OPEN'],
      OPEN: ['ACTIVE'],
      ACTIVE: ['CLOSED'],
      CLOSED: [],
    };

    if (!validTransitions[currentState].includes(newState)) {
      throw new AppError(
        400,
        `Invalid state transition from ${currentState} to ${newState}`,
        'INVALID_TRANSITION'
      );
    }
  }

  // Reset sessione (elimina tutto)
  async resetSession() {
    await prisma.gameSession.deleteMany();
    return { message: 'Session reset successfully' };
  }

  // Statistiche sessione
  async getSessionStats() {
    const session = await prisma.gameSession.findFirst({
      include: {
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Conta partecipanti
    const participantsCount = await prisma.user.count({
      where: {
        predictions: {
          some: {},
        },
      },
    });

    // Conta eventi per stato
    const eventsHappened = await prisma.event.count({
      where: { happened: true },
    });

    const eventsNotHappened = await prisma.event.count({
      where: { happened: false },
    });

    return {
      sessionId: session.id,
      title: session.title,
      state: session.state,
      maxPredictionsPerUser: session.maxPredictionsPerUser,
      totalEvents: session._count.events,
      totalParticipants: participantsCount,
      eventsHappened,
      eventsNotHappened,
    };
  }
}
