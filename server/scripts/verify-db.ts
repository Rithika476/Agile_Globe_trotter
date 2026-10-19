import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import {
  User,
  Trip,
  Destination,
  ItineraryDay,
  Activity,
  TripShare,
} from '../src/models';

async function verifyDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/globetrotter';
  console.log('--- Globe Trotter Database Verification ---');
  console.log(`Connecting to MongoDB at target port/database: ${uri.replace(/\/\/.*@/, '//***@')}...`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ Successfully connected to MongoDB.');

    // 1. Sync indexes on all models
    console.log('\n1. Syncing indexes for all schemas...');
    const models = [
      { name: 'User', model: User },
      { name: 'Trip', model: Trip },
      { name: 'Destination', model: Destination },
      { name: 'ItineraryDay', model: ItineraryDay },
      { name: 'Activity', model: Activity },
      { name: 'TripShare', model: TripShare },
    ];

    for (const m of models) {
      const result = await m.model.syncIndexes();
      console.log(`   - ${m.name}: indexes synchronized (${JSON.stringify(result)})`);
    }

    // 2. List indexes per collection
    console.log('\n2. Listing indexes per collection:');
    for (const m of models) {
      const indexes = await m.model.collection.indexes();
      console.log(`   Collection [${m.model.collection.name}]:`);
      for (const idx of indexes) {
        const uniqueFlag = idx.unique ? ' (UNIQUE)' : '';
        console.log(`     * ${idx.name}: ${JSON.stringify(idx.key)}${uniqueFlag}`);
      }
    }

    // 3. Test Insert, Read-back, and Cleanup
    console.log('\n3. Testing CRUD lifecycle (Insert -> Read -> Delete)...');
    const testEmail = `verification_test_${Date.now()}@example.com`;
    const createdUser = await User.create({
      name: 'Verification Bot',
      email: testEmail,
      passwordHash: 'secret_test_hash_abc123',
    });
    console.log(`   ✓ Inserted test user [ID: ${createdUser._id}, Email: ${createdUser.email}]`);

    // Verify select: false behavior (passwordHash should be hidden by default)
    const readUser = await User.findById(createdUser._id);
    if (!readUser) {
      throw new Error('Failed to retrieve test user after insertion.');
    }
    console.log(`   ✓ Read back test user: found name "${readUser.name}", passwordHash is undefined by default: ${readUser.passwordHash === undefined}`);

    // Clean up
    await User.findByIdAndDelete(createdUser._id);
    const verifyDeleted = await User.findById(createdUser._id);
    if (verifyDeleted !== null) {
      throw new Error('Test document was not deleted during cleanup.');
    }
    console.log('   ✓ Cleaned up test document. Cleanup verified.');

    console.log('\n==========================================');
    console.log('✓ Database verification completed successfully!');
    console.log('==========================================\n');
  } catch (error: unknown) {
    console.error('✗ Database verification failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Closed MongoDB connection.');
  }
}

verifyDatabase();
