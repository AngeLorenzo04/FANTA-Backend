import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Funzione per testare la connessione
export const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query per verificare che funzioni tutto
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('📊 Database time:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Chiudi connessione quando l'app termina
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  console.log('👋 Database disconnected');
};

export default prisma;
