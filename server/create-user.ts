import { getDrizzle, initDb } from './src/db/connection.js';
import { users as usersTable } from './src/db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { logger } from './src/utils/logger.js';

async function createUser() {
  const email = 'patrice.huetz@gmail.com';
  const password = 'password123';
  const name = 'Patrice Huetz';

  try {
    initDb();
    const db = getDrizzle();
    
    const existingUser = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (existingUser) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await db.insert(usersTable).values({
      id,
      email,
      passwordHash,
      name,
      plan: 'free',
      planStatus: 'active',
      postsUsedThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`User created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create user:', error);
    process.exit(1);
  }
}

createUser();
