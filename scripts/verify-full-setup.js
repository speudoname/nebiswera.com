// Full verification of Postmark setup
const POSTMARK_ACCOUNT_TOKEN = '043d0e1c-f24a-4f8a-9b8e-41b22715ee53';
const MARKETING_SERVER_TOKEN = '3639fbdf-8685-4387-8baf-fa5cefad6add';
const TRANSACTIONAL_SERVER_TOKEN = '927c3f49-6643-4b83-a389-f16a99fee642';

async function verify() {
  console.log('========================================');
  console.log('FULL POSTMARK ARCHITECTURE VERIFICATION');
  console.log('========================================\n');

  // 1. Get all servers with details
  console.log('1. SERVERS CONFIGURATION\n');

  // Check Transactional Server
  console.log('--- TRANSACTIONAL SERVER ---');
  const transServerRes = await fetch('https://api.postmarkapp.com/server', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': TRANSACTIONAL_SERVER_TOKEN,
    },
  });
  const transServer = await transServerRes.json();
  console.log(`Name: ${transServer.Name}`);
  console.log(`ID: ${transServer.ID}`);
  console.log(`Color: ${transServer.Color}`);
  console.log(`Track Opens: ${transServer.TrackOpens}`);
  console.log(`Track Links: ${transServer.TrackLinks}`);
  console.log(`Inbound Domain: ${transServer.InboundDomain}`);

  // Check Marketing Server
  console.log('\n--- MARKETING SERVER ---');
  const mktServerRes = await fetch('https://api.postmarkapp.com/server', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const mktServer = await mktServerRes.json();
  console.log(`Name: ${mktServer.Name}`);
  console.log(`ID: ${mktServer.ID}`);
  console.log(`Color: ${mktServer.Color}`);
  console.log(`Track Opens: ${mktServer.TrackOpens}`);
  console.log(`Track Links: ${mktServer.TrackLinks}`);
  console.log(`Inbound Domain: ${mktServer.InboundDomain}`);

  // 2. Check Message Streams on both
  console.log('\n\n2. MESSAGE STREAMS\n');

  console.log('--- TRANSACTIONAL SERVER STREAMS ---');
  const transStreamsRes = await fetch('https://api.postmarkapp.com/message-streams', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': TRANSACTIONAL_SERVER_TOKEN,
    },
  });
  const transStreams = await transStreamsRes.json();
  for (const s of transStreams.MessageStreams || []) {
    console.log(`  ${s.ID}: ${s.Name} (${s.MessageStreamType})`);
  }

  console.log('\n--- MARKETING SERVER STREAMS ---');
  const mktStreamsRes = await fetch('https://api.postmarkapp.com/message-streams', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const mktStreams = await mktStreamsRes.json();
  for (const s of mktStreams.MessageStreams || []) {
    console.log(`  ${s.ID}: ${s.Name} (${s.MessageStreamType})`);
  }

  // 3. Check Webhooks on both
  console.log('\n\n3. WEBHOOKS CONFIGURATION\n');

  console.log('--- TRANSACTIONAL SERVER WEBHOOKS ---');
  const transWebhooksRes = await fetch('https://api.postmarkapp.com/webhooks', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': TRANSACTIONAL_SERVER_TOKEN,
    },
  });
  const transWebhooks = await transWebhooksRes.json();
  if (transWebhooks.Webhooks?.length > 0) {
    for (const w of transWebhooks.Webhooks) {
      console.log(`  ID: ${w.ID}`);
      console.log(`  URL: ${w.Url}`);
      console.log(`  Stream: ${w.MessageStream}`);
      console.log(`  Triggers: Delivery=${w.Triggers.Delivery?.Enabled}, Bounce=${w.Triggers.Bounce?.Enabled}, Open=${w.Triggers.Open?.Enabled}, Click=${w.Triggers.Click?.Enabled}, SpamComplaint=${w.Triggers.SpamComplaint?.Enabled}`);
      console.log('');
    }
  } else {
    console.log('  ⚠️  NO WEBHOOKS CONFIGURED!');
  }

  console.log('\n--- MARKETING SERVER WEBHOOKS ---');
  const mktWebhooksRes = await fetch('https://api.postmarkapp.com/webhooks', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const mktWebhooks = await mktWebhooksRes.json();
  if (mktWebhooks.Webhooks?.length > 0) {
    for (const w of mktWebhooks.Webhooks) {
      console.log(`  ID: ${w.ID}`);
      console.log(`  URL: ${w.Url}`);
      console.log(`  Stream: ${w.MessageStream}`);
      console.log(`  Triggers: Delivery=${w.Triggers.Delivery?.Enabled}, Bounce=${w.Triggers.Bounce?.Enabled}, Open=${w.Triggers.Open?.Enabled}, Click=${w.Triggers.Click?.Enabled}, SpamComplaint=${w.Triggers.SpamComplaint?.Enabled}`);
      console.log('');
    }
  } else {
    console.log('  ⚠️  NO WEBHOOKS CONFIGURED!');
  }

  // 4. Check Sender Signatures (domains)
  console.log('\n\n4. SENDER SIGNATURES (DOMAINS)\n');
  const signaturesRes = await fetch('https://api.postmarkapp.com/senders', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN,
    },
  });
  const signatures = await signaturesRes.json();
  for (const sig of signatures.SenderSignatures || []) {
    console.log(`📬 ${sig.EmailAddress || sig.Domain}`);
    console.log(`   Domain: ${sig.Domain}`);
    console.log(`   Confirmed: ${sig.Confirmed}`);
    console.log(`   SPF Verified: ${sig.SPFVerified}`);
    console.log(`   DKIM Verified: ${sig.DKIMVerified}`);
    console.log(`   Return Path Verified: ${sig.ReturnPathDomainVerified}`);
    if (!sig.DKIMVerified && sig.DKIMPendingHost) {
      console.log(`   ⚠️  DKIM Pending - Add: ${sig.DKIMPendingHost}`);
    }
    console.log('');
  }

  // 5. Check domains
  console.log('\n\n5. DOMAINS\n');
  const domainsRes = await fetch('https://api.postmarkapp.com/domains', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN,
    },
  });
  const domains = await domainsRes.json();
  for (const d of domains.Domains || []) {
    console.log(`🌐 ${d.Name}`);
    console.log(`   ID: ${d.ID}`);
    console.log(`   SPF Verified: ${d.SPFVerified}`);
    console.log(`   DKIM Verified: ${d.DKIMVerified}`);
    console.log(`   Return Path Verified: ${d.ReturnPathDomainVerified}`);
    console.log('');
  }
}

verify().catch(console.error);
