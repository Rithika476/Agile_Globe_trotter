import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db';
import { User, Trip, Destination, ItineraryDay, Activity, TripShare } from '../src/models';
import { resyncDays } from '../src/services/destination.service';

const DEMO_EMAIL = 'demo@globetrotter.test';
const DEMO_PASSWORD = 'DemoPassword123!';
const DEMO_NAME = 'Demo Explorer';

async function seedDemoData() {
  console.log('======================================================');
  console.log('       GLOBE TROTTER - DEMO DATA SEED SCRIPT          ');
  console.log('======================================================\n');

  await connectDB();

  try {
    // 1. Clean up existing demo data if present (idempotent / re-runnable)
    console.log(`Checking for existing demo account (${DEMO_EMAIL})...`);
    const existingUser = await User.findOne({ email: DEMO_EMAIL });
    if (existingUser) {
      console.log('Cleaning up previous demo data...');
      const existingTrips = await Trip.find({ owner: existingUser._id });
      const tripIds = existingTrips.map((t) => t._id);

      if (tripIds.length > 0) {
        await Activity.deleteMany({ trip: { $in: tripIds } });
        await ItineraryDay.deleteMany({ trip: { $in: tripIds } });
        await Destination.deleteMany({ trip: { $in: tripIds } });
        await TripShare.deleteMany({ trip: { $in: tripIds } });
        await Trip.deleteMany({ _id: { $in: tripIds } });
      }

      await User.deleteOne({ _id: existingUser._id });
      console.log('Previous demo data removed successfully.\n');
    }

    // 2. Create demo user
    console.log('Creating demo user...');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const demoUser = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash,
    });
    console.log(`Demo User created: ${demoUser.name} (${demoUser.email})`);

    // 3. Create Sample 5-day Trip
    console.log('\nCreating sample trip...');
    const startDate = new Date('2026-11-10T00:00:00.000Z');
    const endDate = new Date('2026-11-14T00:00:00.000Z'); // 5 days: Nov 10, 11, 12, 13, 14
    const estimatedBudget = 25000; // Target budget in INR

    const trip = await Trip.create({
      owner: demoUser._id,
      title: 'Classic Rajasthan Heritage Tour',
      startDate,
      endDate,
      estimatedBudget,
    });
    console.log(`Trip created: "${trip.title}" (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);

    // 4. Create 3 Destinations across the 5 days
    console.log('\nAdding 3 destinations...');
    // Destination 1: Jaipur (Days 1–2: Nov 10 – Nov 11)
    const destJaipur = await Destination.create({
      trip: trip._id,
      city: 'Jaipur',
      country: 'India',
      arrivalDate: new Date('2026-11-10T00:00:00.000Z'),
      departureDate: new Date('2026-11-11T00:00:00.000Z'),
      order: 0,
    });

    // Destination 2: Jodhpur (Days 2–4: Nov 11 – Nov 13, boundary day Nov 11 shifts to Jodhpur)
    const destJodhpur = await Destination.create({
      trip: trip._id,
      city: 'Jodhpur',
      country: 'India',
      arrivalDate: new Date('2026-11-11T00:00:00.000Z'),
      departureDate: new Date('2026-11-13T00:00:00.000Z'),
      order: 1,
    });

    // Destination 3: Udaipur (Days 4–5: Nov 13 – Nov 14, boundary day Nov 13 shifts to Udaipur)
    const destUdaipur = await Destination.create({
      trip: trip._id,
      city: 'Udaipur',
      country: 'India',
      arrivalDate: new Date('2026-11-13T00:00:00.000Z'),
      departureDate: new Date('2026-11-14T00:00:00.000Z'),
      order: 2,
    });

    // Resync days to ensure all 5 days exist and point to the correct destinations
    await resyncDays(trip._id);

    const days = await ItineraryDay.find({ trip: trip._id }).sort({ date: 1 });
    console.log(`Generated ${days.length} itinerary calendar days.`);

    // 5. Add 11 activities across multiple categories
    console.log('\nScheduling sample activities across categories...');
    const dayMap = new Map<string, mongoose.Types.ObjectId>();
    for (const d of days) {
      dayMap.set(d.date.toISOString().split('T')[0], d._id as mongoose.Types.ObjectId);
    }

    const activitiesToCreate = [
      // Day 1: Nov 10 (Jaipur)
      {
        itineraryDay: dayMap.get('2026-11-10')!,
        title: 'Amer Fort Guided Tour & Elephant Sanctuary',
        category: 'sightseeing',
        location: 'Amer, Jaipur',
        startTime: new Date('2026-11-10T09:00:00.000Z'),
        endTime: new Date('2026-11-10T12:30:00.000Z'),
        description: 'Guided historical exploration of the iconic Rajput fortress with panoramic views.',
        estimatedCost: 1400,
      },
      {
        itineraryDay: dayMap.get('2026-11-10')!,
        title: 'Traditional Rajasthani Thali Lunch',
        category: 'food',
        location: 'Old City, Jaipur',
        startTime: new Date('2026-11-10T13:00:00.000Z'),
        endTime: new Date('2026-11-10T14:30:00.000Z'),
        description: 'Authentic dal baati churma and local delicacies.',
        estimatedCost: 1600,
      },
      {
        itineraryDay: dayMap.get('2026-11-10')!,
        title: 'Heritage Haveli Hotel Stay',
        category: 'accommodation',
        location: 'Bani Park, Jaipur',
        startTime: new Date('2026-11-10T15:00:00.000Z'),
        description: 'Check-in to a restored heritage mansion with royal courtyard architecture.',
        estimatedCost: 5500,
      },

      // Day 2: Nov 11 (Jodhpur transit & arrival)
      {
        itineraryDay: dayMap.get('2026-11-11')!,
        title: 'Morning Intercity Express Train to Jodhpur',
        category: 'transport',
        location: 'Jaipur Junction -> Jodhpur Rail',
        startTime: new Date('2026-11-11T06:00:00.000Z'),
        endTime: new Date('2026-11-11T10:45:00.000Z'),
        description: 'Air-conditioned express rail ride across the Thar fringe.',
        estimatedCost: 1800,
      },
      {
        itineraryDay: dayMap.get('2026-11-11')!,
        title: 'Blue City Heritage Walk & Toorji Ka Jhalra Stepwell',
        category: 'activities',
        location: 'Brahmapuri, Jodhpur',
        startTime: new Date('2026-11-11T16:00:00.000Z'),
        endTime: new Date('2026-11-11T18:00:00.000Z'),
        description: 'Walking tour through the labyrinth of indigo-painted lanes and historic stepwells.',
        estimatedCost: 800,
      },

      // Day 3: Nov 12 (Jodhpur)
      {
        itineraryDay: dayMap.get('2026-11-12')!,
        title: 'Mehrangarh Fort & Museum Exploration',
        category: 'sightseeing',
        location: 'Mehrangarh, Jodhpur',
        startTime: new Date('2026-11-12T09:30:00.000Z'),
        endTime: new Date('2026-11-12T13:00:00.000Z'),
        description: 'Visit the formidable clifftop fort with audio guide and palace galleries.',
        estimatedCost: 1500,
      },
      {
        itineraryDay: dayMap.get('2026-11-12')!,
        title: 'Rooftop Dinner Overlooking Illuminated Fort',
        category: 'food',
        location: 'Clock Tower Bazaar, Jodhpur',
        startTime: new Date('2026-11-12T19:30:00.000Z'),
        endTime: new Date('2026-11-12T21:30:00.000Z'),
        description: 'Dinner with panoramic skyline views of the illuminated Mehrangarh fortress.',
        estimatedCost: 2200,
      },

      // Day 4: Nov 13 (Udaipur transit & arrival)
      {
        itineraryDay: dayMap.get('2026-11-13')!,
        title: 'Scenic Cab Drive via Ranakpur Jain Temple',
        category: 'transport',
        location: 'Jodhpur to Udaipur highway',
        startTime: new Date('2026-11-13T08:30:00.000Z'),
        endTime: new Date('2026-11-13T14:30:00.000Z'),
        description: 'Private car transfer through the Aravalli hills with stop at Ranakpur marble marvel.',
        estimatedCost: 4500,
      },
      {
        itineraryDay: dayMap.get('2026-11-13')!,
        title: 'Lakeside Heritage Resort Accommodation',
        category: 'accommodation',
        location: 'Lake Pichola, Udaipur',
        startTime: new Date('2026-11-13T15:30:00.000Z'),
        description: 'Two-night boutique lakefront stay with views of Jag Mandir.',
        estimatedCost: 7500,
      },

      // Day 5: Nov 14 (Udaipur)
      {
        itineraryDay: dayMap.get('2026-11-14')!,
        title: 'City Palace Complex & Crystal Gallery',
        category: 'sightseeing',
        location: 'City Palace, Udaipur',
        startTime: new Date('2026-11-14T10:00:00.000Z'),
        endTime: new Date('2026-11-14T13:00:00.000Z'),
        description: 'Rajasthan largest palace complex with royal courtyards and miniature paintings.',
        estimatedCost: 1800,
      },
      {
        itineraryDay: dayMap.get('2026-11-14')!,
        title: 'Artisans Market Souvenirs & Leather Craft',
        category: 'shopping',
        location: 'Hathi Pol Bazaar, Udaipur',
        startTime: new Date('2026-11-14T16:00:00.000Z'),
        endTime: new Date('2026-11-14T18:00:00.000Z'),
        description: 'Handcrafted Pichwai paintings, camel leather diaries, and silver jewelry.',
        estimatedCost: 2000,
      },
    ];

    let totalPlannedCost = 0;
    for (const act of activitiesToCreate) {
      await Activity.create({
        trip: trip._id,
        itineraryDay: act.itineraryDay,
        title: act.title,
        category: act.category,
        location: act.location,
        startTime: act.startTime,
        endTime: (act as any).endTime,
        description: act.description,
        estimatedCost: act.estimatedCost,
      });
      totalPlannedCost += act.estimatedCost;
    }
    console.log(`Created ${activitiesToCreate.length} activities.`);

    console.log('\n======================================================');
    console.log('       DEMO DATA SEEDED SUCCESSFULLY!                ');
    console.log('======================================================');
    console.log(`User Email:       ${DEMO_EMAIL}`);
    console.log(`User Password:    ${DEMO_PASSWORD}`);
    console.log(`Trip:             ${trip.title}`);
    console.log(`Trip Dates:       2026-11-10 to 2026-11-14 (5 calendar days)`);
    console.log(`Destinations (3): Jaipur (2d), Jodhpur (3d), Udaipur (2d)`);
    console.log(`Target Budget:    INR ${estimatedBudget.toLocaleString('en-IN')}`);
    console.log(`Total Planned:    INR ${totalPlannedCost.toLocaleString('en-IN')}`);
    console.log(`Budget Status:    OVER BUDGET by INR ${(totalPlannedCost - estimatedBudget).toLocaleString('en-IN')} (Showcases over-budget alert!)`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seedDemoData();
