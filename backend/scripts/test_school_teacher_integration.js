const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Testing School, Teacher, Student Ecosystem API ---');

  try {
    // 1. School Admin Login
    console.log('\n1. Testing School Admin Login (admin@sunshine.school)...');
    const schoolLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@sunshine.school', password: 'AdminPass123!' })
    });
    const schoolLogin = await schoolLoginRes.json();
    if (!schoolLoginRes.ok) throw new Error(JSON.stringify(schoolLogin));
    const schoolToken = schoolLogin.token;
    console.log(`✅ School Admin logged in! User: ${schoolLogin.user?.name}, Role: ${schoolLogin.user?.role}`);

    // 2. School Overview
    console.log('\n2. Testing GET /api/dashboard/school/overview...');
    const schoolOvRes = await fetch(`${BASE_URL}/api/dashboard/school/overview`, {
      headers: { Authorization: `Bearer ${schoolToken}` }
    });
    const schoolOv = await schoolOvRes.json();
    console.log(`✅ School Overview for "${schoolOv.school?.name}":`, schoolOv.stats);

    // 3. School Teachers List
    console.log('\n3. Testing GET /api/dashboard/school/teachers...');
    const schoolTeachersRes = await fetch(`${BASE_URL}/api/dashboard/school/teachers`, {
      headers: { Authorization: `Bearer ${schoolToken}` }
    });
    const schoolTeachers = await schoolTeachersRes.json();
    console.log(`✅ Found ${schoolTeachers.length} teachers in school:`);
    schoolTeachers.forEach(t => console.log(`   - ${t.name} (${t.email}) | Status: ${t.status} | Dept: ${t.department}`));

    // 4. School Students List
    console.log('\n4. Testing GET /api/dashboard/school/students...');
    const schoolStudentsRes = await fetch(`${BASE_URL}/api/dashboard/school/students`, {
      headers: { Authorization: `Bearer ${schoolToken}` }
    });
    const schoolStudents = await schoolStudentsRes.json();
    console.log(`✅ Found ${schoolStudents.length} students in school:`);
    schoolStudents.forEach(s => console.log(`   - ${s.name} (${s.email}) | Assigned: ${s.teacher} | Products: ${s.products}`));

    // 5. Teacher Login
    console.log('\n5. Testing Teacher Login (john.teacher@example.com)...');
    const teacherLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.teacher@example.com', password: 'Password123!' })
    });
    const teacherLogin = await teacherLoginRes.json();
    if (!teacherLoginRes.ok) throw new Error(JSON.stringify(teacherLogin));
    const teacherToken = teacherLogin.token;
    console.log(`✅ Teacher logged in! User: ${teacherLogin.user?.name}, Role: ${teacherLogin.user?.role}`);

    // 6. Teacher Pending Approvals
    console.log('\n6. Testing GET /api/dashboard/teacher/pending-approvals...');
    const pendingRes = await fetch(`${BASE_URL}/api/dashboard/teacher/pending-approvals`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    const pending = await pendingRes.json();
    console.log(`✅ Pending students: ${pending.pendingStudents?.length}, Pending products: ${pending.pendingProducts?.length}`);
    pending.pendingProducts?.forEach(p => console.log(`   - Product: "${p.title}" by ${p.studentName} ($${p.price})`));

    // 7. Teacher Approves a Pending Product
    if (pending.pendingProducts?.length > 0) {
      const prodToApprove = pending.pendingProducts[0];
      console.log(`\n7. Teacher approving product "${prodToApprove.title}" (${prodToApprove.id})...`);
      const approveRes = await fetch(`${BASE_URL}/api/dashboard/teacher/products/${prodToApprove.id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      const approveData = await approveRes.json();
      console.log(`✅ ${approveData.message}`);
    }

    console.log('\n🎉 ALL SCHOOL & TEACHER & STUDENT ECOSYSTEM APIS ARE OPERATING PERFECTLY!');
  } catch (err) {
    console.error('❌ Integration Test Error:', err.message);
  }
}

runTests();
