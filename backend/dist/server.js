"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const prisma_1 = require("./lib/prisma");
let server;
async function bootstrap() {
    try {
        console.log('Connecting to PostgreSQL database...');
        await prisma_1.prisma.$connect();
        console.log('Database connected successfully.');
        server = app_1.default.listen(env_1.env.PORT, () => {
            console.log(`Splitpay backend running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        });
    }
    catch (error) {
        console.error('Failed to connect to the database on startup:', error);
        process.exit(1);
    }
}
// Graceful shutdown handling
const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            await prisma_1.prisma.$disconnect();
            console.log('Database connection closed.');
            process.exit(0);
        });
    }
    else {
        await prisma_1.prisma.$disconnect();
        process.exit(0);
    }
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
bootstrap();
//# sourceMappingURL=server.js.map