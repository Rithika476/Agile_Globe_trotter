import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User, Trip, Destination, ItineraryDay, Activity, TripShare } from '../src/models';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];
let allResponsesJsonStrings: string[] = [];

function record(name: string, passed: boolean, details?: string) {
  results.push({ name, passed, details });
  const statusMark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${statusMark}: ${name}${details ? ' - ' + details : ''}`);
}

async function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  allResponsesJsonStrings.push(text);

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('       GLOBE TROTTER - AUTOMATED API TEST SUITE       ');
  console.log('======================================================\n');

  let serverInstance: http.Server | null = null;
  let baseUrl = 'http://localhost:5000';

  // 1. Ensure DB connection
  await connectDB();

  // 2. Check if server is already running on port 5000; if not, spin up in-process server
  try {
    const healthCheck = await fetch('http://localhost:5000/api/health', { method: 'GET' });
    if (healthCheck.ok) {
      console.log('Detected existing server running on http://localhost:5000\n');
    } else {
      throw new Error('Not running');
    }
  } catch {
    console.log('Starting dedicated test server on port 5000...');
    serverInstance = app.listen(5000);
    baseUrl = 'http://localhost:5000';
    await new Promise((r) => setTimeout(r, 500));
    console.log('Test server ready.\n');
  }

  const timestamp = Date.now();
  const userAData = {
    name: 'Alice Explorer',
    email: `alice_${timestamp}@globetrotter.test`,
    password: 'Password123!',
  };
  const userBData = {
    name: 'Bob Traveler',
    email: `bob_${timestamp}@globetrotter.test`,
    password: 'Password123!',
  };

  let tokenA = '';
  let tokenB = '';
  let tripId = '';
  let dest1Id = '';
  let dest2Id = '';
  let day1Id = '';
  let act1Id = '';
  let act2Id = '';
  let act3Id = '';
  let shareToken = '';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register User A
    // -------------------------------------------------------------------------
    const regRes = await request(baseUrl, 'POST', '/api/auth/register', userAData);
    const regPass = regRes.status === 201 && !!regRes.data?.data?.token && regRes.data?.data?.user?.email === userAData.email;
    record('1. Register User A', regPass, `Status ${regRes.status}`);
    tokenA = regRes.data?.data?.token;

    // -------------------------------------------------------------------------
    // TEST 2: Reject duplicate email
    // -------------------------------------------------------------------------
    const dupRes = await request(baseUrl, 'POST', '/api/auth/register', userAData);
    record('2. Reject duplicate email', dupRes.status === 409, `Status ${dupRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 3: Login User A (Success)
    // -------------------------------------------------------------------------
    const loginRes = await request(baseUrl, 'POST', '/api/auth/login', {
      email: userAData.email,
      password: userAData.password,
    });
    record('3. Login User A success', loginRes.status === 200 && !!loginRes.data?.data?.token, `Status ${loginRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 4: Login with invalid password (generic error)
    // -------------------------------------------------------------------------
    const badLoginRes = await request(baseUrl, 'POST', '/api/auth/login', {
      email: userAData.email,
      password: 'WrongPassword!',
    });
    record(
      '4. Login invalid credentials (generic 401)',
      badLoginRes.status === 401 && badLoginRes.data?.message === 'Invalid email or password',
      `Status ${badLoginRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: GET /me without token (401)
    // -------------------------------------------------------------------------
    const noTokenRes = await request(baseUrl, 'GET', '/api/auth/me');
    record('5. GET /api/auth/me without token returns 401', noTokenRes.status === 401, `Status ${noTokenRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 6: GET /me with tampered token (401)
    // -------------------------------------------------------------------------
    const tamperedRes = await request(baseUrl, 'GET', '/api/auth/me', undefined, 'Bearer invalid.tampered.token');
    record('6. GET /api/auth/me with tampered token returns 401', tamperedRes.status === 401, `Status ${tamperedRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 7: PUT /me update name and password
    // -------------------------------------------------------------------------
    const updateMeRes = await request(
      baseUrl,
      'PUT',
      '/api/auth/me',
      {
        name: 'Alice Wonder',
        currentPassword: 'Password123!',
        newPassword: 'NewPassword999!',
      },
      tokenA
    );
    record(
      '7. PUT /api/auth/me update profile and password',
      updateMeRes.status === 200 && updateMeRes.data?.data?.user?.name === 'Alice Wonder',
      `Status ${updateMeRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Register User B
    // -------------------------------------------------------------------------
    const regBRes = await request(baseUrl, 'POST', '/api/auth/register', userBData);
    tokenB = regBRes.data?.data?.token;
    record('8. Register User B', regBRes.status === 201 && !!tokenB, `Status ${regBRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 9: Create Trip for User A
    // -------------------------------------------------------------------------
    const tripData = {
      title: 'European Summer Vacation',
      startDate: '2026-07-01T00:00:00.000Z',
      endDate: '2026-07-10T00:00:00.000Z',
      estimatedBudget: 1500,
    };
    const createTripRes = await request(baseUrl, 'POST', '/api/trips', tripData, tokenA);
    tripId = createTripRes.data?.data?.trip?._id;
    record(
      '9. POST /api/trips create trip',
      createTripRes.status === 201 && !!tripId,
      `Trip ID: ${tripId}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Ownership Isolation - User B cannot read, update, or delete User A's trip (404)
    // -------------------------------------------------------------------------
    const bGet = await request(baseUrl, 'GET', `/api/trips/${tripId}`, undefined, tokenB);
    const bPut = await request(baseUrl, 'PUT', `/api/trips/${tripId}`, { title: 'Hacked' }, tokenB);
    const bDel = await request(baseUrl, 'DELETE', `/api/trips/${tripId}`, undefined, tokenB);
    const ownershipPass = bGet.status === 404 && bPut.status === 404 && bDel.status === 404;
    record('10. Ownership isolation: User B gets 404 on User A trip', ownershipPass, `GET:${bGet.status}, PUT:${bPut.status}, DELETE:${bDel.status}`);

    // -------------------------------------------------------------------------
    // TEST 11: Destination Validations (arrival <= departure & within trip dates)
    // -------------------------------------------------------------------------
    const badDestDates = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/destinations`,
      {
        city: 'Paris',
        country: 'France',
        arrivalDate: '2026-07-05T00:00:00.000Z',
        departureDate: '2026-07-03T00:00:00.000Z', // departure < arrival
      },
      tokenA
    );
    const outOfTripWindow = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/destinations`,
      {
        city: 'London',
        country: 'UK',
        arrivalDate: '2026-06-25T00:00:00.000Z', // outside trip start
        departureDate: '2026-06-28T00:00:00.000Z',
      },
      tokenA
    );
    record(
      '11. Destination date validations reject invalid ranges (400)',
      badDestDates.status === 400 && outOfTripWindow.status === 400,
      `Reversals: ${badDestDates.status}, Out of window: ${outOfTripWindow.status}`
    );

    // Create Destination 1 (Paris)
    const dest1Res = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/destinations`,
      {
        city: 'Paris',
        country: 'France',
        arrivalDate: '2026-07-01T00:00:00.000Z',
        departureDate: '2026-07-04T00:00:00.000Z',
      },
      tokenA
    );
    dest1Id = dest1Res.data?.data?.destination?._id;

    // Create Destination 2 (Nice)
    const dest2Res = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/destinations`,
      {
        city: 'Nice',
        country: 'France',
        arrivalDate: '2026-07-05T00:00:00.000Z',
        departureDate: '2026-07-08T00:00:00.000Z',
      },
      tokenA
    );
    dest2Id = dest2Res.data?.data?.destination?._id;
    record(
      '11b. Create valid destinations with automatic ordering (order 0 and 1)',
      dest1Res.status === 201 && dest2Res.status === 201 && dest1Res.data?.data?.destination?.order === 0 && dest2Res.data?.data?.destination?.order === 1,
      `Dest1 order: ${dest1Res.data?.data?.destination?.order}, Dest2 order: ${dest2Res.data?.data?.destination?.order}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Auto-generated Itinerary Days
    // -------------------------------------------------------------------------
    const daysRes = await request(baseUrl, 'GET', `/api/trips/${tripId}/days`, undefined, tokenA);
    const daysList = daysRes.data?.data?.days || [];
    // Paris (July 1 to 4 = 4 days) + Nice (July 5 to 8 = 4 days) = 8 days
    const daysPass = daysRes.status === 200 && daysList.length === 8;
    day1Id = daysList[0]?._id;
    record('12. Auto-generated ItineraryDays for destination date ranges', daysPass, `Generated ${daysList.length} days`);

    // -------------------------------------------------------------------------
    // TEST 13: Reorder Destinations safely despite unique (trip, order) index
    // -------------------------------------------------------------------------
    const reorderRes = await request(
      baseUrl,
      'PUT',
      `/api/trips/${tripId}/destinations/reorder`,
      {
        destinationIds: [dest2Id, dest1Id], // Swap order
      },
      tokenA
    );
    const reorderedList = reorderRes.data?.data?.destinations || [];
    const reorderPass =
      reorderRes.status === 200 &&
      reorderedList[0]?._id === dest2Id &&
      reorderedList[0]?.order === 0 &&
      reorderedList[1]?._id === dest1Id &&
      reorderedList[1]?.order === 1;
    record('13. Reorder destinations swaps order values safely', reorderPass, `Status ${reorderRes.status}`);

    // -------------------------------------------------------------------------
    // TEST 14: Activity Lifecycle (Create -> Edit -> Delete)
    // -------------------------------------------------------------------------
    const act1Res = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/days/${day1Id}/activities`,
      {
        title: 'Louvre Museum Tour',
        category: 'sightseeing',
        startTime: '2026-07-01T09:00:00.000Z',
        endTime: '2026-07-01T12:00:00.000Z',
        estimatedCost: 150,
      },
      tokenA
    );
    act1Id = act1Res.data?.data?.activity?._id;

    const act2Res = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/days/${day1Id}/activities`,
      {
        title: 'Boutique Hotel Booking Reserve',
        category: 'accommodation',
        estimatedCost: 600,
      },
      tokenA
    );
    act2Id = act2Res.data?.data?.activity?._id;

    // Edit activity 1
    const editAct1 = await request(
      baseUrl,
      'PUT',
      `/api/trips/${tripId}/activities/${act1Id}`,
      {
        estimatedCost: 200,
      },
      tokenA
    );
    const actLifecyclePass = act1Res.status === 201 && act2Res.status === 201 && editAct1.status === 200 && editAct1.data?.data?.activity?.estimatedCost === 200;
    record('14. Activity create & update with day validation', actLifecyclePass, `Act1: ${act1Id}, Act2: ${act2Id}`);

    // -------------------------------------------------------------------------
    // TEST 15: Live Budget Aggregation & Over-budget Calculation
    // -------------------------------------------------------------------------
    // Budget was 1500. Currently 200 + 600 = 800. Not over budget.
    const budgetRes1 = await request(baseUrl, 'GET', `/api/trips/${tripId}/budget`, undefined, tokenA);
    const b1 = budgetRes1.data?.data?.budget;
    const b1Pass = b1?.totalEstimated === 800 && b1?.remaining === 700 && b1?.overBudget === false;

    // Add large expense to exceed 1500 budget
    const act3Res = await request(
      baseUrl,
      'POST',
      `/api/trips/${tripId}/days/${day1Id}/activities`,
      {
        title: 'Private Yacht Charter',
        category: 'activities',
        estimatedCost: 1200,
      },
      tokenA
    );
    act3Id = act3Res.data?.data?.activity?._id;

    // Total should now be 200 + 600 + 1200 = 2000. Over budget by 500!
    const budgetRes2 = await request(baseUrl, 'GET', `/api/trips/${tripId}/budget`, undefined, tokenA);
    const b2 = budgetRes2.data?.data?.budget;
    const b2Pass = b2?.totalEstimated === 2000 && b2?.overBudget === true && b2?.overBy === 500 && b2?.remaining === -500;

    // Delete Activity 3 to restore budget
    const delAct3 = await request(baseUrl, 'DELETE', `/api/trips/${tripId}/activities/${act3Id}`, undefined, tokenA);
    const budgetRes3 = await request(baseUrl, 'GET', `/api/trips/${tripId}/budget`, undefined, tokenA);
    const b3 = budgetRes3.data?.data?.budget;
    const b3Pass = delAct3.status === 200 && b3?.totalEstimated === 800 && b3?.overBudget === false;

    record('15. Live Budget aggregation and over-budget calculation', b1Pass && b2Pass && b3Pass, `Initial 800 ok -> Exceeded 2000 (overBy 500) -> Restored 800`);

    // -------------------------------------------------------------------------
    // TEST 16: Sharing (Create -> Public Read -> Revoke -> 404)
    // -------------------------------------------------------------------------
    const shareCreateRes = await request(baseUrl, 'POST', `/api/trips/${tripId}/share`, undefined, tokenA);
    shareToken = shareCreateRes.data?.data?.shareToken;

    const shareStatusRes = await request(baseUrl, 'GET', `/api/trips/${tripId}/share`, undefined, tokenA);
    const statusPass = shareStatusRes.status === 200 && shareStatusRes.data?.data?.isActive === true;

    // Public read-only request WITHOUT auth header
    const publicReadRes = await request(baseUrl, 'GET', `/api/shared/${shareToken}`);
    const pubData = publicReadRes.data?.data?.itinerary;
    const pubPass =
      publicReadRes.status === 200 &&
      pubData?.title === 'European Summer Vacation' &&
      pubData?.destinations?.length > 0 &&
      pubData?.owner === undefined &&
      pubData?.user === undefined;

    // Invalid token returns 404
    const badTokenRes = await request(baseUrl, 'GET', '/api/shared/invalid-token-12345');
    const badTokenPass = badTokenRes.status === 404;

    // Revoke share
    const revokeRes = await request(baseUrl, 'DELETE', `/api/trips/${tripId}/share`, undefined, tokenA);

    // Calling public URL after revocation returns 404
    const postRevokeRes = await request(baseUrl, 'GET', `/api/shared/${shareToken}`);
    const revokePass = revokeRes.status === 200 && postRevokeRes.status === 404;

    record(
      '16. Sharing lifecycle (Create, Public Read, Invalid 404, Revocation 404)',
      !!shareToken && statusPass && pubPass && badTokenPass && revokePass,
      `ShareToken generated, Public 200, Revoked 404`
    );

    // -------------------------------------------------------------------------
    // TEST 17: Cascade Deletion (Deleting Trip deletes destinations, days, activities, shares)
    // -------------------------------------------------------------------------
    const delTripRes = await request(baseUrl, 'DELETE', `/api/trips/${tripId}`, undefined, tokenA);
    const tripGone = await request(baseUrl, 'GET', `/api/trips/${tripId}`, undefined, tokenA);

    // Direct MongoDB inspection to ensure zero orphaned records remain
    const remainingDests = await Destination.countDocuments({ trip: tripId });
    const remainingDays = await ItineraryDay.countDocuments({ trip: tripId });
    const remainingActs = await Activity.countDocuments({ trip: tripId });
    const remainingShares = await TripShare.countDocuments({ trip: tripId });

    const cascadePass =
      delTripRes.status === 200 &&
      tripGone.status === 404 &&
      remainingDests === 0 &&
      remainingDays === 0 &&
      remainingActs === 0 &&
      remainingShares === 0;

    record(
      '17. Cascade deletion cleans up all child documents',
      cascadePass,
      `Remaining Dests:${remainingDests}, Days:${remainingDays}, Acts:${remainingActs}, Shares:${remainingShares}`
    );

    // -------------------------------------------------------------------------
    // TEST 18: Security Check: Zero passwordHash occurrences in any API response
    // -------------------------------------------------------------------------
    let passwordHashLeaked = false;
    for (const jsonStr of allResponsesJsonStrings) {
      if (jsonStr.includes('passwordHash')) {
        passwordHashLeaked = true;
        break;
      }
    }
    record(
      '18. Security verification: No response contains passwordHash',
      !passwordHashLeaked,
      `Scanned ${allResponsesJsonStrings.length} HTTP response bodies`
    );

    // Cleanup test users
    await User.deleteMany({ email: { $in: [userAData.email, userBData.email] } });
    console.log('\nCleaned up test users from database.');

  } catch (error) {
    console.error('\nUnexpected test suite exception:', error);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
      console.log('Closed in-process test server.');
    }
    await disconnectDB();
  }

  // Summary
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
