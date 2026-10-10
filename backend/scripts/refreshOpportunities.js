import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { ingestOpportunities } from '../src/services/opportunities/ingest.js';

dotenv.config();

try {
  await connectDB();
  const report = await ingestOpportunities();
  console.log(JSON.stringify({
    lastRefreshedAt: report.lastRefreshedAt,
    sourceCounts: report.sourceCounts,
    fetched: report.fetched,
    deduplicated: report.deduplicated,
    india: report.india,
    global: report.global,
    expiredRemoved: report.expiredRemoved,
  }, null, 2));
} catch (error) {
  console.error(`Opportunity ingestion failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
