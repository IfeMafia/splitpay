import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import type { Server } from 'http';

let server: Server;

async function bootstrap() {
  try {
    console.log('Connecting to PostgreSQL database...');
    await prisma.$connect();
    console.log('Database connected successfully.');

    server = app.listen(env.PORT, () => {
      console.log(`Splitpay backend running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('Failed to connect to the database on startup:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap();
