// Script to fix DNS records via Cloudflare API
const CLOUDFLARE_API_KEY = 'a477e194f7eff58cb9aa770022b0c283fc6c2';
const CLOUDFLARE_EMAIL = 'levan@sarke.ge';

const ZONES = {
  'nebiswera.com': '3f43b160949d0d09a44096f0d438aeab',
  'nbswera.com': 'de00ef4c486f92132df0ae9a6c1be111',
};

const headers = {
  'X-Auth-Email': CLOUDFLARE_EMAIL,
  'X-Auth-Key': CLOUDFLARE_API_KEY,
  'Content-Type': 'application/json',
};

async function addDnsRecord(zoneId, record) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    }
  );
  const data = await res.json();
  return data;
}

async function getDnsRecords(zoneId) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
    { headers }
  );
  const data = await res.json();
  return data.result || [];
}

async function fixDns() {
  console.log('=== Fixing DNS Records ===\n');

  // 1. Add SPF for nbswera.com
  console.log('1. Adding SPF record for nbswera.com...');
  const nbsweraRecords = await getDnsRecords(ZONES['nbswera.com']);
  const existingSpf = nbsweraRecords.find(
    r => r.type === 'TXT' && r.name === 'nbswera.com' && r.content.includes('v=spf1')
  );

  if (existingSpf) {
    console.log('   ✅ SPF already exists:', existingSpf.content);
  } else {
    const spfResult = await addDnsRecord(ZONES['nbswera.com'], {
      type: 'TXT',
      name: 'nbswera.com',
      content: 'v=spf1 a mx include:spf.mtasv.net ~all',
      ttl: 3600,
    });
    if (spfResult.success) {
      console.log('   ✅ SPF added successfully');
    } else {
      console.log('   ❌ Failed:', spfResult.errors);
    }
  }

  // 2. Add DMARC for nbswera.com
  console.log('\n2. Adding DMARC record for nbswera.com...');
  const existingDmarcNbs = nbsweraRecords.find(
    r => r.type === 'TXT' && r.name === '_dmarc.nbswera.com'
  );

  if (existingDmarcNbs) {
    console.log('   ✅ DMARC already exists:', existingDmarcNbs.content);
  } else {
    const dmarcResult = await addDnsRecord(ZONES['nbswera.com'], {
      type: 'TXT',
      name: '_dmarc.nbswera.com',
      content: 'v=DMARC1; p=none; rua=mailto:dmarc@nbswera.com',
      ttl: 3600,
    });
    if (dmarcResult.success) {
      console.log('   ✅ DMARC added successfully');
    } else {
      console.log('   ❌ Failed:', dmarcResult.errors);
    }
  }

  // 3. Add DMARC for nebiswera.com
  console.log('\n3. Adding DMARC record for nebiswera.com...');
  const nebisweraRecords = await getDnsRecords(ZONES['nebiswera.com']);
  const existingDmarcNeb = nebisweraRecords.find(
    r => r.type === 'TXT' && r.name === '_dmarc.nebiswera.com'
  );

  if (existingDmarcNeb) {
    console.log('   ✅ DMARC already exists:', existingDmarcNeb.content);
  } else {
    const dmarcResult2 = await addDnsRecord(ZONES['nebiswera.com'], {
      type: 'TXT',
      name: '_dmarc.nebiswera.com',
      content: 'v=DMARC1; p=none; rua=mailto:dmarc@nebiswera.com',
      ttl: 3600,
    });
    if (dmarcResult2.success) {
      console.log('   ✅ DMARC added successfully');
    } else {
      console.log('   ❌ Failed:', dmarcResult2.errors);
    }
  }

  // Verify
  console.log('\n\n=== Verification ===\n');

  console.log('nbswera.com records:');
  const updatedNbs = await getDnsRecords(ZONES['nbswera.com']);
  updatedNbs.filter(r => r.type === 'TXT').forEach(r => {
    console.log(`  ${r.name}: ${r.content.substring(0, 60)}...`);
  });

  console.log('\nnebiswera.com records:');
  const updatedNeb = await getDnsRecords(ZONES['nebiswera.com']);
  updatedNeb.filter(r => r.type === 'TXT').forEach(r => {
    console.log(`  ${r.name}: ${r.content.substring(0, 60)}...`);
  });
}

fixDns().catch(console.error);
