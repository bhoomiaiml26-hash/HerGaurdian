import prisma from '../lib/prisma.js';

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
