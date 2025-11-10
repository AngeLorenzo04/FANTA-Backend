import prisma from '../../utils/prisma';
import { AppError } from '../../middlewares/error.middleware';

export class LeaderboardService {
  // UNICA FUNZIONE: Ottieni classifica completa
  async getLeaderboard() {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo se sessione è CLOSED
    if (session.state !== 'CLOSED') {
      throw new AppError(
        400,
        `Leaderboard only available when CLOSED. Current: ${session.state}`,
        'SESSION_NOT_CLOSED'
      );
    }

    // Ottieni tutti gli utenti (no filtro role, filtriamo dopo)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    // Filtra manualmente solo USER (evita problema enum)
    const users = allUsers.filter((u) => u.role === 'USER');

    // Per ogni user, calcola il punteggio
    const leaderboard = [];

    for (const user of users) {
      // Ottieni tutte le sue predizioni per questa sessione
      const predictions = await prisma.prediction.findMany({
        where: {
          userId: user.id,
        },
        include: {
          event: {
            select: {
              sessionId: true,
              points: true,
              happened: true,
            },
          },
        },
      });

      // Filtra solo predizioni di questa sessione
      const sessionPredictions = predictions.filter(
        (p) => p.event.sessionId === session.id
      );

      // Se non ha fatto predizioni, salta
      if (sessionPredictions.length === 0) {
        continue;
      }

      // Calcola punteggio: somma punti solo di eventi accaduti
      let finalScore = 0;
      let eventsGuessed = 0;

      for (const pred of sessionPredictions) {
        if (pred.event.happened === true) {
          finalScore += pred.event.points;
          eventsGuessed++;
        }
      }

      const totalPredictions = sessionPredictions.length;
      const accuracyPercentage =
        totalPredictions > 0
          ? Math.round((eventsGuessed / totalPredictions) * 100)
          : 0;

      leaderboard.push({
        userId: user.id,
        username: user.username,
        email: user.email,
        finalScore,
        eventsGuessed,
        totalPredictions,
        accuracyPercentage,
      });
    }

    // Ordina per punteggio (decrescente)
    leaderboard.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      // Se pari punteggio, ordina per accuracy
      return b.accuracyPercentage - a.accuracyPercentage;
    });

    // Aggiungi posizione in classifica
    const finalLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rankPosition: index + 1,
    }));

    return finalLeaderboard;
  }
}