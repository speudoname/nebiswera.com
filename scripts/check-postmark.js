// Script to check Postmark configuration
const POSTMARK_ACCOUNT_TOKEN = '043d0e1c-f24a-4f8a-9b8e-41b22715ee53';
const MARKETING_SERVER_TOKEN = '3639fbdf-8685-4387-8baf-fa5cefad6add';
const TRANSACTIONAL_SERVER_TOKEN = '927c3f49-6643-4b83-a389-f16a99fee642';

async function checkPostmark() {
  console.log('=== Postmark Configuration Check ===\n');

  // 1. List all servers
  console.log('📧 Servers:');
  const serversRes = await fetch('https://api.postmarkapp.com/servers', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN,
    },
  });
  const servers = await serversRes.json();

  for (const server of servers.Servers || []) {
    console.log(`\n  Server: ${server.Name} (ID: ${server.ID})`);
    console.log(`    Color: ${server.Color}`);
    console.log(`    API Token: ${server.ApiTokens?.[0] || 'N/A'}`);
  }

  // 2. Check sender signatures (domains)
  console.log('\n\n✉️ Sender Signatures (Domains):');
  const signaturesRes = await fetch('https://api.postmarkapp.com/senders', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Account-Token': POSTMARK_ACCOUNT_TOKEN,
    },
  });
  const signatures = await signaturesRes.json();

  for (const sig of signatures.SenderSignatures || []) {
    console.log(`\n  📬 ${sig.EmailAddress || sig.Domain}`);
    console.log(`    Name: ${sig.Name}`);
    console.log(`    Domain: ${sig.Domain}`);
    console.log(`    Confirmed: ${sig.Confirmed}`);
    console.log(`    SPF Verified: ${sig.SPFVerified}`);
    console.log(`    DKIM Verified: ${sig.DKIMVerified}`);
    console.log(`    Return Path Verified: ${sig.ReturnPathDomainVerified}`);
    console.log(`    DKIM Host: ${sig.DKIMPendingHost}`);
    console.log(`    DKIM Value: ${sig.DKIMPendingTextValue?.substring(0, 50)}...`);
  }

  // 3. Check message streams on marketing server
  console.log('\n\n🌊 Marketing Server Message Streams:');
  const streamsRes = await fetch('https://api.postmarkapp.com/message-streams', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const streams = await streamsRes.json();

  for (const stream of streams.MessageStreams || []) {
    console.log(`\n  Stream: ${stream.Name} (ID: ${stream.ID})`);
    console.log(`    Type: ${stream.MessageStreamType}`);
    console.log(`    Description: ${stream.Description}`);
  }

  // 4. Check webhooks on marketing server
  console.log('\n\n🔗 Marketing Server Webhooks:');
  const webhooksRes = await fetch('https://api.postmarkapp.com/webhooks', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const webhooks = await webhooksRes.json();

  if (webhooks.Webhooks?.length > 0) {
    for (const webhook of webhooks.Webhooks) {
      console.log(`\n  Webhook ID: ${webhook.ID}`);
      console.log(`    URL: ${webhook.Url}`);
      console.log(`    Stream: ${webhook.MessageStream}`);
      console.log(`    Triggers: ${JSON.stringify(webhook.Triggers)}`);
    }
  } else {
    console.log('  ⚠️ NO WEBHOOKS CONFIGURED!');
  }

  // 5. Check suppression list
  console.log('\n\n🚫 Marketing Server Suppressions (first 10):');
  const suppressionsRes = await fetch(
    'https://api.postmarkapp.com/message-streams/broadcast/suppressions',
    {
      headers: {
        Accept: 'application/json',
        'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
      },
    }
  );
  const suppressions = await suppressionsRes.json();

  if (suppressions.Suppressions?.length > 0) {
    for (const sup of suppressions.Suppressions.slice(0, 10)) {
      console.log(`  - ${sup.EmailAddress}: ${sup.SuppressionReason} (${sup.CreatedAt})`);
    }
  } else {
    console.log('  No suppressions');
  }
}

checkPostmark().catch(console.error);
