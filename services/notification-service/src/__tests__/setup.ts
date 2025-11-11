import { PrismaClient } from '@prisma/client';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://user:password@localhost:5432/notification_test_db?schema=public';
process.env.EMAIL_PROVIDER = 'mock';
process.env.SMS_PROVIDER = 'mock';
process.env.PUSH_PROVIDER = 'mock';
process.env.EVENT_CONSUMER_TYPE = 'mock';
process.env.EVENT_PUBLISHER_TYPE = 'mock';

const prisma = new PrismaClient();

// Clean up database before all tests
beforeAll(async () => {
  // Clean up test data
  await prisma.notificationLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.emailTemplate.deleteMany();
});

// Clean up after each test
afterEach(async () => {
  await prisma.notificationLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.emailTemplate.deleteMany();
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

