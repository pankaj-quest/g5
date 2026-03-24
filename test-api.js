/**
 * Quick API test script to verify the Insights endpoint works
 * Run: node test-api.js
 */

const BASE = 'http://localhost:3000'

async function main() {
  console.log('🔍 Testing G5 Analytics API\n')

  // 1. Login
  console.log('1. Logging in...')
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@g5.dev', password: 'demo1234' }),
  })
  const loginData = await loginRes.json()
  
  if (!loginData.token) {
    console.error('❌ Login failed:', loginData)
    return
  }
  
  console.log('✅ Logged in')
  console.log('   Token:', loginData.token.slice(0, 20) + '...')
  console.log('   OrgId:', loginData.orgId)

  const token = loginData.token
  const authHeader = { Authorization: `Bearer ${token}` }

  // 2. Get projects
  console.log('\n2. Fetching projects...')
  const projectsRes = await fetch(`${BASE}/projects`, { headers: authHeader })
  const projects = await projectsRes.json()
  
  if (!projects || projects.length === 0) {
    console.error('❌ No projects found')
    return
  }
  
  const project = projects[0]
  console.log('✅ Found project:', project.name)
  console.log('   Project ID:', project._id)
  console.log('   Token:', project.token)

  // 3. Test Insights API
  console.log('\n3. Testing Insights API...')
  const insightsUrl = `${BASE}/analytics/insights?projectId=${project._id}&eventName=Login&metric=total&unit=day`
  console.log('   URL:', insightsUrl)
  
  const insightsRes = await fetch(insightsUrl, { headers: authHeader })
  const insightsData = await insightsRes.json()
  
  console.log('   Status:', insightsRes.status)
  console.log('   Response:', JSON.stringify(insightsData, null, 2))
  
  if (insightsRes.status === 200) {
    console.log('\n✅ Insights API works!')
    console.log(`   Found ${insightsData.length} data points`)
  } else {
    console.log('\n❌ Insights API failed')
  }

  // 4. Check event count in DB
  console.log('\n4. Summary:')
  console.log(`   - Login events found: ${insightsData.length > 0 ? 'YES' : 'NO'}`)
  console.log(`   - Data points: ${insightsData.length}`)
}

main().catch(console.error)

