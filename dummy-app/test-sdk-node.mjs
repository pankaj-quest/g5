// Node.js E2E test for G5 SDK
// Tests against the live Cloud Run backend

const API_HOST = 'https://g5-api-757475034422.asia-south1.run.app'
const TOKEN = '298f05bfccf08da4db6cb50e2ddfc030'

let passed = 0
let failed = 0

function log(status, msg) {
  const icon = status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m'
  console.log(`${icon} ${msg}`)
  if (status === 'PASS') passed++
  else failed++
}

async function test(name, fn) {
  try {
    await fn()
    log('PASS', name)
  } catch (e) {
    log('FAIL', `${name} — ${e.message}`)
  }
}

async function run() {
  console.log('\n=== G5 SDK Node.js E2E Tests ===\n')

  // Test 1: /track endpoint
  await test('POST /track — single event', async () => {
    const res = await fetch(`${API_HOST}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-g5-token': TOKEN },
      body: JSON.stringify({
        event: 'Node Test Event',
        properties: {
          distinct_id: 'node-test-user',
          time: Math.floor(Date.now() / 1000),
          $insert_id: `test_${Date.now()}`,
          source: 'node-e2e-test',
        }
      })
    })
    const data = await res.json()
    if (data.status !== 1) throw new Error(`Expected status 1, got ${JSON.stringify(data)}`)
  })

  // Test 2: /import endpoint (batch)
  await test('POST /import — batch events', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      event: `Batch Event ${i + 1}`,
      properties: {
        distinct_id: 'node-test-user',
        token: TOKEN,
        time: Math.floor(Date.now() / 1000),
        $insert_id: `batch_${Date.now()}_${i}`,
        index: i,
      }
    }))
    const res = await fetch(`${API_HOST}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-g5-token': TOKEN },
      body: JSON.stringify(events),
    })
    const data = await res.json()
    if (data.status !== 1) throw new Error(`Expected status 1, got ${JSON.stringify(data)}`)
  })

  // Test 3: /engage endpoint (profile)
  await test('POST /engage — user profile set', async () => {
    const res = await fetch(`${API_HOST}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-g5-token': TOKEN },
      body: JSON.stringify({
        $distinct_id: 'node-test-user',
        $token: TOKEN,
        $set: { name: 'Node Test User', email: 'node@test.com', plan: 'free' },
      })
    })
    const data = await res.json()
    if (data.status !== 1) throw new Error(`Expected status 1, got ${JSON.stringify(data)}`)
  })

  // Test 4: /engage — increment
  await test('POST /engage — increment counter', async () => {
    const res = await fetch(`${API_HOST}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-g5-token': TOKEN },
      body: JSON.stringify({
        $distinct_id: 'node-test-user',
        $token: TOKEN,
        $increment: { login_count: 1, total_actions: 5 },
      })
    })
    const data = await res.json()
    if (data.status !== 1) throw new Error(`Expected status 1, got ${JSON.stringify(data)}`)
  })

  // Test 5: /groups endpoint
  await test('POST /groups — group profile set', async () => {
    const res = await fetch(`${API_HOST}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-g5-token': TOKEN },
      body: JSON.stringify({
        $token: TOKEN,
        $group_key: 'company_id',
        $group_id: 'test_corp',
        $set: { name: 'Test Corp', industry: 'Technology', plan: 'enterprise' },
      })
    })
    const data = await res.json()
    if (data.status !== 1) throw new Error(`Expected status 1, got ${JSON.stringify(data)}`)
  })

  // Test 6: Analytics endpoints (need JWT auth)
  // First login
  let jwt = null
  await test('POST /auth/login', async () => {
    const res = await fetch(`${API_HOST}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pankaj@velosapps.com', password: 'Pankaj@123' }),
    })
    const data = await res.json()
    if (!data.token) throw new Error(`No token returned: ${JSON.stringify(data)}`)
    jwt = data.token
  })

  if (jwt) {
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` }
    const projectId = '69c31abe66cd919bad1e55a1'

    await test('GET /analytics/stats', async () => {
      const res = await fetch(`${API_HOST}/analytics/stats?projectId=${projectId}`, { headers: authHeaders })
      const data = await res.json()
      if (typeof data.totalEvents !== 'number') throw new Error(`Unexpected: ${JSON.stringify(data)}`)
      console.log(`     Events: ${data.totalEvents}, Users: ${data.totalUsers}, Today: ${data.eventsToday}`)
    })

    await test('GET /analytics/events', async () => {
      const res = await fetch(`${API_HOST}/analytics/events?projectId=${projectId}`, { headers: authHeaders })
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error(`Expected array: ${JSON.stringify(data)}`)
      console.log(`     Event types: ${data.join(', ')}`)
    })

    await test('GET /analytics/recent-events', async () => {
      const res = await fetch(`${API_HOST}/analytics/recent-events?projectId=${projectId}&limit=5`, { headers: authHeaders })
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error(`Expected array`)
      console.log(`     Recent events: ${data.length}`)
    })

    await test('GET /analytics/people', async () => {
      const res = await fetch(`${API_HOST}/analytics/people?projectId=${projectId}&limit=5`, { headers: authHeaders })
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error(`Expected array`)
      console.log(`     Profiles: ${data.length}`)
    })
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
}

run()
