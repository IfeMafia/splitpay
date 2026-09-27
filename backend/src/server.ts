import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import type { Server } from 'http';

let server: Server;

async function bootstrap() {
  console.log('Connecting to PostgreSQL database...');
  let connected = false;
  let attempts = 0;
  while (!connected && attempts < 5) {
    try {
      attempts++;
      await prisma.$connect();
      connected = true;
      console.log('Database connected successfully.');
    } catch (error) {
      console.warn(`Database connection attempt ${attempts} failed:`, error instanceof Error ? error.message : error);
      if (attempts < 5) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  server = app.listen(env.PORT, () => {
    console.log(`Splitpay backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
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
