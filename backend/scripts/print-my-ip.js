import https from 'https';

const services = [
  'https://api.ipify.org',
  'https://ipinfo.io/ip',
  'https://icanhazip.com'
];

async function getIP(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

async function run() {
  console.log('🔍 Checking your public IP address...');
  for (const service of services) {
    try {
      const ip = await getIP(service);
      console.log(`\n✅ Your Public IP Address: ${ip}`);
      console.log('\n👉 Add this IP address to your MongoDB Atlas Network Access whitelist:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Select "Network Access" in the left sidebar.');
      console.log('   3. Click "Add IP Address".');
      console.log(`   4. Paste: ${ip}`);
      console.log('   5. Click "Confirm" / "Save" and wait 1 minute for it to apply.');
      return;
    } catch (e) {
      // Continue to next service
    }
  }
  console.log('❌ Could not auto-detect public IP. Please search "what is my ip" on Google and whitelist it.');
}
run();
