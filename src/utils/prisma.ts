import { PrismaClient } from '@prisma/client';

// Aggiungi pgbouncer=true al connection string
const connectionString = process.env.DATABASE_URL;
const urlWithPgBouncer = connectionString?.includes('pgbouncer=true')
  ? connectionString
  : `${connectionString}${connectionString?.includes('?') ? '&' : '?'}pgbouncer=true`;

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: urlWithPgBouncer,
    },
  },
});

// Funzione per testare la connessione (SENZA prepared statement)
export const testConnection = async () => {
  try {
    // Usa $executeRaw invece di $queryRaw per evitare prepared statements
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test semplice senza prepared statement
    const users = await prisma.user.findMany({ take: 1 });
    console.log('📊 Database ready - Users table accessible');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  console.log('👋 Database disconnected');
};

export default prisma;