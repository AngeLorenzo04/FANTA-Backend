import prisma from '../../utils/prisma';
import { AppError } from '../../middlewares/error.middleware';

export class LeaderboardService {
  // Ottieni classifica completa
  async getLeaderboard() {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo se sessione è CLOSED
    if (session.state !== 'CLOSED') {
      throw new AppError(
        400,
        'Leaderboard is only available when session is CLOSED',
        'SESSION_NOT_CLOSED'
      );
    }

    // Ottieni tutti gli utenti con predizioni
    const usersWithPredictions = await prisma.user.findMany({
      where: {
        predictions: {
          some: {
            event: {
              sessionId: session.id,
            },
          },
        },
        role: 'USER', // Solo users, non admin
      },
      include: {
        predictions: {
          where: {
            event: {
              sessionId: session.id,
            },
          },
          include: {
            event: {
              select: {
                points: true,
                happened: true,
              },
            },
          },
        },
      },
    });

    // Calcola punteggi per ogni user
    const leaderboard = usersWithPredictions
      .map((user) => {
        const totalPredictions = user.predictions.length;
        const correctPredictions = user.predictions.filter(
          (p) => p.event.happened === true
        ).length;
        const finalScore = user.predictions
          .filter((p) => p.event.happened === true)
          .reduce((sum, p) => sum + p.event.points, 0);

        const accuracyPercentage =
          totalPredictions > 0
            ? Math.round((correctPredictions / totalPredictions) * 100)
            : 0;

        return {
          userId: user.id,
          username: user.username,
          email: user.email,
          finalScore,
          eventsGuessed: correctPredictions,
          totalPredictions,
          accuracyPercentage,
        };
      })
      .sort((a, b) => {
        // Ordina per punteggio, poi per accuracy
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        return b.accuracyPercentage - a.accuracyPercentage;
      })
      .map((user, index) => ({
        ...user,
        rankPosition: index + 1,
      }));

    return leaderboard;
  }

