// Script to fix Postmark webhooks for marketing server
const MARKETING_SERVER_TOKEN = '3639fbdf-8685-4387-8baf-fa5cefad6add';

// Generate secure credentials for webhook
const crypto = require('crypto');
const WEBHOOK_USERNAME = 'nbswera-marketing';
const WEBHOOK_PASSWORD = crypto.randomBytes(32).toString('hex');

async function fixWebhooks() {
  console.log('=== Fixing Postmark Marketing Webhooks ===\n');

  // 1. Get current webhooks
  console.log('1. Getting current webhooks...');
  const webhooksRes = await fetch('https://api.postmarkapp.com/webhooks', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const webhooksData = await webhooksRes.json();

  // 2. Delete wrong webhooks (those on outbound stream)
  console.log('\n2. Deleting wrong webhooks on outbound stream...');
  for (const webhook of webhooksData.Webhooks || []) {
    if (webhook.MessageStream === 'outbound') {
      console.log(`   Deleting webhook ${webhook.ID} (${webhook.MessageStream})...`);
      const deleteRes = await fetch(
        `https://api.postmarkapp.com/webhooks/${webhook.ID}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
          },
        }
      );
      if (deleteRes.ok) {
        console.log(`   ✅ Deleted webhook ${webhook.ID}`);
      } else {
        console.log(`   ❌ Failed to delete webhook ${webhook.ID}`);
      }
    }
  }

  // 3. Create new webhook on broadcast stream with all triggers
  console.log('\n3. Creating new webhook on broadcast stream...');

  const webhookUrl = `https://${WEBHOOK_USERNAME}:${WEBHOOK_PASSWORD}@www.nebiswera.com/api/webhooks/postmark-marketing`;

  const createRes = await fetch('https://api.postmarkapp.com/webhooks', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
    body: JSON.stringify({
      Url: webhookUrl,
      MessageStream: 'broadcast',
      HttpAuth: {
        Username: WEBHOOK_USERNAME,
        Password: WEBHOOK_PASSWORD,
      },
      Triggers: {
        Open: {
          Enabled: true,
          PostFirstOpenOnly: false,
        },
        Click: {
          Enabled: true,
        },
        Delivery: {
          Enabled: true,
        },
        Bounce: {
          Enabled: true,
          IncludeContent: true,
        },
        SpamComplaint: {
          Enabled: true,
          IncludeContent: true,
        },
        SubscriptionChange: {
          Enabled: true,
        },
      },
    }),
  });

  const createData = await createRes.json();

  if (createRes.ok) {
    console.log('   ✅ Created new webhook on broadcast stream');
    console.log(`   Webhook ID: ${createData.ID}`);
  } else {
    console.log('   ❌ Failed to create webhook:', createData);
  }

  // 4. Verify
  console.log('\n\n=== Verification ===\n');
  const verifyRes = await fetch('https://api.postmarkapp.com/webhooks', {
    headers: {
      Accept: 'application/json',
      'X-Postmark-Server-Token': MARKETING_SERVER_TOKEN,
    },
  });
  const verifyData = await verifyRes.json();

  for (const w of verifyData.Webhooks || []) {
    console.log(`Webhook ${w.ID}:`);
    console.log(`  Stream: ${w.MessageStream}`);
    console.log(`  URL: ${w.Url.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`  Triggers: Delivery=${w.Triggers.Delivery?.Enabled}, Bounce=${w.Triggers.Bounce?.Enabled}, Open=${w.Triggers.Open?.Enabled}, Click=${w.Triggers.Click?.Enabled}, SpamComplaint=${w.Triggers.SpamComplaint?.Enabled}`);
    console.log('');
  }

  // 5. Output credentials to add to .env
  console.log('\n=== ADD THESE TO YOUR .env FILE ===\n');
  console.log(`POSTMARK_MARKETING_WEBHOOK_USERNAME="${WEBHOOK_USERNAME}"`);
  console.log(`POSTMARK_MARKETING_WEBHOOK_PASSWORD="${WEBHOOK_PASSWORD}"`);
  console.log(`UNSUBSCRIBE_SECRET="${crypto.randomBytes(32).toString('hex')}"`);
}

fixWebhooks().catch(console.error);
