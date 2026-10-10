/**
 * Wellness Studio — backend API regression test (no test framework in repo).
 * Run: node scripts/testWellnessApi.js
 *
 * Covers: auth enforcement, CRUD for all record types, cross-midnight sleep
 * duration, validation errors, user isolation (2 users), insights with no data
 * / with seeded data, wind-down routine, journal edit, AI consent gates.
 */

const BASE = process.env.API_BASE || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok - ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  FAIL - ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, data };
}

async function registerUser(tag) {
  const email = `wellness_${tag}_${Date.now()}@example.com`;
  const r = await req('POST', '/auth/register', {
    body: { name: `Wellness Tester ${tag}`, email, password: 'TestPass123!' },
  });
  if (r.status !== 201 && r.status !== 200) {
    console.log('register failed:', r.status, JSON.stringify(r.data));
    return null;
  }
  return { token: r.data.token, user: r.data.user || r.data };
}

async function main() {
  console.log('═══ WELLNESS API TESTS ═══\n');

  // 1. Auth enforcement ------------------------------------------------------
  console.log('1. Auth enforcement');
  const noAuth = await req('GET', '/wellness/checkins');
  check('checkins without token → 401', noAuth.status === 401, `got ${noAuth.status}`);
  const noAuth2 = await req('GET', '/wellness/insights');
  check('insights without token → 401', noAuth2.status === 401, `got ${noAuth2.status}`);
  const badTok = await req('GET', '/wellness/goals', { token: 'not-a-jwt' });
  check('checkins with bad token → 401', badTok.status === 401, `got ${badTok.status}`);

  const userA = await registerUser('a');
  const userB = await registerUser('b');
  check('register user A', Boolean(userA?.token));
  check('register user B', Boolean(userB?.token));
  if (!userA?.token || !userB?.token) return finish();
  const tokA = userA.token;
  const tokB = userB.token;

  // 2. Check-ins ------------------------------------------------------------
  console.log('2. Daily check-ins');
  const ci1 = await req('POST', '/wellness/checkins', {
    token: tokA,
    body: { mood: 'good', energy: 4, stress: 2, sleepQuality: 4, generalWellbeing: 4, notes: 'solid day' },
  });
  check('create check-in (defaults to today)', ci1.status === 200 && ci1.data?.checkin?._id, JSON.stringify(ci1.data));
  const ciId = ci1.data?.checkin?._id;

  const ci2 = await req('POST', '/wellness/checkins', {
    token: tokA,
    body: { date: '2026-10-01', mood: 'low', energy: 2, stress: 5, sleepQuality: 2, generalWellbeing: 2 },
  });
  check('create check-in for past date', ci2.status === 200, JSON.stringify(ci2.data));

  const ciBadDate = await req('POST', '/wellness/checkins', { token: tokA, body: { date: 'not-a-date' } });
  check('invalid date → 400', ciBadDate.status === 400, `got ${ciBadDate.status}`);

  const ciList = await req('GET', '/wellness/checkins', { token: tokA });
  check('list check-ins returns both', ciList.status === 200 && ciList.data?.checkins?.length >= 2, JSON.stringify(ciList.data?.checkins?.length));
  check('hasCheckedInToday true', ciList.data?.hasCheckedInToday === true);

  const ciEdit = await req('PUT', `/wellness/checkins/${ciId}`, {
    token: tokA,
    body: { mood: 'great', energy: 5, notes: 'edited' },
  });
  check('edit check-in', ciEdit.status === 200 && ciEdit.data?.checkin?.mood === 'great', JSON.stringify(ciEdit.data));

  const ciEditB = await req('PUT', `/wellness/checkins/${ciId}`, { token: tokB, body: { mood: 'low' } });
  check("user B cannot edit user A's check-in → 404", ciEditB.status === 404, `got ${ciEditB.status}`);

  const ciClamp = await req('POST', '/wellness/checkins', { token: tokA, body: { date: '2026-10-02', energy: 99, stress: -3 } });
  check('out-of-range values clamped to 1..5', ciClamp.data?.checkin?.energy === 5 && ciClamp.data?.checkin?.stress === 1, JSON.stringify({ e: ciClamp.data?.checkin?.energy, s: ciClamp.data?.checkin?.stress }));

  // 3. Sleep (cross-midnight) ------------------------------------------------
  console.log('3. Sleep logging');
  const sl1 = await req('POST', '/wellness/sleep', {
    token: tokA,
    body: { date: '2026-10-01', bedtime: '23:00', wakeTime: '07:00', quality: 4 },
  });
  check('cross-midnight sleep → 480 min', sl1.status === 200 && sl1.data?.log?.durationMinutes === 480, JSON.stringify(sl1.data));

  const slSameDay = await req('POST', '/wellness/sleep', {
    token: tokA,
    body: { date: '2026-10-02', bedtime: '07:00', wakeTime: '07:00' },
  });
  check('identical bed/wake → 400', slSameDay.status === 400, `got ${slSameDay.status}`);

  const slBadTime = await req('POST', '/wellness/sleep', { token: tokA, body: { date: '2026-10-03', bedtime: '25:99', wakeTime: '07:00' } });
  check('invalid time format → 400', slBadTime.status === 400, `got ${slBadTime.status}`);

  const slSameDayDur = await req('POST', '/wellness/sleep', { token: tokA, body: { date: '2026-10-04', bedtime: '22:30', wakeTime: '06:15' } });
  check('same-evening sleep → 465 min', slSameDayDur.data?.log?.durationMinutes === 465, JSON.stringify(slSameDayDur.data));

  // 4. Menstrual ------------------------------------------------------------
  console.log('4. Menstrual journal');
  const mn1 = await req('POST', '/wellness/menstrual', {
    token: tokA,
    body: { startDate: '2026-09-01', endDate: '2026-09-05', flow: 'medium', painLevel: 3, symptoms: ['cramps', 'headache'] },
  });
  check('create cycle log', mn1.status === 201 && mn1.data?.log?._id, JSON.stringify(mn1.data));
  const mnId = mn1.data?.log?._id;

  const mnBad = await req('POST', '/wellness/menstrual', { token: tokA, body: { startDate: '2026-09-10', endDate: '2026-09-01' } });
  check('end before start → 400', mnBad.status === 400, `got ${mnBad.status}`);

  const mnEdit = await req('PUT', `/wellness/menstrual/${mnId}`, { token: tokA, body: { flow: 'heavy', painLevel: 4 } });
  check('edit cycle log', mnEdit.status === 200 && mnEdit.data?.log?.flow === 'heavy', JSON.stringify(mnEdit.data));

  const mnEditB = await req('PUT', `/wellness/menstrual/${mnId}`, { token: tokB, body: { flow: 'light' } });
  check("user B cannot edit user A's cycle log → 404", mnEditB.status === 404, `got ${mnEditB.status}`);

  const mn2 = await req('POST', '/wellness/menstrual', {
    token: tokA,
    body: { startDate: '2026-09-29', symptoms: ['cramps', 'bloating'] },
  });
  check('create second cycle log (irregular, no end date)', mn2.status === 201, JSON.stringify(mn2.data));

  // 5. Movement -------------------------------------------------------------
  console.log('5. Movement');
  const mv1 = await req('POST', '/wellness/movement', { token: tokA, body: { title: 'Gentle walk', category: 'walking', durationMinutes: 15, effort: 'gentle' } });
  check('log movement', mv1.status === 201 && mv1.data?.log?._id, JSON.stringify(mv1.data));
  const mvBad = await req('POST', '/wellness/movement', { token: tokA, body: { title: '' } });
  check('empty title → 400', mvBad.status === 400, `got ${mvBad.status}`);
  const mvBadCat = await req('POST', '/wellness/movement', { token: tokA, body: { title: 'X', category: 'marathon' } });
  check('unknown category → fallback', mvBadCat.status === 201 && mvBadCat.data?.log?.category === 'stretching', JSON.stringify(mvBadCat.data));

  // 6. Journal --------------------------------------------------------------
  console.log('6. Journal (private reflections)');
  const jr1 = await req('POST', '/wellness/journal', { token: tokA, body: { prompt: 'How am I feeling?', content: 'Tired but hopeful today.' } });
  check('create journal entry', jr1.status === 201 && jr1.data?.entry?._id, JSON.stringify(jr1.data));
  const jrId = jr1.data?.entry?._id;

  const jrEdit = await req('PUT', `/wellness/journal/${jrId}`, { token: tokA, body: { content: 'Updated reflection text.' } });
  check('edit journal entry', jrEdit.status === 200 && jrEdit.data?.entry?.content?.startsWith('Updated'), JSON.stringify(jrEdit.data));

  const jrListB = await req('GET', '/wellness/journal', { token: tokB });
  check("user B sees no entries of A", jrListB.status === 200 && (jrListB.data?.entries?.length || 0) === 0, JSON.stringify(jrListB.data?.entries?.length));

  const jrEditB = await req('PUT', `/wellness/journal/${jrId}`, { token: tokB, body: { content: 'hacked' } });
  check("user B cannot edit A's entry → 404", jrEditB.status === 404, `got ${jrEditB.status}`);

  const jrEmpty = await req('POST', '/wellness/journal', { token: tokA, body: { content: '   ' } });
  check('blank content → 400', jrEmpty.status === 400, `got ${jrEmpty.status}`);

  // 7. Goals ----------------------------------------------------------------
  console.log('7. Goals & habits');
  const g1 = await req('POST', '/wellness/goals', { token: tokA, body: { title: 'Evening wind-down', category: 'sleep', frequency: '5x_week', targetCount: 5 } });
  check('create goal', g1.status === 201 && g1.data?.goal?._id, JSON.stringify(g1.data));
  const gId = g1.data?.goal?._id;
  const gInc = await req('PATCH', `/wellness/goals/${gId}/increment`, { token: tokA });
  check('increment goal', gInc.status === 200 && gInc.data?.goal?.currentCount === 1, JSON.stringify(gInc.data));
  const gPause = await req('PUT', `/wellness/goals/${gId}`, { token: tokA, body: { status: 'paused' } });
  check('pause goal', gPause.status === 200 && gPause.data?.goal?.status === 'paused', JSON.stringify(gPause.data));
  const gEditB = await req('PUT', `/wellness/goals/${gId}`, { token: tokB, body: { title: 'stolen' } });
  check("user B cannot edit A's goal → 404", gEditB.status === 404, `got ${gEditB.status}`);

  // 8. Wind-down routine ----------------------------------------------------
  console.log('8. Wind-down routine');
  const wd1 = await req('PUT', '/wellness/winddown', {
    token: tokA,
    body: { activities: [{ label: 'Reduce screen use', time: '21:30' }, { label: 'Quiet reading' }, { label: '' }], remindersEnabled: true },
  });
  check('save routine (blank label dropped)', wd1.status === 200 && wd1.data?.routine?.activities?.length === 2, JSON.stringify(wd1.data?.routine?.activities?.length));
  const wdGet = await req('GET', '/wellness/winddown', { token: tokA });
  check('reload routine preserves order', wdGet.status === 200 && wdGet.data?.routine?.activities?.[0]?.label === 'Reduce screen use', JSON.stringify(wdGet.data));
  const wdB = await req('GET', '/wellness/winddown', { token: tokB });
  check("user B's routine is empty", wdB.status === 200 && (wdB.data?.routine?.activities?.length || 0) === 0);

  // 9. Insights -------------------------------------------------------------
  console.log('9. Pattern insights');
  // user B has no records → all gaps, no fabricated insights
  const insB = await req('GET', '/wellness/insights', { token: tokB });
  check('empty user → 0 insights', insB.status === 200 && insB.data?.insights?.length === 0, JSON.stringify(insB.data?.insights?.length));
  check('empty user → insufficient list populated', (insB.data?.insufficient?.length || 0) >= 4, JSON.stringify(insB.data?.insufficient?.length));
  check('empty user → hasSufficientData false', insB.data?.hasSufficientData === false);

  // user A: seed richer data then verify grounded insights
  const seedDays = [
    { date: '2026-09-20', mood: 'low', energy: 2, stress: 5, sleepQuality: 1, generalWellbeing: 2 },
    { date: '2026-09-21', mood: 'stressed', energy: 2, stress: 5, sleepQuality: 2, generalWellbeing: 2 },
    { date: '2026-09-22', mood: 'neutral', energy: 3, stress: 4, sleepQuality: 3, generalWellbeing: 3 },
    { date: '2026-09-23', mood: 'good', energy: 4, stress: 2, sleepQuality: 4, generalWellbeing: 4 },
    { date: '2026-09-24', mood: 'great', energy: 5, stress: 1, sleepQuality: 5, generalWellbeing: 5 },
    { date: '2026-09-25', mood: 'good', energy: 4, stress: 2, sleepQuality: 4, generalWellbeing: 4 },
    { date: '2026-09-26', mood: 'great', energy: 5, stress: 1, sleepQuality: 5, generalWellbeing: 5 },
    { date: '2026-09-27', mood: 'neutral', energy: 3, stress: 3, sleepQuality: 3, generalWellbeing: 3 },
  ];
  for (const d of seedDays) {
    await req('POST', '/wellness/checkins', { token: tokA, body: d });
    await req('POST', '/wellness/sleep', { token: tokA, body: { date: d.date, bedtime: '23:00', wakeTime: '07:00', quality: d.sleepQuality } });
  }
  await req('POST', '/wellness/movement', { token: tokA, body: { title: 'Stretch', date: '2026-09-23' } });
  await req('POST', '/wellness/movement', { token: tokA, body: { title: 'Walk', date: '2026-09-24' } });
  await req('POST', '/wellness/movement', { token: tokA, body: { title: 'Mobility', date: '2026-09-25' } });

  const insA = await req('GET', '/wellness/insights', { token: tokA });
  check('seeded user → insights produced', insA.status === 200 && insA.data?.insights?.length >= 2, JSON.stringify({ n: insA.data?.insights?.length, gaps: insA.data?.insufficient?.length }));
  const everyInsight = (insA.data?.insights || []).every(
    (i) => i.title && i.observation && i.period?.from && Array.isArray(i.supportingRecords) && i.supportingRecords.length > 0
  );
  check('every insight has period + observation + supporting records', everyInsight);
  // Causal-claim detector: test assertion sentences only, ignoring sentences
  // that explicitly negate causation ("does not prove…", "not that one caused…")
  // because those are the cautious disclaimers the spec requires.
  const causalWords = /\bcauses?\b|\bleads? to\b|\bresults? in\b|\bbecause of your\b|\bproves?\b|\bguarantees?\b|\bdiagnos/i;
  const assertiveSentences = (text) =>
    String(text)
      .split(/(?<=[.!?])\s+/)
      .filter((s) => !/\b(not|no|never|without|rather than)\b/i.test(s));
  const causalHits = (insA.data?.insights || []).filter((i) =>
    assertiveSentences(i.observation).some((s) => causalWords.test(s))
  );
  check('no causal/diagnostic claims in observations', causalHits.length === 0, causalHits.map((i) => `${i.id}: ${i.observation}`).join(' || '));

  // 10. AI consent gates -----------------------------------------------------
  console.log('10. AI consent gates');
  const aiNoConsent = await req('POST', '/wellness/ai/explain', { token: tokA, body: { title: 't', observation: 'o' } });
  check('explain without consent → 400', aiNoConsent.status === 400, `got ${aiNoConsent.status}`);
  const aiNoEntry = await req('POST', '/wellness/ai/reflect', { token: tokA, body: { consent: true } });
  check('reflect without entryId → 400', aiNoEntry.status === 400, `got ${aiNoEntry.status}`);
  const aiBEntry = await req('POST', '/wellness/ai/reflect', { token: tokB, body: { consent: true, entryId: jrId } });
  check("user B cannot reflect on A's entry → 404", aiBEntry.status === 404, `got ${aiBEntry.status}`);

  // 11. Deletion -------------------------------------------------------------
  console.log('11. Deletion controls');
  const delB = await req('DELETE', `/wellness/checkins/${ciId}`, { token: tokB });
  check("user B cannot delete A's check-in → 404", delB.status === 404, `got ${delB.status}`);
  const delA = await req('DELETE', `/wellness/checkins/${ciId}`, { token: tokA });
  check("user A deletes own check-in → 200", delA.status === 200, `got ${delA.status}`);
  const delAgain = await req('DELETE', `/wellness/checkins/${ciId}`, { token: tokA });
  check('second delete → 404', delAgain.status === 404, `got ${delAgain.status}`);

  finish();
}

function finish() {
  console.log(`\n═══ RESULT: ${passed} passed, ${failed} failed ═══`);
  if (failed) {
    console.log('Failed:', failures.join(' | '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('TEST RUNNER ERROR:', err);
  process.exit(1);
});
