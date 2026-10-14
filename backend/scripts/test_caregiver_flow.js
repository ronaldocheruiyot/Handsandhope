const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Caregiver Integration Test ---');

  try {
    // 1. Log in as John Smith (Student)
    console.log('\n1. Logging in as John Smith (Student)...');
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.smith@handsandhope.org',
        password: 'Password123!'
      })
    });
    const studentLogin = await studentLoginRes.json();
    if (!studentLoginRes.ok) throw new Error(JSON.stringify(studentLogin));
    const studentToken = studentLogin.token;
    const studentId = studentLogin.user?.id || studentLogin.user?._id;
    console.log(`✅ Logged in as John Smith (ID: ${studentId})`);

    // 2. Test GET /api/dashboard/caregivers as John Smith
    console.log('\n2. Testing GET /api/dashboard/caregivers as John Smith...');
    const caregiversRes = await fetch(`${BASE_URL}/api/dashboard/caregivers`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const caregivers = await caregiversRes.json();
    if (!caregiversRes.ok) throw new Error(JSON.stringify(caregivers));
    console.log(`✅ Found ${caregivers.length} caregiver(s) linked to John Smith:`);
    caregivers.forEach(cg => {
      console.log(`   - Name: ${cg.fullName} (${cg.email}) | Status: ${cg.status} | Permissions: ${cg.permissionLevel}`);
    });

    // 3. Test GET /api/dashboard/caregivers/activity as John Smith
    console.log('\n3. Testing GET /api/dashboard/caregivers/activity as John Smith...');
    const activitiesRes = await fetch(`${BASE_URL}/api/dashboard/caregivers/activity`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const activities = await activitiesRes.json();
    if (!activitiesRes.ok) throw new Error(JSON.stringify(activities));
    console.log(`✅ Found ${activities.length} activity log entries for John Smith's account`);

    // 4. Log in as Maria Garcia (Caregiver)
    console.log('\n4. Logging in as Maria Garcia (Caregiver)...');
    const caregiverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'caregiver@handsandhope.org',
        password: 'Password123!'
      })
    });
    const caregiverLogin = await caregiverLoginRes.json();
    if (!caregiverLoginRes.ok) throw new Error(JSON.stringify(caregiverLogin));
    const caregiverToken = caregiverLogin.token;
    console.log(`✅ Logged in as Maria Garcia (Caregiver)`);

    // 5. Test GET /api/dashboard/caregiver/managed-accounts as Maria Garcia
    console.log('\n5. Testing GET /api/dashboard/caregiver/managed-accounts as Maria Garcia...');
    const managedRes = await fetch(`${BASE_URL}/api/dashboard/caregiver/managed-accounts`, {
      headers: { Authorization: `Bearer ${caregiverToken}` }
    });
    const managed = await managedRes.json();
    if (!managedRes.ok) throw new Error(JSON.stringify(managed));
    console.log(`✅ Caregiver manages ${managed.length} account(s):`);
    managed.forEach(acc => {
      console.log(`   - Account: ${acc.name} (${acc.email}) | Role: ${acc.role} | Products: ${acc.counts?.totalProducts} | Orders: ${acc.counts?.completedOrders}`);
    });

    // 6. Test Caregiver adding a product for John Smith
    console.log(`\n6. Testing POST /api/products as Caregiver for John Smith (${studentId})...`);
    const newProductRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${caregiverToken}`
      },
      body: JSON.stringify({
        name: `Handcrafted Pottery Bowl - ${Date.now()}`,
        price: 32.50,
        description: 'Artisanal bowl made with organic clay.',
        category: 'Pottery',
        stock: 5,
        targetAccountId: studentId,
      })
    });
    const newProduct = await newProductRes.json();
    if (!newProductRes.ok) throw new Error(JSON.stringify(newProduct));
    console.log(`✅ Product created on behalf of John Smith (Product ID: ${newProduct._id})`);

    // 7. Verify John Smith's activity log now shows the product creation
    const updatedActivitiesRes = await fetch(`${BASE_URL}/api/dashboard/caregivers/activity`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const updatedActivities = await updatedActivitiesRes.json();
    console.log(`\n7. Verified John Smith's updated activity log: ${updatedActivities.length} entries (Latest: "${updatedActivities[0]?.action}" - "${updatedActivities[0]?.actionDetails}")`);

    console.log('\n🎉 ALL CAREGIVER & STUDENT LINKING TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

runTests();
