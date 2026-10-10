import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FootprintScan from '../src/models/FootprintScan.js';
import { analyzeFootprint } from '../src/services/footprintAnalyzer.js';

describe('Footprint Scanner — Multi-User Data Isolation', () => {
  let mongoServer;
  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();

  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('Scans created by User A are strictly isolated and invisible to User B', async () => {
    // 1. User A creates a high-risk scan
    const caseC = analyzeFootprint(`Public profile. Home address and live location are publicly shared.`);
    const scanA = await FootprintScan.create({
      user: userAId,
      scanType: 'text',
      inputSummary: 'TEXT | User A Test',
      findings: caseC.findings,
      overallRiskLevel: caseC.overallRiskLevel,
      riskScore: caseC.riskScore,
      reasoning: caseC.reasoning,
      limitations: caseC.limitations,
      findingCount: caseC.findingCount,
      resolvedCount: 0,
    });

    // 2. User B lists scans using the exact route query: { user: req.user._id }
    const userBScans = await FootprintScan.find({ user: userBId }).lean();
    assert.strictEqual(userBScans.length, 0, 'User B should see 0 scans');

    // 3. User B tries to fetch User A scan by ID using { _id, user }
    const userBFetchA = await FootprintScan.findOne({ _id: scanA._id, user: userBId }).lean();
    assert.strictEqual(userBFetchA, null, 'User B must not be able to retrieve User A scan');

    // 4. User B attempts to delete User A scan
    const userBDeleteA = await FootprintScan.findOneAndDelete({ _id: scanA._id, user: userBId });
    assert.strictEqual(userBDeleteA, null, 'User B must not be able to delete User A scan');

    // Verify User A scan is still intact
    const userAFetchA = await FootprintScan.findOne({ _id: scanA._id, user: userAId }).lean();
    assert.ok(userAFetchA, 'User A scan must still exist unharmed');
    assert.strictEqual(userAFetchA.overallRiskLevel, 'high');

    // 5. User B deletes all their scans
    await FootprintScan.deleteMany({ user: userBId });

    // User A scan is still untouched
    const userACount = await FootprintScan.countDocuments({ user: userAId });
    assert.strictEqual(userACount, 1, 'User A scan must still remain after User B deleteAll');
  });
});
