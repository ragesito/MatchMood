import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Singleton pattern: reuse the same client instance across the app
const prisma = new PrismaClient({ adapter });

export default prisma;
