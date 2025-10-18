import app from './app';
import dotenv from 'dotenv';
import { testConnection, disconnectPrisma } from './utils/prisma';

// Carica variabili d'ambiente
dotenv.config();

const PORT = process.env.PORT || 3000;

// Funzione per avviare il server
const startServer = async () => {
  try {
    // 1. Testa connessione al database PRIMA di avviare il server
    console.log('🔍 Testing database connection...\n');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('\n🔴 Cannot start server: Database connection failed');
      console.error('💡 Check your DATABASE_URL in .env file\n');
      process.exit(1);
    }

    // 2. Se DB OK, avvia server Express
    const server = app.listen(PORT, () => {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Server started successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server:      http://localhost:${PORT}`);
      console.log(`📊 Health:      http://localhost:${PORT}/health`);
      console.log(`🔗 API:         http://localhost:${PORT}/api`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 Press Ctrl+C to stop\n');
    });

    // 3. Gestione chiusura graceful (quando premi Ctrl+C)
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⏳ ${signal} received: Shutting down gracefully...`);
      
      // Chiudi server HTTP (non accetta più richieste)
      server.close(async () => {
        console.log('🛑 HTTP server closed');
        
        // Chiudi connessione al database
        await disconnectPrisma();
        
        console.log('✅ Cleanup completed\n');
        process.exit(0);
      });

      // Forza chiusura dopo 10 secondi se non finisce
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Ascolta segnali di terminazione
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // kill command

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await disconnectPrisma();
    process.exit(1);
  }
};

// Gestione errori non catturati (safety net)
process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await disconnectPrisma();
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await disconnectPrisma();
  process.exit(1);
});

// AVVIA IL SERVER!
startServer();
