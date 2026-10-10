import test from 'node:test';
import assert from 'node:assert/strict';
import { getOpportunityFeed } from '../src/services/opportunityFeed.js';

test('normalizes verified listing fields and preserves cached data on refresh failure', async (context) => {
  let sourceUnavailable = false;
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => {
    if (sourceUnavailable) throw new Error('simulated source failure');
    return new Response(JSON.stringify({
      data: [
        {
          slug: 'javascript-role',
          title: 'JavaScript Engineer',
          company_name: 'Example Employer',
          description: 'Build with JavaScript, SQL, and Python.',
          url: 'https://jobs.example.com/apply',
          location: 'Remote',
          remote: true,
          tags: [],
          job_types: [],
          created_at: 1791639046,
        },
        { slug: 'javascript-role', title: 'Duplicate', url: 'https://jobs.example.com/duplicate' },
        { slug: 'unsafe-link', title: 'Unsafe', url: 'javascript:alert(1)' },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  });

  const liveFeed = await getOpportunityFeed({ refresh: true });
  assert.equal(liveFeed.opportunities.length, 1);
  assert.equal(liveFeed.opportunities[0].deadline, null);
  assert.equal(liveFeed.opportunities[0].status, 'deadline_unverified');
  assert.deepEqual(liveFeed.opportunities[0].skills, ['Python', 'SQL', 'JavaScript']);
  assert.equal(liveFeed.opportunities[0].applicationUrl, 'https://jobs.example.com/apply');

  sourceUnavailable = true;
  const staleFeed = await getOpportunityFeed({ refresh: true });
  assert.equal(staleFeed.stale, true);
  assert.equal(staleFeed.fetchedAt, liveFeed.fetchedAt);
  assert.equal(staleFeed.opportunities.length, 1);
  assert.equal(fetchMock.mock.callCount(), 2);
});