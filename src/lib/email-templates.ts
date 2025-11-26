/**
 * Email Template Library
 *
 * Pre-built email templates for quick campaign creation
 */

export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: 'newsletter' | 'announcement' | 'promotional' | 'update'
  thumbnail?: string
  htmlContent: string
  textContent: string
  suggestedSubject: string
  suggestedPreviewText: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'simple-newsletter',
    name: 'Simple Newsletter',
    description: 'Clean, minimalist newsletter with header, content sections, and footer',
    category: 'newsletter',
    suggestedSubject: 'Your Monthly Update from Nebiswera',
    suggestedPreviewText: 'See what\'s new this month...',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #8B5CF6;
      font-size: 22px;
      margin-bottom: 12px;
    }
    .section p {
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .cta-button {
      display: inline-block;
      background: #8B5CF6;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background: #f8f8f8;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #8B5CF6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nebiswera Newsletter</h1>
    </div>

    <div class="content">
      <p class="greeting">Hi {{firstName|there}},</p>

      <div class="section">
        <h2>What's New This Month</h2>
        <p>We're excited to share some updates with you! This month, we've been working hard to bring you even more value.</p>
        <p>Here's what you need to know...</p>
      </div>

      <div class="section">
        <h2>Featured Content</h2>
        <p>Check out our latest resources and workshops designed to help you succeed with Georgian language learning.</p>
        <a href="https://nebiswera.ge" class="cta-button">Explore Now</a>
      </div>

      <div class="section">
        <h2>Community Spotlight</h2>
        <p>See what our community members have been sharing and learning together this month.</p>
      </div>
    </div>

    <div class="footer">
      <p>Nebiswera - Georgian Language & Culture</p>
      <p>Tbilisi, Georgia</p>
      <p><a href="{{{ pm:unsubscribe }}}">Unsubscribe</a> from future emails</p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Hi {{firstName|there}},

What's New This Month
====================
We're excited to share some updates with you! This month, we've been working hard to bring you even more value.

Here's what you need to know...

Featured Content
================
Check out our latest resources and workshops designed to help you succeed with Georgian language learning.

Visit: https://nebiswera.ge

Community Spotlight
==================
See what our community members have been sharing and learning together this month.

---
Nebiswera - Georgian Language & Culture
Tbilisi, Georgia

Unsubscribe: {{{ pm:unsubscribe }}}`,
  },
  {
    id: 'announcement',
    name: 'Important Announcement',
    description: 'Bold announcement template for urgent news or updates',
    category: 'announcement',
    suggestedSubject: 'Important Update from Nebiswera',
    suggestedPreviewText: 'Please read this important announcement',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .banner {
      background: #FFA500;
      color: white;
      padding: 12px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      color: #8B5CF6;
      margin-bottom: 20px;
      text-align: center;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .highlight-box {
      background: #F3F4F6;
      border-left: 4px solid #8B5CF6;
      padding: 20px;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: #8B5CF6;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
    }
    .footer {
      background: #f8f8f8;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #8B5CF6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">Important Announcement</div>

    <div class="content">
      <h1 class="title">We Have News to Share</h1>

      <p class="message">Hi {{firstName|there}},</p>

      <p class="message">
        We wanted to reach out personally to share some important updates with you.
        Your experience with Nebiswera is our top priority, and we believe this news
        will enhance your learning journey.
      </p>

      <div class="highlight-box">
        <h2 style="margin-top: 0; color: #8B5CF6;">Key Details:</h2>
        <ul style="margin: 10px 0;">
          <li style="margin-bottom: 8px;">Update detail #1</li>
          <li style="margin-bottom: 8px;">Update detail #2</li>
          <li style="margin-bottom: 8px;">Update detail #3</li>
        </ul>
      </div>

      <p class="message">
        Thank you for being part of our community. If you have any questions,
        we're here to help!
      </p>

      <a href="https://nebiswera.ge" class="cta-button">Learn More</a>
    </div>

    <div class="footer">
      <p>Nebiswera - Georgian Language & Culture</p>
      <p><a href="{{{ pm:unsubscribe }}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `*** IMPORTANT ANNOUNCEMENT ***

We Have News to Share

Hi {{firstName|there}},

We wanted to reach out personally to share some important updates with you. Your experience with Nebiswera is our top priority, and we believe this news will enhance your learning journey.

Key Details:
- Update detail #1
- Update detail #2
- Update detail #3

Thank you for being part of our community. If you have any questions, we're here to help!

Learn More: https://nebiswera.ge

---
Nebiswera - Georgian Language & Culture
Unsubscribe: {{{ pm:unsubscribe }}}`,
  },
  {
    id: 'workshop-promo',
    name: 'Workshop Promotion',
    description: 'Promotional template for workshops, webinars, or events',
    category: 'promotional',
    suggestedSubject: 'Join Our Upcoming Georgian Language Workshop',
    suggestedPreviewText: 'Limited spots available - register now!',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workshop</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .hero {
      background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
      color: white;
      padding: 50px 30px;
      text-align: center;
    }
    .hero h1 {
      margin: 0 0 15px 0;
      font-size: 36px;
    }
    .hero .tagline {
      font-size: 18px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .event-details {
      background: #F9FAFB;
      border-radius: 8px;
      padding: 30px;
      margin: 30px 0;
    }
    .detail-row {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .detail-icon {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      color: #8B5CF6;
    }
    .benefits {
      margin: 30px 0;
    }
    .benefits ul {
      list-style: none;
      padding: 0;
    }
    .benefits li {
      padding: 10px 0;
      padding-left: 30px;
      position: relative;
    }
    .benefits li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10B981;
      font-weight: bold;
      font-size: 20px;
    }
    .cta-button {
      display: inline-block;
      background: #8B5CF6;
      color: white;
      padding: 18px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 18px;
      text-align: center;
      width: 100%;
      box-sizing: border-box;
      margin: 20px 0;
    }
    .urgency {
      background: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 20px 0;
      font-size: 14px;
      color: #92400E;
    }
    .footer {
      background: #f8f8f8;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #8B5CF6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>Georgian Language Workshop</h1>
      <p class="tagline">Master Conversational Georgian in 3 Days</p>
    </div>

    <div class="content">
      <p style="font-size: 18px; margin-bottom: 20px;">Hi {{firstName|there}},</p>

      <p style="font-size: 16px; line-height: 1.6;">
        We're excited to invite you to our upcoming intensive workshop! Whether you're
        a complete beginner or looking to improve your skills, this workshop is designed
        to accelerate your Georgian language journey.
      </p>

      <div class="event-details">
        <h3 style="margin-top: 0; color: #8B5CF6;">Workshop Details:</h3>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <strong>Date:</strong> &nbsp; March 15-17, 2025
        </div>
        <div class="detail-row">
          <span class="detail-icon">🕐</span>
          <strong>Time:</strong> &nbsp; 10:00 AM - 4:00 PM
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <strong>Location:</strong> &nbsp; Online (Zoom)
        </div>
        <div class="detail-row">
          <span class="detail-icon">💰</span>
          <strong>Investment:</strong> &nbsp; 299 GEL
        </div>
      </div>

      <div class="benefits">
        <h3 style="color: #8B5CF6;">What You'll Learn:</h3>
        <ul>
          <li>Essential conversational phrases and greetings</li>
          <li>Proper pronunciation and accent training</li>
          <li>Cultural context and etiquette</li>
          <li>Real-world practice with native speakers</li>
          <li>Lifetime access to course materials</li>
        </ul>
      </div>

      <div class="urgency">
        ⚡ <strong>Limited Spots Available!</strong> Only 15 seats remaining.
        Early bird pricing ends in 3 days.
      </div>

      <a href="https://nebiswera.ge/workshops" class="cta-button">Reserve Your Spot Now</a>

      <p style="text-align: center; font-size: 14px; color: #666; margin-top: 30px;">
        Questions? Reply to this email or visit our FAQ page.
      </p>
    </div>

    <div class="footer">
      <p>Nebiswera - Georgian Language & Culture</p>
      <p><a href="{{{ pm:unsubscribe }}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `GEORGIAN LANGUAGE WORKSHOP
Master Conversational Georgian in 3 Days

Hi {{firstName|there}},

We're excited to invite you to our upcoming intensive workshop! Whether you're a complete beginner or looking to improve your skills, this workshop is designed to accelerate your Georgian language journey.

WORKSHOP DETAILS:
📅 Date: March 15-17, 2025
🕐 Time: 10:00 AM - 4:00 PM
📍 Location: Online (Zoom)
💰 Investment: 299 GEL

WHAT YOU'LL LEARN:
✓ Essential conversational phrases and greetings
✓ Proper pronunciation and accent training
✓ Cultural context and etiquette
✓ Real-world practice with native speakers
✓ Lifetime access to course materials

⚡ LIMITED SPOTS AVAILABLE! Only 15 seats remaining. Early bird pricing ends in 3 days.

RESERVE YOUR SPOT NOW: https://nebiswera.ge/workshops

Questions? Reply to this email or visit our FAQ page.

---
Nebiswera - Georgian Language & Culture
Unsubscribe: {{{ pm:unsubscribe }}}`,
  },
  {
    id: 'simple-update',
    name: 'Simple Update',
    description: 'Minimal template for quick updates and notifications',
    category: 'update',
    suggestedSubject: 'Quick Update from Nebiswera',
    suggestedPreviewText: 'A brief update for you',
    htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Update</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
      color: #8B5CF6;
      font-size: 24px;
      font-weight: bold;
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .button {
      display: inline-block;
      background: #8B5CF6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #8B5CF6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Nebiswera</div>

    <div class="content">
      <p>Hi {{firstName|there}},</p>

      <p>We wanted to share a quick update with you.</p>

      <p>[Your update content goes here. Keep it brief and to the point.]</p>

      <p>Thanks for being part of our community!</p>

      <p>
        Best regards,<br>
        The Nebiswera Team
      </p>
    </div>

    <div class="footer">
      <p>Nebiswera - Georgian Language & Culture</p>
      <p><a href="{{{ pm:unsubscribe }}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Nebiswera

Hi {{firstName|there}},

We wanted to share a quick update with you.

[Your update content goes here. Keep it brief and to the point.]

Thanks for being part of our community!

Best regards,
The Nebiswera Team

---
Nebiswera - Georgian Language & Culture
Unsubscribe: {{{ pm:unsubscribe }}}`,
  },
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: EmailTemplate['category']
): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): Array<{
  value: EmailTemplate['category']
  label: string
}> {
  return [
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'update', label: 'Update' },
  ]
}
