import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const dbConnection = async () => {
    try {
        await prisma.$connect();
        console.log("PostgreSQL (Neon) connected successfully via Prisma.");
    } catch (error) {
        console.error("PostgreSQL connection failed:", error.message);
        process.exit(1);
    }
};
