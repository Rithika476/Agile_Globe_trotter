import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { User } from '../src/models/User';

const stateFile = path.resolve(__dirname, '.persistence-state.json');
const action = process.argv[2];

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/globetrotter';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  if (action === 'insert') {
    const email = `persistence_${Date.now()}@example.com`;
    const doc = await User.create({
      name: 'Persistent Traveler',
      email,
      passwordHash: 'secret_persistent_hash_999',
    });
    fs.writeFileSync(stateFile, JSON.stringify({ id: doc._id.toString(), email: doc.email }, null, 2));
    console.log(`[Persistence Step 1]: Inserted test document ID ${doc._id} with email ${doc.email}`);
  } else if (action === 'verify-and-cleanup') {
    if (!fs.existsSync(stateFile)) {
      throw new Error('State file not found! Did you run insert first?');
    }
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    const doc = await User.findById(state.id);
    if (!doc) {
      throw new Error(`Document with ID ${state.id} was not found after restart! Data was lost.`);
    }
    console.log(`[Persistence Step 2]: Successfully found document after mongod restart! Name: "${doc.name}", Email: "${doc.email}"`);

    // Delete and cleanup
    await User.findByIdAndDelete(state.id);
    fs.unlinkSync(stateFile);
    console.log('[Persistence Step 2]: Cleaned up test document and temporary state file.');
  } else {
    console.log('Usage: tsx verify-persistence.ts [insert | verify-and-cleanup]');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Persistence test failed:', err);
  process.exit(1);
});
