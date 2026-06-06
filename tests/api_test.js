const assert = require('assert');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const headers = {
    'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64'),
    'Content-Type': 'application/json'
  };

  console.log('Running API Integration Tests...');

  try {
    // 1. Test Projects
    const projectsRes = await fetch(`${baseUrl}/projects.json`, { headers });
    assert.strictEqual(projectsRes.status, 200, 'Projects API should return 200');
    const projectsData = await projectsRes.json();
    assert(projectsData.projects, 'Should return projects array');
    console.log('✅ Projects API passed');

    // 2. Test Issue Statuses
    const statusesRes = await fetch(`${baseUrl}/issue_statuses.json`, { headers });
    assert.strictEqual(statusesRes.status, 200, 'Statuses API should return 200');
    const statusesData = await statusesRes.json();
    assert(statusesData.issue_statuses, 'Should return issue_statuses array');
    console.log('✅ Issue Statuses API passed');

    // 3. Test Issues (with children and relations)
    const issuesRes = await fetch(`${baseUrl}/issues.json?include=children,relations`, { headers });
    assert.strictEqual(issuesRes.status, 200, 'Issues API should return 200');
    const issuesData = await issuesRes.json();
    assert(issuesData.issues, 'Should return issues array');
    console.log('✅ Issues API passed');

    console.log('🎉 All backend API tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    process.exit(1);
  }
}

runTests();
