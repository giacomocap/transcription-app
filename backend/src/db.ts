import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Test the connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully via Prisma');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

testConnection();

export default prisma;
