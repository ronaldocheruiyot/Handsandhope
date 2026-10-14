import http from 'http';

const testUsers = [
  { email: 'alice.seller@example.com', password: 'Password123!', role: 'seller' },
  { email: 'mary.student@example.com', password: 'Password123!', role: 'student' },
  { email: 'john.teacher@example.com', password: 'Password123!', role: 'teacher' },
  { email: 'admin@sunshine.school', password: 'AdminPass123!', role: 'school' },
];

function loginUser(credentials) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: credentials.email,
      password: credentials.password
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAllLogins() {
  console.log('🧪 Testing login for all 4 seeded accounts against running backend (port 5000)...');
  for (const u of testUsers) {
    try {
      const res = await loginUser(u);
      if (res.status === 200) {
        console.log(`✅ Login SUCCESS for ${u.email} [Role: ${res.data.user.role}]`);
      } else {
        console.log(`❌ Login FAILED for ${u.email} (Status ${res.status}):`, res.data);
      }
    } catch (e) {
      console.log(`⚠️ Network / Server connection error: ${e.message}`);
    }
  }
}

testAllLogins();