  // Ottieni il mio punteggio dettagliato
  async getMyScore(userId: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    // Solo se sessione è CLOSED
    if (session.state !== 'CLOSED') {
      throw new AppError(
        400,
        'Scores are only available when session is CLOSED',
        'SESSION_NOT_CLOSED'
      );
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

    if (predictions.length === 0) {
      throw new AppError(
        404,
        'No predictions found for this user',
        'NO_PREDICTIONS'
      );
    }

    // Calcola punteggi
    const correctPredictions = predictions.filter(
      (p) => p.event.happened === true
    );
    const finalScore = correctPredictions.reduce(
      (sum, p) => sum + p.event.points,
      0
    );
    const eventsGuessed = correctPredictions.length;
    const totalPredictions = predictions.length;
    const accuracyPercentage =
      totalPredictions > 0
        ? Math.round((eventsGuessed / totalPredictions) * 100)
        : 0;

    // Ottieni posizione in classifica
    const leaderboard = await this.getLeaderboard();
    const myRank = leaderboard.find((u) => u.userId === userId);

    return {
      userId,
      finalScore,
      eventsGuessed,
      totalPredictions,
      accuracyPercentage,
      rankPosition: myRank?.rankPosition || null,
      predictions: predictions.map((p) => ({
        eventId: p.event.id,
        description: p.event.description,
        points: p.event.points,
        happened: p.event.happened,
        scored: p.event.happened === true,
      })),
    };
  }

  // Statistiche globali della sessione
  async getSessionStatistics() {
    const session = await prisma.gameSession.findFirst({
      include: {
        events: {
          select: {
            id: true,
            description: true,
            points: true,
            happened: true,
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

    // Conta partecipanti
    const totalParticipants = await prisma.user.count({
      where: {
        predictions: {
          some: {
            event: {
              sessionId: session.id,
            },
          },
        },
        role: 'USER',
      },
    });

    // Eventi accaduti/non accaduti
    const eventsHappened = session.events.filter((e) => e.happened === true).length;
    const eventsNotHappened = session.events.filter((e) => e.happened === false).length;
    const eventsNotVerified = session.events.filter((e) => e.happened === null).length;

    // Evento più popolare (più predetto)
    const eventsByPopularity = session.events
      .map((e) => ({
        id: e.id,
        description: e.description,
        points: e.points,
        happened: e.happened,
        predictionCount: e._count.predictions,
        popularityPercentage:
          totalParticipants > 0
            ? Math.round((e._count.predictions / totalParticipants) * 100)
            : 0,
      }))
      .sort((a, b) => b.predictionCount - a.predictionCount);

    const mostPopularEvent = eventsByPopularity[0] || null;
    const leastPopularEvent = eventsByPopularity[eventsByPopularity.length - 1] || null;

    // Evento più difficile (meno users lo hanno indovinato)
    const eventsWithAccuracy = await Promise.all(
      session.events
        .filter((e) => e.happened !== null) // Solo eventi verificati
        .map(async (event) => {
          // Conta quanti lo hanno predetto
          const totalPredictions = event._count.predictions;

          // Conta quanti hanno "indovinato" (predetto E accaduto)
          const correctPredictions =
            event.happened === true ? totalPredictions : 0;

          // Conta quanti NON lo hanno predetto ma è accaduto
          const missedPredictions =
            event.happened === true ? totalParticipants - totalPredictions : 0;

          const accuracy =
            totalParticipants > 0
              ? Math.round((correctPredictions / totalParticipants) * 100)
              : 0;

          return {
            id: event.id,
            description: event.description,
            points: event.points,
            happened: event.happened,
            totalPredictions,
            correctPredictions,
            missedPredictions,
            accuracy,
          };
        })
    );

    // Ordina per accuracy (più basso = più difficile)
    const sortedByDifficulty = eventsWithAccuracy.sort((a, b) => a.accuracy - b.accuracy);
    const hardestEvent = sortedByDifficulty[0] || null;
    const easiestEvent = sortedByDifficulty[sortedByDifficulty.length - 1] || null;

    // Calcola punteggio medio
    let avgScore = 0;
    let maxScore = 0;
    let minScore = 0;

    if (session.state === 'CLOSED' && totalParticipants > 0) {
      const leaderboard = await this.getLeaderboard();
      const scores = leaderboard.map((u) => u.finalScore);
      avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      maxScore = Math.max(...scores);
      minScore = Math.min(...scores);
    }

    return {
      sessionId: session.id,
      title: session.title,
      state: session.state,
      totalParticipants,
      totalEvents: session.events.length,
      eventsHappened,
      eventsNotHappened,
      eventsNotVerified,
      avgScore,
      maxScore,
      minScore,
      mostPopularEvent,
      leastPopularEvent,
      hardestEvent: hardestEvent
        ? {
            description: hardestEvent.description,
            accuracy: hardestEvent.accuracy,
            correctPredictions: hardestEvent.correctPredictions,
            totalParticipants,
          }
        : null,
      easiestEvent: easiestEvent
        ? {
            description: easiestEvent.description,
            accuracy: easiestEvent.accuracy,
            correctPredictions: easiestEvent.correctPredictions,
            totalParticipants,
          }
        : null,
      eventsByPopularity,
      eventsWithAccuracy: sortedByDifficulty,
    };
  }

  // Top 3 vincitori (podio)
  async getPodium() {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.slice(0, 3);
  }

  // Confronto tra due utenti
  async compareUsers(userId1: string, userId2: string) {
    const session = await prisma.gameSession.findFirst();

    if (!session) {
      throw new AppError(404, 'No active session found', 'NO_SESSION');
    }

    if (session.state !== 'CLOSED') {
      throw new AppError(
        400,
        'Comparison only available when session is CLOSED',
        'SESSION_NOT_CLOSED'
      );
    }

    const [user1Score, user2Score] = await Promise.all([
      this.getMyScore(userId1),
      this.getMyScore(userId2),
    ]);

    // Trova predizioni comuni
    const user1EventIds = new Set(user1Score.predictions.map((p) => p.eventId));
    const user2EventIds = new Set(user2Score.predictions.map((p) => p.eventId));

    const commonEvents = user1Score.predictions.filter((p) =>
      user2EventIds.has(p.eventId)
    );
    const onlyUser1Events = user1Score.predictions.filter(
      (p) => !user2EventIds.has(p.eventId)
    );
    const onlyUser2Events = user2Score.predictions.filter(
      (p) => !user1EventIds.has(p.eventId)
    );

    return {
      user1: {
        userId: user1Score.userId,
        finalScore: user1Score.finalScore,
        eventsGuessed: user1Score.eventsGuessed,
        accuracyPercentage: user1Score.accuracyPercentage,
        rankPosition: user1Score.rankPosition,
      },
      user2: {
        userId: user2Score.userId,
        finalScore: user2Score.finalScore,
        eventsGuessed: user2Score.eventsGuessed,
        accuracyPercentage: user2Score.accuracyPercentage,
        rankPosition: user2Score.rankPosition,
      },
      comparison: {
        scoreDifference: user1Score.finalScore - user2Score.finalScore,
        accuracyDifference:
          user1Score.accuracyPercentage - user2Score.accuracyPercentage,
        commonPredictions: commonEvents.length,
        uniqueUser1: onlyUser1Events.length,
        uniqueUser2: onlyUser2Events.length,
      },
      commonEvents: commonEvents.map((e) => ({
        description: e.description,
        happened: e.happened,
        bothScored: e.scored,
      })),
    };
  }
}