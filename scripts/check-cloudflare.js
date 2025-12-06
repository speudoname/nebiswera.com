// Script to check Cloudflare DNS configuration
const CLOUDFLARE_API_KEY = 'a477e194f7eff58cb9aa770022b0c283fc6c2';
const CLOUDFLARE_EMAIL = 'levan@sarke.ge';

async function checkCloudflare() {
  // List all zones
  console.log('=== Cloudflare Zones ===');
  const zonesRes = await fetch('https://api.cloudflare.com/client/v4/zones', {
    headers: {
      'X-Auth-Email': CLOUDFLARE_EMAIL,
      'X-Auth-Key': CLOUDFLARE_API_KEY,
      'Content-Type': 'application/json',
    },
  });
  const zonesData = await zonesRes.json();

  if (!zonesData.success) {
    console.error('Failed to fetch zones:', zonesData.errors);
    return;
  }

  for (const zone of zonesData.result) {
    console.log(`\n📁 Zone: ${zone.name} (ID: ${zone.id})`);
    console.log(`   Status: ${zone.status}`);

    // Get DNS records for this zone
    const dnsRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
      {
        headers: {
          'X-Auth-Email': CLOUDFLARE_EMAIL,
          'X-Auth-Key': CLOUDFLARE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const dnsData = await dnsRes.json();

    if (dnsData.success) {
      const txtRecords = dnsData.result.filter(r => r.type === 'TXT');
      const cnameRecords = dnsData.result.filter(r => r.type === 'CNAME');

      console.log('\n   TXT Records:');
      txtRecords.forEach(r => {
        console.log(`   - ${r.name}: ${r.content.substring(0, 80)}...`);
      });

      console.log('\n   CNAME Records (DKIM):');
      cnameRecords.filter(r => r.name.includes('domainkey')).forEach(r => {
        console.log(`   - ${r.name}: ${r.content}`);
      });
    }
  }
}

checkCloudflare().catch(console.error);
